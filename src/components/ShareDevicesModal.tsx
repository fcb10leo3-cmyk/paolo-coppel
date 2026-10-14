import React, { useState, useEffect } from 'react';

interface ShareDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'multi_pc' | 'staff' | 'admin' | 'requester' | 'kiosk_api' | 'deploy';
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  origin: string;
  aisle: string;
  reason: string;
  status: string;
}

const STORAGE_NETLIFY_URL_KEY = 'coppel_staff_public_netlify_url';

export const ShareDevicesModal: React.FC<ShareDevicesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'multi_pc',
}) => {
  const [activeTab, setActiveTab] = useState<'multi_pc' | 'staff' | 'admin' | 'requester' | 'kiosk_api' | 'deploy'>(initialTab);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMsg, setTestResultMsg] = useState<string>('');
  const [logs, setLogs] = useState<IntegrationLog[]>([]);

  // Detección y personalización de la URL pública
  const [customOrigin, setCustomOrigin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_NETLIFY_URL_KEY);
      if (saved) return saved;

      const currentOrigin = window.location.origin;
      if (
        currentOrigin.includes('netlify.app') ||
        (!currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1') && !currentOrigin.includes('internal'))
      ) {
        return currentOrigin;
      }
    }
    return '';
  });

  const [inputUrl, setInputUrl] = useState<string>(customOrigin);
  const [isSavedUrlBanner, setIsSavedUrlBanner] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && (activeTab === 'kiosk_api' || activeTab === 'multi_pc')) {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/external/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.netlify.app';
  const effectiveOrigin = (customOrigin.trim() ? customOrigin.trim() : windowOrigin).replace(/\/$/, '');

  const staffUrl = `${effectiveOrigin}/?role=staff`;
  const adminUrl = `${effectiveOrigin}/?role=admin`;
  const requesterUrl = `${effectiveOrigin}/?role=requester`;
  const apiUrl = `${effectiveOrigin}/api/external/call`;

  const isLocalOrSandbox =
    windowOrigin.includes('localhost') ||
    windowOrigin.includes('127.0.0.1') ||
    windowOrigin.includes('run.app') ||
    windowOrigin.includes('google');

  const handleSaveCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let clean = inputUrl.trim().replace(/\/$/, '');
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    setCustomOrigin(clean);
    setInputUrl(clean);
    if (typeof window !== 'undefined') {
      if (clean) {
        localStorage.setItem(STORAGE_NETLIFY_URL_KEY, clean);
      } else {
        localStorage.removeItem(STORAGE_NETLIFY_URL_KEY);
      }
    }
    setIsSavedUrlBanner(true);
    setTimeout(() => setIsSavedUrlBanner(false), 3000);
  };

  const handleResetToCurrentOrigin = () => {
    setCustomOrigin('');
    setInputUrl('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_NETLIFY_URL_KEY);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleTestBroadcastPing = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('/api/assistance/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aisle: 'Pasillo Central (Prueba Multi-PC)',
          department: 'Prueba de Enlace de Red',
          reason: '🔔 Prueba de conexión y timbre entre computadoras',
          requesterRole: 'gerente',
          requesterName: 'Prueba Multi-Computadoras',
          urgency: 'alta',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestResultMsg('¡Prueba enviada! La sirena y notificación sonora deben sonar en todas las PCs y celulares.');
        fetchLogs();
      } else {
        setTestStatus('error');
        setTestResultMsg('No se pudo enviar la prueba.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestResultMsg(`Error al conectar: ${err.message || 'Falla de red'}`);
    }
  };

  const generateQrUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      url
    )}&bgcolor=FFFFFF&color=0047BA&margin=2`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white border-4 border-[#0047BA] w-full max-w-3xl rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-slate-800 max-h-[94vh] overflow-y-auto screen-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0047BA] text-[#FFD100] flex items-center justify-center font-black text-xl shadow-md border-2 border-[#FFD100]">
              <i className="fa-solid fa-network-wired"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFD100] text-[#0047BA] px-2 py-0.5 rounded-md">
                  Red Coppel Tienda
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Servidor en Vivo</span>
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#0047BA] mt-0.5">
                Conectar Varias Computadoras & Celulares de Piso
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* TABS SELECTORAS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('multi_pc')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'multi_pc'
                ? 'bg-[#0047BA] text-white font-black shadow-md'
                : 'text-slate-600 hover:text-[#0047BA]'
            }`}
          >
            <i className="fa-solid fa-laptop"></i>
            <span className="truncate">Multi-PC Guía</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#0047BA] text-white font-black shadow-md'
                : 'text-slate-600 hover:text-[#0047BA]'
            }`}
          >
            <i className="fa-solid fa-headset"></i>
            <span className="truncate">Asesores Piso</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#0047BA] text-white font-black shadow-md'
                : 'text-slate-600 hover:text-[#0047BA]'
            }`}
          >
            <i className="fa-solid fa-user-tie"></i>
            <span className="truncate">Gerente Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('requester')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center cursor-pointer ${
              activeTab === 'requester'
                ? 'bg-[#0047BA] text-white font-black shadow-md'
                : 'text-slate-600 hover:text-[#0047BA]'
            }`}
          >
            <i className="fa-solid fa-cash-register"></i>
            <span className="truncate">Cajas / Apoyo</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk_api')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center cursor-pointer ${
              activeTab === 'kiosk_api'
                ? 'bg-[#0047BA] text-white font-black shadow-md'
                : 'text-slate-600 hover:text-[#0047BA]'
            }`}
          >
            <i className="fa-solid fa-plug"></i>
            <span className="truncate">Kiosco Tótem</span>
          </button>
        </div>

        {/* TAB 1: GUÍA MULTI-PC (RESPONDE DIRECTAMENTE A LA DUDA DEL USUARIO) */}
        {activeTab === 'multi_pc' && (
          <div className="space-y-4 animate-in fade-in">
            {/* LAS 3 OPCIONES PARA CONECTAR LAS COMPUTADORAS */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#0047BA] p-4 rounded-2xl">
              <h4 className="font-extrabold text-sm text-[#0047BA] flex items-center space-x-2">
                <i className="fa-solid fa-circle-question text-[#FFD100]"></i>
                <span>¿Cómo conectar las diferentes computadoras en tienda? Las 3 opciones:</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Para que el <strong>Gerente</strong>, el <strong>Personal de Cajas</strong> y los <strong>Asesores en Piso</strong> reciban las notificaciones simultáneamente, elige la opción que mejor se adapte a tu tienda:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {/* OPCIÓN 1 */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Opción 1 • Más Fácil
                    </span>
                    <h5 className="font-black text-xs text-slate-900 mt-1.5">
                      🌐 Por URL en la Nube (Vía Web)
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      La app ya tiene un servidor activo con <strong>Server-Sent Events</strong>. Solo abre el enlace en Chrome o Edge en cada computadora con su rol. No requiere instalar nada.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 mt-2 block">
                    ✓ Funciona de inmediato
                  </span>
                </div>

                {/* OPCIÓN 2 */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Opción 2 • Red Local
                    </span>
                    <h5 className="font-black text-xs text-slate-900 mt-1.5">
                      📶 Misma Wi-Fi / LAN Tienda
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Una PC de la tienda corre el servidor y las demás se conectan usando la <strong>IP local</strong> (ej. <code>http://192.168.1.50:3000</code>).
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#0047BA] mt-2 block">
                    ✓ Cero dependencia de internet
                  </span>
                </div>

                {/* OPCIÓN 3 */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Opción 3 • Móvil
                    </span>
                    <h5 className="font-black text-xs text-slate-900 mt-1.5">
                      📱 Celular del Asesor con QR
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      El personal en piso no necesita estar en un escritorio: escanea el código QR y lleva la app en el bolsillo con sirena y cámara de evidencia.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-purple-700 mt-2 block">
                    ✓ Movilidad total en pasillos
                  </span>
                </div>
              </div>
            </div>

            {/* ENLACES DIRECTOS PARA CADA COMPUTADORA */}
            <div>
              <h4 className="text-xs font-black uppercase text-[#0047BA] mb-2 flex items-center space-x-1.5">
                <i className="fa-solid fa-link text-[#FFD100]"></i>
                <span>Enlaces listos para abrir en cada computadora:</span>
              </h4>

              <div className="space-y-2">
                {/* PC 1: GERENTE */}
                <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-[#0047BA] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0047BA] text-white flex items-center justify-center text-sm font-black shrink-0">
                      <i className="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900">1. Computadora del Gerente / Oficina</span>
                        <span className="text-[10px] bg-blue-100 text-[#0047BA] font-bold px-1.5 py-0.5 rounded">Rol: admin</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md mt-0.5">
                        {adminUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(adminUrl, 'admin_url')}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>
                      <span>{copiedType === 'admin_url' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-[#0047BA] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* PC 2 / CELULARES: ASESOR PISO */}
                <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-[#0047BA] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                      <i className="fa-solid fa-headset"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900">2. Computadora o Celulares de Asesores en Piso</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Rol: staff</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md mt-0.5">
                        {staffUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(staffUrl, 'staff_url')}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>
                      <span>{copiedType === 'staff_url' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                    <a
                      href={staffUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* PC 3: CAJAS / PERSONAL SOLICITANTE */}
                <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-[#0047BA] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-sm font-black shrink-0">
                      <i className="fa-solid fa-cash-register"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900">3. Computadora de Cajas, Mostrador o Kiosco</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">Rol: requester</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md mt-0.5">
                        {requesterUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(requesterUrl, 'req_url')}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>
                      <span>{copiedType === 'req_url' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                    <a
                      href={requesterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-[#0047BA] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN INTERACTIVO DE PRUEBA DE TIMBRE EN TODAS LAS COMPUTADORAS */}
            <div className="bg-slate-50 border-2 border-slate-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h5 className="font-black text-xs text-slate-900 flex items-center space-x-1.5">
                  <i className="fa-solid fa-bell text-[#0047BA]"></i>
                  <span>¿Deseas probar la conexión entre las pantallas ahora mismo?</span>
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Presiona el botón para emitir una alerta sonora de prueba. Deberá sonar la alarma y reproducirse la síntesis de voz en todas las computadoras y celulares abiertos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestBroadcastPing}
                disabled={testStatus === 'testing'}
                className="py-2.5 px-4 bg-[#FFD100] hover:bg-amber-400 active:scale-95 text-[#0047BA] font-black rounded-xl text-xs shadow-md border-2 border-[#0047BA] flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <i className="fa-solid fa-volume-high"></i>
                <span>{testStatus === 'testing' ? 'Emitiendo timbre...' : '🔔 Probar Timbre en Todas las PCs'}</span>
              </button>
            </div>

            {testResultMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                testStatus === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                <i className={`fa-solid ${testStatus === 'success' ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
                <span>{testResultMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APP ASESORES (QR) */}
        {activeTab === 'staff' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
              <div className="bg-white p-3 rounded-2xl border-4 border-[#0047BA] shrink-0 text-center shadow-md">
                <img
                  src={generateQrUrl(staffUrl)}
                  alt="QR App Asesor"
                  className="w-36 h-36 rounded-xl mx-auto border border-slate-200"
                />
                <span className="text-[10px] text-[#0047BA] font-black block mt-1.5">
                  Escanea con la cámara del celular
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider block">
                    ● Enlace Móvil Optimizado (Pantalla Completa)
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    App para Asesores y Personal en Piso
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Abre este link en el celular (Android o iPhone) o en una tablet de pasillo. Recibe las llamadas con sirena, cámara de evidencia, toma de fotos y gamificación de puntos.
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-[#0047BA] font-bold truncate">
                  {staffUrl}
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => copyToClipboard(staffUrl, 'staff')}
                    className="py-2 px-3.5 bg-[#FFD100] hover:bg-amber-400 text-[#0047BA] font-black rounded-xl text-xs shadow flex items-center space-x-1.5 transition-colors cursor-pointer border border-amber-300"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'staff' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <a
                    href={staffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-[#0047BA] hover:bg-[#003899] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Abrir en Pestaña Nueva</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN SUPERVISOR */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
              <div className="bg-white p-3 rounded-2xl border-4 border-[#0047BA] shrink-0 text-center shadow-md">
                <img
                  src={generateQrUrl(adminUrl)}
                  alt="QR Tablero Supervisor"
                  className="w-36 h-36 rounded-xl mx-auto border border-slate-200"
                />
                <span className="text-[10px] text-[#0047BA] font-black block mt-1.5">
                  Escanea para acceder
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-[#0047BA] font-black uppercase tracking-wider block">
                    ● Acceso Gerencial y Supervisión
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Tablero del Supervisor de Tienda
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Diseñado para la computadora del gerente, monitor central de tienda o tablet de supervisión. Permite reasignar alertas, otorgar bonos de puntos y despachar apoyo inmediato.
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-[#0047BA] font-bold truncate">
                  {adminUrl}
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => copyToClipboard(adminUrl, 'admin')}
                    className="py-2 px-3.5 bg-[#FFD100] hover:bg-amber-400 text-[#0047BA] font-black rounded-xl text-xs shadow flex items-center space-x-1.5 transition-colors cursor-pointer border border-amber-300"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'admin' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <a
                    href={adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-[#0047BA] hover:bg-[#003899] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Abrir en Pestaña Nueva</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TERMINAL DE SOLICITUD CAJAS */}
        {activeTab === 'requester' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
              <div className="bg-white p-3 rounded-2xl border-4 border-[#0047BA] shrink-0 text-center shadow-md">
                <img
                  src={generateQrUrl(requesterUrl)}
                  alt="QR Terminal Apoyo"
                  className="w-36 h-36 rounded-xl mx-auto border border-slate-200"
                />
                <span className="text-[10px] text-[#0047BA] font-black block mt-1.5">
                  Escanea para Terminal
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-[#0047BA] font-black uppercase tracking-wider block">
                    ● Terminal Rápida de Mostrador
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Terminal de Solicitud (Cajas & Almacén)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Ideal para tenerla abierta en la computadora de cajas express, mostrador de crédito o almacén. Ofrece botones de 1 toque para pedir refuerzo sin necesidad de llamar por teléfono.
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-[#0047BA] font-bold truncate">
                  {requesterUrl}
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => copyToClipboard(requesterUrl, 'requester_clip')}
                    className="py-2 px-3.5 bg-[#FFD100] hover:bg-amber-400 text-[#0047BA] font-black rounded-xl text-xs shadow flex items-center space-x-1.5 transition-colors cursor-pointer border border-amber-300"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'requester_clip' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <a
                    href={requesterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-[#0047BA] hover:bg-[#003899] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Abrir en Pestaña Nueva</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KIOSCO API EXTERNO & BACKEND /api/call-assistance */}
        {activeTab === 'kiosk_api' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#0047BA] flex items-center gap-1.5">
                  <i className="fa-solid fa-code text-[#FFD100]"></i>
                  Backend Oficial de Integración: /api/call-assistance
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  ✓ Activo y Funcional
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Este backend ya está completamente implementado y listo para recibir y responder llamadas desde la otra app de kiosco o terminal de clientes.
              </p>

              {/* Endpoints */}
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] mr-2">GET</span>
                  <code className="font-bold text-slate-800">{effectiveOrigin}/api/call-assistance</code>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Devuelve <code className="text-[#0047BA] font-bold">calls</code> con <code className="text-[#0047BA] font-bold">status: "pendiente"</code>, <code className="text-[#0047BA] font-bold">customerPin</code>, <code className="text-[#0047BA] font-bold">aisle</code> y <code className="text-[#0047BA] font-bold">reason</code>.
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[11px] mr-2">POST</span>
                  <code className="font-bold text-slate-800">{effectiveOrigin}/api/call-assistance/:id/accept</code>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recibe <code className="text-[#0047BA] font-bold">{`{ advisorName, estimatedArrival }`}</code>, marca el estado en camino y notifica al cliente y supervisor.
                  </p>
                </div>
              </div>

              {/* Código JavaScript de Integración */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-slate-500">
                    Código JavaScript para tu otra aplicación:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
`const BASE_URL = "${effectiveOrigin}";

// 1. Ejecutar periódicamente (cada 2 o 3 segundos) o al abrir la app:
async function obtenerSolicitudesDeClientes() {
  try {
    const respuesta = await fetch(\`\${BASE_URL}/api/call-assistance\`);
    const data = await respuesta.json();

    if (data.success) {
      // Filtrar las que aún no tienen asesor asignado:
      const pendientes = data.calls.filter(c => c.status === "pendiente");

      pendientes.forEach(llamada => {
        console.log("Nueva llamada de cliente:");
        console.log("- ID Llamada:", llamada.id);
        console.log("- Lugar / Pasillo:", llamada.aisle);
        console.log("- Tipo de Asistencia:", llamada.reason);
        console.log("- PIN del Cliente:", llamada.customerPin);
      });

      return pendientes;
    }
  } catch (error) {
    console.error("Error al consultar solicitudes:", error);
  }
}

// 2. Llamar cuando el asesor pulse "Aceptar y voy en camino":
async function confirmarQueVoyEnCamino(callId, nombreDelAsesor) {
  try {
    const respuesta = await fetch(\`\${BASE_URL}/api/call-assistance/\${callId}/accept\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        advisorName: nombreDelAsesor,
        estimatedArrival: "1-2 minutos"
      })
    });

    const data = await respuesta.json();

    if (data.success) {
      alert(\`¡Listo! El cliente ya ve en su pantalla que tú (\${nombreDelAsesor}) vas en camino.\`);
    }
  } catch (error) {
    console.error("Error al confirmar asistencia:", error);
  }
}`,
                        'js_code'
                      )
                    }
                    className="py-1 px-2.5 bg-[#FFD100] text-[#0047BA] font-bold rounded-lg text-[11px] shadow hover:bg-amber-400 cursor-pointer"
                  >
                    <i className="fa-solid fa-copy mr-1"></i>
                    <span>{copiedType === 'js_code' ? '¡Código Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-44">
{`const BASE_URL = "${effectiveOrigin}";

async function obtenerSolicitudesDeClientes() {
  const respuesta = await fetch(\`\${BASE_URL}/api/call-assistance\`);
  const data = await respuesta.json();
  if (data.success) {
    return data.calls.filter(c => c.status === "pendiente");
  }
}

async function confirmarQueVoyEnCamino(callId, nombreDelAsesor) {
  const respuesta = await fetch(\`\${BASE_URL}/api/call-assistance/\${callId}/accept\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      advisorName: nombreDelAsesor,
      estimatedArrival: "1-2 minutos"
    })
  });
  return await respuesta.json();
}`}
                  </pre>
                </div>
              </div>

              {/* Botón de prueba en vivo */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold">
                  ¿Deseas probar este flujo con una llamada simulada?
                </span>
                <button
                  type="button"
                  onClick={handleTestBroadcastPing}
                  className="py-2 px-3.5 bg-[#0047BA] hover:bg-blue-800 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow"
                >
                  <i className="fa-solid fa-play text-[#FFD100]"></i>
                  <span>Crear Llamada de Prueba</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-[#0047BA] hover:bg-[#003899] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
