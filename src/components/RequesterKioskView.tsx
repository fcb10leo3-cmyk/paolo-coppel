import React, { useState, useEffect } from 'react';
import { AssistanceAlert, Employee } from '../types';
import { staffSync, INITIAL_EMPLOYEES } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';

interface RequesterKioskViewProps {
  onSwitchToAdminRole?: () => void;
  onSwitchToStaffRole?: () => void;
  onOpenShareModal?: (tab?: 'staff' | 'admin' | 'kiosk_api' | 'deploy') => void;
}

const QUICK_SUPPORT_BUTTONS = [
  {
    id: 'cajas-refuerzo',
    title: 'Refuerzo en Cajas Express',
    dept: 'Cajas & Pagos',
    aisle: 'Módulo Central de Cajas',
    icon: 'fa-cash-register',
    desc: 'Fila larga / Apoyo con cobro rápido',
    bg: 'bg-blue-50 border-[#0047BA]',
    badge: 'Alta Demanda',
  },
  {
    id: 'credito-urgente',
    title: 'Asesoría en Crédito Coppel',
    dept: 'Servicios Financieros',
    aisle: 'Mostrador Crédito Coppel',
    icon: 'fa-credit-card',
    desc: 'Trámite de tarjeta departamental o préstamo',
    bg: 'bg-amber-50 border-amber-500',
    badge: 'Crédito',
  },
  {
    id: 'telefonia-celulares',
    title: 'Especialista en Telefonía & TV',
    dept: 'Electrónica & Celulares',
    aisle: 'Pasillo 1A - Telefonía & Cómputo',
    icon: 'fa-mobile-screen',
    desc: 'Cliente solicita asesoría en celulares / pantallas',
    bg: 'bg-emerald-50 border-emerald-500',
    badge: 'Tecnología',
  },
  {
    id: 'muebleria-lineablanca',
    title: 'Apoyo en Muebles & Línea Blanca',
    dept: 'Muebles & Hogar',
    aisle: 'Pasillo 3 y 4 - Mueblería Central',
    icon: 'fa-couch',
    desc: 'Medidas de salas, comedores o refrigeradores',
    bg: 'bg-indigo-50 border-indigo-500',
    badge: 'Hogar',
  },
  {
    id: 'almacen-carga',
    title: 'Carga de Mercancía / Bodega',
    dept: 'Almacén & Entrega',
    aisle: 'Almacén & Entrega de Mercancía',
    icon: 'fa-boxes-packing',
    desc: 'Apoyo para bajar o mover bulto pesado',
    bg: 'bg-slate-50 border-slate-400',
    badge: 'Almacén',
  },
  {
    id: 'gerente-autorizacion',
    title: 'Apoyo / Firma de Gerencia',
    dept: 'Supervisión de Turno',
    aisle: 'Atención a Clientes & Gerencia',
    icon: 'fa-user-tie',
    desc: 'Autorización de precio, devolución o supervisión',
    bg: 'bg-purple-50 border-purple-500',
    badge: 'Gerencial',
  },
];

