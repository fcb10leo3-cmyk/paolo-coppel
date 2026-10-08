import React, { useState, useEffect, useRef } from 'react';
import { Employee, AssistanceAlert, ResolutionOutcome } from '../types';
import { staffSync, INITIAL_EMPLOYEES } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';
import { ResolutionOutcomeModal } from './ResolutionOutcomeModal';
import { AdminGamificationLeaderboard } from './AdminGamificationLeaderboard';
import { getLevelProgress } from '../services/gamification';

interface AdminDashboardViewProps {
  onSwitchToStaffRole?: () => void;
  onOpenShareModal?: (tab?: 'staff' | 'admin' | 'kiosk_api' | 'deploy') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onSwitchToStaffRole,
  onOpenShareModal,
}) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [alertsHistory, setAlertsHistory] = useState<AssistanceAlert[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const list = staffSync.getState()?.employees;
    return list && list.length > 0 ? list : INITIAL_EMPLOYEES;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'live' | 'gamification' | 'team' | 'history'>('live');
  const [isSimulatingCall, setIsSimulatingCall] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const prevCallIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronización en tiempo real
  useEffect(() => {
    const unsubscribe = staffSync.subscribe((state) => {
      setActiveCall(state.activeCall);
      setAlertsHistory(state.history);
      setEmployees(state.employees);
    });

    staffSync.fetchAlerts();
    const interval = setInterval(() => staffSync.fetchAlerts(), 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Sonido de alerta cuando entra una llamada
  useEffect(() => {
    if (activeCall && activeCall.status === 'calling') {
      if (prevCallIdRef.current !== activeCall.id) {
        prevCallIdRef.current = activeCall.id;
        if (isAudioEnabled) {
          soundEffects.playEmergencyAlert();
          voice.speak(`¡Atención Supervisor! Nueva solicitud de cliente en ${activeCall.aisle}.`);
          soundEffects.showBrowserNotification(
            '🚨 Alerta en Piso de Venta',
            `${activeCall.reason} en ${activeCall.aisle}`
          );
        }
      }
    } else if (!activeCall) {
      prevCallIdRef.current = null;
    }
  }, [activeCall, isAudioEnabled]);

  // Cronómetro de llamada activa
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

  const handleEnableAudio = async () => {
    soundEffects.playEmergencyAlert();
    await soundEffects.requestNotificationPermission();
    setIsAudioEnabled(true);
    voice.speak('Sirena y audio del supervisor activados.');
  };

  // ADMINISTRADOR TOMA LA ALERTA DIRECTAMENTE
  const handleAdminTakeCall = async () => {
    if (!activeCall) return;
    soundEffects.playSuccessChime();
    await staffSync.takeCallDirectly(activeCall.id, 'Supervisor de Piso (TÚ)');
    voice.speak('Has tomado la alerta. En camino a atender al cliente.');
  };

  // ADMINISTRADOR ASIGNA / REDIRIGE A UN ASESOR
  const handleAssignToEmployee = async (empId: string) => {
    if (!activeCall) return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    soundEffects.playSuccessChime();
    await staffSync.assignCall(activeCall.id, empId);
    setIsAssignModalOpen(false);
    voice.speak(`Alerta asignada a ${emp.name}.`);
  };

  // ABRIR INSPECCIÓN Y RESOLUCIÓN
  const handleOpenResolveModal = () => {
    if (!activeCall) return;
    setIsOutcomeModalOpen(true);
  };

  // CONFIRMAR RESULTADO DE LA INSPECCIÓN (SÍ SE PUDO RESOLVER / NO SE PUDO RESOLVER)
  const handleConfirmOutcome = async (outcome: ResolutionOutcome, notes: string) => {
    if (!activeCall) return;
    soundEffects.playSuccessChime();
    const alertId = activeCall.id;
    await staffSync.resolveCall(alertId, outcome, notes);
    setIsOutcomeModalOpen(false);

    if (outcome === 'resuelto_exitoso') {
      voice.speak('Atención registrada como resuelta exitosamente.');
    } else {
      voice.speak('Atención registrada como no resuelta para seguimiento.');
    }
  };

  // CANCELAR / DESCARTAR
  const handleCancelCall = async () => {
    soundEffects.playSuccessChime();
    await staffSync.cancelCall();
  };

  // CAMBIAR ESTATUS DE ASESOR DESDE EL TABLERO
  const handleUpdateEmpStatus = async (empId: string, status: Employee['status']) => {
    soundEffects.playSuccessChime();
    await staffSync.updateEmployeeStatus(empId, status);
  };

  // SIMULAR SOLICITUD DE CLIENTE EN PISO
  const handleSimulateClientCall = async (aisle: string, dept: string, reason: string) => {
    setIsSimulatingCall(true);
    soundEffects.playEmergencyAlert();
    await staffSync.triggerCall({ aisle, department: dept, reason });
    setTimeout(() => setIsSimulatingCall(false), 500);
  };

  const handleCopyStaffLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/?role=staff`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const availableEmployees = employees.filter((e) => e.status === 'disponible');
  const enPisoEmployees = employees.filter((e) => e.status === 'en_piso');
  const busyEmployees = employees.filter((e) => e.status === 'ocupado');

  const totalStorePoints = employees.reduce((acc, curr) => acc + (curr.points || 0), 0);
  const sortedByPoints = [...employees].sort((a, b) => (b.points || 0) - (a.points || 0));
  const topAdvisor = sortedByPoints[0];

  const handleAwardBonus = async (empId: string, points: number, reason: string) => {
    await staffSync.awardBonusPoints(empId, points, reason);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 select-none">
      {/* 1. HEADER DE SUPERVISIÓN COPPEL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-[#002B66] flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Centro de Despacho & Supervisión de Tienda
              </h1>
              <span className="text-[10px] bg-blue-950 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-800">
                Coppel Flagship
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoreo en tiempo real de pasillos, asignación de asesores y control de tiempos de atención.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas del Supervisor */}
        <div className="flex flex-wrap items-center gap-2">
          {!isAudioEnabled ? (
            <button
              onClick={handleEnableAudio}
              className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow flex items-center space-x-1.5 animate-pulse transition-colors"
            >
              <i className="fa-solid fa-bell"></i>
              <span>Activar Sirena</span>
            </button>
          ) : (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Sirena Activa</span>
            </div>
          )}

          <button
            onClick={() => onOpenShareModal?.('staff')}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow active:scale-95"
            title="Ver código QR y enlace para compartir con asesores en sus celulares"
          >
            <i className="fa-solid fa-qrcode text-amber-400"></i>
            <span>QR App Celulares</span>
          </button>

          <button
            onClick={() => onOpenShareModal?.('kiosk_api')}
            className="py-2 px-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 text-white border border-blue-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow active:scale-95"
            title="Conectar Kiosco Tótem externo con API y código de integración"
          >
            <i className="fa-solid fa-plug-circle-bolt text-amber-400"></i>
            <span>Conectar Kiosco Externo</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES DE RENDIMIENTO (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Asesores Disponibles
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {availableEmployees.length}
            </span>
            <span className="text-xs text-slate-500 font-bold">de {employees.length}</span>
          </div>
          <span className="text-[10px] text-emerald-500/80 font-medium mt-0.5 block">
            ● {enPisoEmployees.length} en piso · {busyEmployees.length} ocupados
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Estado de Solicitudes
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl sm:text-3xl font-black ${activeCall ? 'text-amber-400' : 'text-slate-200'}`}>
              {activeCall ? '1 Activa' : '0 Pendientes'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            {activeCall ? `Esperando en ${activeCall.aisle.split('-')[0]}` : 'Piso de venta al 100%'}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('gamification')}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">
              Puntos de Asesores
            </span>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-400/30">
              🏆 Gamificación
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-amber-300 transition-colors">
              {totalStorePoints.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-bold">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
            Top #1: <strong className="text-amber-300">{topAdvisor?.name.split(' ')[0]}</strong> ({topAdvisor?.points.toLocaleString()} pts)
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Atenciones Resueltas
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {alertsHistory.filter((a) => a.status === 'resolved').length + 75}
            </span>
            <span className="text-xs text-emerald-400 font-bold">98.2% éxito</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            SLA: 24s promedio · ★ 4.9/5
          </span>
        </div>
      </div>

      {/* 2.1 SELECTOR DE VISTAS DEL ADMINISTRADOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-1.5 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg ring-2 ring-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <i className="fa-solid fa-satellite-dish text-amber-400"></i>
          <span>Despacho en Vivo</span>
          {activeCall && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gamification')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'gamification'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg ring-2 ring-amber-400/40 font-black'
              : 'text-amber-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <i className="fa-solid fa-trophy"></i>
          <span>Puntos & Gamificación</span>
          <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {totalStorePoints.toLocaleString()} pts
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg ring-2 ring-slate-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <i className="fa-solid fa-users text-amber-400"></i>
          <span>Equipo en Piso</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg ring-2 ring-slate-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
          <span>Historial ({alertsHistory.length})</span>
        </button>
      </div>

      {/* Banner de alerta entrante si el supervisor está en otra pestaña */}
      {activeCall && activeTab !== 'live' && (
        <div
          onClick={() => setActiveTab('live')}
          className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-500 text-white p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-2xl cursor-pointer hover:border-red-400 transition-all animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
            <div>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider block text-white flex items-center gap-1.5">
                <i className="fa-solid fa-bell text-amber-400"></i>
                <span>Solicitud Activa en {activeCall.aisle}</span>
              </span>
              <p className="text-xs text-red-200 mt-0.5 font-bold">"{activeCall.reason}"</p>
            </div>
          </div>
          <span className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow shrink-0">
            Atender Ahora ➜
          </span>
        </div>
      )}

      {/* PESTAÑA A: TABLERO DE PUNTOS Y GAMIFICACIÓN */}
      {activeTab === 'gamification' && (
        <AdminGamificationLeaderboard
          employees={employees}
          onAwardBonus={handleAwardBonus}
        />
      )}

      {/* PESTAÑA B: DESPACHO EN VIVO */}
      {activeTab === 'live' && (
        <>
          {/* 3. ALERTA ACTIVA EN TIEMPO REAL (ZONA CRÍTICA DE DESPACHO) */}
          <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <i className="fa-solid fa-satellite-dish text-amber-400"></i>
            <span>Solicitud de Asistencia en Pasillos</span>
          </h2>

          {/* Generador rápido de alertas para pruebas del administrador */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Simular llamada de cliente:</span>
            <button
              onClick={() =>
                handleSimulateClientCall(
                  'Pasillo 4 - Mueblería Central',
                  'Muebles & Salas',
                  'Cliente solicita cotización de sala seccional y dudas sobre flete'
                )
              }
              disabled={isSimulatingCall}
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-slate-700 flex items-center space-x-1"
            >
              <i className="fa-solid fa-couch"></i>
              <span>Pasillo 4</span>
            </button>
            <button
              onClick={() =>
                handleSimulateClientCall(
                  'Pasillo 1A - Telefonía & Accesorios',
                  'Electrónica & Celulares',
                  'Cliente pide ver Samsung Galaxy A55 y verificar crédito Coppel'
                )
              }
              disabled={isSimulatingCall}
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-[11px] font-bold border border-slate-700 flex items-center space-x-1"
            >
              <i className="fa-solid fa-mobile-screen"></i>
              <span>Pasillo 1A</span>
            </button>
          </div>
        </div>

        {activeCall ? (
          <div className={`rounded-3xl p-5 sm:p-6 shadow-2xl border-2 transition-all space-y-4 ${
            activeCall.status === 'calling'
              ? 'bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 border-red-500 ring-4 ring-red-500/20'
              : 'bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-900 border-blue-500'
          }`}>
            {/* Header de la Alerta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className={`w-3.5 h-3.5 rounded-full ${activeCall.status === 'calling' ? 'bg-red-500 animate-ping' : 'bg-blue-400 animate-pulse'}`}></span>
                <span className="font-black text-sm sm:text-base text-white uppercase tracking-wider">
                  {activeCall.status === 'calling' ? '🚨 Solicitud Entrante sin Atender' : '🏃‍♂️ Asesor en Camino a Atender'}
                </span>
                <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  ⏱ Esperando hace {elapsedSeconds}s
                </span>
              </div>

              {/* Estado de asignación actual */}
              <div>
                {activeCall.assignedAssociateName ? (
                  <span className="text-xs text-blue-200 bg-blue-950 px-3 py-1 rounded-xl border border-blue-800 font-bold flex items-center gap-1.5">
                    <i className="fa-solid fa-user-check text-amber-400"></i>
                    <span>Asignado a: <strong>{activeCall.assignedAssociateName}</strong></span>
                  </span>
                ) : (
                  <span className="text-xs text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-800 font-bold flex items-center gap-1.5 animate-pulse">
                    <i className="fa-solid fa-circle-exclamation text-amber-400"></i>
                    <span>¡Sin asesor asignado! Toma la llamada o reasigna</span>
                  </span>
                )}
              </div>
            </div>

            {/* Aviso especial: Si un colaborador rechazó la alerta */}
            {activeCall.lastRejectionReason && (
              <div className="bg-amber-950/90 border-2 border-amber-500 text-amber-200 p-3.5 rounded-2xl flex items-start space-x-3 text-xs animate-in slide-in-from-top-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 text-base mt-0.5 shrink-0"></i>
                <div className="flex-1">
                  <p className="font-black text-white">
                    ⚠️ {activeCall.lastRejectedByName || 'Un asesor'} rechazó esta llamada
                  </p>
                  <p className="text-amber-300 mt-0.5">
                    Motivo indicado: <em>"{activeCall.lastRejectionReason}"</em>
                  </p>
                  <p className="text-[11px] text-amber-400/90 font-medium mt-1">
                    Acción requerida: Redirige a otro asesor disponible o toma la llamada tú mismo para cumplir con el SLA.
                  </p>
                </div>
              </div>
            )}

            {/* Detalles del Cliente y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">
                  Ubicación en Piso de Venta:
                </span>
                <p className="text-base font-black text-white flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-amber-400"></i>
                  {activeCall.aisle}
                </p>
                <span className="text-xs text-blue-300 block">
                  Departamento: <strong>{activeCall.storeDepartment}</strong>
                </span>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">
                  Motivo de la Solicitud / Duda:
                </span>
                <p className="text-sm font-extrabold text-amber-300 leading-snug">
                  "{activeCall.reason}"
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Hora de llamada: {activeCall.timestamp}
                </span>
              </div>
            </div>

            {/* BOTONES DE CONTROL DEL ADMINISTRADOR */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2.5">
              {/* BOTÓN 1: TOMAR LA ALERTA DIRECTAMENTE */}
              <button
                onClick={handleAdminTakeCall}
                className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center space-x-2 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-hand-holding-hand text-base"></i>
                <span>Tomar Yo la Alerta</span>
              </button>

              {/* BOTÓN 2: ASIGNAR / REDIRIGIR A ASESOR */}
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-[#002B66] hover:from-blue-500 hover:to-blue-900 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center space-x-2 border border-blue-400/40 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-share-nodes text-base text-amber-400"></i>
                <span>Asignar / Redirigir</span>
              </button>

              {/* BOTONES DE RESOLUCIÓN CON INSPECCIÓN (¿SE PUDO RESOLVER O NO?) */}
              <div className="flex items-center space-x-1.5 ml-auto">
                <button
                  onClick={() => handleConfirmOutcome('resuelto_exitoso', '🛒 Venta concretada con éxito')}
                  className="py-2.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
                  title="Marcar con 1 clic: Sí se pudo resolver"
                >
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>Sí se resolvió</span>
                </button>

                <button
                  onClick={() => handleConfirmOutcome('no_resuelto', '🚫 Sin inventario / No resuelto')}
                  className="py-2.5 px-3 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
                  title="Marcar con 1 clic: No se pudo resolver"
                >
                  <i className="fa-solid fa-circle-xmark text-red-400"></i>
                  <span>No se resolvió</span>
                </button>

                <button
                  onClick={handleOpenResolveModal}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                  title="Abrir formulario detallado con opciones de inspección"
                >
                  <i className="fa-solid fa-clipboard-check"></i>
                  <span className="hidden sm:inline">Inspeccionar</span>
                </button>

                {/* BOTÓN DESCARTAR */}
                <button
                  onClick={handleCancelCall}
                  className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900 text-red-300 font-bold rounded-xl text-xs border border-red-900/60 transition-colors"
                  title="Descartar llamada"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center text-2xl mx-auto shadow-inner">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="font-extrabold text-sm text-white">Sin llamadas pendientes en pasillos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Todo el piso de venta está despejado. Si un cliente solicita apoyo en cualquier pasillo, la alerta aparecerá inmediatamente aquí para asignarla o tomarla.
            </p>
          </div>
        )}
      </div>

      {/* 4. MODAL DE ASIGNACIÓN RÁPIDA DE ASESORES CON 1 CLIC */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <i className="fa-solid fa-user-plus"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Asignar Alerta a Colaborador
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selecciona al asesor más cercano o disponible para atender de inmediato
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto screen-scroll">
              {employees.map((emp) => {
                const wasRejected = activeCall?.rejectedBy?.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      wasRejected
                        ? 'bg-red-950/30 border-red-900/60 opacity-70'
                        : emp.status === 'disponible'
                        ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 hover:border-amber-400/50'
                        : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-300 font-black text-sm flex items-center justify-center border border-slate-700 shrink-0">
                        {emp.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-white truncate">{emp.name}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              emp.status === 'disponible'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : emp.status === 'en_piso'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : emp.status === 'ocupado'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate block">{emp.role}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          📍 {emp.currentAisle} · ★ {emp.rating}
                        </span>
                        {wasRejected && (
                          <span className="text-[10px] text-red-400 font-bold block mt-0.5">
                            ⚠️ Rechazó la llamada anteriormente
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAssignToEmployee(emp.id)}
                      className="py-2 px-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow active:scale-95 shrink-0"
                    >
                      Asignar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </>
    )}

      {/* 5. TABLERO DE EQUIPO Y GESTIÓN EN PISO */}
      {(activeTab === 'team' || activeTab === 'live') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <i className="fa-solid fa-users text-amber-400"></i>
                <span>Estado del Equipo en Piso & Puntos</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cambia la disponibilidad con 1 clic y monitorea los puntos de cada colaborador
              </p>
            </div>
            <button
              onClick={() => setActiveTab('gamification')}
              className="self-start sm:self-auto py-1 px-3 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/30 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-trophy"></i>
              <span>Ver Ranking Completo ➜</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => {
              const progress = getLevelProgress(emp.points || 0);

              return (
                <div
                  key={emp.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-300 font-black text-sm flex items-center justify-center border border-slate-700 shrink-0">
                        {emp.initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white leading-tight truncate">{emp.name}</h4>
                        <span className="text-[10px] text-slate-400 block truncate">{emp.department}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          ★ {emp.rating} · {emp.totalHelpedToday} atendidos hoy
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        emp.status === 'disponible'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : emp.status === 'en_piso'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : emp.status === 'ocupado'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Resumen de Gamificación del Asesor */}
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-amber-300 font-mono">
                        🏆 {(emp.points || 0).toLocaleString()} PTS
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {emp.levelTitle}
                      </span>
                      <span className="text-[10px] text-orange-400 font-bold flex items-center gap-0.5">
                        <i className="fa-solid fa-fire text-[9px]"></i>
                        {emp.streak || 0}
                      </span>
                    </div>

                    {/* Mini barra de progreso */}
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                        style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Botones de cambio de estado rápido y bono */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-900">
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                      <button
                        onClick={() => handleUpdateEmpStatus(emp.id, 'disponible')}
                        className={`py-1 rounded-lg transition-colors ${
                          emp.status === 'disponible'
                            ? 'bg-emerald-600 text-white font-black'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                        }`}
                      >
                        Libre
                      </button>
                      <button
                        onClick={() => handleUpdateEmpStatus(emp.id, 'en_piso')}
                        className={`py-1 rounded-lg transition-colors ${
                          emp.status === 'en_piso'
                            ? 'bg-amber-600 text-white font-black'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                        }`}
                      >
                        En Piso
                      </button>
                      <button
                        onClick={() => handleUpdateEmpStatus(emp.id, 'ocupado')}
                        className={`py-1 rounded-lg transition-colors ${
                          emp.status === 'ocupado'
                            ? 'bg-red-600 text-white font-black'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                        }`}
                      >
                        Ocupado
                      </button>
                      <button
                        onClick={() => handleUpdateEmpStatus(emp.id, 'descanso')}
                        className={`py-1 rounded-lg transition-colors ${
                          emp.status === 'descanso'
                            ? 'bg-slate-700 text-white font-black'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                        }`}
                      >
                        Descanso
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-slate-500 font-mono">Bono Rápido:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleAwardBonus(emp.id, 50, 'Reconocimiento en piso')}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-bold rounded-lg border border-slate-800 transition-colors"
                        >
                          +50 pts
                        </button>
                        <button
                          onClick={() => handleAwardBonus(emp.id, 100, 'Reconocimiento destacado')}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-bold rounded-lg border border-slate-800 transition-colors"
                        >
                          +100 pts
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. HISTORIAL DE ATENCIONES DE LA SUCURSAL */}
      {(activeTab === 'history' || activeTab === 'live') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
            <span>Registro de Solicitudes Atendidas Hoy</span>
          </h3>

          {alertsHistory.length === 0 ? (
            <div className="bg-slate-950 p-6 rounded-2xl text-center text-xs text-slate-500">
              Aún no hay llamadas registradas en esta jornada.
            </div>
          ) : (
            <div className="space-y-2">
              {alertsHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-xs">{item.aisle}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({item.timestamp})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{item.reason}</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[11px] text-amber-300">
                      Atendió: <strong>{item.assignedAssociateName || 'Supervisor'}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        item.status === 'resolved'
                          ? item.outcome === 'no_resuelto'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : item.status === 'cancelled'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {item.status === 'resolved' ? (
                        item.outcome === 'no_resuelto' ? (
                          <>
                            <i className="fa-solid fa-circle-xmark"></i>
                            <span>No Resuelto</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-circle-check"></i>
                            <span>Resuelto Exitoso</span>
                          </>
                        )
                      ) : item.status === 'cancelled' ? (
                        '✕ Descartado'
                      ) : (
                        '● Activo'
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE INSPECCIÓN Y RESOLUCIÓN (SÍ SE PUDO RESOLVER / NO SE PUDO RESOLVER) */}
      <ResolutionOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        alert={activeCall}
        onConfirmOutcome={handleConfirmOutcome}
        roleTitle="Supervisor de Tienda"
      />
    </div>
  );
};
