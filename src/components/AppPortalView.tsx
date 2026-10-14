import React, { useState } from 'react';

interface AppPortalViewProps {
  onSelectApp: (app: 'consumer' | 'staff' | 'admin') => void;
}

export const AppPortalView: React.FC<AppPortalViewProps> = ({ onSelectApp }) => {
  const [copiedApp, setCopiedApp] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const consumerUrl = `${getBaseUrl()}/consumidor`;
  const advisorUrl = `${getBaseUrl()}/asesor`;
  const adminUrl = `${getBaseUrl()}/admin`;

  const consumerQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    consumerUrl
  )}`;
  const advisorQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    advisorUrl
  )}`;

  const handleCopy = (url: string, key: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedApp(key);
    setTimeout(() => setCopiedApp(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col justify-between select-none">
      {/* 1. ENCABEZADO COPPEL */}
      <header className="bg-[#0047BA] text-white shadow-md border-b-4 border-[#FFD100]">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black text-white tracking-tight">Coppel</span>
                <span className="bg-[#FFD100] text-[#0047BA] text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Multi-App Ecosistema
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">
                Conexión en Tiempo Real entre Celular Consumidor y Celular Asesor
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Servidor SSE Activo</span>
          </div>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL CON LAS DOS APPS INDEPENDIENTES */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {/* BANNER GUÍA DE USO */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047BA] flex items-center justify-center text-xl shadow-inner font-black">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                Dos Aplicaciones Separadas • Conexión Celular a Celular
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Cada aplicación funciona en su propia pantalla de forma 100% independiente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#0047BA] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <p className="text-slate-600 font-medium">
                Abre la <strong>App Consumidor</strong> en el <strong>Celular 1</strong> (o escanea su código QR).
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#FFD100] text-[#0047BA] font-black flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <p className="text-slate-600 font-medium">
                Abre la <strong>App Asesor</strong> en el <strong>Celular 2</strong> (o escanea su código QR).
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <p className="text-slate-600 font-medium">
                Al pulsar <strong>"Pedir Asistencia"</strong> en el Celular 1, <strong>¡sonará la sirena en vivo</strong> en el Celular 2!
              </p>
            </div>
          </div>
        </div>

        {/* TARJETAS DE LAS DOS APLICACIONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TARJETA 1: APP CONSUMIDOR */}
          <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-blue-200 hover:border-[#0047BA] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-100 text-[#0047BA] text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  Celular 1 • Cliente
                </span>
                <span className="text-xs text-slate-400 font-mono">/consumidor</span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#0047BA] text-white flex items-center justify-center text-2xl shadow-md">
                  <i className="fa-solid fa-cart-shopping"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    App Consumidor
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Experiencia limpia para el cliente en tienda
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
                Diseñada exclusivamente para clientes: catálogo de productos Coppel, precios de contado y abonos quincenales, y el botón <strong>"Pedir Asistencia en mi Pasillo"</strong> con PIN de seguridad.
              </p>

              {/* QR CONSUMIDOR */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center mb-4">
                <span className="text-[11px] font-bold text-slate-600 mb-2">
                  Escanea con la cámara del <strong>Celular 1</strong>:
                </span>
                <img
                  src={consumerQr}
                  alt="QR App Consumidor"
                  className="w-40 h-40 rounded-xl shadow-sm border border-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSelectApp('consumer')}
                className="w-full py-3 bg-[#0047BA] hover:bg-blue-800 text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Abrir App Consumidor Ahora</span>
              </button>

              <button
                onClick={() => handleCopy(consumerUrl, 'consumer')}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#0047BA] rounded-xl font-bold text-xs border border-blue-200 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-copy"></i>
                <span>{copiedApp === 'consumer' ? '¡Enlace Copiado!' : 'Copiar Enlace para Celular 1'}</span>
              </button>
            </div>
          </div>

          {/* TARJETA 2: APP ASESOR */}
          <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-amber-300 hover:border-amber-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  Celular 2 • Colaborador
                </span>
                <span className="text-xs text-slate-400 font-mono">/asesor</span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-2xl shadow-md">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    App Asesor de Piso
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Herramienta de atención y sirena en vivo
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
                Herramienta para el personal en piso: recibe la <strong>sirena sonora en tiempo real</strong> al pedir ayuda, muestra el pasillo del cliente, cuenta regresiva, y permite <strong>tomar foto con la cámara del celular</strong> para validar la atención.
              </p>

              {/* QR ASESOR */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center mb-4">
                <span className="text-[11px] font-bold text-slate-600 mb-2">
                  Escanea con la cámara del <strong>Celular 2</strong>:
                </span>
                <img
                  src={advisorQr}
                  alt="QR App Asesor"
                  className="w-40 h-40 rounded-xl shadow-sm border border-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSelectApp('staff')}
                className="w-full py-3 bg-[#FFD100] hover:bg-amber-300 text-[#0047BA] rounded-2xl font-black text-sm shadow-md border-2 border-white/60 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Abrir App Asesor Ahora</span>
              </button>

              <button
                onClick={() => handleCopy(advisorUrl, 'staff')}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs border border-amber-200 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-copy"></i>
                <span>{copiedApp === 'staff' ? '¡Enlace Copiado!' : 'Copiar Enlace para Celular 2'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TARJETA SECUNDARIA: TABLERO GERENCIAL EN COMPUTADORA */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#FFD100] flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-desktop"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                ¿Prefieres monitorear desde una computadora?
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Accede al Tablero del Gerente para ver métricas de atención, mapa de colaboradores y despachar apoyo.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectApp('admin')}
            className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold border border-white/20 whitespace-nowrap transition-all active:scale-95 cursor-pointer"
          >
            Abrir Tablero Gerente
          </button>
        </div>
      </main>

      {/* 3. PIE DE PÁGINA */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-400">
        Ecosistema Omnicanal Coppel • Sincronización SSE en Tiempo Real
      </footer>
    </div>
  );
};
