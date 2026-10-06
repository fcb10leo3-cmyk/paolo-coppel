import React, { useState } from 'react';
import { ProductCatalogItem, KioskReceipt } from '../types';
import { voice } from '../services/voice';
import { SecureKioskPaymentModal, PaymentItemDetails } from './SecureKioskPaymentModal';

interface ProductDetailViewProps {
  product: ProductCatalogItem;
  onBack: () => void;
  onTriggerAssistance: (reason?: string) => void;
  onPrintTicket: (receipt: KioskReceipt) => void;
  onOpenSecurePayment?: (item: PaymentItemDetails) => void;
  isLargeText: boolean;
  isVoiceEnabled: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onTriggerAssistance,
  onPrintTicket,
  onOpenSecurePayment,
  isLargeText,
  isVoiceEnabled,
}) => {
  const [selectedQuincenas, setSelectedQuincenas] = useState<number>(24);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(0);
  const [isCopiedNotification, setIsCopiedNotification] = useState<boolean>(false);
  const [isApartarModalOpen, setIsApartarModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [payPlanChoice, setPayPlanChoice] = useState<'contado' | 'primera_quincena'>('contado');

  // Credit calculation logic
  const calculateCredit = (prod: ProductCatalogItem, quincenas: number, downPercent: number) => {
    const cash = prod.cashPrice;
    const downPayment = Math.round(cash * (downPercent / 100));
    const amountToFinance = cash - downPayment;

    // Standard Coppel interest factors based on terms
    let interestRate = 0.28; // 24 quincenas
    if (quincenas === 12) interestRate = 0.16;
    if (quincenas === 18) interestRate = 0.22;
    if (quincenas === 36) interestRate = 0.38;

    const totalFinanced = Math.round(amountToFinance * (1 + interestRate));
    const amountPerQuincena = Math.round(totalFinanced / quincenas);
    const totalCost = downPayment + totalFinanced;
    const cashSavings = totalCost - cash;

    return {
      downPayment,
      amountPerQuincena,
      totalCost,
      cashSavings,
      monthlyEquivalent: amountPerQuincena * 2,
    };
  };

  const calc = calculateCredit(product, selectedQuincenas, downPaymentPercent);

  const handlePrint = () => {
    if (isVoiceEnabled) {
      voice.speak(`Imprimiendo cotización de ${product.name} a ${selectedQuincenas} quincenas.`);
    }

    const receipt: KioskReceipt = {
      ticketNumber: `COT-${Math.floor(100000 + Math.random() * 900000)}`,
      clientNumber: 'CLIENTE EN TIENDA',
      clientName: 'Cotización Coppel',
      concept: `Cotización: ${product.name}`,
      amount: calc.amountPerQuincena,
      paymentMethod: `Simulación Crédito (${selectedQuincenas} Quincenas)`,
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      kioskId: 'KIOSK-04-REVOLUCION',
      branch: 'Coppel Revolución Flagship',
      authCode: `PLAZO ${selectedQuincenas}Q`,
      barcode: `*${product.id}-${selectedQuincenas}Q*`,
      details: {
        quincenas: selectedQuincenas,
        pagoQuincenal: calc.amountPerQuincena,
        pagoContado: product.cashPrice,
        aisle: product.aisle,
      },
    };

    onPrintTicket(receipt);
  };

  const handleAskAssociate = () => {
    if (isVoiceEnabled) {
      voice.speak(`Llamando asesor para ver ${product.name} en el ${product.aisle.split('-')[0]}.`);
    }
    onTriggerAssistance(`Interés en producto: ${product.name} (${product.aisle})`);
  };

  const handleApartar = () => {
    setIsApartarModalOpen(true);
    if (isVoiceEnabled) {
      voice.speak(`Apartado express para ${product.name}.`);
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto space-y-3 animate-in fade-in zoom-in-95 duration-200 select-none ${
      isLargeText ? 'text-base' : 'text-sm'
    }`}>
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN Y CIERRE (GRANDE, INTUITIVA Y ACCESIBLE) */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between gap-2">
        {/* Botón Grande de Regresar con Flecha */}
        <button
          onClick={onBack}
          className="py-1.5 sm:py-2 px-3 sm:px-5 bg-gradient-to-r from-blue-900 to-[#002B66] hover:from-blue-800 hover:to-blue-950 text-amber-300 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2 btn-motion shadow-sm shrink-0"
          title="Regresar a la pantalla anterior"
        >
          <i className="fa-solid fa-arrow-left text-xs sm:text-base"></i>
          <span>Regresar</span>
        </button>

        {/* Migas de Pan / Breadcrumbs para que el usuario no se pierda */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-500 overflow-hidden truncate">
          <span className="text-[#002B66] font-bold">Catálogo</span>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <span className="capitalize">{product.category}</span>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <span className="text-slate-800 font-bold truncate">{product.name}</span>
        </div>

        {/* Botón de Tache (✕) para Cerrar y volver */}
        <button
          onClick={onBack}
          className="py-1.5 sm:py-2 px-3 sm:px-4 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-200 hover:border-red-300 flex items-center space-x-1.5 btn-motion shrink-0"
          title="Cerrar esta vista"
        >
          <i className="fa-solid fa-xmark text-sm sm:text-base text-red-500"></i>
          <span className="hidden xs:inline">Cerrar</span>
        </button>
      </div>

      {/* 2. CONTENIDO PRINCIPAL DEL PRODUCTO: VISTA COMPLETA, ESPACIOSA Y ESTÉTICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* COLUMNA IZQUIERDA: SHOWCASE VISUAL DEL PRODUCTO & ESPECIFICACIONES (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            {/* Header del Producto: Marca, Badge y Modelo */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border border-slate-200">
                {product.brand}
              </span>
              {product.badge && (
                <span className="bg-amber-400 text-[#002B66] px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs animate-pulse">
                  <i className="fa-solid fa-star mr-1 text-[10px]"></i>
                  {product.badge}
                </span>
              )}
            </div>

            {/* Nombre Principal del Producto en Grande */}
            <h1 className="text-xl sm:text-2xl font-black text-[#002B66] leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Modelo: {product.model}</p>

            {/* Contenedor Visual Central del Producto (Grande y Estético) */}
            <div className="my-4 py-8 px-4 bg-gradient-to-b from-blue-50/60 to-slate-50 rounded-2xl border-2 border-blue-100 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-md flex items-center justify-center text-[#002B66] text-4xl sm:text-5xl border border-blue-200 transform group-hover:scale-105 transition-transform duration-300">
                <i className={product.imageIcon}></i>
              </div>

              {/* Indicador de Stock Físico en Tienda */}
              <div className="mt-4 inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Disponible en esta tienda ({product.stock} pzas)</span>
              </div>
            </div>

            {/* Ubicación Exacta en Tienda (Pasillo) */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 flex items-center justify-between text-xs mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center text-sm font-black">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-extrabold uppercase block">Ubicación en Tienda:</span>
                  <span className="font-black text-[#002B66] text-xs sm:text-sm">{product.aisle}</span>
                </div>
              </div>
              <button
                onClick={handleAskAssociate}
                className="py-1 px-2.5 bg-white hover:bg-amber-100 text-[#002B66] font-bold rounded-lg text-[11px] border border-amber-300 btn-motion"
              >
                ¿Cómo llegar?
              </button>
            </div>

            {/* Características & Specs */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Características Principales:
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {product.specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700">
                    <i className="fa-solid fa-check text-emerald-600 text-xs shrink-0"></i>
                    <span className="font-medium">{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción Breve */}
            <p className="text-xs text-slate-500 mt-3 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              "{product.description}"
            </p>
          </div>

          {/* Garantía Coppel */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-blue-600"></i>
              Garantía oficial de 1 a 2 años en Coppel
            </span>
            <span className="font-bold text-[#002B66]">Entrega o retiro hoy</span>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR DE CRÉDITO, QUINCENAS & CUADROS DE ACCIÓN LIMPIOS */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border-2 border-amber-400 shadow-md flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {/* Header del Cotizador */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">
                  Financiamiento & Compra Inmediata
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#002B66]">
                  Planes de Crédito y Pago en Tótem
                </h2>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-xl border border-emerald-200">
                <i className="fa-solid fa-bolt mr-1 text-emerald-600"></i> Sin Trámites
              </span>
            </div>

            {/* CUADRO 1: COMPARATIVA DUAL DE PRECIOS (QUINCENAS VS CONTADO) */}
            <div className="bg-gradient-to-r from-[#002B66] via-blue-900 to-[#001f4d] text-white p-3.5 sm:p-4 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Lado A: Quincenal */}
                <div className="sm:border-r sm:border-white/20 sm:pr-3">
                  <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider block">
                    PAGO EN QUINCENAS FIJAS:
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      ${calc.amountPerQuincena.toLocaleString('es-MX')}
                    </span>
                    <span className="text-[11px] text-blue-200 font-semibold">MXN / quincena</span>
                  </div>
                  <span className="text-[10px] text-blue-200 block mt-0.5">
                    {selectedQuincenas} Quincenas fijas (${calc.monthlyEquivalent.toLocaleString('es-MX')} al mes)
                  </span>
                </div>

                {/* Lado B: Contado */}
                <div className="sm:pl-1">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                    PRECIO DE CONTADO:
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      ${product.cashPrice.toLocaleString('es-MX')}
                    </span>
                    <span className="text-[10px] text-slate-300">MXN</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                    ✓ Ahorras ${calc.cashSavings.toLocaleString('es-MX')} vs crédito
                  </span>
                </div>
              </div>
            </div>

            {/* Selectores Compactos de Plazo y Enganche en 2 Columnas Limpias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {/* Selector Plazo */}
              <div>
                <span className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Plazo: <strong className="text-[#002B66]">{selectedQuincenas} Quincenas</strong>
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[12, 18, 24, 36].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuincenas(q)}
                      className={`py-1.5 text-center rounded-xl font-bold text-xs transition-all btn-motion border ${
                        selectedQuincenas === q
                          ? 'bg-[#002B66] text-amber-300 border-[#002B66] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {q}Q
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Enganche */}
              <div>
                <span className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Enganche: <strong className="text-emerald-700">{downPaymentPercent === 0 ? '$0 (Sin enganche)' : `${downPaymentPercent}% ($${calc.downPayment})`}</strong>
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 10, 20, 30].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDownPaymentPercent(pct)}
                      className={`py-1.5 text-center rounded-xl font-bold text-xs transition-all btn-motion border ${
                        downPaymentPercent === pct
                          ? 'bg-amber-400 text-[#002B66] border-amber-400 font-black shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pct === 0 ? '$0' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CUADRO 2: ACCIÓN PRINCIPAL DE PAGO SEGURO EN TÓTEM (ESPACIOSO Y NO AMONTONADO) */}
          <div className="bg-emerald-50/70 border-2 border-emerald-500/70 p-3 sm:p-3.5 rounded-3xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-lock text-emerald-600"></i> Pago Directo en este Tótem:
              </span>

              {/* Toggle Contado vs 1ra Quincena */}
              <div className="inline-flex bg-white p-0.5 rounded-xl border border-emerald-300 text-xs font-bold w-full sm:w-auto justify-center">
                <button
                  onClick={() => setPayPlanChoice('contado')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all text-center ${
                    payPlanChoice === 'contado'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contado (${product.cashPrice.toLocaleString('es-MX')})
                </button>
                <button
                  onClick={() => setPayPlanChoice('primera_quincena')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all text-center ${
                    payPlanChoice === 'primera_quincena'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1ra Quincena (${calc.amountPerQuincena})
                </button>
              </div>
            </div>

            {/* Botón Gigante de Pago Seguro */}
            <button
              onClick={() => {
                const isContado = payPlanChoice === 'contado';
                const item: PaymentItemDetails = {
                  title: product.name,
                  concept: isContado ? 'Compra de Contado' : `Pago 1ra Quincena (${selectedQuincenas}Q)`,
                  amount: isContado ? product.cashPrice : calc.amountPerQuincena,
                  quincenalInfo: !isContado ? `Restan ${selectedQuincenas - 1} quincenas de $${calc.amountPerQuincena}` : undefined,
                  clientName: 'Carlos E. Mendoza',
                  itemType: 'product',
                };
                if (onOpenSecurePayment) {
                  onOpenSecurePayment(item);
                } else {
                  setIsPaymentModalOpen(true);
                }
                if (isVoiceEnabled) {
                  voice.speak(`Iniciando cobro seguro de ${isContado ? product.cashPrice : calc.amountPerQuincena} pesos con tarjeta y código SMS.`);
                }
              }}
              className="w-full py-3 sm:py-3.5 px-3 sm:px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 btn-motion shadow-md"
            >
              <i className="fa-solid fa-credit-card text-amber-300 text-sm sm:text-base shrink-0"></i>
              <span className="text-center leading-snug">
                Pagar {payPlanChoice === 'contado' ? `$${product.cashPrice.toLocaleString('es-MX')} MXN` : `$${calc.amountPerQuincena} MXN`} con Tarjeta & 2FA
              </span>
            </button>

            <div className="flex items-center justify-center space-x-3 text-[10px] text-emerald-800 font-medium">
              <span>🔒 Cifrado TLS 1.3</span>
              <span>•</span>
              <span>📱 Verificación SMS</span>
              <span>•</span>
              <span>🖨️ Ticket impreso de inmediato</span>
            </div>
          </div>

          {/* CUADRO 3: ACCIONES SECUNDARIAS (COTIZACIÓN & ASESOR EN PARALELO, NO AMONTONADOS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-[#002B66] font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 btn-motion shadow-xs"
            >
              <i className="fa-solid fa-print text-xs"></i>
              <span>Imprimir Cotización en Ticket</span>
            </button>

            <button
              onClick={handleAskAssociate}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 btn-motion border border-slate-300"
            >
              <i className="fa-solid fa-user-tie text-[#002B66] text-xs"></i>
              <span>Pedir Asesor al Pasillo</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE APARTAR / COMPRAR EN TIENDA */}
      {isApartarModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 z-40 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-5 border-2 border-amber-400 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center text-lg font-black">
                  <i className="fa-solid fa-cart-shopping"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-[#002B66] text-base">Apartar este Producto</h3>
                  <span className="text-xs text-slate-500">Sin filas en cajas</span>
                </div>
              </div>
              <button
                onClick={() => setIsApartarModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full text-lg"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Puedes apartar <strong>{product.name}</strong> para entrega inmediata en mostrador o pedir que un asesor te lo entregue listo en el pasillo de entrega.
            </p>

            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#002B66]">
                <span>Producto:</span>
                <span className="truncate max-w-[180px]">{product.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Plan elegido:</span>
                <span>{selectedQuincenas} Quincenas de ${calc.amountPerQuincena}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ubicación:</span>
                <span>{product.aisle.split('-')[0]}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setIsApartarModalOpen(false);
                  const item: PaymentItemDetails = {
                    title: product.name,
                    concept: 'Apartado y Compra en Tienda',
                    amount: product.cashPrice,
                    clientName: 'Carlos E. Mendoza',
                    itemType: 'product',
                  };
                  if (onOpenSecurePayment) {
                    onOpenSecurePayment(item);
                  } else {
                    setIsPaymentModalOpen(true);
                  }
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 btn-motion shadow"
              >
                <i className="fa-solid fa-lock text-amber-300"></i>
                <span>Pagar con Tarjeta y 2FA en este Tótem</span>
              </button>

              <button
                onClick={() => {
                  handlePrint();
                  setIsApartarModalOpen(false);
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-[#002B66] font-bold rounded-xl text-xs flex items-center justify-center space-x-2 btn-motion"
              >
                <i className="fa-solid fa-receipt"></i>
                <span>Solo Generar Orden con Ticket para Pagar en Caja</span>
              </button>

              <button
                onClick={() => setIsApartarModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs btn-motion"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO SEGURO EN TÓTEM (TARJETA CIFRADA + CÓDIGO SMS/2FA BANCARIO + TICKET) */}
      <SecureKioskPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        itemDetails={{
          title: product.name,
          concept: payPlanChoice === 'contado' ? 'Compra de Contado' : `Pago 1ra Quincena (${selectedQuincenas}Q)`,
          amount: payPlanChoice === 'contado' ? product.cashPrice : calc.amountPerQuincena,
          quincenalInfo: payPlanChoice === 'primera_quincena' ? `Restan ${selectedQuincenas - 1} quincenas de $${calc.amountPerQuincena}` : undefined,
          clientName: 'Carlos E. Mendoza',
          itemType: 'product',
        }}
        onPaymentSuccess={(receipt) => {
          onPrintTicket(receipt);
        }}
        isLargeText={isLargeText}
        isVoiceEnabled={isVoiceEnabled}
      />
    </div>
  );
};
