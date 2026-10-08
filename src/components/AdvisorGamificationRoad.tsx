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
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center text-xs text-slate-400">
          Cargando datos de gamificación...
        </div>
      );
    }
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
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
        className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-3.5 shadow-lg cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider">
                  {currentLvl.title}
                </span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-400/40">
                  NIVEL {currentLvl.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {streak > 0 ? `🔥 Racha de ${streak} éxitos seguidos` : 'Camino de avance en piso'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-white font-mono tracking-tight group-hover:text-amber-300 transition-colors">
              {points.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400 font-bold ml-1">PTS</span>
            <span className="block text-[9px] text-slate-400 font-mono">
              {nextLvl ? `Faltan ${progressInfo.pointsToNext} pts` : '¡Nivel Máximo!'}
            </span>
          </div>
        </div>

        {/* Barra animada de progreso */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>Progreso al siguiente rango</span>
            <span className="text-amber-300 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-1000 relative shadow-sm"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <i className="fa-solid fa-circle-check"></i>
            {successfulAssists} atendidos con éxito (+100 pts c/u)
          </span>
          <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Ver camino animado
            <i className="fa-solid fa-arrow-right text-[9px]"></i>
          </span>
        </div>
      </div>
    );
  }

  // Vista extendida completa del camino animado (Camino de Avance)
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Luces decorativas */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header del Camino de Avance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-amber-400/20 animate-pulse">
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Camino de Avance & Puntos Coppel
              </h3>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-400/40">
                Gamificación en Piso
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ganas <strong>+100 PTS</strong> por cada cliente resuelto con éxito + bonos de rapidez y racha.
            </p>
          </div>
        </div>

        {/* Resumen de Puntos y Racha */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shrink-0">
          <div className="text-right px-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {points.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-black ml-1">PTS</span>
            <span className="block text-[10px] text-amber-300/90 font-bold uppercase">
              {currentLvl.title}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3 pr-1 text-center">
            <span className="text-xl font-black text-orange-400 flex items-center justify-center gap-1">
              <i className="fa-solid fa-fire animate-bounce"></i>
              <span>{streak}</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold block uppercase">
              Racha
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Progreso al Próximo Rango */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative z-10 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Rango Actual:</span>
            <span className="font-extrabold text-amber-300 flex items-center gap-1">
              <i className={`fa-solid ${currentLvl.badgeIcon}`}></i>
              {currentLvl.title} (Nivel {currentLvl.level})
            </span>
          </div>
          {nextLvl && (
            <div className="text-slate-400">
              Siguiente: <strong className="text-cyan-300">{nextLvl.title}</strong>
            </div>
          )}
        </div>

        {/* Gran Barra de Progreso Animada */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="text-slate-400">{currentLvl.minPoints} PTS</span>
            <span className="text-amber-400 font-black text-xs">
              {progressPercent}% completado
            </span>
            <span className="text-slate-400">{nextLvl ? `${nextLvl.minPoints} PTS` : 'Máximo'}</span>
          </div>

          <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-1 border border-slate-800 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-1000 relative shadow-md"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            >
              {/* Brillo resplandeciente */}
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>

          {nextLvl && (
            <p className="text-[11px] text-center text-slate-400 pt-1">
              🎯 ¡Te faltan sólo <strong className="text-amber-300 font-mono font-black">{progressInfo.pointsToNext} puntos</strong> para ascender a <strong>{nextLvl.title}</strong>!
            </p>
          )}
        </div>
      </div>

      {/* EL CAMINO DE AVANCE ANIMADO (ROADMAP CON HITOS Y AVATAR) */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-amber-400"></i>
            <span>Tu Trayectoria de Avance en Tienda</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">
            {ROAD_MILESTONES.filter((m) => points >= m.targetPoints).length} de {ROAD_MILESTONES.length} hitos alcanzados
          </span>
        </div>

        {/* Camino visual con nodos conectados */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-1.5 before:bg-gradient-to-b before:from-amber-400 before:via-blue-500 before:to-slate-800 before:rounded-full">
          {ROAD_MILESTONES.map((milestone, idx) => {
            const isReached = points >= milestone.targetPoints;
            const isNextGoal = !isReached && (idx === 0 || points >= ROAD_MILESTONES[idx - 1].targetPoints);

            return (
              <div
                key={milestone.id}
                className={`relative flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isReached
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-md'
                    : isNextGoal
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                }`}
              >
                {/* Pin / Marcador de posición sobre la línea */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-transform ${
                    isReached
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 ring-4 ring-emerald-400/20 scale-105'
                      : isNextGoal
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-4 ring-amber-400/40 scale-110 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
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
                      <span className="font-extrabold text-sm text-white">
                        {milestone.title}
                      </span>
                      {isReached && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i>
                          Completado
                        </span>
                      )}
                      {isNextGoal && (
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full animate-bounce">
                          🎯 Meta Actual
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-black text-amber-400 shrink-0">
                      {milestone.targetPoints.toLocaleString()} PTS
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-gift text-amber-400/80"></i>
                    <span>Premio: <strong className="text-slate-200">{milestone.reward}</strong></span>
                  </p>

                  {/* Estado relativo */}
                  {isNextGoal && (
                    <div className="mt-2.5 bg-black/40 p-2 rounded-xl border border-amber-400/30 text-[11px] text-amber-200 flex items-center justify-between">
                      <span>Tu posición actual: <strong>{points} pts</strong></span>
                      <span className="font-mono font-bold text-amber-400">
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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5 relative z-10 text-xs">
        <h5 className="font-black text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-amber-400"></i>
          <span>¿Cómo ganar más puntos en cada asistencia?</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="font-black text-emerald-400 block">+100 PTS</span>
            <span className="text-slate-300 font-bold">Por Asistencia Exitosa</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Al marcar que el caso se resolvió con éxito.</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="font-black text-cyan-400 block">+50 PTS Bono</span>
            <span className="text-slate-300 font-bold">Respuesta Rápida</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Si atiendes al cliente en menos de 45 segundos.</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="font-black text-orange-400 block">+25 a +50 PTS</span>
            <span className="text-slate-300 font-bold">Racha de Éxito 🔥</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Por 3 o más atenciones resueltas consecutivas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
