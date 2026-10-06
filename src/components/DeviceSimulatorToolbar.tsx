import React, { useState } from 'react';
import { DeviceMode } from './PhoneHeader';
import { QRCodeDisplay } from './QRCodeDisplay';

interface DeviceSimulatorToolbarProps {
  deviceMode: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
  isWireframe: boolean;
  onToggleWireframe: () => void;
  backendOnline: boolean;
}

export const DeviceSimulatorToolbar: React.FC<DeviceSimulatorToolbarProps> = ({
  deviceMode,
  onDeviceChange,
  isWireframe,
  onToggleWireframe,
  backendOnline,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <header className="w-full max-w-4xl mx-auto mb-3 px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs shadow-xl z-30 flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Backend Status */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span className="font-bold text-slate-200">Coppel Select</span>
            <span className="text-[10px] text-amber-400 font-mono">Backend Express</span>
          </div>
        </div>

        {/* Device Mode Switcher (iPhone, Samsung, Tablet, Fluid) */}
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onDeviceChange('iphone')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-all btn-motion ${
              deviceMode === 'iphone'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Vista iPhone 16 Pro (iOS)"
          >
            <i className="fa-brands fa-apple text-xs"></i>
            <span>iPhone</span>
          </button>

          <button
            onClick={() => onDeviceChange('samsung')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-all btn-motion ${
              deviceMode === 'samsung'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Vista Samsung Galaxy (Android)"
          >
            <i className="fa-brands fa-android text-xs"></i>
            <span>Samsung</span>
          </button>

          <button
            onClick={() => onDeviceChange('tablet')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-all btn-motion ${
              deviceMode === 'tablet'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Vista iPad / Tablet"
          >
            <i className="fa-solid fa-tablet-screen-button text-xs"></i>
            <span>Tablet</span>
          </button>

          <button
            onClick={() => onDeviceChange('fluid')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-all btn-motion ${
              deviceMode === 'fluid'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Vista Fluida Responsive 100%"
          >
            <i className="fa-solid fa-desktop text-xs"></i>
            <span>Fluido</span>
          </button>
        </div>

        {/* QR Testing & Wireframe Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-amber-300 font-semibold text-[11px] flex items-center space-x-1.5 border border-blue-700/50 btn-motion"
            title="Escanear en celular físico real"
          >
            <i className="fa-solid fa-qrcode text-xs"></i>
            <span>Abrir en mi Celular</span>
          </button>

          <button
            onClick={onToggleWireframe}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-all btn-motion ${
              isWireframe
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Alternar modo Wireframe"
          >
            <i className="fa-solid fa-vector-square text-[10px]"></i>
            <span>{isWireframe ? 'Wireframe ON' : 'Wireframe'}</span>
          </button>
        </div>
      </header>

      {/* Modal para probar en Smartphone o Tablet real mediante QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-400/40 w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl space-y-3 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>

            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-400 text-[#002B66] text-lg font-bold">
              <i className="fa-solid fa-mobile-screen"></i>
            </div>

            <h3 className="text-base font-extrabold text-white">
              Prueba en tu iPhone, Samsung o Tablet
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apunta la cámara de tu teléfono a este código QR para abrir la app directamente en Safari o Chrome como PWA nativa.
            </p>

            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <QRCodeDisplay value={currentUrl} size={160} />
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left space-y-1">
              <p className="text-amber-300 font-bold">Instrucciones para instalar:</p>
              <p>• <strong>iPhone / iPad:</strong> Toca compartir en Safari y "Agregar a pantalla de inicio".</p>
              <p>• <strong>Samsung / Android:</strong> Toca el menú (3 puntos) y "Instalar aplicación".</p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-[#002B66] font-bold rounded-xl text-xs btn-motion"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
