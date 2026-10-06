import React, { useState } from 'react';
import { CategoryCard, KioskReceipt, AssistanceAlert } from '../types';
import { voice } from '../services/voice';
import { ProductSimulatorView } from './ProductSimulatorView';
import { SecureKioskPaymentModal, PaymentItemDetails } from './SecureKioskPaymentModal';
import { AssistanceRequestModal } from './AssistanceRequestModal';
import { TwoDeviceSyncModal } from './TwoDeviceSyncModal';

interface KioskTabletUIProps {
  onTriggerAssistance: (reason?: string, preferredEmployeeId?: string) => void;
  isAssistanceActive: boolean;
  activeAssociateName: string;
  onCancelAssistance: () => void;
  onPrintTicket: (receipt: KioskReceipt) => void;
  isLargeText: boolean;
  onToggleLargeText: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenAdminPanel?: () => void;
  activeCall?: AssistanceAlert | null;
}

export const KioskTabletUI: React.FC<KioskTabletUIProps> = ({
  onTriggerAssistance,
  isAssistanceActive,
  activeAssociateName,
  onCancelAssistance,
  onPrintTicket,
  isLargeText,
  onToggleLargeText,
  isVoiceEnabled,
  onToggleVoice,
  onOpenAdminPanel,
  activeCall,
}) => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'simulator' | 'aisle_detail' | 'pay_flow'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCard | null>(null);
  const [initialCategoryFilter, setInitialCategoryFilter] = useState<string | null>(null);
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Form states for paying installment
  const [clientNumberInput, setClientNumberInput] = useState('98421092');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedAbonoAmount, setSelectedAbonoAmount] = useState<number>(450);
  const [isSecureModalOpen, setIsSecureModalOpen] = useState(false);
  const [securePaymentItem, setSecurePaymentItem] = useState<PaymentItemDetails>({
    title: 'Abono Quincenal Coppel',
    concept: 'Pago a Cuenta',
    amount: 450,
    clientNumber: '98421092',
    clientName: 'Carlos E. Mendoza',
    itemType: 'abono',
  });

  // Categories matching the user's reference image
  const categories: CategoryCard[] = [
    {
      id: 'ropa',
      name: 'Ropa & Calzado',
      sublabel: 'Dama, Caballero, Niños y Zapatería',
      iconClass: 'fa-solid fa-shirt',
      aisle: 'Pasillo 7 y 8 - Moda & Vestidores',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      popularItems: ['Pantalones y Jeans', 'Camisas y Blusas', 'Tenis y Zapatos', 'Ropa Interior'],
    },
    {
      id: 'hogar',
      name: 'Hogar & Cocina',
      sublabel: 'Electrodomésticos, Vajillas y Blancos',
      iconClass: 'fa-solid fa-house',
      aisle: 'Pasillo 5B - Hogar & Cocina',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      popularItems: ['Licuadoras y Batidoras', 'Baterías de Cocina', 'Sábanas y Colchas', 'Ventiladores'],
    },
    {
      id: 'electronica',
      name: 'Electrónica & Audio',
      sublabel: 'Pantallas OLED, Bocinas y Video',
      iconClass: 'fa-solid fa-laptop',
      aisle: 'Pasillo 2B - Audio y Video High-End',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      popularItems: ['Smart TV 4K 55" y 65"', 'Bocinas Bluetooth', 'Barras de Sonido', 'Consolas'],
    },
    {
      id: 'muebles',
      name: 'Muebles & Salas',
      sublabel: 'Sillones, Comedores y Mesas',
      iconClass: 'fa-solid fa-couch',
      aisle: 'Pasillo 3 y 4 - Mueblería Central',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      popularItems: ['Salas Modulares', 'Comedores 4 y 6 Sillas', 'Sillones Reclinables', 'Centros de TV'],
    },
    {
      id: 'colchones',
      name: 'Colchones & Recámara',
      sublabel: 'Camas, Bases y Almohadas',
      iconClass: 'fa-solid fa-bed',
      aisle: 'Pasillo 6B - Zona Descanso & Blancos',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      popularItems: ['Colchón Matrimonial', 'Camas King Size', 'Almohadas Memory Foam', 'Roperos'],
    },
    {
      id: 'celulares',
      name: 'Celulares & Teléfonos',
      sublabel: 'Smartphones, Tablets y Accesorios',
      iconClass: 'fa-solid fa-mobile-screen',
      aisle: 'Pasillo 1A - Telefonía & Accesorios',
      color: 'bg-sky-50 text-sky-800 border-sky-200',
      popularItems: ['Samsung Galaxy', 'iPhone', 'Motorola / Xiaomi', 'Cargadores y Fundas'],
    },
    {
      id: 'bano',
      name: 'Baño & Fontanería',
      sublabel: 'Regaderas, Muebles y Grifería',
      iconClass: 'fa-solid fa-shower',
      aisle: 'Pasillo 10A - Baño y Ferretería',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      popularItems: ['Regaderas Ahorradoras', 'Muebles de Lavabo', 'Espejos con Luz', 'Accesorios de Baño'],
    },
    {
      id: 'abonos',
      name: 'Pagar Abono / Crédito',
      sublabel: 'Consulta saldo e imprime ticket sin fila',
      iconClass: 'fa-solid fa-receipt',
      aisle: 'Operación Inmediata en este Kiosco',
      color: 'bg-yellow-50 text-yellow-900 border-yellow-300 font-bold',
      popularItems: ['Consultar mi Saldo', 'Pagar Abono Quincenal', 'Imprimir Comprobante', 'Estado de Cuenta'],
    },
  ];

  const handleSelectCategory = (cat: CategoryCard) => {
    if (isVoiceEnabled) {
      voice.speak(`Seleccionaste ${cat.name}. Abriendo catálogo de productos y simulador de quincenas.`);
    }

    if (cat.id === 'abonos') {
      setCurrentScreen('pay_flow');
    } else {
      setSelectedCategory(cat);
      setInitialCategoryFilter(cat.id);
      setCurrentScreen('simulator');
    }
  };

  const handleOpenGlobalSimulator = () => {
    if (isVoiceEnabled) {
      voice.speak('Abriendo buscador de productos y cotizador de crédito en quincenas.');
    }
    setInitialCategoryFilter('all');
    setCurrentScreen('simulator');
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    if (isVoiceEnabled) {
      voice.speak('Procesando tu pago de abono. Por favor espera tu ticket impreso.');
    }

    setTimeout(() => {
      setIsProcessingPayment(false);
      const newReceipt: KioskReceipt = {
        ticketNumber: `CP-TK-${Math.floor(100000 + Math.random() * 900000)}`,
        clientNumber: clientNumberInput || '98421092',
        clientName: 'Carlos Mendoza',
        concept: 'Abono Quincenal Puntual Coppel',
        amount: 450,
        paymentMethod: 'Tarjeta Bancaria / Contactless',
        date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        kioskId: 'KIOSK-COP-CDMX-04',
        branch: 'Coppel Revolución Flagship',
        authCode: `AUT-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: `*98421092450*`,
      };
      onPrintTicket(newReceipt);
      setCurrentScreen('home');
    }, 1800);
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#F3F7FA] select-none text-slate-800 relative overflow-hidden ${
      isLargeText ? 'text-base' : 'text-sm'
    }`}>
      {/* 1. Header Superior Coppel (Exacto a la imagen: Amarillo con llave Coppel) */}
      <header className="coppel-yellow text-[#002B66] px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-1.5 shadow-md shrink-0 border-b border-amber-400">
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => setCurrentScreen('home')}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#002B66] flex items-center justify-center font-black text-amber-300 text-base sm:text-lg shadow-sm shrink-0">
            <i className="fa-solid fa-key"></i>
          </div>
          <div>
            <div className="flex items-center space-x-1 font-black text-lg sm:text-2xl tracking-tight leading-none">
              <span>Coppel</span>
            </div>
            <span className="text-[9px] sm:text-xs font-bold text-[#002B66]/80 block tracking-wider uppercase truncate max-w-[130px] xs:max-w-none">
              Tótem Asistencia · Pasillo 4
            </span>
          </div>
        </div>

        {/* Accessibility & Navigation Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar max-w-full">
          {/* Direct Kiosk Payment Button in Header */}
          <button
            onClick={() => {
              setSecurePaymentItem({
                title: 'Abono Quincenal a Crédito Coppel',
                concept: 'Abono a Cuenta',
                amount: 450,
                clientNumber: clientNumberInput || '98421092',
                clientName: 'Carlos Eduardo Mendoza',
                itemType: 'abono',
              });
              setIsSecureModalOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1 sm:space-x-1.5 shadow-sm btn-motion bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            title="Pagar en el tótem con tarjeta y verificación 2FA"
          >
            <i className="fa-solid fa-lock text-amber-300 text-xs"></i>
            <span className="hidden sm:inline">Pagar</span>
          </button>

          {/* Direct Simulator Button in Header */}
          <button
            onClick={handleOpenGlobalSimulator}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1 sm:space-x-1.5 shadow-sm btn-motion shrink-0 ${
              currentScreen === 'simulator'
                ? 'bg-[#002B66] text-amber-300'
                : 'bg-white/90 hover:bg-white text-[#002B66]'
            }`}
          >
            <i className="fa-solid fa-calculator text-amber-500"></i>
            <span className="hidden sm:inline">Simulador</span>
          </button>

          {/* Voice Reading Mode Button */}
          <button
            onClick={() => {
              onToggleVoice();
              if (!isVoiceEnabled) {
                voice.speak('Asistencia de voz activada. Te leeré cada opción que toques.');
              } else {
                voice.stop();
              }
            }}
            className={`px-2 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-xs btn-motion shrink-0 ${
              isVoiceEnabled
                ? 'bg-[#002B66] text-amber-300'
                : 'bg-white/80 hover:bg-white text-[#002B66]'
            }`}
            title="Lectura en voz alta"
          >
            <i className="fa-solid fa-volume-high text-xs"></i>
            <span className="hidden md:inline">{isVoiceEnabled ? 'Voz On' : 'Voz'}</span>
          </button>

          {/* Text Size Zoom for Elderly */}
          <button
            onClick={onToggleLargeText}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl font-extrabold text-xs bg-white/80 hover:bg-white text-[#002B66] shadow-xs btn-motion shrink-0"
            title="Cambiar tamaño de letra para fácil lectura"
          >
            <i className="fa-solid fa-text-height mr-0.5"></i>
            <span className="hidden md:inline">{isLargeText ? 'Normal' : 'A+'}</span>
            <span className="md:hidden">{isLargeText ? 'A' : 'A+'}</span>
          </button>

          {/* Big Help Call Button on Screen */}
          <button
            onClick={() => setIsAssistanceModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs bg-[#002B66] hover:bg-blue-900 text-amber-300 shadow-md flex items-center space-x-1 btn-motion animate-pulse shrink-0"
          >
            <i className="fa-solid fa-user-tie text-xs"></i>
            <span className="hidden xs:inline">Pedir Asesor</span>
            <span className="xs:hidden">Asesor</span>
          </button>

          {/* Vincular con Celular (2 Dispositivos) */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-2 sm:px-3 py-1.5 rounded-xl font-extrabold text-xs bg-amber-400 hover:bg-amber-300 text-[#002B66] shadow-sm flex items-center space-x-1 btn-motion shrink-0"
            title="Conectar con tu celular para probar en 2 dispositivos en tiempo real"
          >
            <i className="fa-solid fa-mobile-screen-button text-xs"></i>
            <span className="hidden md:inline">2 Dispositivos</span>
            <span className="md:hidden">QR</span>
          </button>
        </div>
      </header>

      {/* 2. Banner de Ayuda o Notificación de Asistencia en Camino */}
      {isAssistanceActive && (
        <div className="bg-gradient-to-r from-blue-900 to-[#002B66] text-white p-3.5 px-6 shadow-md border-b-2 border-amber-400 flex items-center justify-between animate-in slide-in-from-top-4 duration-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#002B66] flex items-center justify-center font-extrabold text-lg shrink-0 animate-bounce">
              <i className="fa-solid fa-person-walking-arrow-right"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                ¡Tu asesor {activeAssociateName} viene en camino!
              </p>
              <p className="text-[11px] text-blue-200">
                Llamada notificada en su celular · Tiempo estimado: ~30 segundos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAssistanceModalOpen(true)}
              className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-[#002B66] rounded-xl text-xs font-black btn-motion"
            >
              Ver Asesores
            </button>
            <button
              onClick={onCancelAssistance}
              className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold btn-motion"
            >
              Ya no lo necesito
            </button>
          </div>
        </div>
      )}

      {/* 3. Área de Contenido Principal del Kiosco */}
      <main className="flex-1 overflow-y-auto screen-scroll p-3.5 sm:p-5">
        {/* PANTALLA PRINCIPAL: MATRIZ DE BOTONES TÁCTILES GIGANTES (Exacto a la foto) */}
        {currentScreen === 'home' && (
          <div className="max-w-5xl mx-auto space-y-3.5">
            {/* Título y Buscador Rápido Directo */}
            <div className="bg-white p-4 rounded-3xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h1 className={`${isLargeText ? 'text-2xl' : 'text-xl'} font-black text-[#002B66]`}>
                  ¿Qué buscas hoy en tu tienda Coppel?
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toca cualquier categoría para buscar productos, simular tus pagos en quincenas o saber el pasillo.
                </p>
              </div>

              {/* Acceso Rápido al Cotizador / Buscador */}
              <button
                onClick={handleOpenGlobalSimulator}
                className="py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#002B66] font-black rounded-2xl text-xs sm:text-sm shadow-md flex items-center space-x-2 btn-motion shrink-0"
              >
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
                <span>Buscar Producto & Simular Crédito</span>
              </button>
            </div>

            {/* Grilla 8 Botones Grandes (Matching user photo layout: 4 cols or 2x4) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`bg-white hover:bg-slate-50 border-2 ${
                    cat.id === 'abonos'
                      ? 'border-amber-400 bg-gradient-to-b from-amber-50/70 to-white ring-2 ring-amber-400/30'
                      : 'border-slate-200 hover:border-[#002B66]/40'
                  } rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 flex flex-col items-center justify-between text-center shadow-xs hover:shadow-md transition-all btn-motion min-h-[125px] sm:min-h-[165px] group`}
                >
                  {/* Icono Redondo Gigante */}
                  <div
                    className={`w-11 h-11 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl mb-1 sm:mb-1.5 transition-transform group-hover:scale-110 shadow-xs ${cat.color}`}
                  >
                    <i className={cat.iconClass}></i>
                  </div>

                  {/* Nombre de la Categoría */}
                  <div className="w-full">
                    <span
                      className={`block font-black text-[#002B66] leading-tight ${
                        isLargeText ? 'text-sm sm:text-lg' : 'text-xs sm:text-base'
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[9px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 block">
                      {cat.sublabel}
                    </span>
                  </div>

                  {/* Ubicación rápida */}
                  <div className="mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100 w-full flex items-center justify-center text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    <i className="fa-solid fa-location-dot text-amber-500 mr-1"></i>
                    <span className="truncate">{cat.aisle.split('-')[0]}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Banner inferior de asistencia rápida física */}
            <div className="bg-[#002B66] text-white p-3.5 sm:p-4 rounded-3xl shadow-lg border border-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-full bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-xl shrink-0">
                  <i className="fa-solid fa-microphone-lines"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    ¿Prefieres hablar con un asesor en persona?
                  </h3>
                  <p className="text-xs text-blue-200">
                    Oprime el <strong>botón redondo plateado "Push to Speak"</strong> debajo de esta pantalla.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAssistanceModalOpen(true)}
                className="py-2.5 px-5 coppel-yellow hover:bg-amber-400 text-[#002B66] font-extrabold rounded-2xl text-xs sm:text-sm shadow-md btn-motion whitespace-nowrap"
              >
                <i className="fa-solid fa-users mr-1.5"></i>
                Ver Asesores Disponibles & Llamar
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA: CATÁLOGO DE PRODUCTOS, BÚSQUEDA Y SIMULADOR DE CRÉDITO */}
        {currentScreen === 'simulator' && (
          <ProductSimulatorView
            initialCategory={initialCategoryFilter}
            onBackToMenu={() => setCurrentScreen('home')}
            onTriggerAssistance={onTriggerAssistance}
            onPrintTicket={onPrintTicket}
            onOpenSecurePayment={(item) => {
              setSecurePaymentItem(item);
              setIsSecureModalOpen(true);
            }}
            isLargeText={isLargeText}
            isVoiceEnabled={isVoiceEnabled}
          />
        )}

        {/* PANTALLA: PAGO DE ABONO / CONSULTA DE SALDO */}
        {currentScreen === 'pay_flow' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentScreen('home')}
                className="py-2 px-4 bg-gradient-to-r from-blue-900 to-[#002B66] hover:from-blue-800 hover:to-blue-950 text-amber-300 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-2 btn-motion shadow-sm shrink-0"
                title="Regresar al Menú Principal"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Regresar al Menú</span>
              </button>

              <span className="hidden sm:inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <i className="fa-solid fa-bolt mr-1 text-emerald-600"></i> Servicio Express sin fila en cajas
              </span>

              <button
                onClick={() => setCurrentScreen('home')}
                className="py-2 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-200 hover:border-red-300 flex items-center space-x-1.5 btn-motion shrink-0"
                title="Cerrar y volver al inicio"
              >
                <i className="fa-solid fa-xmark text-red-500"></i>
                <span className="hidden xs:inline">Cerrar</span>
              </button>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400 shadow-md space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-2xl shrink-0">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#002B66]">Pagar Abono a Cuenta Coppel</h2>
                  <p className="text-xs text-slate-500">Ingresa tu número de cliente o acerca tu tarjeta para consultar tu pago.</p>
                </div>
              </div>

              {/* Campo para ingresar número de cliente */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Número de Cliente Coppel:</label>
                <input
                  type="text"
                  value={clientNumberInput}
                  onChange={(e) => setClientNumberInput(e.target.value)}
                  className="w-full text-lg sm:text-xl font-mono font-bold p-3 rounded-2xl border-2 border-slate-300 bg-slate-50 text-slate-900 tracking-wider text-center focus:border-[#002B66] outline-none"
                />
              </div>

              {/* Desglose de Cuenta */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl border border-blue-200 space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col xs:flex-row justify-between font-bold text-[#002B66] gap-1">
                  <span>Cliente: Carlos Eduardo Mendoza</span>
                  <span className="text-emerald-700">Estado: Al corriente ★</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Abono Quincenal Sugerido:</span>
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">$450.00 MXN</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Saldo Total Pendiente:</span>
                  <span className="font-mono font-bold text-slate-700">$2,850.00 MXN</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Próximo vencimiento:</span>
                  <span>10 Octubre 2026</span>
                </div>
              </div>

              {/* Selección de Monto a Pagar */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Selecciona o ingresa el monto a abonar hoy:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2">
                  {[
                    { amount: 450, label: 'Sugerido ($450)' },
                    { amount: 600, label: 'Adelantar ($600)' },
                    { amount: 1000, label: 'Mayor ($1,000)' },
                    { amount: 2850, label: 'Liquidar ($2,850)' },
                  ].map((item) => (
                    <button
                      key={item.amount}
                      type="button"
                      onClick={() => setSelectedAbonoAmount(item.amount)}
                      className={`py-2 px-1 text-center rounded-xl font-bold text-xs transition-all btn-motion border-2 ${
                        selectedAbonoAmount === item.amount
                          ? 'bg-[#002B66] text-amber-300 border-[#002B66] shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="block font-black text-sm">${item.amount}</span>
                      <span className="text-[9px] opacity-80 block truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Principal de Pago Blindado con 2FA */}
              <button
                onClick={() => {
                  setSecurePaymentItem({
                    title: `Abono a Cuenta Coppel (${clientNumberInput || '98421092'})`,
                    concept: 'Abono Puntual de Crédito',
                    amount: selectedAbonoAmount,
                    clientNumber: clientNumberInput || '98421092',
                    clientName: 'Carlos Eduardo Mendoza',
                    itemType: 'abono',
                  });
                  setIsSecureModalOpen(true);
                  if (isVoiceEnabled) {
                    voice.speak(`Abriendo pasarela de pago seguro para abonar ${selectedAbonoAmount} pesos.`);
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-2 btn-motion shadow-lg"
              >
                <i className="fa-solid fa-lock text-amber-300 text-lg"></i>
                <span>Pagar ${selectedAbonoAmount.toLocaleString('es-MX')} MXN de Forma Segura (Tarjeta & 2FA)</span>
              </button>

              <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500 pt-1">
                <span>🔒 Cifrado Bancario TLS 1.3</span>
                <span>•</span>
                <span>📱 Código SMS / Token de Seguridad</span>
                <span>•</span>
                <span>🖨️ Ticket Impreso en Tótem</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE PAGO SEGURO BANCARIO EN TÓTEM CON VERIFICACIÓN 2FA */}
      <SecureKioskPaymentModal
        isOpen={isSecureModalOpen}
        onClose={() => {
          setIsSecureModalOpen(false);
          setCurrentScreen('home');
        }}
        itemDetails={securePaymentItem}
        onPaymentSuccess={(receipt) => {
          onPrintTicket(receipt);
        }}
        isLargeText={isLargeText}
        isVoiceEnabled={isVoiceEnabled}
      />

      {/* MODAL DE PEDIR ASISTENCIA & SELECCIÓN DE EMPLEADOS DISPONIBLES */}
      <AssistanceRequestModal
        isOpen={isAssistanceModalOpen}
        onClose={() => setIsAssistanceModalOpen(false)}
        activeCall={activeCall || null}
        onTriggerAssistance={(reason, preferredEmployeeId) => {
          onTriggerAssistance(reason, preferredEmployeeId);
          setIsAssistanceModalOpen(false);
        }}
        onCancelAssistance={onCancelAssistance}
        isVoiceEnabled={isVoiceEnabled}
      />

      {/* MODAL DE CÓDIGO QR PARA VINCULAR CON 2 DISPOSITIVOS */}
      <TwoDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onOpenAdminInSameWindow={() => {
          setIsSyncModalOpen(false);
          if (onOpenAdminPanel) onOpenAdminPanel();
        }}
      />
    </div>
  );
};
