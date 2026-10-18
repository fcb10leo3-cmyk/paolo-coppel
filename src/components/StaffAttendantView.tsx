import React, { useState, useEffect, useRef } from 'react';
import { Employee, AssistanceAlert, ResolutionOutcome, AssistanceVerificationProof } from '../types';
import { staffSync, INITIAL_EMPLOYEES } from '../services/kioskSync';
import { soundEffects } from '../services/soundEffects';
import { voice } from '../services/voice';
import { ResolutionOutcomeModal } from './ResolutionOutcomeModal';
import { AdvisorGamificationRoad } from './AdvisorGamificationRoad';
import { PointsCelebrationModal } from './PointsCelebrationModal';
import { calculatePointsForAssistance } from '../services/gamification';
import {
  simularLlamadaKioscoCliente,
  firebaseConfig,
  suscribirAsistenciasPendientes,
  confirmarQueVoyEnCamino,
} from '../services/externalKioskService';

interface StaffAttendantViewProps {
  onSwitchToAdminRole?: () => void;
  onOpenShareModal?: (tab?: 'staff' | 'admin' | 'kiosk_api' | 'deploy') => void;
}

export const StaffAttendantView: React.FC<StaffAttendantViewProps> = ({
  onSwitchToAdminRole,
  onOpenShareModal,
}) => {
  const [activeCall, setActiveCall] = useState<AssistanceAlert | null>(null);
  const [pendingCalls, setPendingCalls] = useState<AssistanceAlert[]>([]);
  const [inTransitCall, setInTransitCall] = useState<AssistanceAlert | null>(null);
  const inTransitCallRef = useRef<AssistanceAlert | null>(null);

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const list = staffSync.getState()?.employees;
    return list && list.length > 0 ? list : INITIAL_EMPLOYEES;
  });
  const [alertsHistory, setAlertsHistory] = useState<AssistanceAlert[]>([]);
  const [selectedMyId, setSelectedMyId] = useState<string>('emp-01'); // Mariana Gómez por defecto
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasArrivedAtAisle, setHasArrivedAtAisle] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState<boolean>(false);
  const [modalInitialOutcome, setModalInitialOutcome] = useState<ResolutionOutcome>('resuelto_exitoso');
  const [modalStartCamera, setModalStartCamera] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Atendiendo a otro cliente en este momento');
  const [justRejectedNotice, setJustRejectedNotice] = useState<boolean>(false);
  const [advisorTab, setAdvisorTab] = useState<'dispatch' | 'road'>('dispatch');
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

  // Sincronización en tiempo real vía Firebase Firestore (onSnapshot) y staffSync
  useEffect(() => {
    // 1. Escuchar asistencias en tiempo real directamente desde Firestore
    const unsubFirestore = suscribirAsistenciasPendientes((pendientes) => {
      setPendingCalls(pendientes);

      // Si ya tenemos una llamada que estamos atendiendo activamente en tránsito, mantenerla
      if (inTransitCallRef.current) {
        return;
      }

      // Si hay llamadas pendientes, la llamada en pantalla es la más reciente
      if (pendientes.length > 0) {
        const topPending = pendientes[0];
        setActiveCall(topPending);
        staffSync.setActiveCall(topPending);
      } else {
        setActiveCall(null);
        staffSync.setActiveCall(null);
      }
    });

    // 2. Sincronizar catálogo de colaboradores y métricas locales
    const unsubscribeSync = staffSync.subscribe((state) => {
      if (state.employees && state.employees.length > 0) {
        setEmployees(state.employees);
      }
      if (state.history) {
        setAlertsHistory(state.history);
      }
    });

    staffSync.fetchAlerts();

    return () => {
      unsubFirestore();
      unsubscribeSync();
    };
  }, []);

  const myEmployee =
    employees.find((e) => e.id === selectedMyId) || employees[0] || INITIAL_EMPLOYEES[0];

  // Llamada activa actual a mostrar en tarjeta: en tránsito o primera pendiente
  const currentCall = inTransitCall || activeCall || (pendingCalls.length > 0 ? pendingCalls[0] : null);

  // Evaluar si la llamada activa aplica a este asesor:
  const isAssignedToMe = currentCall?.assignedAssociateId === myEmployee?.id;
  const haveIRejected = currentCall?.rejectedBy?.includes(myEmployee?.id || '');
  const isRelevantCall = !!currentCall && !haveIRejected;

  // Alerta sonora cuando le llega llamada
  useEffect(() => {
    if (currentCall && currentCall.status === 'calling' && !haveIRejected) {
      if (prevCallIdRef.current !== currentCall.id) {
        prevCallIdRef.current = currentCall.id;
        setHasArrivedAtAisle(false);
        if (isAudioEnabled) {
          soundEffects.playEmergencyAlert();
          const originPhrase =
            currentCall.requesterRole === 'gerente'
              ? 'Solicitud urgente de Gerencia'
              : currentCall.requesterRole === 'cajas'
              ? 'Personal de Cajas solicita refuerzo'
              : currentCall.requesterRole === 'asesor'
              ? 'Un compañero asesor solicita apoyo'
              : 'Nueva solicitud en piso';
          voice.speak(`¡Atención ${myEmployee?.name.split(' ')[0]}! ${originPhrase} en ${currentCall.aisle}.`);
          soundEffects.showBrowserNotification(
            `🚨 ${originPhrase}`,
            `${currentCall.reason} en ${currentCall.aisle}`
          );
        }
      }
    } else if (!currentCall) {
      prevCallIdRef.current = null;
      setHasArrivedAtAisle(false);
    }
  }, [currentCall, isAudioEnabled, haveIRejected, myEmployee]);

  // Cronómetro
  useEffect(() => {
    if (currentCall && !haveIRejected) {
      const calcElapsed = () => {
        const diff = Math.floor((Date.now() - (currentCall.createdAt || Date.now())) / 1000);
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
  }, [currentCall, haveIRejected]);

  const handleEnableAudio = async () => {
    soundEffects.playEmergencyAlert();
    await soundEffects.requestNotificationPermission();
    setIsAudioEnabled(true);
    voice.speak('Sirena y notificaciones de asesor Coppel activadas.');
  };

  // 1. ACCIÓN: ACEPTAR Y VOY EN CAMINO
  const handleAcceptCall = async (callIdToAccept?: string) => {
    const targetCall = callIdToAccept
      ? (pendingCalls.find((p) => p.id === callIdToAccept) || currentCall)
      : currentCall;
    if (!targetCall) return;

    soundEffects.playSuccessChime();
    voice.speak('Llamada aceptada. Voy en camino.');

    const acceptedCall: AssistanceAlert = {
      ...targetCall,
      status: 'in_transit',
      assignedAssociateId: myEmployee.id,
      assignedAssociateName: myEmployee.name,
      assignedAssociateRole: myEmployee.role,
    };

    setInTransitCall(acceptedCall);
    inTransitCallRef.current = acceptedCall;
    setActiveCall(acceptedCall);
    staffSync.setActiveCall(acceptedCall);

    // Actualizar en Firebase Firestore con updateDoc:
    // status="en_camino", advisorName=<nombre del asesor>, estimatedArrival="1-2 minutos"
    await confirmarQueVoyEnCamino(targetCall.id, myEmployee.name);
    await staffSync.acceptCall(targetCall.id, myEmployee.id, myEmployee.name);
  };

  // 2. ACCIÓN: RECHAZAR PORQUE ESTOY CON OTRO CLIENTE
  const handleConfirmReject = async () => {
    if (!currentCall) return;
    soundEffects.playSuccessChime();
    await staffSync.rejectCall(currentCall.id, myEmployee.id, rejectReason);
    setIsRejectModalOpen(false);
    setJustRejectedNotice(true);
    voice.speak('Llamada rechazada. Notificando al supervisor.');
    setTimeout(() => setJustRejectedNotice(false), 5000);
  };

  // 3. ABRIR MODAL CON OUTCOME ESPECÍFICO
  const handleOpenOutcomeModal = (outcome: ResolutionOutcome, startCamera: boolean = false) => {
    setModalInitialOutcome(outcome);
    setModalStartCamera(startCamera);
    setIsOutcomeModalOpen(true);
    soundEffects.playSuccessChime();
  };

  // 4. ACCIÓN: CONFIRMAR RESULTADO DE LA ATENCIÓN
  const handleConfirmOutcome = async (
    outcome: ResolutionOutcome,
    notes: string,
    verificationProof?: AssistanceVerificationProof,
    outcomeCategory?: string
  ) => {
    const target = inTransitCall || activeCall || currentCall;
    if (!target) return;
    const alertId = target.id;
    const hasProof = !!(
      verificationProof &&
      (verificationProof.photoUrl ||
        verificationProof.verifiedPin ||
        verificationProof.signatureDataUrl ||
        verificationProof.ticketFolio)
    );

    // Calcular puntos ganados y bonos
    const pointsCalc = calculatePointsForAssistance({
      outcome,
      elapsedSeconds,
      currentStreak: myEmployee?.streak || 0,
      hasProofBonus: hasProof,
    });

    if (outcome === 'resuelto_exitoso') {
      soundEffects.playPointsFanfare();
      voice.speak(`¡Excelente trabajo ${myEmployee?.name.split(' ')[0]}! Has ganado ${pointsCalc.totalPoints} puntos.`);
    } else {
      soundEffects.playSuccessChime();
      voice.speak('Atención registrada. Supervisor notificado.');
    }

    setCelebrationData({
      isOpen: true,
      points: pointsCalc.totalPoints,
      outcome,
      breakdown: pointsCalc.reasons,
    });

    await staffSync.resolveCall(alertId, outcome, notes, verificationProof, outcomeCategory);
    setInTransitCall(null);
    inTransitCallRef.current = null;
    setIsOutcomeModalOpen(false);

    // Si quedan llamadas pendientes, pasar a la siguiente
    const remaining = pendingCalls.filter((p) => p.id !== alertId);
    if (remaining.length > 0) {
      setActiveCall(remaining[0]);
      staffSync.setActiveCall(remaining[0]);
    } else {
      setActiveCall(null);
      staffSync.setActiveCall(null);
    }
  };

  // Cambiar mi estado personal (Disponible, Ocupado, Descanso)
  const handleSetMyStatus = async (status: Employee['status']) => {
    soundEffects.playSuccessChime();
    await staffSync.updateEmployeeStatus(myEmployee.id, status);
  };

  // Simular llamada de prueba desde el Kiosco de Clientes (con PIN y pasillo)
  const handleSimulateTestCall = async () => {
    soundEffects.playSuccessChime();
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Nueva llamada de cliente:");
    console.log("- ID Llamada:", `KIOSK-${Date.now()}`);
    console.log("- Lugar / Pasillo:", 'Pasillo 1A - Telefonía & Celulares');
    console.log("- Tipo de Asistencia:", 'Cliente solicita ver celulares Samsung en vitrina');
    console.log("- PIN del Cliente:", pin);

    await simularLlamadaKioscoCliente({
      aisle: 'Pasillo 1A - Telefonía & Celulares',
      reason: 'Cliente solicita ver celulares Samsung en vitrina',
      customerPin: pin,
    });
  };

  return (
    <div className="w-full max-w-xl md:max-w-2xl mx-auto min-h-screen bg-[#F4F6F9] text-slate-800 shadow-2xl flex flex-col justify-start select-none relative sm:rounded-3xl overflow-hidden pb-12 border border-slate-200">
      {/* 0. BARRA DE ENLACE ACTIVO CON FIREBASE FIRESTORE */}
      <div className="bg-white border-b-2 border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-[11px] shadow-sm">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="text-slate-700 font-bold truncate">
            🔥 Firebase Firestore: <strong className="text-[#0047BA] font-mono text-[10px]">{firebaseConfig.projectId}</strong>
            <span className="text-slate-500 font-medium ml-1 hidden sm:inline">(Colección: "asistencias")</span>
          </span>
        </div>
        <button
          onClick={handleSimulateTestCall}
          className="shrink-0 bg-[#FFD100] hover:bg-amber-400 active:scale-95 text-[#0047BA] font-black px-2.5 py-1 rounded-lg text-[10px] border border-amber-300 shadow-sm cursor-pointer transition-all flex items-center space-x-1"
          title="Crear un documento de prueba en 'asistencias' para ver cómo entra la alerta en tiempo real con PIN y sonido"
        >
          <i className="fa-solid fa-flask"></i>
          <span>Probar Kiosco</span>
        </button>
      </div>

      {/* 1. BARRA SUPERIOR DE LA APP COPPEL ASESOR */}
      <div className="bg-[#0047BA] px-3.5 sm:px-4 py-2 text-white flex items-center justify-between text-xs border-b border-blue-600/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span className="font-black text-[11px] sm:text-xs text-white uppercase tracking-wider">
            Terminal Asesor Coppel · Piso de Venta
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onOpenShareModal?.('staff')}
            className="bg-white/15 hover:bg-white/25 text-[#FFD100] font-black px-2 py-0.5 rounded text-[10px] border border-white/20 flex items-center space-x-1 cursor-pointer transition-colors"
            title="Compartir link o código QR para otros celulares"
          >
            <i className="fa-solid fa-qrcode"></i>
            <span>QR</span>
          </button>

          {!isAudioEnabled ? (
            <button
              onClick={handleEnableAudio}
              className="bg-[#FFD100] text-[#0047BA] font-black px-2 py-0.5 rounded text-[10px] animate-pulse cursor-pointer shadow"
            >
              <i className="fa-solid fa-bell mr-1"></i>
              Activar Audio
            </button>
          ) : (
            <span className="text-emerald-300 font-mono text-[10px] flex items-center gap-1 font-black bg-white/10 px-2 py-0.5 rounded">
              <i className="fa-solid fa-volume-high"></i>
              ON
            </span>
          )}
        </div>
      </div>

      {/* 2. ENCABEZADO PRINCIPAL AZUL COPPEL (#0047BA) CON LOGO OFICIAL */}
      <div className="bg-[#0047BA] px-4 py-3 text-white shadow-md flex items-center justify-between gap-3 border-b-2 border-[#FFD100]">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Logo 3 puntos amarillos Coppel */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-[#0047BA] font-black text-lg flex items-center justify-center shrink-0 shadow-lg border-2 border-white/20">
            {myEmployee?.initials || 'MG'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-black text-sm sm:text-base text-white truncate tracking-tight">
                {myEmployee?.name}
              </h2>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                  myEmployee?.status === 'disponible'
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400'
                    : myEmployee?.status === 'en_piso'
                    ? 'bg-[#FFD100] text-[#0047BA] border-[#FFD100]'
                    : myEmployee?.status === 'ocupado'
                    ? 'bg-red-500/20 text-red-200 border-red-400'
                    : 'bg-white/20 text-white border-white/40'
                }`}
              >
                {myEmployee?.status}
              </span>
            </div>
            <p className="text-[11px] text-blue-100 truncate font-medium">{myEmployee?.role}</p>
            <p className="text-[10px] text-yellow-300 font-mono mt-0.5">
              📍 {myEmployee?.currentAisle} · ★ {myEmployee?.rating} · {myEmployee?.levelTitle}
            </p>
          </div>
        </div>

        {/* Selector de Asesor */}
        <div className="shrink-0 text-right">
          <label className="text-[9px] text-blue-200 block mb-0.5 font-bold uppercase">Asesor:</label>
          <select
            value={selectedMyId}
            onChange={(e) => setSelectedMyId(e.target.value)}
            className="bg-white text-[11px] text-[#0047BA] border-2 border-[#FFD100] rounded-xl px-2 py-1 outline-none font-black shadow-sm cursor-pointer"
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
      <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] shadow-sm">
        <span className="text-slate-600 font-black">Mi Estatus en Piso:</span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleSetMyStatus('disponible')}
            className={`px-2.5 py-1 rounded-xl font-black text-[10px] transition-all cursor-pointer ${
              myEmployee?.status === 'disponible'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ✓ Disponible
          </button>
          <button
            onClick={() => handleSetMyStatus('en_piso')}
            className={`px-2.5 py-1 rounded-xl font-black text-[10px] transition-all cursor-pointer ${
              myEmployee?.status === 'en_piso'
                ? 'bg-[#FFD100] text-[#0047BA] shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            En Piso
          </button>
          <button
            onClick={() => handleSetMyStatus('ocupado')}
            className={`px-2.5 py-1 rounded-xl font-black text-[10px] transition-all cursor-pointer ${
              myEmployee?.status === 'ocupado'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ocupado
          </button>
          <button
            onClick={() => handleSetMyStatus('descanso')}
            className={`px-2.5 py-1 rounded-xl font-black text-[10px] transition-all cursor-pointer ${
              myEmployee?.status === 'descanso'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Descanso
          </button>
        </div>
      </div>

      {/* 3.1 PESTAÑAS: ATENCIÓN EN PISO VS CAMINO DE PUNTOS */}
      <div className="bg-[#EBF1FA] px-4 pt-2 pb-2 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 w-full">
          <button
            onClick={() => setAdvisorTab('dispatch')}
            className={`flex-1 py-2 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
              advisorTab === 'dispatch'
                ? 'bg-[#0047BA] text-white shadow-md'
                : 'bg-white text-slate-600 hover:text-[#0047BA] border border-slate-200'
            }`}
          >
            <i className="fa-solid fa-headset"></i>
            <span>Atención en Piso</span>
            {isRelevantCall && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setAdvisorTab('road')}
            className={`flex-1 py-2 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
              advisorTab === 'road'
                ? 'bg-[#FFD100] text-[#0047BA] shadow-md border-2 border-amber-400'
                : 'bg-white text-slate-700 hover:text-amber-600 border border-slate-200'
            }`}
          >
            <i className="fa-solid fa-trophy text-amber-500"></i>
            <span>Camino de Puntos</span>
            <span className="bg-[#0047BA] text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black">
              {myEmployee?.points || 0} pts
            </span>
          </button>
        </div>
      </div>

      {/* 4. CONTENIDO PRINCIPAL: SOLICITUD ENTRANTE O CAMINO DE AVANCE */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto screen-scroll">
        {advisorTab === 'road' ? (
          /* VISTA COMPLETA DEL CAMINO ANIMADO */
          <div className="space-y-4 animate-in fade-in duration-200">
            {myEmployee && <AdvisorGamificationRoad employee={myEmployee} compact={false} />}
            <button
              onClick={() => setAdvisorTab('dispatch')}
              className="w-full py-3 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Regresar a Atención en Piso</span>
            </button>
          </div>
        ) : (
          /* VISTA DE ATENCIÓN OPERATIVA EN PISO */
          <>
            {/* Tarjeta compacta del progreso de puntos */}
            {myEmployee && (
              <AdvisorGamificationRoad
                employee={myEmployee}
                compact={true}
                onOpenRoadDetails={() => setAdvisorTab('road')}
              />
            )}

            {/* Aviso de llamada rechazada recientemente */}
            {justRejectedNotice && (
              <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 p-3.5 rounded-2xl text-xs space-y-1 animate-in fade-in shadow-sm">
                <p className="font-black flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-amber-600 text-sm"></i>
                  <span>Llamada rechazada correctamente</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  Tu estado cambió a <strong>Ocupado</strong> y el supervisor fue notificado para reasignar a otro asesor.
                </p>
              </div>
            )}

            {/* AVISO DE MULTIPLES SOLICITUDES EN COLA */}
            {pendingCalls.length > 1 && !inTransitCall && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-bell animate-bounce text-amber-600"></i>
                    <span>{pendingCalls.length} Solicitudes Pendientes en Piso</span>
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono">
                    En cola
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {pendingCalls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setActiveCall(call)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                        currentCall?.id === call.id
                          ? 'bg-white border-[#0047BA] shadow font-black text-[#0047BA]'
                          : 'bg-white/70 hover:bg-white border-amber-200 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <span className="font-bold block truncate">{call.aisle}</span>
                        <span className="text-[10px] text-slate-500 truncate block">{call.reason}</span>
                      </div>
                      {call.customerPin && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] font-black rounded border border-amber-300 shrink-0">
                          PIN: {call.customerPin}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CASO A: HAY UNA ALERTA ENTRANTE DISPONIBLE */}
            {isRelevantCall && currentCall ? (
              <div
                className={`rounded-3xl p-5 shadow-xl border-2 space-y-4 animate-in zoom-in-95 duration-200 ${
                  currentCall.status === 'calling'
                    ? 'bg-gradient-to-b from-red-50 via-white to-white border-red-500 ring-4 ring-red-500/15'
                    : 'bg-gradient-to-b from-blue-50 via-white to-white border-[#0047BA] ring-4 ring-blue-500/15'
                }`}
              >
                {/* Header de la Alerta */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        currentCall.status === 'calling' ? 'bg-red-500 animate-ping' : 'bg-[#0047BA] animate-pulse'
                      }`}
                    ></span>
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      {currentCall.status === 'calling'
                        ? '🚨 Solicitud Entrante en Piso'
                        : '🏃‍♂️ Atención Aceptada · En Camino'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0047BA] bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-300 font-black">
                    ⏱ {elapsedSeconds}s transcurridos
                  </span>
                </div>

                {/* Ubicación y Motivo */}
                <div className="space-y-2.5">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">
                      Ubicación del Cliente:
                    </span>
                    <p className="text-base font-black text-[#0047BA] flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-red-500 text-lg"></i>
                      <span>{currentCall.aisle}</span>
                    </p>
                    <p className="text-xs text-[#0047BA] font-bold">
                      Departamento: <strong>{currentCall.storeDepartment}</strong>
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">
                        Motivo de la Solicitud:
                      </span>
                      {currentCall.requesterRole && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          currentCall.requesterRole === 'gerente'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : currentCall.requesterRole === 'cajas'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : currentCall.requesterRole === 'asesor'
                            ? 'bg-blue-100 text-[#0047BA] border border-blue-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {currentCall.requesterRole === 'gerente' && '👔 De Gerencia'}
                          {currentCall.requesterRole === 'cajas' && '🛒 De Cajas Express'}
                          {currentCall.requesterRole === 'asesor' && '🎧 De Asesor Compañero'}
                          {currentCall.requesterRole === 'personal' && '👤 Personal en Tienda'}
                          {currentCall.requesterRole === 'cliente' && '👤 Kiosco Cliente'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      "{currentCall.reason}"
                    </p>
                    {currentCall.urgency === 'urgente' && (
                      <div className="pt-1">
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md animate-pulse">
                          🚨 PRIORIDAD ALTA / ATENCIÓN INMEDIATA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* PIN del cliente para verificación rápida */}
                  {currentCall.customerPin && (
                    <div className="bg-amber-50 border-2 border-amber-300 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black text-xs">
                          <i className="fa-solid fa-key"></i>
                        </span>
                        <div>
                          <span className="font-bold text-amber-950 block">PIN de Verificación del Cliente:</span>
                          <span className="text-[10px] text-amber-800">Pídelo al llegar al pasillo</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-base text-[#0047BA] bg-white px-2.5 py-0.5 rounded-xl border border-amber-300">
                        {currentCall.customerPin}
                      </span>
                    </div>
                  )}

                  {currentCall.dispatchedByAdmin && (
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-[11px] text-[#0047BA] flex items-center space-x-2 font-bold">
                      <i className="fa-solid fa-headset text-amber-500 text-sm"></i>
                      <span>Asignada directamente por el <strong>Supervisor de Tienda</strong></span>
                    </div>
                  )}
                </div>

                {/* BOTONES DE DECISIÓN DEL ASESOR */}
                <div className="pt-2 border-t border-slate-200 space-y-2.5">
                  {currentCall.status === 'calling' ? (
                    <>
                      {/* BOTÓN 1: ACEPTAR Y VOY EN CAMINO */}
                      <button
                        type="button"
                        onClick={() => handleAcceptCall()}
                        className="w-full py-4 px-4 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer border-2 border-[#003899] group"
                      >
                        <i className="fa-solid fa-person-running text-xl text-[#FFD100] group-hover:scale-110 transition-transform"></i>
                        <span className="tracking-wide">Aceptar y Voy en Camino</span>
                      </button>

                      {/* BOTÓN 2: RECHAZAR */}
                      <button
                        type="button"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="w-full py-3 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-extrabold rounded-2xl text-xs border border-slate-300 flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                        <span>Rechazar (Estoy con otro cliente)</span>
                      </button>
                    </>
                  ) : (
                    /* CUANDO YA ESTÁ ACEPTADA Y EN ATENCIÓN */
                    <div className="space-y-3 pt-1">
                      {/* Estado en camino / presencia */}
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-[#0047BA] font-bold">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-person-walking text-base text-amber-500"></i>
                          <span>{hasArrivedAtAisle ? 'En atención con el cliente en pasillo' : 'En camino al pasillo'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHasArrivedAtAisle(true);
                            soundEffects.playSuccessChime();
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                            hasArrivedAtAisle
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-white text-[#0047BA] border border-blue-300 hover:bg-blue-100'
                          }`}
                        >
                          {hasArrivedAtAisle ? '✓ Llegada Registrada' : 'Marcar: Ya llegué'}
                        </button>
                      </div>

                      {/* BOTÓN RÁPIDO: CONECTAR CÁMARA Y TOMAR FOTO DE EVIDENCIA IN SITU */}
                      <button
                        type="button"
                        onClick={() => handleOpenOutcomeModal('resuelto_exitoso', true)}
                        className="w-full py-3 px-4 bg-white hover:bg-amber-50 text-[#0047BA] font-black rounded-2xl text-xs border-2 border-[#FFD100] shadow-sm flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer group"
                      >
                        <i className="fa-solid fa-camera text-base text-amber-500 group-hover:scale-110 transition-transform"></i>
                        <span>📷 Conectar Cámara & Tomar Foto de Evidencia (+25 PTS)</span>
                      </button>

                      {/* BOTÓN PRINCIPAL DE FINALIZAR & REGISTRAR */}
                      <button
                        type="button"
                        onClick={() => handleOpenOutcomeModal('resuelto_exitoso', false)}
                        className="w-full py-3.5 px-4 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer border-2 border-[#003899]"
                      >
                        <i className="fa-solid fa-clipboard-check text-lg text-[#FFD100]"></i>
                        <span>Finalizar Atención & Registrar Resultado</span>
                      </button>

                      {/* BOTONES DIRECTOS 1-CLIC */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {/* 1-CLIC: SÍ SE RESOLVIÓ */}
                        <button
                          type="button"
                          onClick={() => handleOpenOutcomeModal('resuelto_exitoso', false)}
                          className="p-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white font-black rounded-2xl text-xs shadow-md flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
                        >
                          <span className="absolute top-1 right-1 bg-[#FFD100] text-[#0047BA] text-[8px] font-black px-1.5 py-0.2 rounded-full">
                            +100 a +125 PTS
                          </span>
                          <i className="fa-solid fa-circle-check text-lg text-[#FFD100]"></i>
                          <span>✓ Sí se resolvió</span>
                          <span className="text-[10px] text-emerald-100 font-bold">Elegir motivo & foto</span>
                        </button>

                        {/* 1-CLIC: NO SE RESOLVIÓ */}
                        <button
                          type="button"
                          onClick={() => handleOpenOutcomeModal('no_resuelto', false)}
                          className="p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-black rounded-2xl text-xs shadow-md flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-circle-xmark text-lg text-white"></i>
                          <span>✕ No se resolvió</span>
                          <span className="text-[10px] text-red-100 font-bold">Indicar por qué</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* CASO B: EN ESPERA / MODO DISPONIBLE EN PISO */
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0047BA] border-2 border-blue-200 flex items-center justify-center text-3xl mx-auto shadow-sm">
                  <i className="fa-solid fa-headset"></i>
                </div>

                <div>
                  <h3 className="font-black text-base text-[#0047BA]">
                    Terminal Coppel · Disponible en Piso
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Tu dispositivo está enlazado a la sucursal. En cuanto un cliente solicite apoyo desde un Tótem o pasillo, sonará la alarma sonora con su ubicación.
                  </p>
                </div>

                {/* Botón rápido para simular llamada de prueba */}
                <button
                  type="button"
                  onClick={handleSimulateTestCall}
                  className="py-2.5 px-4 bg-[#FFD100] hover:bg-[#ffc700] text-[#0047BA] font-black rounded-2xl text-xs shadow-sm flex items-center justify-center space-x-2 mx-auto active:scale-95 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>Simular Llamada de Prueba en Piso</span>
                </button>

                {/* Resumen del desempeño personal hoy */}
                <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">
                      Atenciones de Hoy
                    </span>
                    <span className="text-2xl font-black text-[#0047BA]">
                      {myEmployee?.successfulAssistsToday || myEmployee?.totalHelpedToday || 14}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">
                      Puntos Ganados
                    </span>
                    <span className="text-2xl font-black text-amber-500 font-mono">
                      {myEmployee?.points || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Historial de atenciones recientes con comprobantes */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Mis Atenciones de Hoy en Piso
                </h4>
                <span className="text-[10px] text-[#0047BA] font-bold">
                  {alertsHistory.length} registradas
                </span>
              </div>

              <div className="space-y-2">
                {alertsHistory
                  .filter((a) => a.assignedAssociateId === myEmployee?.id || a.status === 'resolved')
                  .slice(0, 5)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3 text-xs flex items-center justify-between shadow-sm hover:border-slate-300 transition-all gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-xs truncate">
                            {item.aisle}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.resolvedAt || item.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {item.outcomeCategory || item.resolutionNotes || item.reason}
                        </p>

                        {/* Insignia de verificación si tiene */}
                        {item.verificationProof && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] bg-blue-50 text-[#0047BA] font-bold px-1.5 py-0.2 rounded border border-blue-200 flex items-center gap-1">
                              {item.verificationProof.type === 'photo' && <i className="fa-solid fa-camera"></i>}
                              {item.verificationProof.type === 'customer_pin' && <i className="fa-solid fa-key"></i>}
                              {item.verificationProof.type === 'signature' && <i className="fa-solid fa-signature"></i>}
                              {item.verificationProof.type === 'ticket_folio' && <i className="fa-solid fa-receipt"></i>}
                              <span>Comprobada</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 border ${
                          item.outcome === 'no_resuelto'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {item.outcome === 'no_resuelto' ? '✕ No resuelto' : '✓ Resuelto'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black">
                <i className="fa-solid fa-xmark"></i>
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Rechazar Solicitud</h3>
                <p className="text-[11px] text-slate-500">Indica el motivo para reasignar al supervisor</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                'Atendiendo a otro cliente en este momento',
                'Realizando cobro de abono en caja express',
                'Buscando mercancía solicitada en bodega',
                'Asesorando trámite de Crédito Coppel en módulo',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                    rejectReason === reason
                      ? 'bg-[#0047BA] text-white border-[#0047BA] shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESULTADO, OPCIONES COMUNES Y COMPROBACIÓN */}
      <ResolutionOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        alert={activeCall}
        initialOutcome={modalInitialOutcome}
        startWithCamera={modalStartCamera}
        onConfirmOutcome={handleConfirmOutcome}
        roleTitle="Asesor en Piso"
        advisorName={myEmployee?.name}
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
