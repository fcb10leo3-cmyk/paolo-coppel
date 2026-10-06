import React, { useState, useEffect } from 'react';
import { AssistanceAlert } from './types';
import { PhysicalTotemFrame } from './components/PhysicalTotemFrame';
import { HardwareBlueprintModal } from './components/HardwareBlueprintModal';
import { AdminEmployeePanel } from './components/AdminEmployeePanel';
import { TwoDeviceSyncModal } from './components/TwoDeviceSyncModal';
import { voice } from './services/voice';
import { kioskSync } from './services/kioskSync';

export default function App() {
  // The user specifically wants the App Móvil de Empleados as the default primary project
  const [activeView, setActiveView] = useState<'admin' | 'kiosk'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'kiosk' || window.location.pathname === '/kiosk') {
        return 'kiosk';
      }
    }
    return 'admin';
  });

  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [isAssistanceActive, setIsAssistanceActive] = useState<boolean>(false);
  const [activeAssociateName, setActiveAssociateName] = useState<string>('Mariana Gómez');
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Real-time synchronization (kioskSync with SSE + BroadcastChannel + Fast Poll fallback)
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

    // SSE connection for immediate push across devices when backend is available
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/assistance/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'init' || payload.type === 'new_call') {
            const call = payload.activeCall || payload.alert;
            if (call) {
              setActiveCall(call);
              setIsAssistanceActive(true);
              if (call.assignedAssociateName) {
                setActiveAssociateName(call.assignedAssociateName);
              }
            } else {
              setActiveCall(null);
              setIsAssistanceActive(false);
            }
          } else if (payload.type === 'call_responded') {
            if (payload.activeCall) {
              setActiveCall(payload.activeCall);
              setIsAssistanceActive(true);
              if (payload.activeCall.assignedAssociateName) {
                setActiveAssociateName(payload.activeCall.assignedAssociateName);
              }
            }
          } else if (payload.type === 'call_resolved') {
            setActiveCall(null);
            setIsAssistanceActive(false);
            voice.speak('¡Asistencia completada! Esperamos que tu experiencia en Coppel haya sido excelente.');
          } else if (payload.type === 'call_cancelled') {
            setActiveCall(null);
            setIsAssistanceActive(false);
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // SSE connection error
    }

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (eventSource) eventSource.close();
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

  // Keyboard shortcut listener for physical arcade button (Spacebar)
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
      {/* Background ambient showroom lights */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[200px]"></div>
      </div>

      {/* VISTA 1: APP MÓVIL DE ADMINISTRADOR Y EMPLEADOS (Para probar en celular) */}
      {activeView === 'admin' ? (
        <AdminEmployeePanel onBackToKiosk={() => setActiveView('kiosk')} />
      ) : (
        /* VISTA 2: TÓTEM KIOSCO COPPEL ASISTENCIA */
        <PhysicalTotemFrame
          onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
          onOpenAdminPanel={() => setActiveView('admin')}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          isAssistanceActive={isAssistanceActive}
          onTriggerAssistance={handleTriggerAssistance}
          onCancelAssistance={handleCancelAssistance}
          activeAssociateName={activeAssociateName}
          activeCall={activeCall}
        />
      )}

      {/* Modal de Sincronización QR para probar con 2 Dispositivos */}
      <TwoDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onOpenAdminInSameWindow={() => {
          setIsSyncModalOpen(false);
          setActiveView('admin');
        }}
      />

      {/* Modal Interactivo de Hardware, Pantallas, Circuitos y Presupuesto */}
      <HardwareBlueprintModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </div>
  );
}
