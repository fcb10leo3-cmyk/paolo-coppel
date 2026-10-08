import React, { useState, useEffect } from 'react';

interface ShareDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'staff' | 'admin' | 'kiosk_api' | 'deploy';
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
  initialTab = 'staff',
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin' | 'kiosk_api' | 'deploy'>(initialTab);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMsg, setTestResultMsg] = useState<string>('');
  const [logs, setLogs] = useState<IntegrationLog[]>([]);

  // Detección y personalización de la URL pública (Netlify o Dominio propio)
  const [customOrigin, setCustomOrigin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_NETLIFY_URL_KEY);
      if (saved) return saved;

      const currentOrigin = window.location.origin;
      // Si ya está en netlify o dominio externo público, usarlo
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
    if (isOpen && activeTab === 'kiosk_api') {
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

  // Determinar la URL efectiva
  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.netlify.app';
  const effectiveOrigin = (customOrigin.trim() ? customOrigin.trim() : windowOrigin).replace(/\/$/, '');

  const staffUrl = `${effectiveOrigin}/?role=staff`;
  const adminUrl = `${effectiveOrigin}/?role=admin`;
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

  const handleTestExternalCall = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('/api/external/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aisle: 'Kiosco Tótem - Pasillo 3 (Test Externo)',
          department: 'Electrónica & Telefonía',
          reason: 'Prueba de integración en vivo desde Kiosco Externo',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestResultMsg(`¡Éxito! Llamada despachada. Asignada a: ${data.assignedTo || 'Personal de Piso'}`);
        fetchLogs();
      } else {
        setTestStatus('error');
        setTestResultMsg('El servidor no pudo procesar la solicitud.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestResultMsg(`Error al conectar: ${err.message || 'Falla de red'}`);
    }
  };

  const generateQrUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      url
    )}&bgcolor=020617&color=FBBF24&margin=2`;
  };

  const sampleSnippet = `// Código para la otra app de Kiosco Tótem
