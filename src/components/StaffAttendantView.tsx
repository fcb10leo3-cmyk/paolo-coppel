import React, { useState, useEffect, useRef } from 'react';
import { Employee, AssistanceAlert, ResolutionOutcome } from '../types';
import { staffSync, INITIAL_EMPLOYEES } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';
import { ResolutionOutcomeModal } from './ResolutionOutcomeModal';
import { AdvisorGamificationRoad } from './AdvisorGamificationRoad';
import { PointsCelebrationModal } from './PointsCelebrationModal';
import { calculatePointsForAssistance } from '../services/gamification';

interface StaffAttendantViewProps {
  onSwitchToAdminRole?: () => void;
  onOpenShareModal?: (tab?: 'staff' | 'admin' | 'kiosk_api' | 'deploy') => void;
}

export const StaffAttendantView: React.FC<StaffAttendantViewProps> = ({
  onSwitchToAdminRole,
  onOpenShareModal,
}) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const list = staffSync.getState()?.employees;
    return list && list.length > 0 ? list : INITIAL_EMPLOYEES;
  });
  const [alertsHistory, setAlertsHistory] = useState<AssistanceAlert[]>([]);
  const [selectedMyId, setSelectedMyId] = useState<string>('emp-01'); // Mariana Gómez por defecto
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Atendiendo a otro cliente en este momento');
  const [justRejectedNotice, setJustRejectedNotice] = useState<boolean>(false);
  const [advisorTab, setAdvisorTab] = useState<'dispatch' | 'road'>('dispatch');
  const [isRoadModalOpen, setIsRoadModalOpen] = useState<boolean>(false);
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    points: number;
    outcome: ResolutionOutcome;
    breakdown: string[];
  }>({
    isOpen: false,
    points: 100,
    outcome: 'resuelto_exitoso',
    breakdown: [],
  });

  const prevCallIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronización en tiempo real
  useEffect(() => {
    const unsubscribe = staffSync.subscribe((state) => {
      setActiveCall(state.activeCall);
      setEmployees(state.employees);
      setAlertsHistory(state.history);
    });

    staffSync.fetchAlerts();
    const interval = setInterval(() => staffSync.fetchAlerts(), 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const myEmployee = employees.find((e) => e.id === selectedMyId) || employees[0] || INITIAL_EMPLOYEES[0];

  // Evaluar si la llamada activa aplica a este asesor:
  // Es relevante si está sin asignar, asignada a él, o si no la ha rechazado ya
  const isAssignedToMe = activeCall?.assignedAssociateId === myEmployee?.id;
  const haveIRejected = activeCall?.rejectedBy?.includes(myEmployee?.id || '');
  const isRelevantCall = activeCall && !haveIRejected;

  // Alerta sonora cuando le llega llamada
  useEffect(() => {
    if (activeCall && activeCall.status === 'calling' && !haveIRejected) {
      if (prevCallIdRef.current !== activeCall.id) {
        prevCallIdRef.current = activeCall.id;
        if (isAudioEnabled) {
          soundEffects.playEmergencyAlert();
          voice.speak(`¡Atención ${myEmployee?.name.split(' ')[0]}! Solicitud de asistencia en ${activeCall.aisle}.`);
          soundEffects.showBrowserNotification(
            '🚨 Asistencia Solicitada en Pasillo',
            `${activeCall.reason} en ${activeCall.aisle}`
          );
        }
      }
    } else if (!activeCall) {
      prevCallIdRef.current = null;
    }
  }, [activeCall, isAudioEnabled, haveIRejected, myEmployee]);

  // Cronómetro
  useEffect(() => {
    if (activeCall && !haveIRejected) {
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
  }, [activeCall, haveIRejected]);

  const handleEnableAudio = async () => {
    soundEffects.playEmergencyAlert();
    await soundEffects.requestNotificationPermission();
    setIsAudioEnabled(true);
    voice.speak('Sirena y notificaciones de asesor activadas.');
  };

  // 1. ACCIÓN: ACEPTAR Y VOY EN CAMINO
  const handleAcceptCall = async () => {
    if (!activeCall) return;
    soundEffects.playSuccessChime();
    await staffSync.acceptCall(activeCall.id, myEmployee.id, myEmployee.name);
    voice.speak('Llamada aceptada. Voy en camino.');
  };

  // 2. ACCIÓN: RECHAZAR PORQUE ESTOY CON OTRO CLIENTE
  const handleConfirmReject = async () => {
    if (!activeCall) return;
    soundEffects.playSuccessChime();
    await staffSync.rejectCall(activeCall.id, myEmployee.id, rejectReason);
    setIsRejectModalOpen(false);
    setJustRejectedNotice(true);
    voice.speak('Llamada rechazada. Notificando al supervisor para reasignación.');
    setTimeout(() => setJustRejectedNotice(false), 5000);
  };

  // 3. ACCIÓN: CONFIRMAR RESULTADO DE LA INSPECCIÓN (SÍ SE PUDO RESOLVER / NO SE PUDO RESOLVER)
  const handleConfirmOutcome = async (outcome: ResolutionOutcome, notes: string) => {
    if (!activeCall) return;
    const alertId = activeCall.id;

    // Calcular puntos ganados y bonos
    const pointsCalc = calculatePointsForAssistance({
      outcome,
      elapsedSeconds,
      currentStreak: myEmployee?.streak || 0,
    });

    if (outcome === 'resuelto_exitoso') {
      soundEffects.playPointsFanfare();
      voice.speak(`¡Excelente trabajo ${myEmployee?.name.split(' ')[0]}! Has ganado ${pointsCalc.totalPoints} puntos.`);
    } else {
      soundEffects.playSuccessChime();
      voice.speak('Atención registrada como no resuelta. Supervisor notificado.');
    }

    setCelebrationData({
      isOpen: true,
      points: pointsCalc.totalPoints,
      outcome,
      breakdown: pointsCalc.reasons,
    });

    await staffSync.resolveCall(alertId, outcome, notes);
    setIsOutcomeModalOpen(false);
  };

  // Cambiar mi estado personal (Disponible, Ocupado, Descanso)
  const handleSetMyStatus = async (status: Employee['status']) => {
    soundEffects.playSuccessChime();
    await staffSync.updateEmployeeStatus(myEmployee.id, status);
  };

  return (
    <div className="w-full max-w-xl md:max-w-2xl mx-auto min-h-screen bg-slate-900 border-none sm:border-x sm:border-slate-800 shadow-2xl flex flex-col justify-start text-slate-100 select-none relative sm:rounded-3xl overflow-hidden pb-12">
      {/* 1. BARRA SUPERIOR DE ESTADO DEL ASESOR */}
      <div className="bg-[#001F4D] px-3 sm:px-4 py-2.5 border-b border-blue-900/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
            Coppel Staff · Asesor en Piso
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón QR / Compartir */}
          <button
            onClick={() => onOpenShareModal?.('staff')}
            className="bg-slate-800/90 hover:bg-slate-750 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-700 flex items-center space-x-1 transition-colors"
            title="Compartir link o código QR para otros celulares"
          >
            <i className="fa-solid fa-qrcode"></i>
            <span>QR</span>
          </button>

          {!isAudioEnabled ? (
            <button
              onClick={handleEnableAudio}
              className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] animate-pulse"
            >
              <i className="fa-solid fa-bell mr-1"></i>
              Activar Audio
            </button>
          ) : (
            <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
              <i className="fa-solid fa-volume-high"></i>
              Audio ON
            </span>
          )}
        </div>
      </div>

      {/* 2. PERFIL DEL ASESOR ACTUAL & SELECTOR RÁPIDO */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#002B66] font-black text-lg flex items-center justify-center shrink-0 shadow">
            {myEmployee?.initials || 'MG'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm text-white truncate">{myEmployee?.name}</h2>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  myEmployee?.status === 'disponible'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : myEmployee?.status === 'en_piso'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : myEmployee?.status === 'ocupado'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {myEmployee?.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{myEmployee?.role}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              📍 {myEmployee?.currentAisle} · ★ {myEmployee?.rating}
            </p>
          </div>
        </div>

        {/* Selector de qué asesor soy */}
        <div className="shrink-0">
          <label className="text-[9px] text-slate-500 block text-right mb-0.5 font-bold">Cambiar Asesor:</label>
          <select
            value={selectedMyId}
            onChange={(e) => setSelectedMyId(e.target.value)}
            className="bg-slate-800 text-[11px] text-amber-300 border border-slate-700 rounded-xl px-2 py-1 outline-none font-bold cursor-pointer"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name.split(' ')[0]} ({emp.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. SELECTOR DE MI DISPONIBILIDAD PERSONAL */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Mi Estatus en Piso:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleSetMyStatus('disponible')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
              myEmployee?.status === 'disponible'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Disponible
          </button>
          <button
            onClick={() => handleSetMyStatus('en_piso')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
              myEmployee?.status === 'en_piso'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            En Piso
          </button>
          <button
            onClick={() => handleSetMyStatus('ocupado')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
              myEmployee?.status === 'ocupado'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Ocupado
          </button>
          <button
            onClick={() => handleSetMyStatus('descanso')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
              myEmployee?.status === 'descanso'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Descanso
          </button>
        </div>
      </div>

      {/* 3.1 PESTAÑAS DE VISTA: ATENCIÓN EN PISO VS CAMINO DE AVANCE ANIMADO */}
      <div className="bg-slate-950 px-4 pt-2.5 pb-2 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 w-full">
          <button
            onClick={() => setAdvisorTab('dispatch')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              advisorTab === 'dispatch'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg ring-2 ring-blue-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <i className="fa-solid fa-headset"></i>
            <span>Atención en Piso</span>
            {isRelevantCall && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setAdvisorTab('road')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              advisorTab === 'road'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg ring-2 ring-amber-400/30 font-black'
                : 'bg-slate-900 text-amber-300 hover:text-white border border-slate-800'
            }`}
          >
            <i className="fa-solid fa-trophy"></i>
            <span>Camino de Puntos</span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
              {myEmployee?.points || 0} pts
            </span>
          </button>
        </div>
      </div>

      {/* 4. ÁREA CENTRAL: SOLICITUD ENTRANTE O CAMINO DE AVANCE */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto screen-scroll">
        {advisorTab === 'road' ? (
          /* VISTA COMPLETA: CAMINO DE AVANCE ANIMADO CON HITOS */
          <div className="space-y-4 animate-in fade-in duration-200">
            <AdvisorGamificationRoad employee={myEmployee} compact={false} />
            <button
              onClick={() => setAdvisorTab('dispatch')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-2xl text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Regresar a Atención en Piso</span>
            </button>
          </div>
        ) : (
          /* VISTA OPERATIVA DE DESPACHO EN PISO */
          <>
            {/* Tarjeta compacta del progreso de puntos del asesor */}
            <AdvisorGamificationRoad
              employee={myEmployee}
              compact={true}
              onOpenRoadDetails={() => setAdvisorTab('road')}
            />
        {/* Aviso de llamada rechazada recientemente */}
        {justRejectedNotice && (
          <div className="bg-amber-950/90 border border-amber-600 text-amber-200 p-3 rounded-2xl text-xs space-y-1 animate-in fade-in">
            <p className="font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-circle-check text-amber-400"></i>
              <span>Llamada rechazada correctamente</span>
            </p>
            <p className="text-[11px] text-amber-300/90">
              Tu estado cambió a <strong>Ocupado</strong> y el supervisor fue notificado para asignarla a otro compañero.
            </p>
          </div>
        )}

        {/* CASO A: HAY UNA ALERTA ENTRANTE DISPONIBLE PARA ATENDER */}
        {isRelevantCall ? (
          <div className={`rounded-3xl p-5 shadow-2xl border-2 space-y-4 animate-in zoom-in-95 duration-200 ${
            activeCall.status === 'calling'
              ? 'bg-gradient-to-b from-red-950 via-slate-900 to-slate-900 border-red-500 ring-4 ring-red-500/25'
              : 'bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 border-blue-500'
          }`}>
            {/* Header de la alerta */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${activeCall.status === 'calling' ? 'bg-red-500 animate-ping' : 'bg-blue-400 animate-pulse'}`}></span>
                <span className="font-black text-xs uppercase tracking-wider text-white">
                  {activeCall.status === 'calling' ? '🚨 Solicitud de Cliente' : '🏃‍♂️ Atendiendo en Camino'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-300 bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-bold">
                ⏱ {elapsedSeconds}s transcurridos
              </span>
            </div>

            {/* Ubicación y Motivo */}
            <div className="space-y-2.5">
              <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black block">
                  Ubicación del Cliente:
                </span>
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-amber-400 text-base"></i>
                  <span>{activeCall.aisle}</span>
                </p>
                <p className="text-[11px] text-blue-300">
                  Departamento: <strong>{activeCall.storeDepartment}</strong>
                </p>
              </div>

              <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black block">
                  Motivo de la Consulta:
                </span>
                <p className="text-xs font-extrabold text-amber-300">
                  "{activeCall.reason}"
                </p>
              </div>

              {activeCall.dispatchedByAdmin && (
                <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-800 text-[11px] text-blue-200 flex items-center space-x-2">
                  <i className="fa-solid fa-headset text-amber-400"></i>
                  <span>Asignada por el <strong>Supervisor de Tienda</strong></span>
                </div>
              )}
            </div>

            {/* BOTONES DE DECISIÓN DEL PERSONAL (EXCLUSIVAMENTE ACEPTAR O RECHAZAR) */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              {activeCall.status === 'calling' ? (
                <>
                  {/* OPCIÓN 1: ACEPTAR Y VOY EN CAMINO */}
                  <button
                    onClick={handleAcceptCall}
                    className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-person-running text-lg"></i>
                    <span>Aceptar y Voy en Camino</span>
                  </button>

                  {/* OPCIÓN 2: RECHAZAR (PORQUE ESTOY CON OTRO CASO) */}
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="w-full py-3 px-4 bg-red-950/80 hover:bg-red-900 text-red-200 font-extrabold rounded-2xl text-xs border border-red-800 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                    <span>Rechazar (Estoy con otro cliente)</span>
                  </button>
                </>
              ) : (
                /* CUANDO YA ESTÁ ACEPTADA Y EN ATENCIÓN EN PISO */
                <div className="space-y-3 pt-1">
                  <div className="bg-emerald-950/70 border border-emerald-600/80 p-3 rounded-2xl flex items-center space-x-2 text-xs text-emerald-200 font-bold">
                    <i className="fa-solid fa-person-circle-check text-emerald-400 text-base"></i>
                    <span>En atención: Inspecciona la solicitud con el cliente</span>
                  </div>

                  {/* PREGUNTA DE RESULTADO CON BOTONES RÁPIDOS */}
                  <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-black text-center text-slate-200 uppercase tracking-wider block">
                      ¿Se pudo resolver la solicitud del cliente?
                    </span>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* BOTÓN 1: SÍ SE PUDO RESOLVER */}
                      <button
                        type="button"
                        onClick={() => handleConfirmOutcome('resuelto_exitoso', '🛒 Venta concretada / Duda resuelta con éxito')}
                        className="p-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all cursor-pointer relative overflow-hidden ring-2 ring-emerald-400/40"
                      >
                        <span className="absolute top-1.5 right-1.5 bg-amber-300 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                          +100 a +150 PTS
                        </span>
                        <i className="fa-solid fa-circle-check text-xl"></i>
                        <span>Sí se resolvió</span>
                        <span className="text-[10px] text-emerald-950 font-black">Ganar Puntos 🏆</span>
                      </button>

                      {/* BOTÓN 2: NO SE PUDO RESOLVER */}
                      <button
                        type="button"
                        onClick={() => handleConfirmOutcome('no_resuelto', '🚫 Sin inventario / No resuelto en piso')}
                        className="p-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <i className="fa-solid fa-circle-xmark text-xl"></i>
                        <span>No se resolvió</span>
                        <span className="text-[10px] text-red-200 font-bold">Seguimiento</span>
                      </button>
                    </div>

                    {/* BOTÓN 3: ABRIR INSPECCIÓN DETALLADA */}
                    <button
                      type="button"
                      onClick={() => setIsOutcomeModalOpen(true)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-clipboard-check"></i>
                      <span>Inspección Detallada (Elegir motivo y notas)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CASO B: SIN LLAMADAS ACTIVAS O YA RECHAZADA */
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center justify-center text-3xl mx-auto shadow-inner">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Modo Disponible en Piso</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Tu dispositivo está conectado. Cuando un cliente o el supervisor te asigne una llamada, sonará una alarma y podrás <strong>Aceptar</strong> o <strong>Rechazar</strong>.
              </p>
            </div>

            {/* Resumen del desempeño personal hoy */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Atendidos Hoy</span>
                <span className="text-xl font-black text-amber-400">{myEmployee?.totalHelpedToday || 14}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tu Calificación</span>
                <span className="text-xl font-black text-emerald-400">★ {myEmployee?.rating || 4.9}</span>
              </div>
            </div>
          </div>
        )}

        {/* Historial de mis atenciones recientes */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Mis Atenciones de Hoy
          </h4>
          <div className="space-y-1.5">
            {alertsHistory
              .filter((a) => a.assignedAssociateId === myEmployee?.id || a.status === 'resolved')
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-extrabold text-white text-[11px] block truncate">{item.aisle}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{item.reason}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 shrink-0">
                    ✓ Resuelto
                  </span>
                </div>
              ))}
          </div>
        </div>
          </>
        )}
      </div>

      {/* 5. MODAL DE MOTIVO DE RECHAZO */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                <i className="fa-solid fa-xmark"></i>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Rechazar Solicitud</h3>
                <p className="text-[11px] text-slate-400">Indica el motivo para avisar al supervisor</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                'Atendiendo a otro cliente en este momento',
                'Realizando cobro de abono en caja express',
                'Buscando mercancía solicitada en bodega',
                'Asesorando trámite de crédito Coppel en módulo',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border ${
                    rejectReason === reason
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INSPECCIÓN DETALLADA Y RESULTADO */}
      <ResolutionOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        alert={activeCall}
        onConfirmOutcome={handleConfirmOutcome}
        roleTitle="Asesor en Piso"
      />

      {/* MODAL DE CELEBRACIÓN DE PUNTOS GANADOS (FANFARRIA Y GAMIFICACIÓN) */}
      <PointsCelebrationModal
        isOpen={celebrationData.isOpen}
        onClose={() => setCelebrationData((prev) => ({ ...prev, isOpen: false }))}
        pointsEarned={celebrationData.points}
        advisorName={myEmployee?.name || 'Asesor'}
        outcome={celebrationData.outcome}
        breakdown={celebrationData.breakdown}
        currentTotalPoints={myEmployee?.points || 0}
      />
    </div>
  );
};
