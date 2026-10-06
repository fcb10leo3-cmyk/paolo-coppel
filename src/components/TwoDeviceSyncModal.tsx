import React, { useState } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';

interface TwoDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminInSameWindow: () => void;
}

export const TwoDeviceSyncModal: React.FC<TwoDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminInSameWindow,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Real URL for the mobile admin app on the second device
  const mobileAdminUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?mode=admin`
    : 'https://ais-dev-nwtb25iieeohszzxoybd5e-425523644258.us-west2.run.app/?mode=admin';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileAdminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-white text-slate-900 rounded-[32px] w-full max-w-xl flex flex-col shadow-2xl border-4 border-amber-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-[#002B66] to-blue-900 text-white p-5 flex items-center justify-between border-b-4 border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center text-2xl font-black shadow">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Probar con 2 Dispositivos Distintos</span>
                <span className="text-[10px] bg-amber-400 text-[#002B66] font-extrabold px-2 py-0.5 rounded-full">
                  Multi-Device Sync
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Tótem en Pantalla 1 y Notificaciones en tu Celular 2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh] screen-scroll">
          {/* Instrucciones 1-2-3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                1
              </div>
              <h4 className="text-xs font-black text-[#002B66]">Escanea en tu Celular</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Usa la cámara de tu teléfono móvil para escanear el QR inferior.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-[#002B66] font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                2
              </div>
              <h4 className="text-xs font-black text-amber-900">Activa Notificaciones</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Toca el botón en tu celular para activar el timbre y vibrador.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                3
              </div>
              <h4 className="text-xs font-black text-emerald-900">Oprime el Botón</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Presiona "Pedir Asistencia" en este kiosco y mira cómo suena tu celular.
              </p>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-center gap-5 text-center sm:text-left">
            <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-[#002B66] shrink-0">
              <QRCodeDisplay value={mobileAdminUrl} size={150} />
              <div className="text-[9px] font-mono text-center text-slate-400 mt-1">
                ESCANEAME CON TU CÁMARA
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                ● Enlace Directo para Teléfono
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#002B66]">
                App Móvil del Personal Coppel
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Abre esta dirección web en cualquier smartphone (iPhone o Android) conectado a internet:
              </p>

              <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-300">
                <input
                  type="text"
                  readOnly
                  value={mobileAdminUrl}
                  className="text-[11px] font-mono text-slate-700 bg-transparent flex-1 px-2 outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center space-x-1 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#002B66] hover:bg-blue-800 text-amber-300'
                  }`}
                >
                  <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Botón para previsualizar en la misma computadora/ventana */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="text-xs text-blue-900">
              <strong className="block font-bold">¿Quieres probar sin celular primero?</strong>
              <span className="text-[11px] text-blue-700">
                Puedes cambiar de vista a la App de Empleados en este mismo navegador.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAdminInSameWindow();
              }}
              className="py-2 px-3.5 bg-[#002B66] hover:bg-blue-900 text-amber-300 font-extrabold rounded-xl text-xs transition-colors shrink-0"
            >
              Abrir Panel Admin Aquí
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};
