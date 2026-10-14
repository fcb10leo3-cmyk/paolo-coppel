import React, { useState } from 'react';
import { staffSync } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';

interface RequestSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRequester?: 'gerente' | 'personal' | 'asesor' | 'cajas';
}

const COMMON_AISLES = [
  { id: 'cajas', name: 'Módulo de Cajas Express', dept: 'Cajas & Pagos' },
  { id: 'credito', name: 'Mostrador Crédito Coppel', dept: 'Servicios Financieros' },
  { id: 'pasillo-1', name: 'Pasillo 1A - Telefonía & Cómputo', dept: 'Electrónica & Celulares' },
  { id: 'pasillo-2', name: 'Pasillo 2B - Audio, Video & TV', dept: 'Electrónica' },
  { id: 'pasillo-3', name: 'Pasillo 3 y 4 - Mueblería Central', dept: 'Muebles & Hogar' },
  { id: 'pasillo-5', name: 'Pasillo 5A - Línea Blanca & Cocina', dept: 'Línea Blanca' },
  { id: 'pasillo-7', name: 'Pasillo 7 y 8 - Moda, Ropa & Blancos', dept: 'Ropa & Calzado' },
  { id: 'pasillo-9', name: 'Pasillo 9 - Zapatería & Sneakers', dept: 'Calzado' },
  { id: 'almacen', name: 'Almacén & Entrega de Mercancía', dept: 'Bodega' },
];

const COMMON_REASONS = [
  { icon: 'fa-people-group', label: 'Refuerzo por alta afluencia / fila', desc: 'Se requiere apoyo inmediato con clientes en espera' },
  { icon: 'fa-credit-card', label: 'Asesoría urgente en Crédito Coppel', desc: 'Cliente solicita tramitar tarjeta o préstamo' },
  { icon: 'fa-mobile-screen', label: 'Duda técnica en celulares / pantallas', desc: 'Cliente requiere asesor especialista' },
  { icon: 'fa-box-open', label: 'Carga de producto pesado / Bodega', desc: 'Apoyo para mover mueble o electrodoméstico' },
  { icon: 'fa-signature', label: 'Autorización / Firma de Gerencia', desc: 'Trámite o cobro requiere supervisor' },
  { icon: 'fa-handshake-angle', label: 'Cliente pide asesor en pasillo', desc: 'Atención personalizada en exhibición' },
];