// Ejecuta esto al presionar "Necesito un Asesor" o "Push to Speak"
async function solicitarAsesorCoppel() {
  try {
    const respuesta = await fetch("${apiUrl}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aisle: "Pasillo 4 - Mueblería Central",
        department: "Muebles & Salas",
        reason: "Cliente solicita apoyo en el Kiosco Digital"
      })
    });
    
    const resultado = await respuesta.json();
    console.log("¡Asesor notificado con éxito!", resultado);
    // resultado.assignedTo contiene el nombre del asesor asignado
  } catch (error) {
    console.error("Error al notificar al asesor:", error);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-2xl rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[94vh] overflow-y-auto screen-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg">
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Compartir Enlaces, QR & Conectar Kiosco
              </h3>
              <p className="text-[11px] text-slate-400">
                Sincronización en tiempo real para Netlify, Celulares y Tótem Externo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* BARRA DE CONFIGURACIÓN DE URL PÚBLICA (SOLUCIÓN ERROR 404 EN QR) */}
        <div className="bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-globe text-amber-400"></i>
                  Dominio Público para Celulares y QR:
                </span>
                {customOrigin ? (
                  <span className="bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ Netlify Configurado
                  </span>
                ) : isLocalOrSandbox ? (
                  <span className="bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⚠️ Vista Previa / Local
                  </span>
                ) : (
                  <span className="bg-blue-950 border border-blue-600 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ Dominio Detectado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {isLocalOrSandbox && !customOrigin ? (
                  <span className="text-amber-300">
                    <strong>¿Por qué daba error 404 al escanear?</strong> En la vista previa interna de desarrollo,
                    el celular no tiene acceso. Para que el QR abra en cualquier celular sin 404, pega tu URL de Netlify
                    abajo:
                  </span>
                ) : (
                  'Todos los códigos QR, enlaces para asesores y webhooks usarán esta URL base pública.'
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCustomUrl} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-link absolute left-3 top-3 text-slate-500 text-xs"></i>
              <input
                type="text"
                placeholder="https://tu-sitio.netlify.app"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 pl-8 pr-3 text-xs text-amber-300 font-mono outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow flex items-center justify-center space-x-1.5 transition-colors shrink-0"
              >
                <i className="fa-solid fa-check"></i>
                <span>Aplicar a QR</span>
              </button>
              {customOrigin && (
                <button
                  type="button"
                  onClick={handleResetToCurrentOrigin}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                  title="Restablecer URL"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
              )}
            </div>
          </form>

          {isSavedUrlBanner && (
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <i className="fa-solid fa-circle-check"></i>
              <span>¡URL pública guardada! Los códigos QR y enlaces han sido actualizados.</span>
            </div>
          )}
        </div>

        {/* TABS SELECTORAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center ${
              activeTab === 'staff'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-mobile-screen-button"></i>
            <span className="truncate">1. App Celulares</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center ${
              activeTab === 'admin'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span className="truncate">2. Tablero Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk_api')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center ${
              activeTab === 'kiosk_api'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-plug-circle-bolt"></i>
            <span className="truncate">3. Conectar Kiosco</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-center ${
              activeTab === 'deploy'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span className="truncate">4. Git & Netlify</span>
          </button>
        </div>

        {/* TAB 1: APP ASESORES */}
        {activeTab === 'staff' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shrink-0 text-center shadow-inner">
                <img
                  src={generateQrUrl(staffUrl)}
                  alt="QR App Asesor"
                  className="w-36 h-36 rounded-xl mx-auto border border-amber-400/20"
                />
                <span className="text-[10px] text-amber-300 font-bold block mt-1.5">
                  Escanea con tu celular
                </span>
              </div>

              {/* Info y Enlace */}
              <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">
                    ● Enlace Móvil Optimizado (Pantalla Completa)
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    App para Asesores y Personal en Piso
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Abre este link en cualquier celular (Android o iPhone). Se ajusta al 100% de la pantalla sin cortes y funciona como radio-localizador para recibir alertas con sonido, aceptar casos o rechazarlos.
                  </p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 truncate">
                  {staffUrl}
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => copyToClipboard(staffUrl, 'staff')}
                    className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow flex items-center space-x-1.5 transition-colors active:scale-95"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'staff' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <a
                    href={staffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Abrir en Pestaña Nueva</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/40 border border-blue-900/60 p-3 rounded-2xl text-xs text-blue-200 space-y-1">
              <span className="font-black text-white flex items-center gap-1.5">
                <i className="fa-solid fa-lightbulb text-amber-400"></i>
                Tip para Piso de Venta:
              </span>
              <p className="text-[11px] text-blue-300">
                Puedes abrir el link en tantos teléfonos como asesores haya en tienda. Cada colaborador puede seleccionar su nombre en la barra superior (ej. Mariana, Jorge, Claudia) para recibir las alertas asignadas.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: TABLERO ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shrink-0 text-center shadow-inner">
                <img
                  src={generateQrUrl(adminUrl)}
                  alt="QR Tablero Admin"
                  className="w-36 h-36 rounded-xl mx-auto border border-amber-400/20"
                />
                <span className="text-[10px] text-amber-300 font-bold block mt-1.5">
                  Escanea para Tablet / PC
                </span>
              </div>

              {/* Info y Enlace */}
              <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                    ● Centro de Despacho & Control
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Tablero de Supervisión de Tienda
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Diseñado para la computadora del supervisor, tablet en mostrador o pantalla central. Permite redirigir alertas con 1 clic, tomar llamadas personalmente y monitorear la disponibilidad de todo el equipo.
                  </p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 truncate">
                  {adminUrl}
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => copyToClipboard(adminUrl, 'admin')}
                    className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow flex items-center space-x-1.5 transition-colors active:scale-95"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'admin' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <a
                    href={adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Abrir en Pestaña Nueva</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONECTAR KIOSCO EXTERNO */}
        {activeTab === 'kiosk_api' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Explicación de Integración */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block">
                  ● Conexión API REST con CORS Habilitado
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  ¿Cómo conectar la otra app del Kiosco Tótem a este sistema?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Cuando el cliente presione <strong>"Necesito un Asesor"</strong> o el botón físico en la otra app del
                  kiosco, esa app solo debe hacer una petición <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">POST</code>{' '}
                  a este endpoint. La solicitud llegará al instante al supervisor y a los celulares del personal.
                </p>
              </div>

              {/* Endpoint URL con botón copiar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Endpoint URL del Webhook:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-xs text-amber-300 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(apiUrl, 'api')}
                    className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow flex items-center space-x-1 shrink-0 active:scale-95 transition-colors"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedType === 'api' ? '¡Copiado!' : 'Copiar URL'}</span>
                  </button>
                </div>
              </div>

              {/* Código listo para copiar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400">
                    Código JavaScript / React para la otra app:
                  </label>
                  <button
                    onClick={() => copyToClipboard(sampleSnippet, 'snippet')}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                  >
                    {copiedType === 'snippet' ? '¡Código copiado!' : 'Copiar código completo'}
                  </button>
                </div>
                <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto screen-scroll max-h-44">
                  {sampleSnippet}
                </pre>
              </div>

              {/* Botón de prueba interactiva */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-white block">Prueba de Conexión en Vivo:</span>
                  <span className="text-[11px] text-slate-400">
                    Simula que el Kiosco externo presionó el botón en este instante
                  </span>
                </div>

                <button
                  onClick={handleTestExternalCall}
                  disabled={testStatus === 'testing'}
                  className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>{testStatus === 'testing' ? 'Disparando...' : 'Probar Llamada Externa Ahora'}</span>
                </button>
              </div>

              {testResultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
                    testStatus === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-red-950 text-red-300 border border-red-700'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      testStatus === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-red-400'
                    }`}
                  ></i>
                  <span>{testResultMsg}</span>
                </div>
              )}
            </div>

            {/* Registro de llamadas recibidas desde kioscos externos */}
            {logs.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-list-check text-amber-400"></i>
                  Últimas llamadas recibidas por API:
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto screen-scroll">
                  {logs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-slate-800/80 p-2 rounded-xl text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{log.aisle}</span>
                        <span className="text-slate-400 text-[10px] block truncate">{log.reason}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-400 font-mono text-[10px] block">✓ Procesada</span>
                        <span className="text-slate-500 font-mono text-[9px] block">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GUÍA GIT & NETLIFY */}
        {activeTab === 'deploy' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-amber-400">
                  <i className="fa-brands fa-github text-white mr-1.5"></i>
                  Paso 1: Darle Push a GitHub
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Abre la terminal en tu proyecto y corre estos comandos para subir todo tu código a GitHub:
              </p>
              <div className="relative">
                <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
{`git add .
git commit -m "feat: Coppel Staff con Netlify Functions y QR multidispositivo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main`}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `git add .\ngit commit -m "feat: Coppel Staff con Netlify Functions y QR multidispositivo"\ngit branch -M main\ngit remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git\ngit push -u origin main`,
                      'git_commands'
                    )
                  }
                  className="absolute top-2 right-2 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg font-bold"
                >
                  {copiedType === 'git_commands' ? '¡Copiado!' : 'Copiar comandos'}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-cyan-400">
                  <i className="fa-solid fa-cloud text-cyan-400 mr-1.5"></i>
                  Paso 2: Conectar con Netlify (¡Sin error 404!)
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  1. Entra a <strong>app.netlify.com</strong> y da clic en <strong>"Add new site" ➜ "Import an existing project"</strong>.
                </p>
                <p>
                  2. Selecciona tu repositorio de <strong>GitHub</strong>.
                </p>
                <p>
                  3. Netlify leerá automáticamente el archivo <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">netlify.toml</code> que ya configuramos con:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Build command: <span className="text-white">npm run build</span></li>
                  <li>Publish directory: <span className="text-white">dist</span></li>
                  <li>Functions directory: <span className="text-white">netlify/functions</span></li>
                  <li>Regla de redirección SPA: <span className="text-white">/* /index.html 200</span> (evita error 404)</li>
                </ul>
                <p>
                  4. Da clic en <strong>"Deploy site"</strong>. En 1 minuto tendrás tu enlace <code className="text-amber-300">https://tu-sitio.netlify.app</code>.
                </p>
                <p>
                  5. Vuelve aquí, pega esa URL en la barra superior de este modal, ¡y los códigos QR funcionarán en cualquier teléfono sin error 404!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
