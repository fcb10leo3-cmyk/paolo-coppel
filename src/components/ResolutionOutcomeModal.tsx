import React, { useState } from 'react';
import { AssistanceAlert, ResolutionOutcome } from '../types';

interface ResolutionOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: AssistanceAlert | null;
  onConfirmOutcome: (outcome: ResolutionOutcome, notes: string) => Promise<void>;
  roleTitle?: string;
}

export const ResolutionOutcomeModal: React.FC<ResolutionOutcomeModalProps> = ({
  isOpen,
  onClose,
  alert,
  onConfirmOutcome,
  roleTitle = 'Asesor',
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<ResolutionOutcome | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !alert) return null;

  const successReasons = [
    { id: 'venta', label: '🛒 Venta concretada con éxito', desc: 'Cliente adquirió el producto o contrató servicio' },
    { id: 'duda', label: '💡 Duda de producto aclarada', desc: 'Se brindó asesoría técnica o especificaciones' },
    { id: 'credito', label: '💳 Trámite / Crédito aprobado', desc: 'Se tramitó o liberó compra con crédito Coppel' },
    { id: 'localizado', label: '📦 Producto localizado y entregado', desc: 'Se ubicó la mercancía en piso o bodega' },
  ];

  const failureReasons = [
    { id: 'agotado', label: '🚫 Sin inventario / Producto agotado', desc: 'No había existencia ni en piso ni bodega' },
    { id: 'credito_rechazado', label: '❌ Crédito no aprobado / Sin capacidad', desc: 'No cumplió con requisitos para financiar' },
    { id: 'retiro', label: '🚶 Cliente se retiró del pasillo', desc: 'Al llegar el asesor, el cliente ya no estaba' },
    { id: 'gerencia', label: '👔 Requiere autorización de Gerencia', desc: 'Caso especial escalado a nivel gerencial' },
  ];

  const handleSelectOutcome = (outcome: ResolutionOutcome) => {
    setSelectedOutcome(outcome);
    if (outcome === 'resuelto_exitoso') {
      setSelectedReason('🛒 Venta concretada con éxito');
    } else {
      setSelectedReason('🚫 Sin inventario / Producto agotado');
    }
  };

  const handleConfirm = async () => {
    if (!selectedOutcome) return;
    setIsSubmitting(true);
    const finalNotes = customNotes.trim() ? `${selectedReason} - ${customNotes.trim()}` : selectedReason;
    await onConfirmOutcome(selectedOutcome, finalNotes);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[92vh] overflow-y-auto screen-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Inspección y Resultado de la Solicitud
              </h3>
              <p className="text-[11px] text-slate-400">
                Finalizar caso de {alert.aisle} ({roleTitle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Resumen del caso inspeccionado */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Ubicación: <strong className="text-white">{alert.aisle}</strong></span>
            <span className="font-mono text-amber-400">{alert.timestamp}</span>
          </div>
          <p className="text-slate-300 font-medium">"{alert.reason}"</p>
        </div>

        {/* PREGUNTA PRINCIPAL: ¿SE PUDO RESOLVER O NO? */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-black uppercase tracking-wider text-slate-300 block text-center">
            ¿Se pudo resolver la solicitud del cliente?
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* BOTÓN 1: SÍ, SE PUDO RESOLVER */}
            <button
              type="button"
              onClick={() => handleSelectOutcome('resuelto_exitoso')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 ${
                selectedOutcome === 'resuelto_exitoso'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-4 ring-emerald-500/20 shadow-lg'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-black">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <span className="font-black text-xs sm:text-sm text-white">
                Sí se pudo resolver
              </span>
              <span className="text-[10px] text-emerald-300/80 font-medium leading-tight">
                Cliente satisfecho / Éxito
              </span>
            </button>

            {/* BOTÓN 2: NO SE PUDO RESOLVER */}
            <button
              type="button"
              onClick={() => handleSelectOutcome('no_resuelto')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 ${
                selectedOutcome === 'no_resuelto'
                  ? 'bg-red-950/90 border-red-500 text-red-200 ring-4 ring-red-500/20 shadow-lg'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-black">
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
              <span className="font-black text-xs sm:text-sm text-white">
                No se pudo resolver
              </span>
              <span className="text-[10px] text-red-300/80 font-medium leading-tight">
                Sin solución en piso / Seguimiento
              </span>
            </button>
          </div>
        </div>

        {/* MOTIVO DE RESOLUCIÓN SEGÚN LA ELECCIÓN */}
        {selectedOutcome && (
          <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              {selectedOutcome === 'resuelto_exitoso'
                ? 'Selecciona el motivo de éxito:'
                : 'Indica por qué no se pudo resolver:'}
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto screen-scroll">
              {(selectedOutcome === 'resuelto_exitoso' ? successReasons : failureReasons).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReason(item.label)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-start space-x-2 ${
                    selectedReason === item.label
                      ? selectedOutcome === 'resuelto_exitoso'
                        ? 'bg-emerald-900/60 border-emerald-400 text-white shadow-sm'
                        : 'bg-red-900/60 border-red-400 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="mt-0.5">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Notas opcionales */}
            <div className="pt-1">
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Comentarios adicionales (opcional)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* BOTONES FINALES DE CONFIRMACIÓN */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors"
          >
            Regresar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedOutcome || isSubmitting}
            className={`flex-1 py-3 px-4 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${
              !selectedOutcome
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : selectedOutcome === 'resuelto_exitoso'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 shadow-emerald-900/30'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white shadow-red-900/30'
            }`}
          >
            {isSubmitting ? (
              <span>Guardando...</span>
            ) : (
              <>
                <i className={`fa-solid ${selectedOutcome === 'no_resuelto' ? 'fa-triangle-exclamation' : 'fa-check'}`}></i>
                <span>
                  {selectedOutcome === 'no_resuelto' ? 'Confirmar como No Resuelto' : 'Confirmar Resolución'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
