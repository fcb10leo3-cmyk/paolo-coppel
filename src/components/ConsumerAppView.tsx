import React, { useState, useEffect } from 'react';
import { AssistanceAlert, Employee } from '../types';
import { staffSync, INITIAL_EMPLOYEES } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';
import {
  CONSUMER_PRODUCTS,
  STORE_AISLES,
  ASSISTANCE_REASONS,
  ConsumerProduct,
} from '../data/consumerProducts';

interface ConsumerAppViewProps {
  onOpenAdvisorApp?: () => void;
  onOpenPortal?: () => void;
}

export const ConsumerAppView: React.FC<ConsumerAppViewProps> = ({
  onOpenAdvisorApp,
  onOpenPortal,
}) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedAisle, setSelectedAisle] = useState<string>(STORE_AISLES[2].name); // Pasillo 3 y 4 por defecto
  const [selectedDept, setSelectedDept] = useState<string>(STORE_AISLES[2].dept);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ConsumerProduct | null>(null);

  // Modales
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [modalReason, setModalReason] = useState<string>(ASSISTANCE_REASONS[0].label);
  const [modalAisle, setModalAisle] = useState<string>(STORE_AISLES[2].name);
  const [modalDept, setModalDept] = useState<string>(STORE_AISLES[2].dept);
  const [clientName, setClientName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<boolean>(false);

  // Escuchar estado en tiempo real (SSE / Broadcast)
  useEffect(() => {
    const unsub = staffSync.subscribe((state) => {
      setActiveCall(state.activeCall);
      if (state.employees && state.employees.length > 0) {
        setEmployees(state.employees);
      }
    });

    staffSync.fetchAlerts();
    const interval = setInterval(() => staffSync.fetchAlerts(), 2500);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Filtrado de catálogo
  const filteredProducts = CONSUMER_PRODUCTS.filter((prod) => {
    const matchCat = selectedCategory === 'todos' || prod.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.brand.toLowerCase().includes(q) ||
      prod.model.toLowerCase().includes(q) ||
      prod.aisle.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const availableEmployeesCount = employees.filter((e) => e.status === 'disponible').length;

  const handleOpenRequestForProduct = (prod: ConsumerProduct) => {
    setModalAisle(prod.aisle);
    const matchedAisle = STORE_AISLES.find((a) => a.name === prod.aisle);
    if (matchedAisle) setModalDept(matchedAisle.dept);
    setModalReason(`Interés en ${prod.name} (Ver producto / Abono Coppel)`);
    setIsRequestModalOpen(true);
  };

  const handleOpenGeneralRequest = () => {
    setModalAisle(selectedAisle);
    setModalDept(selectedDept);
    setModalReason(ASSISTANCE_REASONS[0].label);
    setIsRequestModalOpen(true);
  };

  const handleSendAssistanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      const call = await staffSync.triggerCall({
        aisle: modalAisle,
        department: modalDept,
        reason: modalReason,
        requesterRole: 'cliente',
        requesterName: clientName.trim() || 'Cliente en Tienda',
        urgency: 'alta',
        supportType: modalReason,
        customerPin: generatedPin,
      });

      if (call) {
        setActiveCall(call);
      }

      soundEffects.playSuccessChime();
      voice.speak(`Solicitud enviada. Un asesor de piso acudirá a ${modalAisle}.`);

      setIsSubmitting(false);
      setIsRequestModalOpen(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleCancelMyRequest = async () => {
    if (confirm('¿Deseas cancelar la llamada al asesor?')) {
      await staffSync.cancelCall();
      setActiveCall(null);
    }
  };

  const getAdvisorUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/asesor`;
    }
    return '/asesor';
  };

  const handleCopyAdvisorLink = () => {
    const url = getAdvisorUrl();
    navigator.clipboard?.writeText(url);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 2500);
  };

  const advisorQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    getAdvisorUrl()
  )}`;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col justify-start relative select-none pb-28">
      {/* 1. ENCABEZADO OFICIAL APP COPPEL CLIENTE */}
      <header className="sticky top-0 z-40 bg-[#0047BA] text-white shadow-md border-b-2 border-[#FFD100]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* LOGO COPPEL + IDENTIDAD */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1 bg-white/15 px-2 py-1 rounded-xl border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                  Coppel
                </span>
                <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Tienda
                </span>
              </div>
              <p className="text-[10px] text-blue-100 font-medium leading-none mt-0.5">
                Sucursal Revolución • CDMX
              </p>
            </div>
          </div>

          {/* BOTÓN CONECTAR ASESOR / QR + SELECTOR DE PASILLO */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="py-1 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[11px] font-bold border border-white/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Escanear en el celular del asesor para conectarlos"
            >
              <i className="fa-solid fa-qrcode text-[#FFD100]"></i>
              <span className="hidden sm:inline">Conectar Celular Asesor</span>
              <span className="sm:hidden">QR Asesor</span>
            </button>
          </div>
        </div>

        {/* BARRA DE PASILLO ACTUAL DEL CLIENTE */}
        <div className="bg-[#003899] px-3 sm:px-4 py-1.5 border-t border-blue-400/20">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-blue-100">
            <div className="flex items-center space-x-1.5 truncate">
              <i className="fa-solid fa-location-dot text-[#FFD100]"></i>
              <span className="font-semibold text-white">Tu Pasillo:</span>
              <select
                value={selectedAisle}
                onChange={(e) => {
                  setSelectedAisle(e.target.value);
                  const found = STORE_AISLES.find((a) => a.name === e.target.value);
                  if (found) setSelectedDept(found.dept);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg px-2 py-0.5 border border-white/20 text-xs focus:outline-none cursor-pointer truncate max-w-[200px] sm:max-w-xs"
              >
                {STORE_AISLES.map((aisle) => (
                  <option key={aisle.id} value={aisle.name} className="text-slate-900 bg-white">
                    {aisle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 shrink-0 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-bold">{availableEmployeesCount} asesores listos</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 space-y-3">
        {/* PANEL EN VIVO DE ASISTENCIA ACTIVA (SI EL CLIENTE YA PULSÓ ASISTENCIA) */}
        {activeCall && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl border-4 border-[#0047BA] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0047BA] text-[#FFD100] flex items-center justify-center text-2xl shadow-md shrink-0 animate-bounce">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#FFD100] text-[#0047BA] text-xs font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      {activeCall.status === 'calling'
                        ? '📡 Llamando a Asesores'
                        : activeCall.status === 'in_transit'
                        ? '🏃 Asesor en Camino'
                        : '✅ Asistencia en Curso'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeCall.timestamp}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {activeCall.status === 'in_transit'
                      ? `¡${activeCall.assignedAssociateName || 'Un asesor'} acude a tu pasillo!`
                      : 'Solicitud enviada al personal de tienda'}
                  </h2>
                </div>
              </div>

              {/* PIN DE SEGURIDAD PARA EL CLIENTE */}
              <div className="bg-blue-50 border-2 border-[#0047BA] rounded-2xl px-3 py-1.5 flex items-center justify-between sm:flex-col sm:items-end">
                <span className="text-[10px] text-[#0047BA] uppercase font-bold tracking-wider">
                  Tu PIN de Confirmación:
                </span>
                <span className="text-lg font-black text-[#0047BA] font-mono tracking-widest">
                  #{activeCall.customerPin || '4821'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Punto de Encuentro
                </span>
                <span className="font-extrabold text-slate-800 flex items-center space-x-1 mt-0.5">
                  <i className="fa-solid fa-map-pin text-[#0047BA]"></i>
                  <span>{activeCall.aisle}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Motivo
                </span>
                <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                  {activeCall.reason}
                </span>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                  Asesor Asignado
                </span>
                <span className="font-extrabold text-emerald-800 flex items-center space-x-1 mt-0.5">
                  <i className="fa-solid fa-user-check text-emerald-600"></i>
                  <span>{activeCall.assignedAssociateName || 'Mariana Gómez (En Piso)'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-500 font-medium">
                <i className="fa-solid fa-circle-info text-blue-500 mr-1"></i>
                Muestra tu PIN al asesor cuando llegue para validar tu asistencia.
              </p>
              <button
                onClick={handleCancelMyRequest}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
              >
                Cancelar Solicitud
              </button>
            </div>
          </div>
        )}

        {/* HERO BANNER: PEDIR ASISTENCIA INMEDIATA */}
        <div className="bg-gradient-to-r from-[#0047BA] via-[#003899] to-[#002875] rounded-3xl p-4 sm:p-6 text-white shadow-lg border-2 border-white/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-lg space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-[#FFD100] text-[#0047BA] px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm">
                <i className="fa-solid fa-bolt"></i>
                <span>Atención Rápida en Piso</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ¿Necesitas que un asesor te atienda en tu pasillo?
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                Pide asistencia con un clic. Sonará la sirena en el celular del asesor y acudirá a {selectedAisle} en menos de 1 minuto.
              </p>
            </div>

            <button
              onClick={handleOpenGeneralRequest}
              className="py-3.5 px-6 bg-[#FFD100] hover:bg-amber-300 text-[#0047BA] rounded-2xl font-black text-sm sm:text-base shadow-xl border-2 border-white/40 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shrink-0 animate-pulse"
            >
              <i className="fa-solid fa-headset text-lg"></i>
              <span>🔔 PEDIR ASISTENCIA AHORA</span>
            </button>
          </div>
        </div>

        {/* BUSCADOR DE PRODUCTOS EN TIENDA */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por producto, marca (Samsung, iPhone, Mabe...) o pasillo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0047BA] shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* CATEGORÍAS EN CHIPS DESLIZABLES */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'todos', label: 'Todos los Productos', icon: 'fa-layer-group' },
            { id: 'celulares', label: 'Celulares', icon: 'fa-mobile-screen' },
            { id: 'electronica', label: 'Pantallas TV', icon: 'fa-tv' },
            { id: 'muebles', label: 'Muebles & Salas', icon: 'fa-couch' },
            { id: 'linea_blanca', label: 'Línea Blanca', icon: 'fa-snowflake' },
            { id: 'colchones', label: 'Colchones', icon: 'fa-bed' },
            { id: 'ropa_calzado', label: 'Calzado & Ropa', icon: 'fa-shoe-prints' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0047BA] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <i className={`fa-solid ${cat.icon} text-xs`}></i>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* GRID DE PRODUCTOS EN TIENDA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047BA] flex items-center justify-center text-lg shadow-inner">
                    <i className={`fa-solid ${prod.icon}`}></i>
                  </div>
                  {prod.badge && (
                    <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm">
                      {prod.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {prod.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">{prod.model}</p>

                {/* PASILLO DONDE SE ENCUENTRA EN LA TIENDA FÍSICA */}
                <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#0047BA] bg-blue-50 px-2 py-0.5 rounded-lg mb-2.5">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>{prod.aisle}</span>
                </div>

                {/* PRECIO CONTADO Y ABONO QUINCENAL COPPEL */}
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 mb-3 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Contado:</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        ${prod.cashPrice.toLocaleString('es-MX')} MXN
                      </span>
                      {prod.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through block leading-none">
                          ${prod.originalPrice.toLocaleString('es-MX')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0047BA] uppercase">
                      Crédito Coppel:
                    </span>
                    <span className="text-xs font-black text-[#0047BA] bg-[#FFD100]/30 px-1.5 py-0.5 rounded-md">
                      Desde ${prod.quincenalBase}/quincena
                    </span>
                  </div>
                </div>
              </div>

              {/* ACCIONES DEL PRODUCTO */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => handleOpenRequestForProduct(prod)}
                  className="w-full py-2 px-3 bg-[#FFD100] hover:bg-amber-300 text-[#0047BA] rounded-xl text-xs font-black shadow-sm border border-amber-300/50 flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-headset text-xs"></i>
                  <span>Pedir Asesor para este Producto</span>
                </button>

                <button
                  onClick={() => setSelectedProduct(prod)}
                  className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>Ver Especificaciones y Abonos</span>
                  <i className="fa-solid fa-chevron-right text-[9px]"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 3. BOTÓN FLOTANTE PERMANENTE EN EL MÓVIL: "PEDIR ASISTENCIA" */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-3 max-w-md mx-auto pointer-events-none">
        <button
          onClick={handleOpenGeneralRequest}
          className="w-full py-3.5 px-4 bg-[#FFD100] hover:bg-amber-300 text-[#0047BA] rounded-2xl font-black text-sm shadow-2xl border-2 border-white/80 flex items-center justify-between transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-amber-500/30"
        >
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-[#0047BA] text-[#FFD100] flex items-center justify-center text-sm shadow">
              <i className="fa-solid fa-bell animate-wiggle"></i>
            </span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black uppercase tracking-wider">
                Pedir Asistencia en Piso
              </span>
              <span className="text-[10px] text-blue-900 font-semibold truncate block">
                {selectedAisle}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-xs font-black bg-[#0047BA] text-white px-2.5 py-1 rounded-xl shadow-sm">
            <span>LLAMAR</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </div>
        </button>
      </div>

      {/* MODAL: SOLICITAR ASISTENCIA EN TIENDA */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-[#0047BA] overflow-hidden flex flex-col max-h-[92vh]">
            {/* ENCABEZADO MODAL */}
            <div className="bg-[#0047BA] text-white p-4 flex items-center justify-between border-b-2 border-[#FFD100]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">Llamar a un Asesor Coppel</h3>
                  <p className="text-[10px] text-blue-100">Atención presencial en tu pasillo</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSendAssistanceRequest} className="p-4 overflow-y-auto space-y-3.5">
              {/* SELECCIÓN DE PASILLO */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  1. ¿En qué pasillo te encuentras?
                </label>
                <select
                  value={modalAisle}
                  onChange={(e) => {
                    setModalAisle(e.target.value);
                    const found = STORE_AISLES.find((a) => a.name === e.target.value);
                    if (found) setModalDept(found.dept);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0047BA]"
                >
                  {STORE_AISLES.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECCIÓN DE MOTIVO */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  2. ¿Qué tipo de apoyo necesitas?
                </label>
                <div className="space-y-1.5">
                  {ASSISTANCE_REASONS.map((reason) => (
                    <button
                      type="button"
                      key={reason.id}
                      onClick={() => setModalReason(reason.label)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                        modalReason === reason.label
                          ? 'bg-blue-50 border-[#0047BA] ring-2 ring-[#0047BA]/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          modalReason === reason.label
                            ? 'bg-[#0047BA] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <i className={`fa-solid ${reason.icon}`}></i>
                      </div>
                      <div className="text-left leading-tight truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {reason.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium truncate block">
                          {reason.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NOMBRE OPCIONAL */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tu nombre (opcional para llamarte):
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0047BA]"
                />
              </div>

              {/* BOTÓN ENVIAR */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#FFD100] hover:bg-amber-300 disabled:opacity-50 text-[#0047BA] rounded-2xl font-black text-sm shadow-lg border-2 border-white/60 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-bullhorn text-sm"></i>
                  <span>{isSubmitting ? 'Conectando con asesores...' : 'SOLICITAR ASESOR AHORA'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Sonará una alerta sonora en el teléfono del personal en piso.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DEL PRODUCTO Y SIMULADOR DE ABONOS */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-[#0047BA] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0047BA] text-white p-4 flex items-center justify-between border-b-2 border-[#FFD100]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-[#FFD100] flex items-center justify-center text-base">
                  <i className={`fa-solid ${selectedProduct.icon}`}></i>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-[10px] text-blue-100">{selectedProduct.aisle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <p className="text-slate-600 font-medium leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* SIMULADOR DE CRÉDITO COPPEL */}
              <div className="bg-blue-50 border-2 border-[#0047BA] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#0047BA] uppercase text-xs">
                    Simulador de Abonos Crédito Coppel
                  </span>
                  <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    Sin Tarjeta Bancaria
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-slate-500 font-bold block">12 Quincenas</span>
                    <span className="font-black text-slate-900 text-xs">
                      ${Math.round(selectedProduct.quincenalBase * 1.35)}/qna
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200 ring-2 ring-[#FFD100]">
                    <span className="text-[10px] text-[#0047BA] font-black block">18 Quincenas (Top)</span>
                    <span className="font-black text-[#0047BA] text-xs">
                      ${selectedProduct.quincenalBase}/qna
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-slate-500 font-bold block">24 Quincenas</span>
                    <span className="font-black text-slate-900 text-xs">
                      ${Math.round(selectedProduct.quincenalBase * 0.8)}/qna
                    </span>
                  </div>
                </div>
              </div>

              {/* ESPECIFICACIONES */}
              <div>
                <span className="font-black text-slate-800 text-xs block mb-1.5 uppercase">
                  Características Destacadas:
                </span>
                <ul className="space-y-1">
                  {selectedProduct.specs.map((spec, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-slate-700">
                      <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* BOTÓN PEDIR ASESOR DIRECTO */}
              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  handleOpenRequestForProduct(prod);
                }}
                className="w-full py-3 bg-[#FFD100] hover:bg-amber-300 text-[#0047BA] rounded-2xl font-black text-sm shadow-md border-2 border-white/60 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer mt-2"
              >
                <i className="fa-solid fa-headset text-sm"></i>
                <span>Llamar a un Asesor para ver este producto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONECTAR SEGUNDO CELULAR (ASESOR) CON QR */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border-4 border-[#0047BA] overflow-hidden flex flex-col">
            <div className="bg-[#0047BA] text-white p-4 flex items-center justify-between border-b-2 border-[#FFD100]">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-mobile-screen text-[#FFD100] text-lg"></i>
                <h3 className="font-black text-sm">Conectar Celular 2 (Asesor)</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 flex flex-col items-center text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Escanea este código QR con la cámara del <strong>segundo celular</strong> para abrir la <strong>App del Asesor</strong>:
              </p>

              {/* CÓDIGO QR */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
                <img
                  src={advisorQrUrl}
                  alt="QR Celular Asesor"
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>

              {/* BOTÓN COPIAR ENLACE */}
              <button
                onClick={handleCopyAdvisorLink}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#0047BA] border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <i className="fa-solid fa-copy"></i>
                <span>{copyNotice ? '¡Enlace Copiado!' : 'Copiar Enlace para Celular 2'}</span>
              </button>

              {/* ACCESO DIRECTO SI SE PRUEBA EN LA MISMA COMPUTADORA */}
              {onOpenAdvisorApp && (
                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    onOpenAdvisorApp();
                  }}
                  className="text-xs text-[#0047BA] underline font-bold cursor-pointer hover:text-blue-800"
                >
                  O abrir App Asesor en esta misma pestaña
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
