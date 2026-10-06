import React, { useState } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { api } from '../services/api';

interface ScreenCompraProps {
  onShowToast: (msg: string) => void;
}

export const ScreenCompra: React.FC<ScreenCompraProps> = ({ onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState({
    title: 'Pantalla Samsung 65" QLED 4K',
    model: 'QN65Q60D Smart Tizen TV',
    price: 14999,
    quincenas: 24,
    quincenaCost: 625,
    tag: 'Entrega en Tienda Select',
  });

  const [ticketData, setTicketData] = useState({
    code: 'CP-SEL-2026-8842',
    date: '05 Oct 2026, 14:45 hrs',
    sucursal: 'Monumento a la Revolución - Kiosco 02',
    auth: 'AUTH-998412-VIP',
  });

  const handlePagarKiosco = async () => {
    setIsProcessing(true);
    try {
      const res = await api.checkoutKiosk({
        productTitle: selectedProduct.title,
        amount: selectedProduct.price,
        quincenas: selectedProduct.quincenas,
        sucursal: ticketData.sucursal,
      });

      if (res.success && res.order) {
        setTicketData({
          code: res.order.ticketNumber,
          date: `${res.order.date}, ${res.order.time} hrs`,
          sucursal: res.order.store,
          auth: res.order.authCode,
        });
      }
    } catch {
      // Keep existing data as optimistic fallback
    } finally {
      setIsProcessing(false);
      setIsModalOpen(true);
      onShowToast('Ticket enviado a Kiosco de Sucursal');
    }
  };

  const handleSimularImpresion = async () => {
    setIsPrinting(true);
    onShowToast('🖨️ Imprimiendo comprobante en Kiosco Coppel...');
    try {
      await api.printKioskReceipt(ticketData.code);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setIsPrinting(false);
      onShowToast('✅ ¡Ticket impreso con éxito en Kiosco 02!');
    }, 2000);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText?.(ticketData.code);
    onShowToast(`Código ${ticketData.code} copiado.`);
  };

  return (
    <div id="screen-compra" className="screen active px-4 pt-3 pb-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-[#002B66]">
          Compra Rápida & Kiosco Express
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Sin Filas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Columna Izquierda: Producto y Checkout */}
        <div>
          {/* Selector de Producto / Tarjeta de Pedido */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm mb-3 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
                  Artículo Select Seleccionado
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight mt-0.5">
                  {selectedProduct.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedProduct.model}</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 block">
                  ${selectedProduct.price.toLocaleString('es-MX')} MXN
                </span>
                <span className="text-[9px] text-slate-400 line-through">$17,499 MXN</span>
              </div>
            </div>

            {/* Desglose de Pago Quincenal */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px]">Plan de Financiamiento:</span>
                <p className="font-bold text-[#002B66]">{selectedProduct.quincenas} quincenas fijas de</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">${selectedProduct.quincenaCost} MXN</span>
                <span className="block text-[8px] text-emerald-600 font-bold">0% Recargo VIP</span>
              </div>
            </div>

            {/* Estado de Crédito y Aprobación */}
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-credit-card text-[#002B66]"></i>
                <span>Pago con Crédito Navy VIP</span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 border border-emerald-200">
                <i className="fa-solid fa-bolt text-emerald-600 text-[9px]"></i>
                Aprobado sin filas
              </span>
            </div>
          </div>

          {/* Botón Principal (Original del prompt) */}
          <button
            onClick={handlePagarKiosco}
            disabled={isProcessing}
            className="w-full py-3 px-4 text-xs font-bold text-white coppel-navy hover:bg-blue-900 rounded-xl shadow-md flex items-center justify-center space-x-2 btn-motion mb-3 disabled:opacity-70"
          >
            <i className={`fa-solid ${isProcessing ? 'fa-spinner fa-spin' : 'fa-print'} text-amber-400 text-sm`}></i>
            <span>{isProcessing ? 'Procesando en Backend...' : 'Pagar y Generar Ticket para Kiosco'}</span>
          </button>

          {/* Beneficios del Kiosco Select */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-[10px] text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-store text-blue-700"></i>
              ¿Cómo funciona el Kiosco Express?
            </p>
            <p>1. Genera tu compra desde tu app con tu crédito Navy VIP.</p>
            <p>2. Llega a la sucursal elegida y pasa directamente al módulo Select.</p>
            <p>3. Escanea tu QR en el lector del kiosco para retirar tu producto sin hacer fila en caja.</p>
          </div>
        </div>

        {/* Columna Derecha: Ticket Generado y Simulación */}
        <div>
          {isModalOpen ? (
            <div
              id="kioscoModal"
              className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl text-center space-y-3 shadow-md animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-center space-x-1.5 text-xs font-extrabold text-[#002B66]">
                <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                <span>¡Pago Exitoso! Ticket Digital Generado</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-slate-200 relative">
                <QRCodeDisplay
                  value={`https://coppel.com/select/kiosk?ref=${ticketData.code}&auth=${ticketData.auth}`}
                  size={140}
                />
                <div className="mt-1">
                  <span className="text-[9px] font-mono text-slate-400 tracking-wider">
                    SCAN AT KIOSK
                  </span>
                </div>
              </div>

              {/* Código Alfanumérico de Retiro */}
              <div className="bg-white/90 p-2 rounded-xl border border-amber-200/80 inline-flex items-center space-x-2">
                <span className="text-[10px] text-slate-500">Código de Retiro:</span>
                <span className="font-mono font-extrabold text-xs text-[#002B66] tracking-wider">
                  {ticketData.code}
                </span>
                <button
                  onClick={copyCode}
                  title="Copiar código"
                  className="text-[10px] text-blue-600 hover:text-blue-800 p-1"
                >
                  <i className="fa-regular fa-copy"></i>
                </button>
              </div>

              <p className="text-[10px] text-slate-600 leading-snug px-2">
                Escanea este código en cualquier <strong className="text-slate-800">Kiosco Coppel Select</strong> para imprimir tu comprobante físico al instante y retirar tu mercancía.
              </p>

              {/* Botones de acción del Ticket */}
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  onClick={handleSimularImpresion}
                  disabled={isPrinting}
                  className={`w-full py-2.5 px-3 text-[11px] font-bold rounded-xl btn-motion flex items-center justify-center space-x-1.5 shadow-xs ${
                    isPrinting
                      ? 'bg-amber-300 text-[#002B66] cursor-wait'
                      : 'bg-[#002B66] text-white hover:bg-blue-900'
                  }`}
                >
                  <i className={`fa-solid ${isPrinting ? 'fa-spinner fa-spin' : 'fa-receipt'} text-amber-400`}></i>
                  <span>{isPrinting ? 'Imprimiendo en Kiosco...' : 'Simular Impresión en Kiosco Físico'}</span>
                </button>

                <button
                  onClick={() => onShowToast('Ticket enviado a tu WhatsApp y Correo.')}
                  className="w-full py-2 text-[10px] font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center space-x-1.5"
                >
                  <i className="fa-brands fa-whatsapp text-emerald-600"></i>
                  <span>Enviar a mi WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full p-6 bg-white/40 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-xs">
              <i className="fa-solid fa-receipt text-3xl mb-2 text-slate-300"></i>
              <p className="font-semibold text-slate-600">Ticket Kiosco Express</p>
              <p className="text-[10px] mt-1 max-w-xs">
                Al confirmar tu compra, aquí se generará tu comprobante digital y código QR para retirar en sucursal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