export const RequestSupportModal: React.FC<RequestSupportModalProps> = ({
  isOpen,
  onClose,
  defaultRequester = 'personal',
}) => {
  const [requesterRole, setRequesterRole] = useState<'gerente' | 'personal' | 'asesor' | 'cajas'>(defaultRequester);
  const [selectedAisle, setSelectedAisle] = useState<string>(COMMON_AISLES[0].name);
  const [selectedDept, setSelectedDept] = useState<string>(COMMON_AISLES[0].dept);
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0].label);
  const [customReason, setCustomReason] = useState<string>('');
  const [urgency, setUrgency] = useState<'normal' | 'alta' | 'urgente'>('normal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectAisle = (aisleObj: typeof COMMON_AISLES[0]) => {
    setSelectedAisle(aisleObj.name);
    setSelectedDept(aisleObj.dept);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    const requesterNameLabel =
      requesterRole === 'gerente'
        ? 'Gerente de Tienda'
        : requesterRole === 'asesor'
        ? 'Asesor en Piso'
        : requesterRole === 'cajas'
        ? 'Cajero / Cajas Express'
        : 'Personal de Mostrador';

    try {
      await staffSync.triggerCall({
        aisle: selectedAisle,
        department: selectedDept,
        reason: `${finalReason} (${requesterNameLabel})`,
        requesterRole,
        requesterName: requesterNameLabel,
        urgency,
        supportType: finalReason,
      });

      soundEffects.playSuccessChime();
      voice.speak(
        `Solicitud enviada a piso. Alerta despachada para ${selectedAisle}.`
      );

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1800);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-4 border-[#0047BA] overflow-hidden flex flex-col max-h-[92vh]">
        {/* ENCABEZADO COPPEL */}
        <div className="bg-[#0047BA] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#FFD100]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-xl shadow-md">
              <i className="fa-solid fa-bullhorn animate-bounce"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
                  Red Coppel
                </span>
                <span className="text-xs bg-[#FFD100] text-[#0047BA] font-black px-2 py-0.5 rounded-md uppercase">
                  Despacho Rápido
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
                Solicitar Apoyo a Piso
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {successNotice ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border-2 border-emerald-400">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg animate-pulse mb-3">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-xl font-black text-emerald-900">
                ¡Solicitud Enviada a Piso!
              </h3>
              <p className="text-sm font-semibold text-emerald-700 mt-1">
                La notificación sonora y la sirena ya están sonando en las computadoras y celulares de los asesores.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. ¿QUIÉN SOLICITA? */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0047BA] mb-2">
                  1. ¿Quién solicita el apoyo?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequesterRole('gerente')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      requesterRole === 'gerente'
                        ? 'border-[#0047BA] bg-[#0047BA]/10 text-[#0047BA] font-black shadow-sm ring-2 ring-[#0047BA]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0047BA] text-white flex items-center justify-center text-sm mb-1.5 shadow">
                      <i className="fa-solid fa-user-tie"></i>
                    </div>
                    <span className="text-xs leading-tight">Gerente / Supervisor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequesterRole('cajas')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      requesterRole === 'cajas'
                        ? 'border-[#0047BA] bg-[#0047BA]/10 text-[#0047BA] font-black shadow-sm ring-2 ring-[#0047BA]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-sm mb-1.5 shadow font-black">
                      <i className="fa-solid fa-cash-register"></i>
                    </div>
                    <span className="text-xs leading-tight">Personal Cajas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequesterRole('asesor')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      requesterRole === 'asesor'
                        ? 'border-[#0047BA] bg-[#0047BA]/10 text-[#0047BA] font-black shadow-sm ring-2 ring-[#0047BA]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm mb-1.5 shadow">
                      <i className="fa-solid fa-headset"></i>
                    </div>
                    <span className="text-xs leading-tight">Asesor en Piso</span>
                  </button>
                </div>
              </div>

              {/* 2. UBICACIÓN / PASILLO */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0047BA] mb-2">
                  2. ¿En qué pasillo o área de tienda se requiere?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_AISLES.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectAisle(a)}
                      className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all cursor-pointer ${
                        selectedAisle === a.name
                          ? 'border-[#0047BA] bg-[#0047BA] text-white font-black shadow'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700 font-bold'
                      }`}
                    >
                      <div className="truncate">{a.name}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${
                        selectedAisle === a.name ? 'text-blue-100 font-medium' : 'text-slate-500'
                      }`}>
                        {a.dept}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. MOTIVO PRINCIPAL */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0047BA] mb-2">
                  3. Motivo del apoyo solicitado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedReason(r.label);
                        setCustomReason('');
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start space-x-2 ${
                        selectedReason === r.label && !customReason
                          ? 'border-[#0047BA] bg-[#0047BA]/10 text-[#0047BA] font-black'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold'
                      }`}
                    >
                      <i className={`fa-solid ${r.icon} text-sm mt-0.5 text-[#0047BA]`}></i>
                      <div className="text-xs leading-snug">
                        <div>{r.label}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="O escribe otro motivo específico (opcional)..."
                    className="w-full text-xs p-2.5 rounded-xl border-2 border-slate-200 focus:border-[#0047BA] focus:outline-none bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* 4. NIVEL DE URGENCIA */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0047BA] mb-2">
                  4. Nivel de urgencia
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('normal')}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      urgency === 'normal'
                        ? 'border-[#0047BA] bg-[#0047BA] text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-clock"></i>
                    <span>Atención Estándar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('urgente')}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      urgency === 'urgente'
                        ? 'border-red-600 bg-red-600 text-white shadow animate-pulse'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-triangle-exclamation text-yellow-300"></i>
                    <span>🚨 Urgente / Inmediata</span>
                  </button>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-4 rounded-2xl bg-[#FFD100] hover:bg-amber-400 active:scale-95 text-[#0047BA] text-sm font-black shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer border-2 border-[#0047BA]"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>{isSubmitting ? 'Enviando...' : '📢 Despachar Apoyo a Piso'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
