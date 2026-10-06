import React, { useState } from 'react';
import { KioskReceipt, AssistanceAlert } from '../types';
import { KioskTabletUI } from './KioskTabletUI';
import { voice } from '../services/voice';

interface PhysicalTotemFrameProps {
  onOpenHardwareModal: () => void;
  onOpenAdminPanel: () => void;
  onOpenSyncModal: () => void;
  isAssistanceActive: boolean;
  onTriggerAssistance: (reason?: string, preferredEmployeeId?: string) => void;
  onCancelAssistance: () => void;
  activeAssociateName: string;
  activeCall?: AssistanceAlert | null;
}

export const PhysicalTotemFrame: React.FC<PhysicalTotemFrameProps> = ({
  onOpenHardwareModal,
  onOpenAdminPanel,
  onOpenSyncModal,
  isAssistanceActive,
  onTriggerAssistance,
  onCancelAssistance,
  activeAssociateName,
  activeCall,
}) => {
  const [viewMode, setViewMode] = useState<'totem' | 'fullscreen'>('totem');
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState<KioskReceipt | null>(null);
  const [isPrintingAnimation, setIsPrintingAnimation] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const handlePhysicalButtonClick = () => {
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 250);

    // Audio chime simulation
    if (isVoiceEnabled) {
      voice.speak('Botón presionado. Conectando con un asesor de tienda.');
    }

    onTriggerAssistance('Pulsación del botón físico PUSH TO SPEAK');
  };

  const handlePrintTicket = (receipt: KioskReceipt) => {
    setIsPrintingAnimation(true);
    setPrintedReceipt(receipt);

    setTimeout(() => {
      setIsPrintingAnimation(false);
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-screen p-1.5 sm:p-4 select-none">
      {/* Barra de Controles Superiores del Proyecto */}
      <header className="w-full max-w-5xl mx-auto mb-2 sm:mb-3 px-2.5 sm:px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2 z-30">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-sm sm:text-base shadow">
              <i className="fa-solid fa-key"></i>
            </div>
            <div>
              <span className="font-extrabold text-white text-xs sm:text-sm">Coppel Asistencia</span>
              <span className="text-[9px] sm:text-[10px] text-amber-400 font-mono block">Kiosco Tótem & Mobile Sync</span>
            </div>
          </div>

          {/* Botón rápido de Guía en mobile */}
          <button
            onClick={onOpenHardwareModal}
            className="sm:hidden px-2.5 py-1 bg-blue-900/80 hover:bg-blue-800 text-amber-300 font-bold rounded-lg text-[10px] flex items-center space-x-1 border border-blue-600/50"
            title="Especificaciones de hardware"
          >
            <i className="fa-solid fa-microchip text-[10px]"></i>
            <span>Hardware</span>
          </button>
        </div>

        {/* View Switcher: Totem Real vs Pantalla Completa Tablet vs App Celular */}
        <div className="flex items-center justify-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewMode('totem')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 sm:space-x-1.5 transition-all btn-motion whitespace-nowrap ${
              viewMode === 'totem'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Ver el mueble/tótem físico completo con el botón arcade"
          >
            <i className="fa-solid fa-store text-xs"></i>
            <span className="hidden xs:inline">Tótem Físico</span>
            <span className="xs:hidden">Tótem</span>
          </button>

          <button
            onClick={() => setViewMode('fullscreen')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 sm:space-x-1.5 transition-all btn-motion whitespace-nowrap ${
              viewMode === 'fullscreen'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Ver sólo la interfaz táctil de la pantalla/tablet"
          >
            <i className="fa-solid fa-tablet-screen-button text-xs"></i>
            <span className="hidden xs:inline">Pantalla Tablet</span>
            <span className="xs:hidden">Tablet</span>
          </button>

          <button
            onClick={onOpenAdminPanel}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 sm:space-x-1.5 text-blue-300 hover:text-white hover:bg-slate-800 transition-all btn-motion whitespace-nowrap"
            title="Abrir el Panel de Administrador / App Celular de Empleados"
          >
            <i className="fa-solid fa-mobile-screen-button text-xs text-amber-400"></i>
            <span className="hidden xs:inline">App Móvil</span>
            <span className="xs:hidden">Móvil</span>
          </button>
        </div>

        {/* Acciones Secundarias: Vincular Celular & Hardware Blueprint (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={onOpenSyncModal}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-sm btn-motion whitespace-nowrap"
            title="Abrir código QR para probar en 2 celulares/dispositivos en simultáneo"
          >
            <i className="fa-solid fa-qrcode text-xs"></i>
            <span>2 Dispositivos (QR)</span>
          </button>

          <button
            onClick={onOpenHardwareModal}
            className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-800 text-amber-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-blue-600/50 shadow-sm btn-motion whitespace-nowrap"
            title="Ver qué hardware, pulgadas, circuitos y costos necesitas"
          >
            <i className="fa-solid fa-microchip text-xs"></i>
            <span>Guía Hardware</span>
          </button>
        </div>
      </header>

      {/* VISTA 1: EL TÓTEM FÍSICO (IDÉNTICO A LA FOTO DE REFERENCIA) */}
      {viewMode === 'totem' && (
        <div className="w-full max-w-[760px] totem-casing rounded-3xl sm:rounded-[44px] p-3 sm:p-7 flex flex-col items-center shadow-2xl relative overflow-hidden my-auto border-2 sm:border-4 border-blue-500/40">
          {/* 1. Logotipo Superior Retroiluminado Coppel (Exacto a la foto) */}
          <div className="w-full flex justify-center mb-2 sm:mb-3">
            <div className="bg-[#001f4d] px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border-2 border-amber-400/80 shadow-[0_0_20px_rgba(253,224,71,0.3)] flex items-center space-x-2 sm:space-x-2.5">
              <i className="fa-solid fa-key text-amber-400 text-base sm:text-lg neon-coppel-yellow"></i>
              <span className="font-black text-amber-400 text-base sm:text-xl tracking-wider uppercase drop-shadow neon-coppel-yellow">
                Coppel
              </span>
            </div>
          </div>

          {/* 2. Letras 3D Brillantes en relieve: "COPPEL Asistencia" (Exacto a la foto) */}
          <div className="text-center mb-3 sm:mb-5">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase neon-coppel-title">
              COPPEL
            </h2>
            <h3 className="text-base sm:text-xl font-light text-cyan-200 tracking-wider -mt-1 drop-shadow">
              Asistencia
            </h3>
          </div>

          {/* 3. Marco de la Tablet Empotrada Horizontalmente (15.6" - 21.5") */}
          <div className="w-full h-[520px] sm:h-[580px] md:h-[620px] bg-black rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-4 border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
            {/* Pantalla Táctil Activa */}
            <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3F7FA] relative flex flex-col">
              <KioskTabletUI
                onTriggerAssistance={onTriggerAssistance}
                isAssistanceActive={isAssistanceActive}
                activeAssociateName={activeAssociateName}
                onCancelAssistance={onCancelAssistance}
                onPrintTicket={handlePrintTicket}
                isLargeText={isLargeText}
                onToggleLargeText={() => setIsLargeText(!isLargeText)}
                isVoiceEnabled={isVoiceEnabled}
                onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
                onOpenAdminPanel={onOpenAdminPanel}
                activeCall={activeCall}
              />
            </div>
          </div>

          {/* 4. El Botón Físico "PUSH TO SPEAK / PRESIONE PARA PEDIR AYUDA" (Exacto a la foto) */}
          <div className="mt-4 sm:mt-6 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={handlePhysicalButtonClick}>
              {/* Anillo de texto circular curvo exterior */}
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full arcade-button-ring p-2 sm:p-3 flex items-center justify-center relative shadow-2xl transition-all ${
                  isAssistanceActive ? 'led-blue-ring-pulsing' : 'led-blue-ring'
                }`}
              >
                {/* Texto curvo grabado "PUSH TO SPEAK" */}
                <div className="absolute top-1 text-[7px] sm:text-[9px] font-black text-slate-800 tracking-widest uppercase pointer-events-none">
                  PUSH TO SPEAK
                </div>

                {/* Domo Central de Aluminio Cepillado */}
                <button
                  type="button"
                  aria-label="Presione para pedir ayuda"
                  className={`w-18 h-18 sm:w-24 sm:h-24 rounded-full arcade-button-center flex flex-col items-center justify-center font-bold text-slate-700 active:scale-95 transition-transform ${
                    isButtonPressed ? 'pressed' : ''
                  }`}
                >
                  <i
                    className={`fa-solid fa-microphone-lines text-xl sm:text-2xl transition-colors ${
                      isAssistanceActive ? 'text-blue-600 animate-pulse' : 'text-slate-600'
                    }`}
                  ></i>
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-600 mt-0.5 tracking-tight uppercase">
                    Hablar
                  </span>
                </button>

                {/* Texto curvo grabado "PRESIONE PARA PEDIR AYUDA" */}
                <div className="absolute bottom-1 text-[6px] sm:text-[8px] font-black text-slate-800 tracking-wider uppercase pointer-events-none">
                  PRESIONE PARA PEDIR AYUDA
                </div>
              </div>
            </div>

            <span className="text-[9px] sm:text-[10px] text-cyan-200 mt-2 font-medium">
              ↑ Toca el botón circular para pedir asesoría
            </span>
          </div>

          {/* 5. Ranura Expulsora de Ticket de la Impresora Térmica Empotrada */}
          <div className="w-full mt-3 sm:mt-4 flex flex-col items-center">
            {/* Ranura metálica */}
            <div className="w-44 sm:w-56 h-2.5 sm:h-3 bg-slate-950 rounded-full border border-slate-700 shadow-inner relative flex justify-center">
              <div className="w-36 sm:w-48 h-1 bg-black rounded-full mt-1"></div>
            </div>
            <span className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 font-mono">
              [ SALIDA DE TICKETS & COMPROBANTES ]
            </span>

            {/* Ticket animado saliendo físicamente de la ranura */}
            {printedReceipt && (
              <div
                className={`mt-1 w-60 sm:w-64 max-w-full bg-white text-slate-900 p-3 sm:p-3.5 rounded-lg shadow-2xl border border-slate-300 font-mono text-[9px] sm:text-[10px] space-y-1.5 ${
                  isPrintingAnimation ? 'ticket-eject' : ''
                }`}
              >
                <div className="text-center border-b border-dashed border-slate-400 pb-1.5">
                  <p className="font-extrabold text-xs">COPPEL ASISTENCIA</p>
                  <p className="text-[9px] text-slate-500">{printedReceipt.branch}</p>
                  <p className="text-[8px] text-slate-400">{printedReceipt.date} · {printedReceipt.time}</p>
                </div>

                <div className="space-y-0.5 text-[9px]">
                  <p><strong>Folio:</strong> {printedReceipt.ticketNumber}</p>
                  <p><strong>Concepto:</strong> {printedReceipt.concept}</p>
                  {printedReceipt.amount > 0 && !printedReceipt.details && (
                    <p><strong>Total Pagado:</strong> ${printedReceipt.amount}.00 MXN</p>
                  )}
                  {printedReceipt.details && (
                    <div className="my-1.5 p-1.5 bg-slate-50 border border-slate-300 rounded text-[9px] space-y-0.5">
                      <p className="font-bold text-[#002B66]">COTIZACIÓN DE CRÉDITO:</p>
                      <p>• {printedReceipt.details.quincenas} Quincenas de: <strong className="text-amber-800">${printedReceipt.details.pagoQuincenal}.00 MXN</strong></p>
                      <p>• Pago de Contado: ${printedReceipt.details.pagoContado?.toLocaleString('es-MX')} MXN</p>
                      <p>• Ubicación: {printedReceipt.details.aisle}</p>
                    </div>
                  )}
                  <p><strong>Método:</strong> {printedReceipt.paymentMethod}</p>
                </div>

                <div className="text-center pt-1 border-t border-dashed border-slate-400 text-[8px] text-slate-500">
                  <p className="font-mono tracking-widest">{printedReceipt.barcode}</p>
                  <p>¡Gracias por tu visita a Coppel!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: MODO PANTALLA COMPLETA TABLET (Para instalar directo en el monitor/tablet del tótem) */}
      {viewMode === 'fullscreen' && (
        <div className="w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-slate-800 overflow-hidden flex flex-col my-auto relative">
          <KioskTabletUI
            onTriggerAssistance={onTriggerAssistance}
            isAssistanceActive={isAssistanceActive}
            activeAssociateName={activeAssociateName}
            onCancelAssistance={onCancelAssistance}
            onPrintTicket={handlePrintTicket}
            isLargeText={isLargeText}
            onToggleLargeText={() => setIsLargeText(!isLargeText)}
            isVoiceEnabled={isVoiceEnabled}
            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            onOpenAdminPanel={onOpenAdminPanel}
            activeCall={activeCall}
          />

          {/* Ticket popup en vista tablet */}
          {printedReceipt && (
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white text-slate-900 p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-amber-400 font-mono text-xs w-64 sm:w-72 animate-in slide-in-from-bottom duration-300 z-50">
              <div className="flex justify-between items-center border-b pb-1 mb-2">
                <span className="font-extrabold text-[#002B66]">Ticket Impreso</span>
                <button
                  onClick={() => setPrintedReceipt(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p><strong>Folio:</strong> {printedReceipt.ticketNumber}</p>
              <p><strong>Concepto:</strong> {printedReceipt.concept}</p>
              {printedReceipt.amount > 0 && (
                <p><strong>Monto:</strong> ${printedReceipt.amount}.00 MXN</p>
              )}
              <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Comprobante generado con éxito</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Informativo */}
      <footer className="mt-2 sm:mt-3 text-center text-slate-400 text-[10px] sm:text-xs max-w-lg px-2">
        <span>Kiosco Coppel Asistencia con Botón Físico "Push to Speak" · Listo para Pantallas Touch y Tablets</span>
      </footer>
    </div>
  );
};
