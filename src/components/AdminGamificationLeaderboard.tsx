import React, { useState } from 'react';
import { Employee } from '../types';
import {
  getLevelProgress,
  getGamificationLevel,
  GAMIFICATION_LEVELS,
} from '../services/gamification';
import { soundEffects } from '../services/soundEffects';

interface AdminGamificationLeaderboardProps {
  employees: Employee[];
  onAwardBonus: (employeeId: string, points: number, reason: string) => Promise<void>;
}

export const AdminGamificationLeaderboard: React.FC<AdminGamificationLeaderboardProps> = ({
  employees,
  onAwardBonus,
}) => {
  const [selectedBonusEmp, setSelectedBonusEmp] = useState<Employee | null>(null);
  const [bonusPointsToGive, setBonusPointsToGive] = useState<number>(100);
  const [bonusReason, setBonusReason] = useState<string>('Excelente atención y servicio al cliente');
  const [isSubmittingBonus, setIsSubmittingBonus] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Ordenar empleados por puntos descendente
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const sortedEmployees = [...safeEmployees].sort((a, b) => (b.points || 0) - (a.points || 0));

  const totalStorePoints = safeEmployees.reduce((acc, curr) => acc + (curr?.points || 0), 0);
  const topAdvisor = sortedEmployees[0];
  const totalSuccessful = safeEmployees.reduce((acc, curr) => acc + (curr?.successfulAssistsToday || curr?.totalHelpedToday || 0), 0);

  const handleOpenBonusModal = (emp: Employee, defaultPoints: number = 100) => {
    setSelectedBonusEmp(emp);
    setBonusPointsToGive(defaultPoints);
  };

  const handleConfirmBonus = async () => {
    if (!selectedBonusEmp) return;
    setIsSubmittingBonus(true);
    soundEffects.playPointsFanfare();
    await onAwardBonus(selectedBonusEmp.id, bonusPointsToGive, bonusReason);
    setIsSubmittingBonus(false);
    setSelectedBonusEmp(null);
    setSuccessToast(`¡Bono de +${bonusPointsToGive} PTS otorgado a ${selectedBonusEmp.name}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast de Confirmación de Bono */}
      {successToast && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">🏆</span>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-900 font-bold px-1.5">
            ✕
          </button>
        </div>
      )}

      {/* 1. RESUMEN EJECUTIVO DE GAMIFICACIÓN EN TIENDA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">
            Puntos Totales de Tienda
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalStorePoints.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-bold">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Acumulados en la jornada
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Top Asesor Líder
          </span>
          <div className="flex items-center space-x-2 mt-1 truncate">
            <span className="text-xl sm:text-2xl font-black text-amber-400 truncate">
              {topAdvisor ? (topAdvisor.name ? topAdvisor.name.split(' ')[0] : 'Asesor') : 'N/A'}
            </span>
            <span className="text-xs bg-amber-400/20 text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-400/30">
              🥇 #1
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block font-mono">
            {topAdvisor ? `${(topAdvisor.points || 0).toLocaleString()} PTS · ${topAdvisor.levelTitle || 'Asesor'}` : ''}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Atenciones Exitosas
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {totalSuccessful}
            </span>
            <span className="text-xs text-slate-400 font-bold">casos</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-0.5 block">
            +100 PTS otorgados por cada una
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
            Promedio por Asesor
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
              {employees.length > 0 ? Math.round(totalStorePoints / employees.length).toLocaleString() : 0}
            </span>
            <span className="text-xs text-cyan-300 font-bold">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Nivel promedio de sucursal
          </span>
        </div>
      </div>

      {/* 2. PODIO DE HONOR: TOP 3 ASESORES DE LA TIENDA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <i className="fa-solid fa-trophy text-amber-400"></i>
              <span>Podio de Honor · Top Desempeño en Piso</span>
            </h3>
            <p className="text-xs text-slate-400">
              Reconocimiento a los colaboradores con mayor puntaje por resolución de clientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {sortedEmployees.slice(0, 3).map((emp, idx) => {
            const rank = idx + 1;
            const progress = getLevelProgress(emp.points || 0);

            return (
              <div
                key={emp.id}
                className={`rounded-2xl p-4 border relative overflow-hidden transition-all ${
                  rank === 1
                    ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-amber-400/80 ring-2 ring-amber-400/30 shadow-2xl md:-translate-y-1'
                    : rank === 2
                    ? 'bg-gradient-to-b from-slate-800/60 via-slate-900 to-slate-950 border-slate-400/60 shadow-lg'
                    : 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-700/60 shadow-md'
                }`}
              >
                {/* Medalla / Posición en esquina */}
                <div className="absolute top-3 right-3 flex items-center space-x-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/50'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    <span>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                    <span>#{rank}</span>
                  </span>
                </div>

                {/* Perfil del colaborador */}
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-lg ${
                      rank === 1
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 ring-4 ring-amber-400/20'
                        : 'bg-slate-800 text-amber-300 border border-slate-700'
                    }`}
                  >
                    {emp.initials}
                  </div>
                  <div className="min-w-0 pr-10">
                    <h4 className="font-extrabold text-sm text-white truncate leading-tight">
                      {emp.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 block truncate">{emp.role}</span>
                    <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                      ★ {emp.rating} · {emp.levelTitle}
                    </span>
                  </div>
                </div>

                {/* Puntos y Racha */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Puntos Totales:</span>
                    <span className="text-base font-black text-white font-mono">
                      {(emp.points || 0).toLocaleString()} <span className="text-amber-400 text-xs">PTS</span>
                    </span>
                  </div>

                  {/* Barra animada individual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <span>Avance de Rango</span>
                      <span className="text-amber-300 font-mono">{progress.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span className="text-emerald-400 font-bold">
                      ✓ {emp.successfulAssistsToday || emp.totalHelpedToday || 0} exitosos
                    </span>
                    <span className="text-orange-400 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-fire"></i>
                      Racha: {emp.streak || 0}
                    </span>
                  </div>
                </div>

                {/* Botón rápido del Supervisor para otorgar bono */}
                <button
                  type="button"
                  onClick={() => handleOpenBonusModal(emp, 100)}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-gift text-amber-400"></i>
                  <span>Otorgar Bono Especial (+100 PTS)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TABLA COMPLETA DE CLASIFICACIÓN DE TODOS LOS ASESORES */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <i className="fa-solid fa-list-ol text-amber-400"></i>
              <span>Tabla General de Puntos y Avance de Asesores</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualiza en tiempo real los puntos, avance de camino y nivel de cada colaborador
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {employees.length} Asesores Monitoreados
          </span>
        </div>

        <div className="space-y-2.5">
          {sortedEmployees.map((emp, index) => {
            const rank = index + 1;
            const progress = getLevelProgress(emp.points || 0);
            const lvl = getGamificationLevel(emp.points || 0);

            return (
              <div
                key={emp.id}
                className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:shadow-md"
              >
                {/* Ranking y Asesor */}
                <div className="flex items-center space-x-3 min-w-0 md:w-1/3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{rank}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-300 font-black text-sm flex items-center justify-center border border-slate-700 shrink-0">
                    {emp.initials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-white truncate leading-tight">
                        {emp.name}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                          emp.status === 'disponible'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : emp.status === 'en_piso'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{emp.role}</span>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      📍 {emp.currentAisle ? emp.currentAisle.split('-')[0] : 'En piso'}
                    </span>
                  </div>
                </div>

                {/* Barra de Avance y Nivel */}
                <div className="md:w-1/3 space-y-1.5 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <i className={`fa-solid ${lvl.badgeIcon} text-[10px]`}></i>
                      {emp.levelTitle || lvl.title} (Nivel {lvl.level})
                    </span>
                    <span className="font-mono text-white font-bold">
                      {(emp.points || 0).toLocaleString()} <span className="text-amber-400 text-[10px]">PTS</span>
                    </span>
                  </div>

                  {/* Barra de progreso animada */}
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(4, progress.progressPercent)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span>{progress.progressPercent}% al sig. rango</span>
                    <span>
                      {progress.nextLevel ? `Faltan ${progress.pointsToNext} pts` : '¡Máximo!'}
                    </span>
                  </div>
                </div>

                {/* Métricas de Éxito y Botón de Bono */}
                <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-black text-emerald-400 block">
                      {emp.successfulAssistsToday || emp.totalHelpedToday || 0} Exitosos
                    </span>
                    <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1 md:justify-end">
                      <i className="fa-solid fa-fire text-[9px]"></i>
                      Racha: {emp.streak || 0}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenBonusModal(emp, 50)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-[11px] border border-slate-700 flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
                      title="Otorgar +50 PTS por buena atención"
                    >
                      <i className="fa-solid fa-plus text-[9px]"></i>
                      <span>50 pts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBonusModal(emp, 100)}
                      className="py-1.5 px-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-[11px] shadow flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
                      title="Otorgar +100 PTS por caso destacado"
                    >
                      <i className="fa-solid fa-gift text-[9px]"></i>
                      <span>+100 pts</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL PARA OTORGAR BONO DEL SUPERVISOR */}
      {selectedBonusEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="bg-slate-900 border-2 border-amber-400/80 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Otorgar Bono de Supervisor
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Premiar a <strong>{selectedBonusEmp.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBonusEmp(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Cantidad de puntos */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Selecciona la cantidad de puntos a premiar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setBonusPointsToGive(pts)}
                    className={`py-2.5 px-3 rounded-xl font-mono font-black text-xs border transition-all ${
                      bonusPointsToGive === pts
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow ring-2 ring-amber-400/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    +{pts} PTS
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Motivo del reconocimiento:
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto screen-scroll">
                {[
                  'Excelente atención y amabilidad con el cliente',
                  'Resolución rápida y eficaz de caso complejo',
                  'Venta concretada con crédito Coppel',
                  'Apoyo en pasillo saturado y trabajo en equipo',
                  'Reconocimiento especial de la Gerencia',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBonusReason(reason)}
                    className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      bonusReason === reason
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Puntos actuales de {selectedBonusEmp.name.split(' ')[0]}:</span>
                <span className="font-mono font-bold text-slate-400">{selectedBonusEmp.points} pts</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-amber-300 font-bold">
                <span>Nuevo puntaje con bono:</span>
                <span className="font-mono text-sm">{selectedBonusEmp.points + bonusPointsToGive} pts</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBonusEmp(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBonus}
                disabled={isSubmittingBonus}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-trophy"></i>
                <span>Otorgar +{bonusPointsToGive} PTS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
