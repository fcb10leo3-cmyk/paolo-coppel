import React from 'react';
import { Appointment } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';

interface AppointmentPassModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelAppointment: () => void;
  onShowToast: (msg: string) => void;
}

export const AppointmentPassModal: React.FC<AppointmentPassModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onCancelAppointment,
  onShowToast,
}) => {
  if (!isOpen || !appointment) return null;

  const handleAddToWallet = () => {
    onShowToast('Pase VIP añadido a tu Wallet exitosamente.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-amber-300 relative">
        {/* Header of Pass */}
        <div className="coppel-navy text-white p-4 text-center relative border-b border-amber-400/40">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-full text-base"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="inline-flex items-center space-x-1.5 bg-amber-400 text-[#002B66] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
            <i className="fa-solid fa-crown text-[8px]"></i>
            <span>Pase Concierge VIP</span>
          </div>

          <h3 className="font-extrabold text-sm text-white">Coppel SELECT</h3>
          <p className="text-[10px] text-blue-200">Acceso a Zona Lounge y Asesor Exclusivo</p>
        </div>

        {/* Body of Pass */}
        <div className="p-4 space-y-3 text-slate-800 text-xs">
          <div className="text-center">
            <QRCodeDisplay value={`COPPEL-SELECT-PASS:${appointment.codigoCita}`} size={120} />
            <p className="font-mono font-bold text-[11px] text-[#002B66] mt-1 tracking-wider">
              {appointment.codigoCita}
            </p>
            <span className="text-[9px] text-slate-400">Presenta este pase al llegar a recepción</span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Sucursal:</span>
              <span className="font-bold text-slate-800 text-right max-w-[170px] truncate">
                {appointment.sucursal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha y Hora:</span>
              <span className="font-bold text-[#002B66]">
                {appointment.fecha} · {appointment.horario}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Área de Interés:</span>
              <span className="font-semibold text-slate-700">{appointment.producto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cortesía de Bienvenida:</span>
              <span className="font-bold text-amber-600">{appointment.snack}</span>
            </div>
            {appointment.notas && (
              <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600">
                <span className="font-bold text-slate-700 block">Nota del Cliente:</span>
                "{appointment.notas}"
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleAddToWallet}
              className="w-full py-2.5 bg-black hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 btn-motion shadow"
            >
              <i className="fa-brands fa-apple text-sm"></i>
              <span>Añadir a Apple Wallet</span>
            </button>

            <button
              onClick={onCancelAppointment}
              className="w-full py-1.5 text-[10px] text-red-600 hover:text-red-700 font-semibold text-center"
            >
              Cancelar Cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
