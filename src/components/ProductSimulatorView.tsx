import React, { useState, useMemo } from 'react';
import { ProductCatalogItem, KioskReceipt } from '../types';
import { KIOSK_PRODUCTS } from '../data/kioskProducts';
import { voice } from '../services/voice';
import { ProductDetailView } from './ProductDetailView';
import { PaymentItemDetails } from './SecureKioskPaymentModal';

interface ProductSimulatorViewProps {
  initialCategory?: string | null;
  onBackToMenu: () => void;
  onTriggerAssistance: (reason?: string) => void;
  onPrintTicket: (receipt: KioskReceipt) => void;
  onOpenSecurePayment?: (item: PaymentItemDetails) => void;
  isLargeText: boolean;
  isVoiceEnabled: boolean;
}

export const ProductSimulatorView: React.FC<ProductSimulatorViewProps> = ({
  initialCategory,
  onBackToMenu,
  onTriggerAssistance,
  onPrintTicket,
  onOpenSecurePayment,
  isLargeText,
  isVoiceEnabled,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(initialCategory || 'all');
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState<boolean>(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return KIOSK_PRODUCTS.filter((prod) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' || prod.category === selectedCategoryFilter;
      const matchesQuery =
        searchQuery === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.aisle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategoryFilter]);

  const handleSelectProduct = (product: ProductCatalogItem) => {
    setSelectedProduct(product);
    if (isVoiceEnabled) {
      voice.speak(`Abriendo detalle de ${product.name}. Contado $${product.cashPrice} pesos o ${product.quincenalBase} quincenales.`);
    }
  };

  // Virtual keyboard keys
  const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BORRAR', 'ESPACIO'],
  ];

  // SI SE HA SELECCIONADO UN PRODUCTO: SE ABRE LA PANTALLA COMPLETA NUEVA DEL PRODUCTO
  // "que cuando seleccione algún producto, que se abra el producto en sí, que no aparezca todo lo demás y que con un tache o un signo de regresar pues se regrese a lo anterior"
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onTriggerAssistance={onTriggerAssistance}
        onPrintTicket={onPrintTicket}
        onOpenSecurePayment={onOpenSecurePayment}
        isLargeText={isLargeText}
        isVoiceEnabled={isVoiceEnabled}
      />
    );
  }

  // SI NO HAY PRODUCTO SELECCIONADO: CATÁLOGO AMPLIO, LIMPIO Y ESPACIOSO
  return (
    <div className={`w-full max-w-5xl mx-auto space-y-3 animate-in fade-in duration-200 select-none ${
      isLargeText ? 'text-base' : 'text-xs sm:text-sm'
    }`}>
      {/* 1. BARRA SUPERIOR: BOTÓN REGRESAR, BUSCADOR Y TECLADO VIRTUAL */}
      <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2.5 rounded-2xl border-2 border-slate-200 shadow-xs">
        <button
          onClick={onBackToMenu}
          className="py-2 px-3.5 sm:px-4 bg-gradient-to-r from-blue-900 to-[#002B66] hover:from-blue-800 hover:to-blue-950 text-amber-300 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-2 btn-motion shrink-0"
          title="Regresar al Menú Principal"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Menú Principal</span>
        </button>

        {/* Buscador de Productos */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsVirtualKeyboardOpen(true)}
            placeholder="Buscar por producto, marca o modelo (Samsung, Lavadora, iPhone...)"
            className="w-full py-2 pl-9 pr-8 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium focus:border-[#002B66] focus:bg-white outline-none"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <i className="fa-solid fa-circle-xmark text-sm"></i>
            </button>
          )}
        </div>

        {/* Botón de Teclado Táctil */}
        <button
          onClick={() => setIsVirtualKeyboardOpen(!isVirtualKeyboardOpen)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 btn-motion shrink-0 ${
            isVirtualKeyboardOpen
              ? 'bg-[#002B66] text-amber-300 border-[#002B66]'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Abrir teclado táctil en pantalla"
        >
          <i className="fa-solid fa-keyboard text-xs"></i>
          <span className="hidden sm:inline">Teclado</span>
        </button>

        {/* Tache de salida rápida al menú */}
        <button
          onClick={onBackToMenu}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 shrink-0 text-sm"
          title="Cerrar búsqueda y volver"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Teclado Virtual Desplegable */}
      {isVirtualKeyboardOpen && (
        <div className="bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-700 shadow-xl space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center px-2 text-[11px] text-amber-300 font-bold">
            <span>Teclado Táctil de Kiosco</span>
            <button onClick={() => setIsVirtualKeyboardOpen(false)} className="text-slate-300 hover:text-white">
              <i className="fa-solid fa-xmark mr-1"></i> Cerrar Teclado
            </button>
          </div>
          {keyboardKeys.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-0.5 sm:gap-1.5">
              {row.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === 'BORRAR') setSearchQuery((prev) => prev.slice(0, -1));
                    else if (k === 'ESPACIO') setSearchQuery((prev) => prev + ' ');
                    else setSearchQuery((prev) => prev + k);
                  }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-transform active:scale-90 ${
                    k === 'BORRAR'
                      ? 'bg-red-800 text-white min-w-[50px] sm:min-w-[70px]'
                      : k === 'ESPACIO'
                      ? 'bg-amber-400 text-slate-950 flex-1 max-w-[160px] sm:max-w-[200px]'
                      : 'bg-slate-800 text-white hover:bg-slate-700 min-w-[24px] xs:min-w-[28px] sm:min-w-[38px]'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 2. CHIPS DE FILTRO DE CATEGORÍAS (AMPLIOS Y CÓMODOS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none no-scrollbar">
        {[
          { id: 'all', label: 'Todos los Artículos' },
          { id: 'celulares', label: '📱 Celulares' },
          { id: 'electronica', label: '📺 Pantallas & Audio' },
          { id: 'muebles', label: '🛋️ Muebles & Salas' },
          { id: 'hogar', label: '❄️ Hogar & Línea Blanca' },
          { id: 'colchones', label: '🛏️ Colchones & Camas' },
          { id: 'bano', label: '🚿 Baño & Fontanería' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedCategoryFilter(f.id)}
            className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap btn-motion text-xs sm:text-sm border shrink-0 ${
              selectedCategoryFilter === f.id
                ? 'bg-[#002B66] text-amber-300 border-[#002B66] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3. ENCABEZADO DEL CATÁLOGO & CONTADOR */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center px-1 text-xs text-slate-600 font-semibold gap-1">
        <span>Mostrando {filteredProducts.length} productos disponibles en tienda</span>
        <span className="text-[#002B66] font-bold text-[11px] sm:text-xs">Toca cualquier producto para abrirlo en grande</span>
      </div>

      {/* 4. GRILLA AMPLIA Y ESPACIOSA DE PRODUCTOS (3 A 4 COLUMNAS SIN SATURAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 max-h-[65vh] overflow-y-auto screen-scroll pr-1 pb-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            onClick={() => handleSelectProduct(prod)}
            className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 p-3 sm:p-3.5 rounded-3xl transition-all cursor-pointer btn-motion shadow-xs hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              {/* Top: Icon + Badge + Brand */}
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#002B66] flex items-center justify-center text-lg shrink-0 border border-blue-200 group-hover:scale-105 transition-transform">
                  <i className={prod.imageIcon}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                    {prod.brand}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {prod.model.split(' ')[0]}
                  </span>
                </div>
                {prod.badge && (
                  <span className="text-[9px] font-black uppercase bg-amber-400 text-[#002B66] px-2 py-0.5 rounded-lg shrink-0 shadow-xs">
                    {prod.badge.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h3 className="mt-2 font-extrabold text-[#002B66] text-sm leading-snug line-clamp-2 group-hover:text-blue-900">
                {prod.name}
              </h3>
            </div>

            {/* Price Box */}
            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Contado:</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">
                  ${prod.cashPrice.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-normal">MXN</span>
                </span>
              </div>

              {/* Quincenas Pill */}
              <div className="bg-gradient-to-r from-blue-50 to-amber-50/60 p-2 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-blue-900 font-extrabold uppercase block">24 Quincenas:</span>
                  <span className="text-xs sm:text-sm font-black text-amber-600">
                    ${prod.quincenalBase} <span className="text-[9px] text-slate-500 font-normal">/ qna</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#002B66] bg-white px-2 py-1 rounded-lg border border-slate-200 group-hover:border-amber-400 group-hover:text-amber-600 transition-colors">
                  Ver detalle <i className="fa-solid fa-arrow-right ml-0.5 text-[9px]"></i>
                </span>
              </div>

              {/* Aisle location */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="truncate flex items-center gap-1">
                  <i className="fa-solid fa-location-dot text-amber-500 text-[9px]"></i>
                  <span className="truncate">{prod.aisle.split('-')[0]}</span>
                </span>
                <span className="text-emerald-700 font-bold shrink-0">Stock ({prod.stock})</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className="font-extrabold text-[#002B66] text-base">No se encontraron productos</h3>
          <p className="text-xs text-slate-500">Prueba con otra palabra o selecciona "Todos los Artículos".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryFilter('all');
            }}
            className="py-2 px-4 bg-[#002B66] text-amber-300 font-bold rounded-xl text-xs btn-motion"
          >
            Ver todos los productos
          </button>
        </div>
      )}
    </div>
  );
};
