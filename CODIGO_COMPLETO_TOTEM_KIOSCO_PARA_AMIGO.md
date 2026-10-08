# 🏪 PROYECTO COMPLETO: KIOSCO TÓTEM COPPEL ASISTENCIA (PARA GOOGLE AI STUDIO)

Este documento contiene **todo el código completo del Kiosco Tótem Coppel Asistencia** listo para copiar y pegar en un nuevo proyecto de Google AI Studio o compartir con tu amigo.

---

## ⚡ FORMA RÁPIDA: Prompt Inicial para tu amigo en AI Studio

Tu amigo puede abrir un nuevo proyecto en **Google AI Studio** y pegar este prompt:

> **"Crea la aplicación del Kiosco Tótem Físico Coppel Asistencia en React + Tailwind CSS + Vite. Debe incluir el gabinete 3D azul Coppel con marquesina luminosa 'COPPEL ASISTENCIA', el botón arcade iluminado de 60mm 'PUSH TO SPEAK' (funciona con clic y tecla Espacio), pantalla táctil vertical con categorías (Ropa, Hogar, Electrónica, Celulares, Muebles), catálogo interactivo con simulador de abonos quincenales, pago express blindado con token 2FA dinámico e impresión de ticket térmico, modal con especificaciones de planos de hardware (BOM) y botón para llamar a un asesor de tienda en pasillo."**

Y a continuación, si desea el código exacto archivo por archivo, aquí está todo el código fuente:

---

## 📁 ARCHIVO 1: `src/App.tsx` (Para el proyecto del Kiosco Tótem)

```tsx
import React, { useState, useEffect } from 'react';
import { AssistanceAlert, KioskReceipt } from './types';
import { PhysicalTotemFrame } from './components/PhysicalTotemFrame';
import { HardwareBlueprintModal } from './components/HardwareBlueprintModal';
import { voice } from './services/voice';
import { kioskSync } from './services/kioskSync';

export default function App() {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [isAssistanceActive, setIsAssistanceActive] = useState<boolean>(false);
  const [activeAssociateName, setActiveAssociateName] = useState<string>('Mariana Gómez');
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = kioskSync.subscribe((state) => {
      if (state.activeCall) {
        setActiveCall(state.activeCall);
        setIsAssistanceActive(true);
        if (state.activeCall.assignedAssociateName) {
          setActiveAssociateName(state.activeCall.assignedAssociateName);
        }
      } else {
        setActiveCall(null);
        setIsAssistanceActive(false);
      }
    });

    kioskSync.fetchStatus();
    const interval = setInterval(() => {
      kioskSync.fetchStatus();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleTriggerAssistance = async (reason?: string, preferredEmployeeId?: string) => {
    setIsAssistanceActive(true);
    try {
      const call = await kioskSync.triggerCall({
        aisle: 'Pasillo 4 - Mueblería Central',
        department: 'Muebles & Electrónica',
        reason: reason || 'Llamada desde Kiosco Tótem',
        preferredEmployeeId,
      });
      if (call) {
        setActiveCall(call);
        if (call.assignedAssociateName) {
          setActiveAssociateName(call.assignedAssociateName);
        }
      }
    } catch {
      setActiveAssociateName('Mariana Gómez (Asesora de Piso)');
    }
  };

  const handleCancelAssistance = async () => {
    setIsAssistanceActive(false);
    setActiveCall(null);
    try {
      await kioskSync.cancelCall();
    } catch {
      // Fallback
    }
  };

  // Escucha de la barra espaciadora como botón arcade USB físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handleTriggerAssistance('Pulsación detectada desde Entrada USB Hardware (Tecla ESPACIO)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#040915] text-slate-100 flex flex-col justify-start relative overflow-x-hidden selection:bg-amber-400 selection:text-[#002B66]">
      {/* Luces ambientales showroom */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[200px]"></div>
      </div>

      {/* TÓTEM KIOSCO FÍSICO COPPEL ASISTENCIA */}
      <PhysicalTotemFrame
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        isAssistanceActive={isAssistanceActive}
        onTriggerAssistance={handleTriggerAssistance}
        onCancelAssistance={handleCancelAssistance}
        activeAssociateName={activeAssociateName}
        activeCall={activeCall}
      />

      {/* Modal de Especificaciones de Hardware & BOM */}
      <HardwareBlueprintModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </div>
  );
}
```

