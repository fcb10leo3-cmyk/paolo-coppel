import React, { useEffect } from 'react';
import { soundEffects } from '../services/soundEffects';

interface PointsCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsEarned: number;
  advisorName: string;
  outcome: 'resuelto_exitoso' | 'no_resuelto';
  breakdown?: string[];
  currentTotalPoints?: number;
}

export const PointsCelebrationModal: React.FC<PointsCelebrationModalProps> = ({
  isOpen,
  onClose,
  pointsEarned,
  advisorName,
  outcome,
  breakdown = [],
  currentTotalPoints,
}) => {
  useEffect(() => {
    if (isOpen && outcome === 'resuelto_exitoso') {
      soundEffects.playPointsFanfare();
    }
  }, [isOpen, outcome]);

  if (!isOpen) return null;

  const isSuccess = outcome === 'resuelto_exitoso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-amber-400/80 w-full max-w-sm sm:max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden ring-4 ring-amber-400/20 animate-in zoom-in-95 duration-300">
        {/* Glow de fondo animado */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Ícono de celebración */}
        <div className="relative mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center text-4xl font-black shadow-xl mx-auto ring-8 ring-amber-400/30 animate-bounce">
            {isSuccess ? (
              <i className="fa-solid fa-trophy"></i>
            ) : (
              <i className="fa-solid fa-clipboard-check"></i>
            )}
          </div>
          {isSuccess && (
            <div className="absolute -top-2 -right-2 text-2xl text-amber-300 animate-spin">
              ✨
            </div>
          )}
        </div>

        {/* Título de puntos ganados */}
        <div className="space-y-1 relative z-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 block">
            {isSuccess ? '¡Excelente Trabajo en Piso!' : 'Atención Registrada'}
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight text-amber-400 drop-shadow">
            +{pointsEarned} PTS
          </h3>
          <p className="text-xs text-slate-300 font-bold">
            {advisorName} suma puntos en su camino de avance
          </p>
        </div>

        {/* Desglose de puntos */}
        {breakdown.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-left text-xs relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 block">
              Detalle de Puntos Ganados:
            </span>
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 text-slate-200 font-bold"
              >
                <i className="fa-solid fa-check text-emerald-400 text-xs"></i>
                <span className="text-[11px]">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Puntos totales acumulados */}
        {typeof currentTotalPoints === 'number' && (
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs relative z-10 font-bold">
            <span className="text-slate-400">Puntos Totales Acumulados:</span>
            <span className="text-amber-400 font-mono text-sm">
              {(currentTotalPoints + pointsEarned).toLocaleString()} PTS
            </span>
          </div>
        )}

        {/* Botón continuar */}
        <div className="pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Continuar en Piso</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
