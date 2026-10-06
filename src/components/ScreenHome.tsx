import React from 'react';
import { Appointment, LoyaltyProfile, TabId } from '../types';

interface ScreenHomeProps {
  profile: LoyaltyProfile;
  activeAppointment: Appointment | null;
  onNavigate: (tab: TabId) => void;
  onShowAppointmentPass: () => void;
}

export const ScreenHome: React.FC<ScreenHomeProps> = ({
  profile,
  activeAppointment,
  onNavigate,
  onShowAppointmentPass,
}) => {
  return (
    <div id="screen-home" className="screen active px-4 pt-3 pb-6 space-y-3.5 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Tarjeta de Bienvenida VIP */}
      <div className="bg-gradient-to-br from-[#002B66] via-blue-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-amber-400/30 flex justify-between items-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>

        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs sm:text-sm text-amber-300 font-semibold tracking-wide">¡Hola, {profile.name}!</span>
            <span className="text-sm">👋</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5 text-white">
            Cliente Nivel {profile.tier}
          </h3>
          <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-blue-200 mt-1">
            <span>Puntualidad en pagos:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {profile.punctualityScore}% Excelente
            </span>
          </div>
        </div>

        <div className="text-center bg-white/10 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl border border-white/20 shadow-inner">
          <i className="fa-solid fa-crown text-amber-400 text-xl sm:text-2xl drop-shadow"></i>
          <span className="block text-[8px] sm:text-[9px] font-bold text-amber-300 mt-0.5 tracking-wider">NAVY VIP</span>
        </div>
      </div>

      {/* Grid responsivo para Tablets y Teléfonos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Columna Izquierda en Tablet: Billetera y Cita Activa */}
        <div className="space-y-3.5">
          {/* Resumen rápido de Billetera VIP */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigate('tarjetas')}
              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-blue-300 transition-colors btn-motion"
            >
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>LÍNEA DISPONIBLE</span>
                <i className="fa-solid fa-chevron-right text-[9px]"></i>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[#002B66] mt-0.5">
                ${profile.availableCredit.toLocaleString('es-MX')} MXN
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">Límite: ${profile.creditLine.toLocaleString('es-MX')}</p>
            </button>

            <button
              onClick={() => onNavigate('tarjetas')}
              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-left hover:border-amber-300 transition-colors btn-motion"
            >
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>PUNTOS COPPEL MAX</span>
                <i className="fa-solid fa-coins text-amber-500 text-xs"></i>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-amber-600 mt-0.5">
                {profile.coppelMaxPoints.toLocaleString('es-MX')} pts
              </p>
              <p className="text-[9px] text-emerald-600 font-medium mt-0.5">Equivale a $342 MXN</p>
            </button>
          </div>

          {/* Cita VIP Activa (si existe) */}
          {activeAppointment && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-3.5 rounded-2xl border border-amber-300 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#002B66] uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-bell text-amber-600"></i>
                  Tienes Cita VIP Agendada
                </span>
                <span className="text-[9px] bg-amber-400 text-[#002B66] font-extrabold px-1.5 py-0.5 rounded">
                  CONFIRMADA
                </span>
              </div>
              <div className="mt-2 text-xs">
                <p className="font-bold text-slate-800">{activeAppointment.sucursal}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2">
                  <span>📅 {activeAppointment.fecha}</span>
                  <span>⏰ {activeAppointment.horario}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Cortesía: <strong className="text-[#002B66]">{activeAppointment.snack}</strong> · {activeAppointment.producto}
                </p>
              </div>
              <button
                onClick={onShowAppointmentPass}
                className="w-full mt-2.5 py-2 text-xs font-bold text-[#002B66] bg-amber-300 hover:bg-amber-400 rounded-xl flex items-center justify-center space-x-1.5 btn-motion"
              >
                <i className="fa-solid fa-qrcode text-xs"></i>
                <span>Ver Pase de Acceso VIP</span>
              </button>
            </div>
          )}

          {/* Acceso Rápido a Cita (Original del prompt) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-blue-50 text-[#002B66] rounded-xl shrink-0">
                <i className="fa-solid fa-calendar-check text-lg"></i>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Atención VIP por Cita</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Reserva asesor exclusivo, bebida y snack gratis en Zona Select.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('cita')}
              className="w-full mt-2 py-2.5 text-xs font-bold text-white coppel-navy hover:bg-blue-900 rounded-xl btn-motion shadow-sm flex items-center justify-center space-x-1.5"
            >
              <i className="fa-solid fa-calendar-plus text-amber-300"></i>
              <span>Agendar Nueva Cita</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha en Tablet: Lealtad y Beneficios */}
        <div className="space-y-3.5">
          {/* Estado de Lealtad (Original del prompt) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-800">Avance de Lealtad Coppel</span>
              <span className="text-[10px] font-bold text-[#002B66] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Nivel Navy → Gold
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${profile.progressToNextTier}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Te faltan <strong className="text-slate-800 font-bold">{profile.purchasesNeededForGold} compras o abonos puntuales</strong> para acceder al estatus <strong className="text-amber-600 font-bold">Gold VIP</strong>.
            </p>
          </div>

          {/* Beneficios Select Exclusivos */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-xs">
            <h5 className="font-bold text-slate-800 text-[11px] mb-2.5 flex items-center">
              <i className="fa-solid fa-sparkles text-amber-500 mr-1.5"></i>
              Beneficios Activos Navy VIP
            </h5>
            <ul className="space-y-2 text-[10px] text-slate-600">
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                <span>Acceso prioritario a Kioscos y cajas sin fila</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                <span>Cortesía de café gourmet y snack en visitas agendadas</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                <span>Hasta 24 quincenas con tasa preferencial</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                <span>Salón privado Lounge Select en Flagships CDMX</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