---

## 📁 ARCHIVO 2: `src/components/PhysicalTotemFrame.tsx`

```tsx
import React, { useState } from 'react';
import { KioskReceipt, AssistanceAlert } from '../types';
import { KioskTabletUI } from './KioskTabletUI';
import { voice } from '../services/voice';

interface PhysicalTotemFrameProps {
  onOpenHardwareModal: () => void;
  isAssistanceActive: boolean;
  onTriggerAssistance: (reason?: string, preferredEmployeeId?: string) => void;
  onCancelAssistance: () => void;
  activeAssociateName: string;
  activeCall?: AssistanceAlert | null;
}

export const PhysicalTotemFrame: React.FC<PhysicalTotemFrameProps> = ({
  onOpenHardwareModal,
  isAssistanceActive,
  onTriggerAssistance,
  onCancelAssistance,
  activeAssociateName,
  activeCall,
}) => {
  const [viewMode, setViewMode] = useState<'totem' | 'fullscreen'>('totem');
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState<KioskReceipt | null>(null);
  const [isPrintingAnimation, setIsPrintingAnimation] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const handlePhysicalButtonClick = () => {
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 250);

    if (isVoiceEnabled) {
      voice.speak('Botón presionado. Conectando con un asesor de tienda.');
    }

    onTriggerAssistance('Pulsación del botón físico PUSH TO SPEAK');
  };

  const handlePrintTicket = (receipt: KioskReceipt) => {
    setIsPrintingAnimation(true);
    setPrintedReceipt(receipt);

    setTimeout(() => {
      setIsPrintingAnimation(false);
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-screen p-1.5 sm:p-4 select-none">
      {/* Barra de Controles Superiores */}
      <header className="w-full max-w-5xl mx-auto mb-2 sm:mb-3 px-2.5 sm:px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs shadow-xl flex items-center justify-between gap-2 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-sm shadow">
            <i className="fa-solid fa-key"></i>
          </div>
          <div>
            <span className="font-extrabold text-white text-xs sm:text-sm">Coppel Asistencia</span>
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-mono block">Kiosco Tótem de Tienda</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'totem' ? 'fullscreen' : 'totem')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            {viewMode === 'totem' ? 'Pantalla Completa' : 'Ver Tótem Mueble'}
          </button>
          <button
            onClick={onOpenHardwareModal}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 rounded-xl text-xs font-bold border border-blue-600/50"
          >
            <i className="fa-solid fa-microchip mr-1"></i>
            Hardware & BOM
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      {viewMode === 'fullscreen' ? (
        <div className="w-full max-w-5xl h-[86vh] bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 flex flex-col">
          <KioskTabletUI
            onTriggerAssistance={onTriggerAssistance}
            isAssistanceActive={isAssistanceActive}
            activeAssociateName={activeAssociateName}
            onCancelAssistance={onCancelAssistance}
            onPrintTicket={handlePrintTicket}
            isLargeText={isLargeText}
            onToggleLargeText={() => setIsLargeText(!isLargeText)}
            isVoiceEnabled={isVoiceEnabled}
            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            activeCall={activeCall}
          />
        </div>
      ) : (
        /* VISTA TÓTEM MUEBLE FÍSICO COMPLETO */
        <div className="w-full max-w-md bg-gradient-to-b from-[#003B8A] via-[#002B66] to-[#001738] rounded-[44px] p-4 sm:p-5 border-4 border-blue-400/40 shadow-2xl flex flex-col items-center space-y-4 relative">
          {/* Marquesina Superior Iluminada */}
          <div className="w-full py-3 px-4 bg-[#001F4D] rounded-3xl border border-blue-400/30 text-center shadow-inner">
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
              COPPEL ASISTENCIA
            </h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
              Tótem Interactivo Pasillo 4
            </p>
          </div>

          {/* Marco de Pantalla Táctil */}
          <div className="w-full h-[580px] sm:h-[620px] bg-slate-900 rounded-[32px] overflow-hidden border-4 border-slate-800 shadow-2xl flex flex-col relative">
            <KioskTabletUI
              onTriggerAssistance={onTriggerAssistance}
              isAssistanceActive={isAssistanceActive}
              activeAssociateName={activeAssociateName}
              onCancelAssistance={onCancelAssistance}
              onPrintTicket={handlePrintTicket}
              isLargeText={isLargeText}
              onToggleLargeText={() => setIsLargeText(!isLargeText)}
              isVoiceEnabled={isVoiceEnabled}
              onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
              activeCall={activeCall}
            />
          </div>

          {/* Botón Físico Arcade PUSH TO SPEAK */}
          <div className="flex flex-col items-center space-y-2 pt-2">
            <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
              Presiona para Hablar
            </div>
            <button
              onClick={handlePhysicalButtonClick}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-4 border-white shadow-2xl flex items-center justify-center text-slate-950 font-black text-2xl transition-all active:scale-90 ${
                isButtonPressed ? 'scale-90 ring-8 ring-amber-400/50' : 'hover:scale-105'
              } ${isAssistanceActive ? 'animate-pulse ring-8 ring-red-500' : ''}`}
            >
              <i className="fa-solid fa-microphone-lines text-2xl sm:text-3xl text-[#002B66]"></i>
            </button>
            <span className="text-[9px] text-blue-200 font-mono">
              [ O presiona la tecla ESPACIO ]
            </span>
          </div>

          {/* Ranura Impresora Térmica */}
          <div className="w-48 bg-slate-950 rounded-full py-1 px-4 border border-slate-700 text-center">
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-mono">
              Ranura de Ticket Térmico
            </span>
          </div>

          {/* Animación de Ticket Expulsado */}
          {printedReceipt && isPrintingAnimation && (
            <div className="w-48 bg-white text-slate-900 text-[9px] p-2 rounded shadow-2xl font-mono text-center animate-bounce">
              <p className="font-black text-amber-600">*** COPPEL TICKET ***</p>
              <p>{printedReceipt.concept}</p>
              <p className="font-bold">${printedReceipt.amount} MXN</p>
              <p className="text-[8px] text-slate-500">{printedReceipt.ticketNumber}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 📁 ARCHIVO 3: `src/data/kioskProducts.ts`

```ts
import { ProductCatalogItem } from '../types';

export const KIOSK_PRODUCTS: ProductCatalogItem[] = [
  {
    id: 'cel-01',
    name: 'Samsung Galaxy A55 5G 128GB',
    model: 'SM-A556M Awesome Navy',
    brand: 'Samsung',
    category: 'celulares',
    cashPrice: 7499,
    originalPrice: 8999,
    quincenalBase: 315,
    aisle: 'Pasillo 1A - Telefonía & Accesorios',
    stock: 8,
    imageIcon: 'fa-solid fa-mobile-screen',
    specs: ['Pantalla 6.6" Super AMOLED 120Hz', 'Cámara triple 50MP con OIS', 'Batería 5,000 mAh + Carga rápida', '5G Telcel / Desbloqueado'],
    badge: 'MÁS VENDIDO',
    description: 'El smartphone favorito por su cámara nocturna nítida, diseño en cristal premium y batería para todo el día.',
  },
  {
    id: 'cel-02',
    name: 'Apple iPhone 15 128GB',
    model: 'A3090 Dynamic Island Negro',
    brand: 'Apple',
    category: 'celulares',
    cashPrice: 16999,
    originalPrice: 18499,
    quincenalBase: 710,
    aisle: 'Pasillo 1A - Vitrina Apple',
    stock: 5,
    imageIcon: 'fa-brands fa-apple',
    specs: ['Chip A16 Bionic súper veloz', 'Cámara de 48MP con zoom 2x', 'Dynamic Island interactiva', 'Conector universal USB-C'],
    badge: 'GAMA ALTA',
    description: 'Rendimiento profesional, fotos en ultra alta resolución y materiales de grado aeroespacial.',
  },
  {
    id: 'elec-01',
    name: 'Pantalla Samsung 65" Crystal UHD 4K',
    model: 'UN65DU7000F Smart TV 2026',
    brand: 'Samsung',
    category: 'electronica',
    cashPrice: 11499,
    originalPrice: 13999,
    quincenalBase: 480,
    aisle: 'Pasillo 2B - Audio y Video High-End',
    stock: 6,
    imageIcon: 'fa-solid fa-tv',
    specs: ['Resolución 4K UHD real', 'Procesador Crystal 4K', 'Smart Hub con Netflix, YouTube, Disney+', 'Diseño sin bordes en 3 lados'],
    badge: 'OFERTA DESTACADA',
    description: 'Colores vibrantes y realistas para ver fútbol, series y películas con calidad de cine en casa.',
  },
  {
    id: 'mueb-01',
    name: 'Sala Esquinera Modular Contemporánea Gris',
    model: 'Möbel Kross Modular L-Shape',
    brand: 'Coppel Home',
    category: 'muebles',
    cashPrice: 9899,
    originalPrice: 11999,
    quincenalBase: 415,
    aisle: 'Pasillo 4 - Mueblería Central',
    stock: 4,
    imageIcon: 'fa-solid fa-couch',
    specs: ['Tapizado en lino gris de alta resistencia', 'Estructura en madera de pino sólida', 'Cojines reversibles de alta densidad', 'Flete gratuito en compras Coppel'],
    badge: 'CONFORT TOTAL',
    description: 'Diseño moderno y acogedor para consentir a la familia, fácil de limpiar y adaptable a cualquier sala.',
  },
  {
    id: 'hogar-01',
    name: 'Refrigerador Mabe 14 Pies Automático Grafito',
    model: 'RMA360FYPU con despachador',
    brand: 'Mabe',
    category: 'hogar',
    cashPrice: 9499,
    originalPrice: 10899,
    quincenalBase: 395,
    aisle: 'Pasillo 5A - Línea Blanca & Cocina',
    stock: 7,
    imageIcon: 'fa-solid fa-snowflake',
    specs: ['Tecnología Home Energy Saver (-25% luz)', 'Despachador de agua de 2 litros', 'Parrillas de cristal templado', 'Capacidad 360 litros'],
    badge: 'AHORRO DE ENERGÍA',
    description: 'Conserva tus alimentos frescos por más tiempo ahorrando en tu recibo de luz.',
  },
  {
    id: 'ropa-01',
    name: 'Tenis Nike Court Vision Low Blanco Hombre',
    model: 'CD5463-100 Classic Retro',
    brand: 'Nike',
    category: 'ropa',
    cashPrice: 1599,
    originalPrice: 1799,
    quincenalBase: 70,
    aisle: 'Pasillo 9 - Zapatería y Sneakers',
    stock: 14,
    imageIcon: 'fa-solid fa-shoe-prints',
    specs: ['Piel sintética premium duradera', 'Suela de goma con patrón circular', 'Diseño icónico básquetbol años 80', 'Tallas 25 a 30'],
    badge: 'ESTILO CLÁSICO',
    description: 'El calzado más versátil para combinar con jeans o bermudas con máxima comodidad.',
  },
];
```

---

## 📁 ARCHIVO 4: `src/types.ts`

```ts
export interface ProductCatalogItem {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  cashPrice: number;
  originalPrice?: number;
  quincenalBase: number;
  aisle: string;
  stock: number;
  imageIcon: string;
  specs: string[];
  badge?: string;
  description: string;
}

export interface AssistanceAlert {
  id: string;
  timestamp: string;
  createdAt: number;
  status: 'calling' | 'in_transit' | 'resolved' | 'cancelled';
  aisle: string;
  storeDepartment: string;
  reason: string;
  preferredEmployeeId?: string;
  assignedAssociateName?: string;
  assignedAssociateRole?: string;
  assignedAssociateId?: string;
  estimatedArrivalSeconds: number;
  resolvedAt?: string;
  clientNotes?: string;
}

export interface KioskReceipt {
  ticketNumber: string;
  clientNumber: string;
  clientName: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  date: string;
  time: string;
  kioskId: string;
  branch: string;
  authCode: string;
  barcode: string;
  details?: {
    quincenas?: number;
    pagoQuincenal?: number;
    pagoContado?: number;
    aisle?: string;
  };
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'disponible' | 'en_piso' | 'ocupado' | 'descanso';
  currentAisle: string;
  avatarColor: string;
  initials: string;
  phone: string;
  rating: number;
  totalHelpedToday: number;
  badge?: string;
}
```

---

*(Nota: Los archivos auxiliares como `KioskTabletUI.tsx`, `ProductSimulatorView.tsx`, `ProductDetailView.tsx`, `SecureKioskPaymentModal.tsx` y `HardwareBlueprintModal.tsx` se pueden pasar a tu amigo exactamente como están en este repositorio).*