export const RequesterKioskView: React.FC<RequesterKioskViewProps> = ({
  onSwitchToAdminRole,
  onSwitchToStaffRole,
  onOpenShareModal,
}) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const list = staffSync.getState()?.employees;
    return list && list.length > 0 ? list : INITIAL_EMPLOYEES;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastRequestedId, setLastRequestedId] = useState<string | null>(null);
  const [customAisle, setCustomAisle] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);

  useEffect(() => {
    const unsub = staffSync.subscribe((state) => {
      setActiveCall(state.activeCall);
      setEmployees(state.employees);
    });

    staffSync.fetchAlerts();
    return () => unsub();
  }, []);

  const handleQuickRequest = async (btn: typeof QUICK_SUPPORT_BUTTONS[0]) => {
    setIsSubmitting(true);
    soundEffects.playSuccessChime();
    voice.speak(`Despachando solicitud de apoyo para ${btn.title}.`);

    try {
      const alert = await staffSync.triggerCall({
        aisle: btn.aisle,
        department: btn.dept,
        reason: `${btn.title} - ${btn.desc}`,
        requesterRole: 'personal',
        requesterName: 'Terminal de Solicitud de Apoyo',
        urgency: btn.id.includes('urgente') ? 'urgente' : 'normal',
        supportType: btn.title,
      });

      setLastRequestedId(alert.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAisle.trim() || !customReason.trim()) return;

    setIsSubmitting(true);
    soundEffects.playSuccessChime();

    try {
      const alert = await staffSync.triggerCall({
        aisle: customAisle.trim(),
        department: 'Piso General',
        reason: customReason.trim(),
        requesterRole: 'personal',
        requesterName: 'Terminal de Solicitud',
        urgency: 'normal',
      });
      setLastRequestedId(alert.id);
      setCustomAisle('');
      setCustomReason('');
      setShowCustomForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCall = async () => {
    soundEffects.playSuccessChime();
    await staffSync.cancelCall();
  };

  const availableCount = employees.filter((e) => e.status === 'disponible').length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* 1. TARJETA SUPERIOR DE TERMINAL DE APOYO */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-[#0047BA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#0047BA] text-[#FFD100] flex items-center justify-center text-2xl shadow-lg border-2 border-[#FFD100] shrink-0">
            <i className="fa-solid fa-headset"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                Terminal Auxiliar
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Enlace en Vivo con Piso</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0047BA] tracking-tight">
              Solicitud de Apoyo a Personal en Piso
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Usa esta terminal en computadoras de Cajas, Mostrador o Kiosco para alertar a los asesores con 1 clic.
            </p>
          </div>
        </div>

        {/* ESTATUS EN PISO */}
        <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between sm:justify-end bg-blue-50 px-3.5 py-2 rounded-2xl border border-blue-200">
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Personal Disponible</div>
            <div className="text-lg font-black text-[#0047BA]">{availableCount} de {employees.length} asesores</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#0047BA] flex items-center justify-center shadow-sm font-black border border-blue-200">
            <i className="fa-solid fa-users text-sm"></i>
          </div>
        </div>
      </div>

      {/* 2. ESTADO ACTIVO SI HAY UNA SOLICITUD EN CURSO */}
      {activeCall && (
        <div className={`p-4 sm:p-5 rounded-3xl border-4 shadow-xl transition-all ${
          activeCall.status === 'in_transit'
            ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
            : 'bg-amber-50 border-[#FFD100] text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md ${
                activeCall.status === 'in_transit'
                  ? 'bg-emerald-500 text-white animate-bounce'
                  : 'bg-[#FFD100] text-[#0047BA] animate-pulse'
              }`}>
                <i className={`fa-solid ${activeCall.status === 'in_transit' ? 'fa-person-walking' : 'fa-bell'}`}></i>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    activeCall.status === 'in_transit'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0047BA] text-white'
                  }`}>
                    {activeCall.status === 'in_transit' ? 'Asesor en Camino' : '🚨 Sirena Sonando en Piso'}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{activeCall.timestamp}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {activeCall.reason}
                </h3>
                <div className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center space-x-2">
                  <span>📍 {activeCall.aisle}</span>
                  {activeCall.assignedAssociateName && (
                    <span className="text-emerald-700 font-black">
                      • Atendido por: {activeCall.assignedAssociateName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleCancelCall}
                className="py-2 px-3.5 rounded-xl border-2 border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTONES RÁPIDOS DE 1 TOQUE */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#0047BA] flex items-center space-x-2">
            <i className="fa-solid fa-bolt text-[#FFD100]"></i>
            <span>Solicitar Apoyo Inmediato (1 Clic)</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-xs font-bold text-[#0047BA] hover:underline cursor-pointer flex items-center space-x-1"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>{showCustomForm ? 'Ocultar personalizado' : 'Otro pasillo o motivo...'}</span>
          </button>
        </div>

        {/* FORMULARIO PERSONALIZADO EXPANDIBLE */}
        {showCustomForm && (
          <form onSubmit={handleCustomSubmit} className="mb-4 bg-white p-4 rounded-2xl border-2 border-[#0047BA] shadow space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  Pasillo / Zona de Tienda:
                </label>
                <input
                  type="text"
                  value={customAisle}
                  onChange={(e) => setCustomAisle(e.target.value)}
                  placeholder="Ej: Pasillo 6 - Zapatería deportiva"
                  className="w-full text-xs p-2.5 rounded-xl border-2 border-slate-200 focus:border-[#0047BA] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  Motivo de la solicitud:
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ej: Cliente requiere número 28.5 no exhibido"
                  className="w-full text-xs p-2.5 rounded-xl border-2 border-slate-200 focus:border-[#0047BA] focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-1.5 px-4 rounded-xl bg-[#0047BA] text-white text-xs font-black shadow hover:bg-blue-700"
              >
                📢 Enviar Solicitud a Piso
              </button>
            </div>
          </form>
        )}

        {/* PARRILLA DE BOTONES DE 1 TOQUE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_SUPPORT_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickRequest(btn)}
              className={`p-4 rounded-2xl border-2 ${btn.bg} text-left transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#0047BA]">
                    {btn.badge}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white text-[#0047BA] flex items-center justify-center text-sm shadow-sm group-hover:bg-[#FFD100] transition-colors">
                    <i className={`fa-solid ${btn.icon}`}></i>
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#0047BA] transition-colors leading-snug">
                  {btn.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  {btn.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="truncate">📍 {btn.aisle}</span>
                <span className="text-[#0047BA] font-black group-hover:translate-x-1 transition-transform">
                  Pedir →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. ACCESO RÁPIDO A ENLACES Y CÓDIGO QR */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-network-wired text-[#0047BA] text-base"></i>
          <span>
            ¿Estás configurando otras computadoras o celulares en la tienda?
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenShareModal?.('kiosk_api')}
            className="py-1.5 px-3 bg-[#0047BA] text-white rounded-xl font-bold hover:bg-blue-800 transition-all cursor-pointer flex items-center space-x-1"
          >
            <i className="fa-solid fa-qrcode text-[#FFD100]"></i>
            <span>Ver Códigos QR & Guía Multi-PC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
