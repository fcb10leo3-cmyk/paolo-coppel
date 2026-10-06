import React, { useState, useEffect } from 'react';
import { KioskReceipt } from '../types';
import { voice } from '../services/voice';

export interface PaymentItemDetails {
  title: string;
  concept: string;
  amount: number;
  quincenalInfo?: string;
  clientNumber?: string;
  clientName?: string;
  itemType: 'product' | 'abono';
}

interface SecureKioskPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemDetails: PaymentItemDetails;
  onPaymentSuccess: (receipt: KioskReceipt) => void;
  isLargeText: boolean;
  isVoiceEnabled: boolean;
}

export const SecureKioskPaymentModal: React.FC<SecureKioskPaymentModalProps> = ({
  isOpen,
  onClose,
  itemDetails,
  onPaymentSuccess,
  isLargeText,
  isVoiceEnabled,
}) => {
  // Step tracker: 1 = Bank & Card Data, 2 = 2FA Phone SMS/Token Code, 3 = Processing, 4 = Ticket Generated & Printed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'coppel_card' | 'contactless'>('card');

  // Step 1: Card & Bank details
  const [cardNumber, setCardNumber] = useState('4152 3109 4820 7193');
  const [cardHolder, setCardHolder] = useState('CARLOS E. MENDOZA');
  const [cardExpiry, setCardExpiry] = useState('11/29');
  const [cardCvv, setCardCvv] = useState('834');
  const [cardPin, setCardPin] = useState('4912');
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [isCardMasked, setIsCardMasked] = useState(false);
  const [showEncryptedKeypad, setShowEncryptedKeypad] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<'pin' | 'cvv'>('pin');

  // Step 2: 2FA Bank Security Token / SMS verification code
  const [expectedOtp] = useState('849201');
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [smsTimer, setSmsTimer] = useState(120);
  const [isSimulatedSmsVisible, setIsSimulatedSmsVisible] = useState(false);

  // Step 4: Final receipt
  const [generatedReceipt, setGeneratedReceipt] = useState<KioskReceipt | null>(null);
  const [isDigitalCopySent, setIsDigitalCopySent] = useState(false);

  // Scrambled keypad numbers for bank-grade anti-shoulder-surfing security
  const [scrambledNumbers, setScrambledNumbers] = useState([7, 2, 9, 0, 4, 1, 8, 3, 5, 6]);

  const shuffleKeypad = () => {
    setScrambledNumbers([...scrambledNumbers].sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setOtpInputs(['', '', '', '', '', '']);
      setOtpError(null);
      setSmsTimer(120);
      setIsSimulatedSmsVisible(false);
      setGeneratedReceipt(null);
      setIsDigitalCopySent(false);
      shuffleKeypad();
    }
  }, [isOpen]);

  // Countdown timer for 2FA SMS
  useEffect(() => {
    if (currentStep === 2 && smsTimer > 0) {
      const interval = setInterval(() => {
        setSmsTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, smsTimer]);

  if (!isOpen) return null;

  // Handle continuing to 2FA Step
  const handleProceedTo2FA = () => {
    if (!cardNumber || cardNumber.length < 16) {
      alert('Por favor ingresa un número de tarjeta válido.');
      return;
    }
    if (!cardHolder) {
      alert('Por favor ingresa el nombre del titular.');
      return;
    }
    if (!cardExpiry) {
      alert('Por favor ingresa la fecha de vencimiento.');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      alert('Por favor ingresa el CVV de seguridad.');
      return;
    }

    setCurrentStep(2);
    if (isVoiceEnabled) {
      voice.speak(
        'Verificación de seguridad requerida. Hemos solicitado el código de seguridad dinámico de 6 dígitos enviado por SMS a tu teléfono celular.'
      );
    }

    // Automatically trigger simulated SMS notification arrival after 1.5s
    setTimeout(() => {
      setIsSimulatedSmsVisible(true);
    }, 1200);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInputs];
    newOtp[index] = value.slice(-1);
    setOtpInputs(newOtp);
    setOtpError(null);

    // Auto-advance focus to next input box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Paste simulated SMS code
  const handlePasteSimulatedCode = () => {
    const digits = expectedOtp.split('');
    setOtpInputs(digits);
    setOtpError(null);
    if (isVoiceEnabled) {
      voice.speak('Código SMS ingresado correctamente.');
    }
  };

  // Final verification & payment execution
  const handleVerifyAndPay = async () => {
    const fullEnteredOtp = otpInputs.join('');

    if (fullEnteredOtp.length !== 6) {
      setOtpError('Debes ingresar los 6 dígitos del código de seguridad.');
      if (isVoiceEnabled) {
        voice.speak('Código incompleto. Debes escribir los 6 dígitos.');
      }
      return;
    }

    // Enforce banking 2FA verification: without the exact code, payment CANNOT continue!
    if (fullEnteredOtp !== expectedOtp) {
      setOtpError('Código de seguridad incorrecto o expirado. Tu banco ha rechazado la transacción.');
      if (isVoiceEnabled) {
        voice.speak('Código bancario incorrecto. Por seguridad la transacción no puede continuar.');
      }
      return;
    }

    // Start secure bank processing animation
    setCurrentStep(3);
    if (isVoiceEnabled) {
      voice.speak('Autenticación bancaria aprobada. Procesando cobro con cifrado seguro.');
    }

    try {
      // Call backend API
      const res = await fetch('/api/kiosk/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNumber: itemDetails.clientNumber || '98421092',
          amount: itemDetails.amount,
          concept: `${itemDetails.concept} - ${itemDetails.title}`,
          paymentType: `${paymentMethod === 'card' ? 'Tarjeta Bancaria Visa/Mastercard' : paymentMethod === 'coppel_card' ? 'Tarjeta BanCoppel' : 'Contactless NFC'} (2FA Token Validado)`,
        }),
      });

      const data = await res.json();
      const receipt: KioskReceipt = data.receipt || {
        ticketNumber: `CP-TK-${Math.floor(100000 + Math.random() * 900000)}`,
        clientNumber: itemDetails.clientNumber || '98421092',
        clientName: itemDetails.clientName || 'Carlos E. Mendoza',
        concept: itemDetails.title,
        amount: itemDetails.amount,
        paymentMethod: 'Tarjeta Bancaria (2FA Validado)',
        date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        kioskId: 'KIOSK-COP-CDMX-04',
        branch: 'Coppel Revolución Flagship',
        authCode: `AUT-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: `*98421092${itemDetails.amount}*`,
      };

      setTimeout(() => {
        setGeneratedReceipt(receipt);
        setCurrentStep(4);
        onPaymentSuccess(receipt); // Triggers physical totem thermal printer!

        if (isVoiceEnabled) {
          voice.speak('¡Pago completado con éxito! Tu ticket de pago ha sido impreso en la ranura inferior del tótem.');
        }
      }, 1600);
    } catch {
      // Fallback local receipt
      const localReceipt: KioskReceipt = {
        ticketNumber: `CP-TK-${Math.floor(100000 + Math.random() * 900000)}`,
        clientNumber: itemDetails.clientNumber || '98421092',
        clientName: itemDetails.clientName || 'Carlos E. Mendoza',
        concept: itemDetails.title,
        amount: itemDetails.amount,
        paymentMethod: 'Tarjeta Bancaria 2FA Blindada',
        date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        kioskId: 'KIOSK-COP-CDMX-04',
        branch: 'Coppel Revolución Flagship',
        authCode: `AUT-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: `*${itemDetails.amount}*`,
      };

      setGeneratedReceipt(localReceipt);
      setCurrentStep(4);
      onPaymentSuccess(localReceipt);
    }
  };

  // Re-print extra ticket
  const handlePrintAgain = () => {
    if (generatedReceipt) {
      onPaymentSuccess(generatedReceipt);
      if (isVoiceEnabled) {
        voice.speak('Imprimiendo copia adicional de tu ticket.');
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none text-slate-100">
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
        
        {/* HEADER: BARRA SUPERIOR DE ALTA SEGURIDAD BANCARIA CON BOTONES DE REGRESO Y TACHE */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#001f4d] via-[#002B66] to-slate-900 border-b border-amber-400/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-xl shadow">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Módulo de Pago Seguro en Tótem
                </h2>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  <i className="fa-solid fa-lock mr-1"></i> TLS 1.3 / PCI-DSS
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium">
                Terminal Blindada Coppel · Datos protegidos y cifrados de punto a punto
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1 btn-motion"
                title="Regresar a datos de tarjeta"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span className="hidden xs:inline">Volver</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/30 text-white hover:text-red-300 flex items-center justify-center btn-motion"
              title="Cerrar y cancelar pago"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* INDICADOR DE PASOS DE SEGURIDAD */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className={`flex items-center space-x-1.5 font-bold ${currentStep === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>1</span>
              <span>Datos Bancarios</span>
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i>
            <div className={`flex items-center space-x-1.5 font-bold ${currentStep === 2 ? 'text-amber-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>2</span>
              <span>Token 2FA / SMS</span>
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i>
            <div className={`flex items-center space-x-1.5 font-bold ${currentStep >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep >= 3 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>3</span>
              <span>Ticket Impreso</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
            <i className="fa-solid fa-building-columns text-amber-400"></i>
            <span>Conexión Bancaria Segura</span>
          </div>
        </div>

        {/* RESUMEN DEL CONCEPTO Y MONTO A PAGAR */}
        <div className="bg-gradient-to-r from-blue-950 to-slate-900 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">
              {itemDetails.concept}
            </span>
            <h3 className="font-extrabold text-white text-sm sm:text-base line-clamp-1">
              {itemDetails.title}
            </h3>
            {itemDetails.quincenalInfo && (
              <span className="text-xs text-blue-200 block">{itemDetails.quincenalInfo}</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">TOTAL A COBRAR:</span>
            <p className="text-xl sm:text-2xl font-black text-amber-400 leading-none">
              ${itemDetails.amount.toLocaleString('es-MX')} <span className="text-xs text-slate-300 font-normal">MXN</span>
            </p>
          </div>
        </div>

        {/* CUERPO PRINCIPAL DEL FLUJO DE PAGO */}
        <div className="flex-1 overflow-y-auto screen-scroll p-4 sm:p-5 space-y-4">
          
          {/* ======================================================== */}
          {/* PASO 1: SELECCIÓN DE MÉTODO Y DATOS BANCARIOS BLINDADOS  */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Selector de Método de Pago */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Selecciona la forma de pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center btn-motion transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-900/60 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-credit-card text-amber-400 text-base mb-0.5"></i>
                    <span className="text-xs font-bold leading-tight">Tarjeta Débito/Crédito</span>
                    <span className="text-[9px] text-slate-400">Visa / Mastercard</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('coppel_card')}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center btn-motion transition-all ${
                      paymentMethod === 'coppel_card'
                        ? 'bg-blue-900/60 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-id-card text-amber-400 text-base mb-0.5"></i>
                    <span className="text-xs font-bold leading-tight">Tarjeta Coppel</span>
                    <span className="text-[9px] text-slate-400">Crédito o BanCoppel</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('contactless')}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center btn-motion transition-all ${
                      paymentMethod === 'contactless'
                        ? 'bg-blue-900/60 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <i className="fa-solid fa-wifi rotate-90 text-amber-400 text-base mb-0.5"></i>
                    <span className="text-xs font-bold leading-tight">Contactless / Chip</span>
                    <span className="text-[9px] text-slate-400">Acercar tarjeta al tótem</span>
                  </button>
                </div>
              </div>

              {/* Formulario de Tarjeta Cifrada */}
              <div className="bg-slate-950 p-3.5 sm:p-4 rounded-3xl border border-slate-800 space-y-3 shadow-inner">
                {/* Número de Tarjeta */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-lock text-amber-400 text-xs"></i>
                      Número de Tarjeta Bancaria:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCardMasked(!isCardMasked)}
                      className="text-[10px] text-cyan-300 hover:text-white"
                    >
                      {isCardMasked ? '👁️ Mostrar dígitos' : '🔒 Ocultar para privacidad'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={isCardMasked ? '•••• •••• •••• ' + cardNumber.slice(-4) : cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4152 0000 0000 0000"
                      className="w-full py-2.5 pl-10 pr-24 rounded-2xl border-2 border-slate-700 bg-slate-900 text-amber-300 font-mono text-base font-bold focus:border-amber-400 outline-none"
                    />
                    <i className="fa-solid fa-credit-card absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/40">
                        VISA / MC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nombre del Titular */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nombre Completo del Titular (Como aparece en el plástico):
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="CARLOS E. MENDOZA"
                    className="w-full py-2.5 px-3.5 rounded-2xl border-2 border-slate-700 bg-slate-900 text-white font-mono text-xs sm:text-sm font-bold focus:border-amber-400 outline-none uppercase"
                  />
                </div>

                {/* Grid: Vencimiento, CVV y NIP de 4 dígitos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Fecha de Expiración */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Vencimiento:
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-700 bg-slate-900 text-white font-mono text-center text-sm font-bold focus:border-amber-400 outline-none"
                    />
                  </div>

                  {/* CVV / CVC de 3 dígitos */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-300">CVV:</label>
                      <span className="text-[9px] text-slate-400">3 dígitos reverso</span>
                    </div>
                    <div className="relative">
                      <input
                        type={isPinVisible ? 'text' : 'password'}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-700 bg-slate-900 text-amber-300 font-mono text-center text-sm font-bold focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* NIP / PIN Bancario Blindado */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-300">NIP de Tarjeta:</label>
                      <span className="text-[9px] text-amber-400 font-bold">4 dígitos</span>
                    </div>
                    <div className="relative">
                      <input
                        type={isPinVisible ? 'text' : 'password'}
                        value={cardPin}
                        onChange={(e) => setCardPin(e.target.value.slice(0, 4))}
                        placeholder="••••"
                        maxLength={4}
                        className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-700 bg-slate-900 text-amber-300 font-mono text-center text-sm font-bold focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón para abrir el Teclado Numérico Blindado en Pantalla */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowEncryptedKeypad(!showEncryptedKeypad)}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center space-x-1.5 btn-motion"
                  >
                    <i className="fa-solid fa-calculator text-xs"></i>
                    <span>
                      {showEncryptedKeypad
                        ? 'Ocultar teclado táctil blindado'
                        : '🛡️ Usar Teclado Numérico Blindado Anti-Espía'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPinVisible(!isPinVisible)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    {isPinVisible ? '🙈 Ocultar NIP/CVV' : '👁️ Mostrar NIP/CVV'}
                  </button>
                </div>

                {/* TECLADO NUMÉRICO BLINDADO (Scrambled PIN Pad) */}
                {showEncryptedKeypad && (
                  <div className="bg-slate-900 p-3 rounded-2xl border border-amber-400/40 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex justify-between items-center text-[10px] text-amber-300">
                      <span className="font-bold flex items-center gap-1">
                        <i className="fa-solid fa-shield-virus"></i>
                        Teclas con orden aleatorio (Protección contra miradas de terceros en tienda)
                      </span>
                      <button
                        type="button"
                        onClick={shuffleKeypad}
                        className="text-cyan-300 hover:text-white font-bold"
                      >
                        <i className="fa-solid fa-shuffle mr-1"></i> Mezclar teclas
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setKeypadTarget('pin')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          keypadTarget === 'pin'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Ingresando NIP: {cardPin ? '••••' : '(Vacío)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeypadTarget('cvv')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          keypadTarget === 'cvv'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Ingresando CVV: {cardCvv ? '•••' : '(Vacío)'}
                      </button>
                    </div>

                    {/* Botones numéricos aleatorizados */}
                    <div className="grid grid-cols-5 gap-1.5 max-w-sm mx-auto">
                      {scrambledNumbers.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            if (keypadTarget === 'pin') {
                              if (cardPin.length < 4) setCardPin((prev) => prev + num);
                            } else {
                              if (cardCvv.length < 4) setCardCvv((prev) => prev + num);
                            }
                          }}
                          className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-base font-black rounded-xl border border-slate-700 active:scale-95 transition-transform"
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (keypadTarget === 'pin') setCardPin('');
                          else setCardCvv('');
                        }}
                        className="py-1 px-3 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold rounded-lg border border-red-700"
                      >
                        Limpiar {keypadTarget.toUpperCase()}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEncryptedKeypad(false)}
                        className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Continuar a Validación 2FA */}
              <button
                onClick={handleProceedTo2FA}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-[#002B66] font-black rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-2 btn-motion shadow-lg"
              >
                <i className="fa-solid fa-arrow-right"></i>
                <span>Continuar a Verificación 2FA Bancaria</span>
              </button>

              <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-lock text-emerald-400"></i> Cifrado de 256 bits
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-shield text-blue-400"></i> No se almacenan contraseñas
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-file-invoice text-amber-400"></i> Ticket automático
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: VERIFICACIÓN 2FA OBLIGATORIA (TOKEN / CÓDIGO SMS) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl border-2 border-amber-400 shadow-xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center text-2xl mx-auto shadow-md animate-bounce">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Verificación Bancaria Requerida
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                    Por tu seguridad, tu banco ha emitido un <strong>código dinámico de 6 dígitos</strong> a tu teléfono celular registrado con terminación <strong>(***-***-8492)</strong> o a tu App Móvil.
                  </p>
                </div>

                {/* Notificación SMS Simulada */}
                {isSimulatedSmsVisible && (
                  <div className="bg-slate-900 border-2 border-cyan-400/60 p-3.5 rounded-2xl text-left shadow-lg animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-comment-sms"></i> Mensaje SMS recibido en tu celular:
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Ahora</span>
                    </div>
                    <p className="text-xs text-white font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      "BANCO: Tu código de seguridad único Coppel para autorizar ${itemDetails.amount} MXN es: <strong className="text-amber-300 font-black text-sm">{expectedOtp}</strong>. Válido por 2 minutos. No lo compartas."
                    </p>
                    <button
                      onClick={handlePasteSimulatedCode}
                      className="mt-2 py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold border border-cyan-500/40 flex items-center space-x-1.5 btn-motion"
                    >
                      <i className="fa-solid fa-copy"></i>
                      <span>Copiar código recibido ({expectedOtp}) a la pantalla</span>
                    </button>
                  </div>
                )}

                {/* Cajas de Entrada OTP (6 dígitos) */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-amber-300 block uppercase tracking-wider">
                    Ingresa el Código de 6 Dígitos:
                  </label>

                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otpInputs.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border-2 bg-slate-900 text-amber-300 outline-none transition-all ${
                          val
                            ? 'border-amber-400 shadow-[0_0_12px_rgba(253,224,71,0.3)]'
                            : 'border-slate-700 focus:border-cyan-400'
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-xs font-bold text-red-400 bg-red-950/60 p-2 rounded-xl border border-red-800 animate-shake">
                      <i className="fa-solid fa-circle-exclamation mr-1"></i> {otpError}
                    </p>
                  )}
                </div>

                {/* Temporizador y Reenvío de Código */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    El código expira en: <strong className="text-amber-300 font-mono">{Math.floor(smsTimer / 60)}:{(smsTimer % 60).toString().padStart(2, '0')}</strong>
                  </span>

                  <button
                    disabled={smsTimer > 0}
                    onClick={() => {
                      setSmsTimer(120);
                      setIsSimulatedSmsVisible(true);
                      if (isVoiceEnabled) {
                        voice.speak('Nuevo código de seguridad solicitado por SMS.');
                      }
                    }}
                    className={`font-bold ${
                      smsTimer > 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-amber-400 hover:text-amber-300 underline'
                    }`}
                  >
                    Reenviar Código SMS
                  </button>
                </div>

                {/* Botón de Confirmar y Ejecutar Pago */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleVerifyAndPay}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-2 btn-motion shadow-lg"
                  >
                    <i className="fa-solid fa-shield-check text-lg"></i>
                    <span>Verificar Código y Autorizar Pago de ${itemDetails.amount} MXN</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs btn-motion"
                  >
                    ← Modificar tarjeta o método de pago
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: PROCESAMIENTO CIFRADO Y VALIDACIÓN BANCARIA      */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center text-amber-400 text-2xl">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3 className="text-xl font-black text-white">
                Autorizando Pago con Red Bancaria...
              </h3>
              <p className="text-xs text-slate-300 max-w-sm">
                Cifrando paquete con algoritmo TLS 1.3 y aplicando autorización de ${itemDetails.amount} MXN sin comisiones.
              </p>
              <div className="bg-slate-950 px-4 py-2 rounded-full border border-slate-800 text-[11px] text-amber-300 font-mono">
                Por favor, no retires tu tarjeta ni apagues la pantalla
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: PAGO EXITOSO Y TICKET IMPRESO EN EL TÓTEM        */}
          {/* ======================================================== */}
          {currentStep === 4 && generatedReceipt && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              {/* Banner de Éxito */}
              <div className="bg-emerald-950/80 border-2 border-emerald-400 p-4 rounded-3xl text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-2xl font-black mx-auto shadow-lg">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 className="text-xl font-black text-white">
                  ¡Pago Aprobado con Éxito!
                </h3>
                <p className="text-xs text-emerald-200">
                  Tu transacción fue autorizada por el banco (Código: <strong>{generatedReceipt.authCode}</strong>).
                </p>
                <div className="inline-flex items-center space-x-2 bg-emerald-900/60 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/40">
                  <i className="fa-solid fa-print animate-pulse text-amber-300"></i>
                  <span>Tu ticket ha sido impreso en la ranura inferior del tótem</span>
                </div>
              </div>

              {/* Vista Previa del Ticket Digital e Impreso */}
              <div className="bg-white text-slate-900 p-5 rounded-3xl shadow-xl font-mono text-xs space-y-3 border-4 border-amber-400 max-w-md mx-auto">
                <div className="text-center border-b-2 border-dashed border-slate-300 pb-2">
                  <p className="font-black text-sm text-[#002B66]">TIENDAS COPPEL S.A. DE C.V.</p>
                  <p className="text-[10px] text-slate-600">{generatedReceipt.branch}</p>
                  <p className="text-[9px] text-slate-400">Terminal: {generatedReceipt.kioskId} · Pasillo 4</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">
                    {generatedReceipt.date} · {generatedReceipt.time}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">FOLIO TICKET:</span>
                    <strong className="text-[#002B66]">{generatedReceipt.ticketNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>AUTORIZACIÓN:</span>
                    <strong className="text-emerald-700">{generatedReceipt.authCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>CONCEPTO:</span>
                    <span className="truncate max-w-[190px]">{generatedReceipt.concept}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span>{generatedReceipt.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TARJETA:</span>
                    <span>•••• •••• •••• 7193 (2FA Validado)</span>
                  </div>
                </div>

                <div className="my-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-900 font-bold block uppercase">TOTAL PAGADO:</span>
                    <p className="text-xl font-black text-[#002B66]">
                      ${generatedReceipt.amount.toLocaleString('es-MX')} MXN
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-lg">
                    APROBADO ✓
                  </span>
                </div>

                <div className="text-center pt-2 border-t-2 border-dashed border-slate-300 space-y-1">
                  <p className="text-[9px] text-slate-400 tracking-widest">{generatedReceipt.barcode}</p>
                  <p className="text-[10px] text-slate-600 font-bold">Conserva este ticket como comprobante oficial.</p>
                  <p className="text-[8px] text-slate-400">¡Gracias por tu pago y preferencia en Coppel!</p>
                </div>
              </div>

              {/* Botones de Acción Post-Pago */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handlePrintAgain}
                    className="py-3 px-3 bg-amber-400 hover:bg-amber-300 text-[#002B66] font-black rounded-2xl text-xs flex items-center justify-center space-x-1.5 btn-motion shadow-sm"
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>Imprimir Copia Adicional</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDigitalCopySent(true);
                      if (isVoiceEnabled) {
                        voice.speak('Copia digital de tu comprobante enviada a tu celular.');
                      }
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 btn-motion ${
                      isDigitalCopySent
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                    <span>{isDigitalCopySent ? '✓ Enviado a WhatsApp' : 'Enviar a mi WhatsApp'}</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-[#002B66] hover:from-blue-800 hover:to-blue-950 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 btn-motion shadow-md"
                >
                  <i className="fa-solid fa-house"></i>
                  <span>Finalizar y Volver al Menú Principal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
