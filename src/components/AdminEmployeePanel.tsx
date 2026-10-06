import React, { useState, useEffect, useRef } from 'react';
import { Employee, AssistanceAlert } from '../types';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';
import { kioskSync } from '../services/kioskSync';

interface AdminEmployeePanelProps {
  onBackToKiosk?: () => void;
}

export const AdminEmployeePanel: React.FC<AdminEmployeePanelProps> = ({ onBackToKiosk }) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [alertsHistory, setAlertsHistory] = useState<AssistanceAlert[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMyEmployeeId, setSelectedMyEmployeeId] = useState<string>('emp-01'); // Default as Mariana Gómez
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'team' | 'history'>('alerts');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSimulatingAlert, setIsSimulatingAlert] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSimulationDrawerOpen, setIsSimulationDrawerOpen] = useState<boolean>(false);

  const prevCallIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll + SSE + BroadcastChannel via kioskSync
  useEffect(() => {
    const unsubscribe = kioskSync.subscribe((state) => {
      setActiveCall(state.activeCall);
      if (state.history) setAlertsHistory(state.history);
      if (state.employees) setEmployees(state.employees);
    });

    kioskSync.fetchAlerts();
    const pollInterval = setInterval(() => {
      kioskSync.fetchAlerts();
    }, 2000);

    // Real-time Server-Sent Events (SSE) when backend is active
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/assistance/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'init') {
            setActiveCall(payload.activeCall || null);
            if (payload.employees) setEmployees(payload.employees);
            if (payload.history) setAlertsHistory(payload.history);
          } else if (payload.type === 'new_call') {
            setActiveCall(payload.alert);
            setAlertsHistory((prev) => [payload.alert, ...prev.filter((a) => a.id !== payload.alert.id)]);
          } else if (payload.type === 'call_responded') {
            setActiveCall(payload.activeCall);
          } else if (payload.type === 'call_resolved' || payload.type === 'call_cancelled') {
            setActiveCall(null);
            if (payload.employees) setEmployees(payload.employees);
          } else if (payload.type === 'employee_status_changed') {
            if (payload.employees) setEmployees(payload.employees);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // SSE unsupported or offline
    }

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // When activeCall appears or changes, sound the alert on the mobile phone!
  useEffect(() => {
    if (activeCall && activeCall.status === 'calling') {
      if (prevCallIdRef.current !== activeCall.id) {
        prevCallIdRef.current = activeCall.id;

        // Play loud sound, vibrate and notify
        if (isAudioEnabled) {
          soundEffects.playEmergencyAlert();
          voice.speak(`¡Atención! Solicitud de asistencia en ${activeCall.aisle}.`);
          soundEffects.showBrowserNotification(
            '🚨 ¡Atención! Asistencia Requerida en Kiosco',
            `${activeCall.reason} en ${activeCall.aisle}`
          );
        }
      }
    } else if (!activeCall) {
      prevCallIdRef.current = null;
    }
  }, [activeCall, isAudioEnabled]);

  // Elapsed timer counter for active call
  useEffect(() => {
    if (activeCall) {
      const calcElapsed = () => {
        const diff = Math.floor((Date.now() - (activeCall.createdAt || Date.now())) / 1000);
        setElapsedSeconds(Math.max(0, diff));
      };
      calcElapsed();
      timerRef.current = setInterval(calcElapsed, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  const handleEnableNotifications = async () => {
    soundEffects.playEmergencyAlert();
    await soundEffects.requestNotificationPermission();
    setIsAudioEnabled(true);
    voice.speak('Notificaciones y sonido activados en tu celular.');
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    const currentEmp = employees.find((e) => e.id === selectedMyEmployeeId);
    soundEffects.playSuccessChime();

    try {
      await kioskSync.respondCall(
        activeCall.id,
        currentEmp?.id || 'emp-01',
        currentEmp?.name || 'Mariana Gómez'
      );
      setActiveCall({
        ...activeCall,
        status: 'in_transit',
        assignedAssociateName: currentEmp?.name || 'Mariana Gómez',
      });
    } catch (e) {
      console.warn('Error accepting call:', e);
    }
  };

  const handleResolveCall = async () => {
    if (!activeCall) return;
    soundEffects.playSuccessChime();

    try {
      await kioskSync.resolveCall(activeCall.id);
      setActiveCall(null);
    } catch (e) {
      console.warn('Error resolving call:', e);
    }
  };

  const handleCancelCall = async () => {
    soundEffects.playSuccessChime();
    try {
      await kioskSync.cancelCall();
      setActiveCall(null);
    } catch (e) {
      console.warn('Error cancelling call:', e);
    }
  };

  const handleUpdateEmployeeStatus = async (
    empId: string,
    newStatus: 'disponible' | 'en_piso' | 'ocupado' | 'descanso'
  ) => {
    soundEffects.playSuccessChime();
    try {
      await kioskSync.updateEmployeeStatus(empId, newStatus);
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? { ...e, status: newStatus } : e))
      );
    } catch (e) {
      console.warn('Status update error:', e);
    }
  };

  const handleTriggerTestAlert = async () => {
    setIsSimulatingAlert(true);
    soundEffects.playSuccessChime();
    try {
      await kioskSync.triggerCall({
        aisle: 'Pasillo 4 - Mueblería Central',
        department: 'Muebles y Salas',
        reason: 'Alerta de prueba enviada desde Panel Móvil',
      });
    } catch (e) {
      console.warn('Test alert error:', e);
    } finally {
      setTimeout(() => setIsSimulatingAlert(false), 600);
    }
  };

  const triggerPresetScenario = async (aisle: string, department: string, reason: string) => {
    setIsSimulationDrawerOpen(false);
    setIsSimulatingAlert(true);
    soundEffects.playSuccessChime();
    try {
      await kioskSync.triggerCall({
        aisle,
        department,
        reason,
        preferredEmployeeId: selectedMyEmployeeId,
      });
    } catch (e) {
      console.warn('Preset alert error:', e);
    } finally {
      setTimeout(() => setIsSimulatingAlert(false), 500);
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined'
      ? window.location.href
      : 'https://ais-dev-nwtb25iieeohszzxoybd5e-425523644258.us-west2.run.app/';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const activeEmployee = employees.find((e) => e.id === selectedMyEmployeeId) || employees[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-start max-w-md mx-auto shadow-2xl border-x-4 border-slate-800 relative selection:bg-amber-400 selection:text-[#002B66]">
      {/* 1. Barra de Estado Móvil Superior (Estilo App Nativa) */}
      <div className="bg-[#001f4d] px-4 py-2 border-b border-blue-900/60 flex items-center justify-between text-[11px] text-blue-200">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-extrabold uppercase tracking-wider text-white">Coppel Staff Móvil</span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800 text-amber-300">
            En Vivo 24/7
          </span>
          {onBackToKiosk ? (
            <button
              onClick={onBackToKiosk}
              className="text-amber-400 hover:text-white font-bold underline"
              title="Volver al Kiosco Tótem"
            >
              Ver Kiosco
            </button>
          ) : (
            <button
              onClick={() => setIsSimulationDrawerOpen(true)}
              className="bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 px-2 py-0.5 rounded border border-amber-400/40 font-bold"
              title="Abrir simulador de llamadas"
            >
              <i className="fa-solid fa-flask text-[9px] mr-1"></i>
              Simulador
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner de Activación de Sonido y Notificaciones Móviles */}
      {!isAudioEnabled ? (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-3 px-4 shadow-md flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center space-x-2.5">
            <i className="fa-solid fa-bell text-lg"></i>
            <div>
              <p className="font-black text-xs">¡Activa el Sonido y Vibración!</p>
              <p className="text-[10px] font-medium leading-tight">
                Necesario para que tu celular suene cuando un cliente toque el botón.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="py-1.5 px-3 bg-[#002B66] text-white rounded-xl text-xs font-black shadow whitespace-nowrap active:scale-95 transition-transform"
          >
            Activar Ahora
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-1.5 flex items-center justify-between text-[10px] text-emerald-300">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-volume-high text-xs"></i>
            <span>Sonido y Alertas Móviles <strong>Activadas</strong></span>
          </span>
          <button
            onClick={() => soundEffects.playEmergencyAlert()}
            className="text-emerald-200 hover:text-white underline font-mono"
            title="Probar sonido de timbre"
          >
            Probar Bocina
          </button>
        </div>
      )}

      {/* 3. Perfil del Empleado Logueado en este Celular */}
      <div className="bg-slate-950 p-3.5 px-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#002B66] font-black text-base flex items-center justify-center shrink-0 shadow">
            {activeEmployee?.initials || 'MG'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs text-white truncate block">
                {activeEmployee?.name || 'Mariana Gómez'}
              </span>
              <span className="text-[9px] bg-emerald-900 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                En Turno
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {activeEmployee?.role}
            </span>
          </div>
        </div>

        {/* Selector de empleado para probar como diferente persona */}
        <select
          value={selectedMyEmployeeId}
          onChange={(e) => setSelectedMyEmployeeId(e.target.value)}
          className="bg-slate-800 text-[10px] text-amber-300 border border-slate-700 rounded-lg px-2 py-1 outline-none font-bold shrink-0"
          title="Cambiar con qué empleado estás simulando este celular"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name.split(' ')[0]} ({e.status})
            </option>
          ))}
        </select>
      </div>

      {/* 4. Selector de Pestañas Principales */}
      <div className="grid grid-cols-3 bg-slate-950 p-1 border-b border-slate-800 text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'alerts'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-bell"></i>
          <span>Alertas</span>
          {activeCall && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'team'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-users"></i>
          <span>Equipo ({employees.filter((e) => e.status === 'disponible').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span>Historial</span>
        </button>
      </div>

      {/* 5. Área de Contenido Principal */}
      <div className="flex-1 overflow-y-auto screen-scroll p-4 space-y-4">
        {/* PESTAÑA 1: ALERTAS EN VIVO */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* ALERTA EN VIVO: SI HAY CLIENTE LLAMANDO */}
            {activeCall ? (
              <div className="bg-gradient-to-b from-red-950/90 to-slate-900 border-2 border-red-500 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ring-4 ring-red-500/20">
                {/* Header Alerta */}
                <div className="flex items-center justify-between border-b border-red-800/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-black text-xs text-red-400 uppercase tracking-widest">
                      {activeCall.status === 'calling'
                        ? '🚨 ¡Cliente Solicita Asesor!'
                        : '🏃‍♂️ En Camino a Atender'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-full border border-amber-400/30">
                    ⏱ Hace {elapsedSeconds}s
                  </span>
                </div>

                {/* Detalles de Ubicación y Motivo */}
                <div className="space-y-2">
                  <div className="bg-black/40 p-3 rounded-2xl border border-red-900/50">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">
                      Ubicación en Tienda:
                    </span>
                    <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                      <i className="fa-solid fa-location-dot text-amber-400"></i>
                      {activeCall.aisle}
                    </span>
                    <span className="text-[11px] text-blue-300 block mt-0.5">
                      Departamento: {activeCall.storeDepartment}
                    </span>
                  </div>

                  <div className="bg-black/40 p-3 rounded-2xl border border-red-900/50">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">
                      Motivo / Consulta del Cliente:
                    </span>
                    <span className="text-xs font-extrabold text-amber-300 block mt-0.5">
                      "{activeCall.reason}"
                    </span>
                  </div>

                  {activeCall.assignedAssociateName && (
                    <div className="bg-blue-950/50 p-2.5 rounded-xl border border-blue-800 text-xs text-blue-200 flex items-center justify-between">
                      <span>Asignado a: <strong>{activeCall.assignedAssociateName}</strong></span>
                      <span className="text-[10px] text-amber-300 font-mono">
                        {activeCall.status === 'in_transit' ? '● En camino' : '● Por confirmar'}
                      </span>
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN PARA EL EMPLEADO EN SU CELULAR */}
                <div className="space-y-2 pt-1">
                  {activeCall.status === 'calling' ? (
                    <button
                      onClick={handleAcceptCall}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition-transform"
                    >
                      <i className="fa-solid fa-person-running text-lg"></i>
                      <span>Aceptar y Voy en Camino</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResolveCall}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition-transform"
                    >
                      <i className="fa-solid fa-circle-check text-lg"></i>
                      <span>Marcar como Atendido / Resuelto</span>
                    </button>
                  )}

                  <div className="flex gap-2">
                    {activeCall.status === 'in_transit' && (
                      <button
                        onClick={handleAcceptCall}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                      >
                        Reasignar a mí
                      </button>
                    )}
                    <button
                      onClick={handleCancelCall}
                      className="flex-1 py-2 px-3 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-xl border border-red-800/50"
                    >
                      Descartar Alerta
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ESTADO TRANQUILO SIN ALERTAS PENDIENTES */
              <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Sin llamadas pendientes</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Tu celular está conectado en tiempo real. Cuando un cliente toque el botón de asistencia en el tótem, sonará una alarma aquí.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTriggerTestAlert}
                    disabled={isSimulatingAlert}
                    className="py-2.5 px-4 bg-blue-900/60 hover:bg-blue-800 text-amber-300 border border-blue-700 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 mx-auto shadow-sm active:scale-95 transition-transform"
                  >
                    <i className="fa-solid fa-flask-vial"></i>
                    <span>{isSimulatingAlert ? 'Generando...' : 'Simular Alerta de Prueba'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tarjeta Informativa: Cómo probar con 2 dispositivos */}
            <div className="bg-blue-950/40 border border-blue-900/60 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-extrabold">
                <i className="fa-solid fa-circle-nodes"></i>
                <span>Sincronización Multidispositivo Activa</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Abre el Tótem en tu computadora o tablet, y mantén esta pantalla abierta en tu celular. Presiona el botón físico o pide un asesor para ver cómo se comunican de inmediato.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={handleCopyLink}
                  className="text-amber-400 hover:text-white font-mono text-[10px] underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-link"></i>
                  <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar enlace de esta app'}</span>
                </button>
                <button
                  onClick={onBackToKiosk}
                  className="text-xs font-bold text-blue-300 hover:text-white"
                >
                  Ver Pantalla Tótem →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: GESTIÓN DE EQUIPO Y DISPONIBILIDAD */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Estado de Empleados en Tienda
                </h3>
                <p className="text-[10px] text-slate-400">
                  Los cambios que hagas aquí se reflejan de inmediato en el Tótem Kiosco.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-300 font-black text-sm flex items-center justify-center border border-slate-700">
                        {emp.initials}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-white">
                            {emp.name}
                          </span>
                          {emp.id === selectedMyEmployeeId && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 rounded">
                              TÚ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {emp.role}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          ★ {emp.rating} · {emp.totalHelpedToday} clientes atendidos hoy
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        emp.status === 'disponible'
                          ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                          : emp.status === 'en_piso'
                          ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                          : emp.status === 'ocupado'
                          ? 'bg-red-900/80 text-red-300 border border-red-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {emp.status === 'disponible'
                        ? '● Libre'
                        : emp.status === 'en_piso'
                        ? '○ En Piso'
                        : emp.status === 'ocupado'
                        ? '✕ Ocupado'
                        : '☕ Descanso'}
                    </span>
                  </div>

                  {/* Selector rápido de estado para este empleado */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'disponible')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        emp.status === 'disponible'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Disponible
                    </button>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'en_piso')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        emp.status === 'en_piso'
                          ? 'bg-amber-600 text-white font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      En Piso
                    </button>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'ocupado')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        emp.status === 'ocupado'
                          ? 'bg-red-600 text-white font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Ocupado
                    </button>
                    <button
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'descanso')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        emp.status === 'descanso'
                          ? 'bg-slate-700 text-white font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Descanso
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: HISTORIAL DE ATENCIONES */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Historial de Solicitudes Recientes
            </h3>

            {alertsHistory.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-2xl text-center text-xs text-slate-500">
                Aún no hay registros de llamadas hoy.
              </div>
            ) : (
              <div className="space-y-2">
                {alertsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-[11px]">
                        {item.aisle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {item.reason}
                    </p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900">
                      <span className="text-amber-300">
                        Atendió: {item.assignedAssociateName || 'Personal'}
                      </span>
                      <span
                        className={`font-bold ${
                          item.status === 'resolved'
                            ? 'text-emerald-400'
                            : item.status === 'cancelled'
                            ? 'text-slate-500'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.status === 'resolved'
                          ? '✓ Completado'
                          : item.status === 'cancelled'
                          ? '✕ Cancelado'
                          : '● En proceso'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Barra Inferior Fija para Pruebas y Operación */}
      <div className="bg-slate-950 p-3 px-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={() => setIsSimulationDrawerOpen(true)}
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow active:scale-95"
        >
          <i className="fa-solid fa-bolt text-xs"></i>
          <span>Simular Llamada de Cliente</span>
        </button>

        {onBackToKiosk ? (
          <button
            onClick={onBackToKiosk}
            className="py-2.5 px-3 bg-blue-900/80 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center space-x-1"
          >
            <i className="fa-solid fa-store"></i>
            <span>Tótem</span>
          </button>
        ) : (
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center space-x-1"
            title="Copiar enlace de esta app"
          >
            <i className="fa-solid fa-share-nodes"></i>
            <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
          </button>
        )}
      </div>

      {/* Modal / Drawer de Simulación de Escenarios de Clientes en Tienda */}
      {isSimulationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t sm:border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto screen-scroll">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Simular Llamada de Piso</h3>
                  <p className="text-[10px] text-slate-400">Prueba cómo responde la app ante diferentes clientes</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulationDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() =>
                  triggerPresetScenario(
                    'Pasillo 4 - Mueblería Central',
                    'Muebles & Salas',
                    'Cliente solicita cotización de sala reclinable y dudas sobre flete'
                  )
                }
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 transition-all flex items-start space-x-3 group active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 text-base group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  <i className="fa-solid fa-couch"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-white">Muebles & Salas</span>
                    <span className="text-[10px] text-amber-400 font-mono">Pasillo 4</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    "Cliente solicita cotización de sala reclinable y dudas sobre flete"
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  triggerPresetScenario(
                    'Pasillo 1A - Telefonía & Accesorios',
                    'Electrónica & Celulares',
                    'Cliente pide ver Samsung Galaxy A55 y verificar crédito Coppel disponible'
                  )
                }
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 transition-all flex items-start space-x-3 group active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 text-base group-hover:bg-blue-400 group-hover:text-slate-950 transition-colors">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-white">Telefonía Celular</span>
                    <span className="text-[10px] text-blue-400 font-mono">Pasillo 1A</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    "Cliente pide ver Samsung Galaxy A55 y verificar crédito Coppel"
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  triggerPresetScenario(
                    'Pasillo 2B - Audio & Video High-End',
                    'Electrónica',
                    'Cliente en pantallas 4K duda entre Smart TV OLED LG o QLED Samsung'
                  )
                }
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 transition-all flex items-start space-x-3 group active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 text-base group-hover:bg-purple-400 group-hover:text-slate-950 transition-colors">
                  <i className="fa-solid fa-tv"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-white">Pantallas & Video</span>
                    <span className="text-[10px] text-purple-400 font-mono">Pasillo 2B</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    "Cliente duda entre Smart TV OLED LG o QLED Samsung"
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  triggerPresetScenario(
                    'Pasillo 5A - Línea Blanca & Cocina',
                    'Línea Blanca',
                    'Cliente busca refrigerador Mabe Inverter y consulta garantía extendida'
                  )
                }
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 transition-all flex items-start space-x-3 group active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 text-base group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                  <i className="fa-solid fa-snowflake"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-white">Línea Blanca</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Pasillo 5A</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    "Cliente busca refrigerador Mabe Inverter y consulta garantía"
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  triggerPresetScenario(
                    'Pasillo Central Tótem Kiosco',
                    'Atención Inmediata',
                    'Pulsación detectada en Botón Físico Arcade PUSH TO SPEAK'
                  )
                }
                className="w-full text-left p-3 rounded-2xl bg-red-950/60 hover:bg-red-900/60 border border-red-800 hover:border-red-500 transition-all flex items-start space-x-3 group active:scale-98"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 text-base group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <i className="fa-solid fa-bullhorn"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-red-200">Botón Físico Tótem</span>
                    <span className="text-[10px] text-red-400 font-mono">Hardware USB</span>
                  </div>
                  <p className="text-[11px] text-red-300 truncate mt-0.5">
                    "Pulsación de botón de pánico / asistencia en mueble físico"
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
