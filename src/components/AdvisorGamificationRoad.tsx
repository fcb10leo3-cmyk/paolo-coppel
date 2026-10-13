import React from 'react';
import { Employee } from '../types';
import {
  ROAD_MILESTONES,
  getLevelProgress,
  GAMIFICATION_LEVELS,
} from '../services/gamification';

interface AdvisorGamificationRoadProps {
  employee?: Employee | null;
  compact?: boolean;
  onOpenRoadDetails?: () => void;
}

export const AdvisorGamificationRoad: React.FC<AdvisorGamificationRoadProps> = ({
  employee,
  compact = false,
  onOpenRoadDetails,
}) => {
  if (!employee) {
    if (compact) {
      return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 text-center text-xs text-slate-500 shadow-sm">
          Cargando datos de gamificación...
        </div>
      );
    }
    return (
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-center text-slate-500 shadow-sm">
        <p>Cargando información del asesor...</p>
      </div>
    );
  }

  const points = employee.points || 0;
  const progressInfo = getLevelProgress(points);
  const currentLvl = progressInfo.currentLevel;
  const nextLvl = progressInfo.nextLevel;
  const progressPercent = progressInfo.progressPercent;
  const streak = employee.streak || 0;
  const successfulAssists = employee.successfulAssistsToday || employee.totalHelpedToday || 0;

  // Si es compacto (tarjeta en cabecera del asesor)
  if (compact) {
    return (
      <div
        onClick={onOpenRoadDetails}
        className="bg-white border-2 border-[#FFD100] hover:border-[#0047BA] rounded-2xl p-3.5 shadow-md cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black text-sm shadow">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black uppercase text-[#0047BA] tracking-wider">
                  {currentLvl.title}
                </span>
                <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black border border-amber-300">
                  NIVEL {currentLvl.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {streak > 0 ? `🔥 Racha de ${streak} éxitos seguidos` : 'Camino de reconocimientos Coppel'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-[#0047BA] font-mono tracking-tight group-hover:text-amber-500 transition-colors">
              {points.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-500 font-black ml-1">PTS</span>
            <span className="block text-[9px] text-slate-400 font-mono font-bold">
              {nextLvl ? `Faltan ${progressInfo.pointsToNext} pts` : '¡Nivel Máximo!'}
            </span>
          </div>
        </div>

        {/* Barra animada de progreso */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
            <span>Progreso al siguiente rango Coppel</span>
            <span className="text-[#0047BA] font-mono font-black">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#0047BA] via-blue-500 to-[#FFD100] rounded-full transition-all duration-1000 relative shadow-sm"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <i className="fa-solid fa-circle-check text-emerald-500"></i>
            {successfulAssists} atendidos hoy (+100 pts c/u)
          </span>
          <span className="text-[#0047BA] font-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Ver camino completo
            <i className="fa-solid fa-arrow-right text-[9px]"></i>
          </span>
        </div>
      </div>
    );
  }

  // Vista extendida completa del camino animado (Camino de Avance)
  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header del Camino de Avance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-300">
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-[#0047BA] tracking-tight">
                Camino de Avance & Puntos Coppel
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full border border-amber-300">
                Gamificación Piso
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ganas <strong>+100 PTS</strong> por cada cliente resuelto con éxito + bonos de rapidez y evidencia fotográfica.
            </p>
          </div>
        </div>

        {/* Resumen de Puntos y Racha */}
        <div className="flex items-center space-x-2 bg-[#F4F6F9] border border-slate-200 p-2.5 rounded-2xl shrink-0">
          <div className="text-right px-2">
            <span className="text-xl sm:text-2xl font-black text-[#0047BA] font-mono">
              {points.toLocaleString()}
            </span>
            <span className="text-xs text-amber-500 font-black ml-1">PTS</span>
            <span className="block text-[10px] text-slate-600 font-bold uppercase">
              {currentLvl.title}
            </span>
          </div>

          <div className="border-l border-slate-300 pl-3 pr-1 text-center">
            <span className="text-xl font-black text-amber-500 flex items-center justify-center gap-1">
              <i className="fa-solid fa-fire animate-bounce"></i>
              <span>{streak}</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold block uppercase">
              Racha
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Progreso al Próximo Rango */}
      <div className="bg-[#F8FAFC] border-2 border-blue-100 rounded-2xl p-4 space-y-3 relative z-10 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-bold">Rango Actual:</span>
            <span className="font-extrabold text-[#0047BA] flex items-center gap-1">
              <i className={`fa-solid ${currentLvl.badgeIcon} text-[#FFD100]`}></i>
              {currentLvl.title} (Nivel {currentLvl.level})
            </span>
          </div>
          {nextLvl && (
            <div className="text-slate-500 font-bold">
              Siguiente: <strong className="text-[#0047BA]">{nextLvl.title}</strong>
            </div>
          )}
        </div>

        {/* Gran Barra de Progreso Animada */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="text-slate-400">{currentLvl.minPoints} PTS</span>
            <span className="text-[#0047BA] font-black text-xs">
              {progressPercent}% completado
            </span>
            <span className="text-slate-400">{nextLvl ? `${nextLvl.minPoints} PTS` : 'Máximo'}</span>
          </div>

          <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-1 border border-slate-300 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-[#0047BA] via-blue-500 to-[#FFD100] rounded-full transition-all duration-1000 relative shadow-md"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>

          {nextLvl && (
            <p className="text-[11px] text-center text-slate-600 pt-1">
              🎯 ¡Te faltan sólo <strong className="text-[#0047BA] font-mono font-black">{progressInfo.pointsToNext} puntos</strong> para ascender a <strong>{nextLvl.title}</strong>!
            </p>
          )}
        </div>
      </div>

      {/* EL CAMINO DE AVANCE ANIMADO (ROADMAP CON HITOS Y AVATAR) */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-[#0047BA]"></i>
            <span>Tu Trayectoria de Avance en Tienda</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {ROAD_MILESTONES.filter((m) => points >= m.targetPoints).length} de {ROAD_MILESTONES.length} hitos alcanzados
          </span>
        </div>

        {/* Camino visual con nodos conectados */}
        <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-1.5 before:bg-gradient-to-b before:from-[#FFD100] before:via-[#0047BA] before:to-slate-300 before:rounded-full">
          {ROAD_MILESTONES.map((milestone, idx) => {
            const isReached = points >= milestone.targetPoints;
            const isNextGoal = !isReached && (idx === 0 || points >= ROAD_MILESTONES[idx - 1].targetPoints);

            return (
              <div
                key={milestone.id}
                className={`relative flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${
                  isReached
                    ? 'bg-emerald-50/60 border-emerald-400 shadow-sm'
                    : isNextGoal
                    ? 'bg-amber-50 border-[#FFD100] ring-2 ring-amber-300 shadow-md'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                {/* Pin / Marcador de posición sobre la línea */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-transform ${
                    isReached
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 scale-105'
                      : isNextGoal
                      ? 'bg-[#FFD100] text-[#0047BA] ring-4 ring-amber-200 scale-110 animate-pulse border border-[#0047BA]'
                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                  }`}
                >
                  {isReached ? (
                    <i className="fa-solid fa-check text-xs"></i>
                  ) : isNextGoal ? (
                    <i className="fa-solid fa-person-walking text-xs"></i>
                  ) : (
                    <span className="text-[10px] font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Contenido del hito */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {milestone.title}
                      </span>
                      {isReached && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i>
                          Completado
                        </span>
                      )}
                      {isNextGoal && (
                        <span className="text-[9px] bg-[#FFD100] text-[#0047BA] font-black px-2 py-0.5 rounded-full animate-bounce shadow-sm">
                          🎯 Meta Actual
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-black text-[#0047BA] shrink-0">
                      {milestone.targetPoints.toLocaleString()} PTS
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-gift text-amber-500"></i>
                    <span>Premio: <strong className="text-slate-800">{milestone.reward}</strong></span>
                  </p>

                  {/* Estado relativo */}
                  {isNextGoal && (
                    <div className="mt-2.5 bg-white p-2 rounded-xl border border-amber-300 text-[11px] text-amber-900 flex items-center justify-between shadow-sm">
                      <span>Tu posición actual: <strong>{points} pts</strong></span>
                      <span className="font-mono font-bold text-[#0047BA]">
                        Faltan {milestone.targetPoints - points} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reglas de Bonos y Puntos */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-2.5 relative z-10 text-xs">
        <h5 className="font-black text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-[#0047BA]"></i>
          <span>¿Cómo ganar más puntos en cada asistencia?</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-black text-emerald-600 block">+100 PTS</span>
            <span className="text-slate-800 font-bold">Por Asistencia Exitosa</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Al marcar que el caso se resolvió con éxito.</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-black text-[#0047BA] block">+25 PTS Bono</span>
            <span className="text-slate-800 font-bold">Evidencia Fotográfica 📷</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Al adjuntar foto con cámara o validar con PIN.</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-black text-amber-600 block">+25 a +50 PTS</span>
            <span className="text-slate-800 font-bold">Racha de Éxito 🔥</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Por 3 o más atenciones resueltas seguidas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
