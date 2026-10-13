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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white border-2 border-[#0047BA] w-full max-w-sm sm:max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden ring-4 ring-[#FFD100]/40 animate-in zoom-in-95 duration-300">
        {/* Glow de fondo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FFD100]/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Logo 3 puntos Coppel */}
        <div className="flex items-center justify-center space-x-1.5 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100]"></span>
          <span className="text-[#0047BA] font-black text-xs tracking-wider uppercase ml-1">
            Coppel Gamificación
          </span>
        </div>

        {/* Ícono de celebración */}
        <div className="relative mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-4xl font-black shadow-xl mx-auto ring-8 ring-amber-200/60 animate-bounce">
            {isSuccess ? (
              <i className="fa-solid fa-trophy"></i>
            ) : (
              <i className="fa-solid fa-clipboard-check"></i>
            )}
          </div>
          {isSuccess && (
            <div className="absolute -top-2 -right-2 text-2xl text-amber-500 animate-spin">
              ✨
            </div>
          )}
        </div>

        {/* Título de puntos ganados */}
        <div className="space-y-1 relative z-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0047BA] block">
            {isSuccess ? '¡Excelente Atención en Piso!' : 'Atención Registrada'}
          </span>
          <h3 className="text-4xl sm:text-5xl font-black text-[#0047BA] font-mono tracking-tight drop-shadow-sm">
            +{pointsEarned} <span className="text-xl text-[#FFD100]">PTS</span>
          </h3>
          <p className="text-xs text-slate-600 font-bold">
            {advisorName} avanza en el camino de reconocimientos Coppel
          </p>
        </div>

        {/* Desglose de puntos */}
        {breakdown.length > 0 && (
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-left text-xs relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              Detalle de Puntos Otorgados:
            </span>
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 text-slate-700 font-bold"
              >
                <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
                <span className="text-[11px]">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Puntos totales acumulados */}
        {typeof currentTotalPoints === 'number' && (
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 flex items-center justify-between text-xs relative z-10 font-black">
            <span className="text-[#0047BA]">Total de Puntos Acumulados:</span>
            <span className="text-[#0047BA] font-mono text-base">
              {(currentTotalPoints + pointsEarned).toLocaleString()} PTS
            </span>
          </div>
        )}

        {/* Botón continuar */}
        <div className="pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 bg-[#0047BA] hover:bg-[#003899] text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>¡Entendido! Continuar en Piso</span>
            <i className="fa-solid fa-arrow-right text-[#FFD100]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
