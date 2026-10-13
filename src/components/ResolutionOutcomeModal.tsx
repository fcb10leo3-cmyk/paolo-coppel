import React, { useState, useRef, useEffect } from 'react';
import { AssistanceAlert, ResolutionOutcome, AssistanceVerificationProof, VerificationProofType } from '../types';
import { soundEffects } from '../services/soundEffects';

interface ResolutionOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: AssistanceAlert | null;
  initialOutcome?: ResolutionOutcome;
  startWithCamera?: boolean;
  onConfirmOutcome: (
    outcome: ResolutionOutcome,
    notes: string,
    verificationProof?: AssistanceVerificationProof,
    outcomeCategory?: string
  ) => Promise<void>;
  roleTitle?: string;
  advisorName?: string;
}

export const ResolutionOutcomeModal: React.FC<ResolutionOutcomeModalProps> = ({
  isOpen,
  onClose,
  alert,
  initialOutcome = 'resuelto_exitoso',
  startWithCamera = false,
  onConfirmOutcome,
  roleTitle = 'Asesor Coppel',
  advisorName = 'Mariana Gómez',
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<ResolutionOutcome>(initialOutcome);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // MÉTODOS DE COMPROBACIÓN DE SERVICIO
  const [activeProofTab, setActiveProofTab] = useState<VerificationProofType>('photo');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // CÁMARA EN VIVO DEL CELULAR
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // PIN Y FIRMA
  const [customerPinInput, setCustomerPinInput] = useState<string>('');
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [ticketFolio, setTicketFolio] = useState<string>('');
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Canvas para firma digital
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sincronizar outcome inicial si cambia
  useEffect(() => {
    if (initialOutcome) {
      setSelectedOutcome(initialOutcome);
      if (initialOutcome === 'resuelto_exitoso') {
        setSelectedCategory('🛒 Venta concretada en piso');
      } else {
        setSelectedCategory('🚫 Sin inventario / Producto agotado');
      }
    }
  }, [initialOutcome, isOpen]);

  // Limpiar campos y detener stream al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPhotoDataUrl(null);
      setIsCameraActive(false);
      setCameraError(null);
      setCustomerPinInput('');
      setIsPinVerified(false);
      setPinError(null);
      setTicketFolio('');
      setHasSignature(false);
      setCustomNotes('');

      if (startWithCamera) {
        setActiveProofTab('photo');
        setTimeout(() => {
          startLiveCamera();
        }, 120);
      }
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startWithCamera]);

  // Detener tracks de la cámara
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // INICIAR CÁMARA DEL CELULAR EN VIVO
  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      // Intentar primero con cámara trasera (facingMode: environment)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // Fallback a cualquier cámara disponible
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Conectar al elemento video cuando esté listo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.warn('Error al acceder a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara en vivo. Puedes usar el botón de Cámara del Sistema.');
      setIsCameraActive(false);
    }
  };

  // CAPTURAR FOTO INSTANTÁNEA DESDE EL STREAM
  const capturePhotoFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;

    soundEffects.playCameraClick();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar frame de la cámara
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Agregar sello oficial Coppel y marca de tiempo
    ctx.fillStyle = 'rgba(0, 71, 186, 0.85)'; // Azul Coppel
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    ctx.fillStyle = '#FFD100'; // Amarillo Coppel
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✓ EVIDENCIA COPPEL EN PISO', 16, canvas.height - 15);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '13px sans-serif';
    const timestampStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.fillText(`${alert?.aisle || 'Piso de venta'} · ${timestampStr}`, canvas.width - 240, canvas.height - 15);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPhotoDataUrl(dataUrl);

    // Apagar la cámara tras tomar la foto
    stopCameraStream();
    soundEffects.playSuccessChime();
  };

  if (!isOpen || !alert) return null;

  // 6 OPCIONES MÁS COMUNES CUANDO SÍ SE PUDO RESOLVER EN COPPEL
  const successOptions = [
    {
      id: 'venta',
      icon: 'fa-cart-shopping',
      label: '🛒 Venta concretada en piso',
      desc: 'El cliente decidió comprar y se le entregó el producto o acompañó a cajas',
    },
    {
      id: 'credito',
      icon: 'fa-credit-card',
      label: '💳 Trámite de Crédito Coppel realizado',
      desc: 'Se tramitó, autorizó o cargó la compra a su línea de Crédito Coppel',
    },
    {
      id: 'localizado',
      icon: 'fa-box-open',
      label: '📦 Producto / Talla / Modelo localizado',
      desc: 'Se ubicó la mercancía en exhibición o bodega y fue entregada',
    },
    {
      id: 'duda',
      icon: 'fa-circle-question',
      label: '💡 Asesoría técnica y especificaciones resueltas',
      desc: 'Se explicaron funciones, medidas, compatibilidad o póliza de garantía',
    },
    {
      id: 'digital',
      icon: 'fa-mobile-screen',
      label: '📱 Pedido digital asistido en App / Kiosco',
      desc: 'Se auxilió al cliente para comprar en línea con entrega a domicilio o tienda',
    },
    {
      id: 'cambio',
      icon: 'fa-rotate-left',
      label: '🔄 Aclaración o cambio de producto resuelto',
      desc: 'Se resolvió solicitud de ticket, garantía Coppel o cambio de mercancía',
    },
  ];

  // 6 OPCIONES MÁS COMUNES CUANDO NO SE PUDO RESOLVER EN COPPEL
  const failureOptions = [
    {
      id: 'agotado',
      icon: 'fa-ban',
      label: '🚫 Sin inventario / Producto agotado',
      desc: 'No había existencia en piso de venta ni en bodega de la sucursal',
    },
    {
      id: 'retiro',
      icon: 'fa-person-walking-arrow-right',
      label: '🚶 Cliente se retiró del pasillo antes de llegada',
      desc: 'Al acudir el asesor, el cliente ya no se encontraba en el área',
    },
    {
      id: 'credito_rechazado',
      icon: 'fa-id-card-clip',
      label: '❌ Crédito no aprobado o sin capacidad de pago',
      desc: 'Solicitud no autorizada por sistema o falta de documentación requerida',
    },
    {
      id: 'presupuesto',
      icon: 'fa-wallet',
      label: '💰 Fuera de presupuesto / Desistimiento por precio',
      desc: 'El cliente consideró que el precio o plazo no se ajustaba a su presupuesto',
    },
    {
      id: 'gerencia',
      icon: 'fa-user-tie',
      label: '👔 Requiere autorización especial de Gerencia',
      desc: 'Caso especial o descuento mayor que supera las facultades en piso',
    },
    {
      id: 'tecnico',
      icon: 'fa-wrench',
      label: '🔧 Mercancía dañada / Requiere servicio externo',
      desc: 'Artículo de exhibición con detalle estético o falla técnica de fábrica',
    },
  ];

  const currentOptions = selectedOutcome === 'resuelto_exitoso' ? successOptions : failureOptions;

  // Manejo de foto desde cámara nativa del sistema o galería
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEffects.playCameraClick();
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      soundEffects.playSuccessChime();
    };
    reader.readAsDataURL(file);
  };

  // Simulación rápida para pruebas en navegadores sin cámara
  const handleGenerateSamplePhoto = () => {
    soundEffects.playCameraClick();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0047BA'; // Azul Coppel
    ctx.fillRect(0, 0, 600, 400);

    // Puntos amarillos Coppel
    ctx.fillStyle = '#FFD100';
    ctx.beginPath();
    ctx.arc(60, 60, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(105, 60, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 60, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('EVIDENCIA DE ATENCIÓN COPPEL', 60, 130);

    ctx.font = '17px sans-serif';
    ctx.fillText(`Ubicación: ${alert.aisle}`, 60, 175);
    ctx.fillText(`Asesor: ${advisorName}`, 60, 210);
    ctx.fillText(`Resultado: ${selectedCategory || 'Atención realizada'}`, 60, 245);
    ctx.fillText(`Fecha y hora: ${new Date().toLocaleString('es-MX')}`, 60, 280);

    ctx.fillStyle = '#FFD100';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✓ PROTOCOLO DE ATENCIÓN EN PISO CUMPLIDO', 60, 340);

    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.88));
    soundEffects.playSuccessChime();
  };

  // Validación del PIN de cliente
  const targetPin = alert.customerPin || '5821';
  const handleVerifyPin = () => {
    if (customerPinInput.trim() === targetPin) {
      setIsPinVerified(true);
      setPinError(null);
      soundEffects.playPointsFanfare();
    } else {
      setIsPinVerified(false);
      setPinError(`El PIN no coincide. En la pantalla del cliente aparece: ${targetPin}`);
      soundEffects.playEmergencyAlert();
    }
  };

  // Manejo de firma digital
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0047BA';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Determinar si hay alguna prueba de servicio válida
  const hasProofOfService = !!(
    photoDataUrl ||
    isPinVerified ||
    hasSignature ||
    ticketFolio.trim().length >= 4
  );

  const handleConfirm = async () => {
    stopCameraStream();
    setIsSubmitting(true);

    let verificationProof: AssistanceVerificationProof | undefined = undefined;

    if (hasProofOfService) {
      let signatureData: string | undefined = undefined;
      if (hasSignature && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL('image/png');
      }

      verificationProof = {
        type: photoDataUrl
          ? 'photo'
          : isPinVerified
          ? 'customer_pin'
          : hasSignature
          ? 'signature'
          : ticketFolio
          ? 'ticket_folio'
          : 'in_person',
        photoUrl: photoDataUrl || undefined,
        customerPin: isPinVerified ? customerPinInput : undefined,
        verifiedPin: isPinVerified,
        signatureDataUrl: signatureData,
        ticketFolio: ticketFolio.trim() || undefined,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        verifiedByAssociateId: alert.assignedAssociateId || 'emp-01',
        verifiedByAssociateName: advisorName,
        notes: customNotes.trim() || undefined,
      };
    }

    const finalNotes = customNotes.trim()
      ? `${selectedCategory} - ${customNotes.trim()}`
      : selectedCategory;

    await onConfirmOutcome(
      selectedOutcome,
      finalNotes,
      verificationProof,
      selectedCategory
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 text-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* 1. ENCABEZADO ESTILO APP COPPEL (Azul Coppel #0047BA con Amarillo #FFD100) */}
        <div className="bg-[#0047BA] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shadow-md border-b-2 border-[#FFD100]">
          <div className="flex items-center space-x-2.5">
            {/* 3 puntos amarillos Coppel */}
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-xl border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  Finalizar Atención
                </h3>
                <span className="bg-[#FFD100] text-[#0047BA] text-[10px] font-black px-2 py-0.2 rounded-md uppercase">
                  Piso Coppel
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {alert.aisle} · {alert.storeDepartment}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* 2. CUERPO MODAL */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto screen-scroll bg-[#F4F6F9]">
          {/* Resumen del motivo */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Solicitud en Pasillo:
              </span>
              <p className="text-xs font-bold text-slate-800">
                "{alert.reason}"
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#0047BA] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
              {alert.timestamp}
            </span>
          </div>

          {/* PASO 1: SELECCIÓN (SÍ SE RESOLVIÓ / NO SE RESOLVIÓ) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#0047BA] block">
              1. Resultado del Servicio:
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* SÍ SE RESOLVIÓ */}
              <button
                type="button"
                onClick={() => {
                  setSelectedOutcome('resuelto_exitoso');
                  setSelectedCategory('🛒 Venta concretada en piso');
                  soundEffects.playSuccessChime();
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center space-y-1 cursor-pointer active:scale-95 relative ${
                  selectedOutcome === 'resuelto_exitoso'
                    ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {selectedOutcome === 'resuelto_exitoso' && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full">
                    ✓ Elegido
                  </span>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                  selectedOutcome === 'resuelto_exitoso' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-slate-900 block">
                    Sí se resolvió
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    Cliente satisfecho (+100 PTS)
                  </span>
                </div>
              </button>

              {/* NO SE RESOLVIÓ */}
              <button
                type="button"
                onClick={() => {
                  setSelectedOutcome('no_resuelto');
                  setSelectedCategory('🚫 Sin inventario / Producto agotado');
                  soundEffects.playSuccessChime();
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center space-y-1 cursor-pointer active:scale-95 relative ${
                  selectedOutcome === 'no_resuelto'
                    ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {selectedOutcome === 'no_resuelto' && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full">
                    ✓ Elegido
                  </span>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                  selectedOutcome === 'no_resuelto' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-slate-900 block">
                    No se resolvió
                  </span>
                  <span className="text-[10px] font-bold text-red-600">
                    Seguimiento (+10 PTS)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* PASO 2: OPCIONES MÁS COMUNES */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#0047BA]">
                2. ¿Qué ocurrió? ({selectedOutcome === 'resuelto_exitoso' ? 'Motivo de Éxito' : 'Causa de No Resolución'}):
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Toca para seleccionar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentOptions.map((opt) => {
                const isSelected = selectedCategory === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(opt.label);
                      soundEffects.playSuccessChime();
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-start space-x-2 cursor-pointer ${
                      isSelected
                        ? selectedOutcome === 'resuelto_exitoso'
                          ? 'bg-[#0047BA] text-white border-[#0047BA] shadow ring-2 ring-[#0047BA]/20'
                          : 'bg-red-600 text-white border-red-600 shadow ring-2 ring-red-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                      isSelected ? 'bg-white/20 text-[#FFD100]' : 'bg-slate-100 text-[#0047BA]'
                    }`}>
                      <i className={`fa-solid ${opt.icon}`}></i>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-black block leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.label}
                      </span>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: CÁMARA DEL CELULAR / EVIDENCIA DE ATENCIÓN */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#FFD100] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-lg bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black text-xs">
                  <i className="fa-solid fa-camera"></i>
                </span>
                <h4 className="text-xs font-black text-[#0047BA] uppercase tracking-wide">
                  3. Foto de Evidencia / Comprobación
                </h4>
              </div>

              {/* Badge de bono */}
              <div className="flex items-center space-x-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px] font-black shrink-0 self-start sm:self-auto">
                <span>⭐</span>
                <span>+25 PTS Bono de Evidencia</span>
              </div>
            </div>

            {/* Pestañas de método de comprobación */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveProofTab('photo');
                  soundEffects.playSuccessChime();
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  activeProofTab === 'photo'
                    ? 'bg-[#0047BA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-camera"></i>
                <span>Cámara Celular</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveProofTab('customer_pin');
                  soundEffects.playSuccessChime();
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  activeProofTab === 'customer_pin'
                    ? 'bg-[#0047BA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-key"></i>
                <span>PIN Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveProofTab('signature');
                  soundEffects.playSuccessChime();
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  activeProofTab === 'signature'
                    ? 'bg-[#0047BA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-signature"></i>
                <span>Firma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveProofTab('ticket_folio');
                  soundEffects.playSuccessChime();
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  activeProofTab === 'ticket_folio'
                    ? 'bg-[#0047BA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-receipt"></i>
                <span>Folio</span>
              </button>
            </div>

            {/* CONTENIDO 1: CÁMARA DEL CELULAR CON VISOR EN VIVO Y DISPARADOR INSTANTÁNEO */}
            {activeProofTab === 'photo' && (
              <div className="space-y-3 pt-1">
                {/* SI LA CÁMARA ESTÁ ACTIVA EN VIVO */}
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg border-2 border-[#FFD100] flex flex-col items-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-56 object-cover bg-black"
                    />

                    {/* Guías de enfoque / visor de cámara */}
                    <div className="absolute inset-4 border-2 border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full font-bold">
                        Enfoca producto, ticket o pasillo
                      </span>
                    </div>

                    {/* Barra de control con disparador */}
                    <div className="absolute bottom-2 inset-x-0 flex items-center justify-around px-4 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1">
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 cursor-pointer"
                      >
                        Cancelar
                      </button>

                      {/* Botón obturador circular estilo cámara móvil */}
                      <button
                        type="button"
                        onClick={capturePhotoFromCamera}
                        className="w-14 h-14 rounded-full bg-white border-4 border-[#FFD100] shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                        title="Capturar foto ahora"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0047BA] flex items-center justify-center text-white text-base">
                          <i className="fa-solid fa-camera"></i>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={capturePhotoFromCamera}
                        className="text-[#FFD100] text-xs font-black bg-black/60 px-3 py-1.5 rounded-full cursor-pointer"
                      >
                        Tomar Foto
                      </button>
                    </div>
                  </div>
                ) : photoDataUrl ? (
                  /* FOTO YA CAPTURADA / PREVISUALIZACIÓN */
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-900 flex items-center justify-center">
                      <img
                        src={photoDataUrl}
                        alt="Evidencia en piso"
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Foto Capturada y Lista para Subir ✓</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPhotoDataUrl(null);
                          startLiveCamera();
                        }}
                        className="absolute top-2 right-2 bg-[#0047BA] text-white text-xs px-2.5 py-1 rounded-full font-bold shadow hover:bg-blue-800 cursor-pointer flex items-center gap-1"
                      >
                        <i className="fa-solid fa-rotate"></i>
                        <span>Repetir Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* OPCIONES PARA ABRIR CÁMARA */
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      Toma una foto rápida para avalar que estuviste con el cliente. Se subirá de inmediato con tu confirmación.
                    </p>

                    {cameraError && (
                      <div className="bg-amber-50 text-amber-800 text-[11px] p-2 rounded-xl border border-amber-300">
                        {cameraError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* BOTÓN 1: ABRIR CÁMARA EN VIVO DEL CELULAR */}
                      <button
                        type="button"
                        onClick={startLiveCamera}
                        className="py-3 px-3 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 shadow cursor-pointer transition-all active:scale-95 border-2 border-blue-900"
                      >
                        <i className="fa-solid fa-camera text-base text-[#FFD100]"></i>
                        <span>Activar Cámara en Vivo</span>
                      </button>

                      {/* BOTÓN 2: CÁMARA NATIVA DEL SISTEMA / ARCHIVO */}
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-3 px-3 bg-white hover:bg-slate-50 text-[#0047BA] font-black rounded-2xl text-xs border-2 border-slate-300 flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-mobile-screen-button text-base"></i>
                          <span>Cámara del Sistema</span>
                        </button>
                      </div>
                    </div>

                    {/* BOTÓN RÁPIDO PARA SIMULAR EN NAVEGADOR DE ESCRITORIO */}
                    <button
                      type="button"
                      onClick={handleGenerateSamplePhoto}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i>
                      <span>Simular Foto de Prueba (Pruebas rápidas)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO 2: PIN DE CLIENTE */}
            {activeProofTab === 'customer_pin' && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-slate-600">
                  El cliente en el Kiosco tiene un <strong>PIN de Asistencia</strong> en su pantalla. Pídeselo para validar tu presencia física.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={customerPinInput}
                    onChange={(e) => {
                      setCustomerPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(null);
                    }}
                    placeholder="Ej: 5821"
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl py-2 px-3 text-center text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-[#0047BA]"
                  />

                  <button
                    type="button"
                    onClick={handleVerifyPin}
                    className="py-2.5 px-3.5 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-xs flex items-center space-x-1 shadow cursor-pointer"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Validar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomerPinInput(targetPin);
                      setIsPinVerified(true);
                      setPinError(null);
                      soundEffects.playPointsFanfare();
                    }}
                    className="py-2.5 px-2.5 bg-[#FFD100] text-[#0047BA] font-black rounded-2xl text-[11px] shadow cursor-pointer shrink-0"
                    title="Autocompletar PIN para prueba"
                  >
                    <span>PIN: {targetPin}</span>
                  </button>
                </div>

                {isPinVerified && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                    <i className="fa-solid fa-circle-check text-emerald-600"></i>
                    <span>¡PIN Verificado! Presencia confirmada.</span>
                  </div>
                )}

                {pinError && (
                  <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                    <i className="fa-solid fa-circle-xmark text-red-500"></i>
                    <span>{pinError}</span>
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO 3: FIRMA DIGITAL */}
            {activeProofTab === 'signature' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Pide al cliente que firme con el dedo:</span>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Borrar
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 cursor-crosshair"
                  />
                  {!hasSignature && (
                    <span className="absolute text-slate-400 text-xs pointer-events-none">
                      ✍️ Toca y firma aquí
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO 4: FOLIO DE TICKET */}
            {activeProofTab === 'ticket_folio' && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-600">
                  Folio de ticket de venta o trámite de Crédito Coppel:
                </p>
                <input
                  type="text"
                  value={ticketFolio}
                  onChange={(e) => setTicketFolio(e.target.value.toUpperCase())}
                  placeholder="Ej: TKT-984210"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-[#0047BA]"
                />
              </div>
            )}
          </div>

          {/* Notas adicionales */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Comentarios adicionales (opcional):
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Detalle adicional del servicio..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-[#0047BA]"
            />
          </div>
        </div>

        {/* 3. BOTONES DE ACCIÓN DE CIERRE */}
        <div className="bg-white p-3.5 border-t border-slate-200 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-1/3 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Regresar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-4 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
              selectedOutcome === 'resuelto_exitoso'
                ? 'bg-[#0047BA] hover:bg-[#003899] text-white shadow-blue-900/20'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
            }`}
          >
            {isSubmitting ? (
              <span>Registrando en Coppel...</span>
            ) : (
              <>
                <i className={`fa-solid ${selectedOutcome === 'resuelto_exitoso' ? 'fa-check-circle' : 'fa-circle-xmark'} text-base text-[#FFD100]`}></i>
                <span>
                  {selectedOutcome === 'resuelto_exitoso'
                    ? hasProofOfService
                      ? 'Finalizar y Ganar +125 PTS (Con Evidencia 🏆)'
                      : 'Finalizar y Ganar +100 PTS'
                    : 'Confirmar como No Resuelto'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
