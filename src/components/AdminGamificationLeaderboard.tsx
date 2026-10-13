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
        <div className="bg-[#FFD100] text-[#0047BA] px-4 py-3 rounded-2xl font-black text-xs shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 border-2 border-amber-300">
          <div className="flex items-center space-x-2">
            <span className="text-base">🏆</span>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-[#0047BA] font-black px-1.5 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 1. RESUMEN EJECUTIVO DE GAMIFICACIÓN EN TIENDA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border-2 border-[#FFD100] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] text-amber-700 uppercase font-black tracking-wider block">
            Puntos Totales de Tienda
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#0047BA] font-mono">
              {totalStorePoints.toLocaleString()}
            </span>
            <span className="text-xs text-amber-500 font-bold">PTS</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            Acumulados en la jornada
          </span>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
            Top Asesor Líder
          </span>
          <div className="flex items-center space-x-2 mt-1 truncate">
            <span className="text-xl sm:text-2xl font-black text-[#0047BA] truncate">
              {topAdvisor ? (topAdvisor.name ? topAdvisor.name.split(' ')[0] : 'Asesor') : 'N/A'}
            </span>
            <span className="text-xs bg-[#FFD100] text-[#0047BA] font-black px-2 py-0.5 rounded-full border border-amber-300">
              🥇 #1
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block font-mono">
            {topAdvisor ? `${(topAdvisor.points || 0).toLocaleString()} PTS · ${topAdvisor.levelTitle || 'Asesor'}` : ''}
          </span>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
            Atenciones Exitosas
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {totalSuccessful}
            </span>
            <span className="text-xs text-slate-500 font-bold">casos</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            +100 PTS otorgados por cada una
          </span>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
            Promedio por Asesor
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#0047BA] font-mono">
              {employees.length > 0 ? Math.round(totalStorePoints / employees.length).toLocaleString() : 0}
            </span>
            <span className="text-xs text-blue-600 font-bold">PTS</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            Nivel promedio de sucursal
          </span>
        </div>
      </div>

      {/* 2. PODIO DE HONOR: TOP 3 ASESORES DE LA TIENDA */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0047BA] flex items-center gap-2">
              <i className="fa-solid fa-trophy text-[#FFD100]"></i>
              <span>Podio de Honor · Top Desempeño en Piso</span>
            </h3>
            <p className="text-xs text-slate-500">
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
                className={`rounded-2xl p-4 border-2 relative overflow-hidden transition-all ${
                  rank === 1
                    ? 'bg-amber-50/70 border-[#FFD100] ring-2 ring-amber-300 shadow-lg md:-translate-y-1'
                    : rank === 2
                    ? 'bg-slate-50 border-slate-300 shadow'
                    : 'bg-amber-50/40 border-amber-200 shadow-sm'
                }`}
              >
                {/* Medalla / Posición en esquina */}
                <div className="absolute top-3 right-3 flex items-center space-x-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow ${
                      rank === 1
                        ? 'bg-[#FFD100] text-[#0047BA] ring-2 ring-amber-300'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    <span>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                    <span>#{rank}</span>
                  </span>
                </div>

                {/* Perfil del colaborador */}
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow ${
                      rank === 1
                        ? 'bg-[#FFD100] text-[#0047BA] ring-2 ring-amber-300'
                        : 'bg-blue-50 text-[#0047BA] border border-blue-200'
                    }`}
                  >
                    {emp.initials}
                  </div>
                  <div className="min-w-0 pr-10">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
                      {emp.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 block truncate">{emp.role}</span>
                    <span className="text-[10px] text-[#0047BA] font-bold block mt-0.5">
                      ★ {emp.rating} · {emp.levelTitle}
                    </span>
                  </div>
                </div>

                {/* Puntos y Racha */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 mb-3 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Puntos Totales:</span>
                    <span className="text-base font-black text-[#0047BA] font-mono">
                      {(emp.points || 0).toLocaleString()} <span className="text-amber-500 text-xs">PTS</span>
                    </span>
                  </div>

                  {/* Barra animada individual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                      <span>Avance de Rango</span>
                      <span className="text-[#0047BA] font-mono">{progress.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#0047BA] to-[#FFD100] rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="text-emerald-700 font-bold">
                      ✓ {emp.successfulAssistsToday || emp.totalHelpedToday || 0} exitosos
                    </span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-fire"></i>
                      Racha: {emp.streak || 0}
                    </span>
                  </div>
                </div>

                {/* Botón rápido del Supervisor para otorgar bono */}
                <button
                  type="button"
                  onClick={() => handleOpenBonusModal(emp, 100)}
                  className="w-full py-2 px-3 bg-[#0047BA] hover:bg-[#003899] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-gift text-[#FFD100]"></i>
                  <span>Otorgar Bono Especial (+100 PTS)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TABLA COMPLETA DE CLASIFICACIÓN DE TODOS LOS ASESORES */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0047BA] flex items-center gap-2">
              <i className="fa-solid fa-list-ol text-[#FFD100]"></i>
              <span>Tabla General de Puntos y Avance de Asesores</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualiza en tiempo real los puntos, avance de camino y nivel de cada colaborador
            </p>
          </div>
          <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto">
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
                className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:shadow-md"
              >
                {/* Ranking y Asesor */}
                <div className="flex items-center space-x-3 min-w-0 md:w-1/3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-[#FFD100] text-[#0047BA] font-black'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : rank === 3
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{rank}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047BA] font-black text-sm flex items-center justify-center border border-blue-200 shrink-0">
                    {emp.initials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                        {emp.name}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                          emp.status === 'disponible'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : emp.status === 'en_piso'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">{emp.role}</span>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      📍 {emp.currentAisle ? emp.currentAisle.split('-')[0] : 'En piso'}
                    </span>
                  </div>
                </div>

                {/* Barra de Avance y Nivel */}
                <div className="md:w-1/3 space-y-1.5 bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#0047BA] flex items-center gap-1">
                      <i className={`fa-solid ${lvl.badgeIcon} text-[#FFD100] text-[10px]`}></i>
                      {emp.levelTitle || lvl.title} (Nivel {lvl.level})
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {(emp.points || 0).toLocaleString()} <span className="text-amber-500 text-[10px]">PTS</span>
                    </span>
                  </div>

                  {/* Barra de progreso animada */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className="h-full bg-gradient-to-r from-[#0047BA] to-[#FFD100] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(4, progress.progressPercent)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>{progress.progressPercent}% al sig. rango</span>
                    <span>
                      {progress.nextLevel ? `Faltan ${progress.pointsToNext} pts` : '¡Máximo!'}
                    </span>
                  </div>
                </div>

                {/* Métricas de Éxito y Botón de Bono */}
                <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-black text-emerald-700 block">
                      {emp.successfulAssistsToday || emp.totalHelpedToday || 0} Exitosos
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 md:justify-end">
                      <i className="fa-solid fa-fire text-[9px]"></i>
                      Racha: {emp.streak || 0}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenBonusModal(emp, 50)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] border border-slate-300 flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
                      title="Otorgar +50 PTS por buena atención"
                    >
                      <i className="fa-solid fa-plus text-[9px]"></i>
                      <span>50 pts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBonusModal(emp, 100)}
                      className="py-1.5 px-2.5 bg-[#FFD100] hover:bg-amber-400 text-[#0047BA] font-black rounded-xl text-[11px] shadow flex items-center space-x-1 transition-all active:scale-95 cursor-pointer border border-amber-300"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in select-none">
          <div className="bg-white border-2 border-[#0047BA] w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center font-black text-lg shadow">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Otorgar Bono de Supervisor
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Premiar a <strong>{selectedBonusEmp.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBonusEmp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cantidad de puntos */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Selecciona la cantidad de puntos a premiar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setBonusPointsToGive(pts)}
                    className={`py-2.5 px-3 rounded-xl font-mono font-black text-xs border transition-all cursor-pointer ${
                      bonusPointsToGive === pts
                        ? 'bg-[#0047BA] text-white border-[#0047BA] shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    +{pts} PTS
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
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
                    className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      bonusReason === reason
                        ? 'bg-blue-50 border-[#0047BA] text-[#0047BA]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>Puntos actuales de {selectedBonusEmp.name.split(' ')[0]}:</span>
                <span className="font-mono font-bold text-slate-500">{selectedBonusEmp.points} pts</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[#0047BA] font-bold">
                <span>Nuevo puntaje con bono:</span>
                <span className="font-mono text-sm">{selectedBonusEmp.points + bonusPointsToGive} pts</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBonusEmp(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBonus}
                disabled={isSubmittingBonus}
                className="flex-1 py-3 bg-[#0047BA] hover:bg-[#003899] text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-trophy text-[#FFD100]"></i>
                <span>Otorgar +{bonusPointsToGive} PTS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
