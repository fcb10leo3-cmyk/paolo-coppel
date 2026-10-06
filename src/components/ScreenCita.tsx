import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';

interface ScreenCitaProps {
  onCitaSubmit: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'codigoCita'>) => void;
  activeAppointment: Appointment | null;
  onShowPass: () => void;
}

export const ScreenCita: React.FC<ScreenCitaProps> = ({
  onCitaSubmit,
  activeAppointment,
  onShowPass,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [sucursal, setSucursal] = useState('Monumento a la Revolución');
  const [fecha, setFecha] = useState(defaultDateStr);
  const [horario, setHorario] = useState('16:30');
  const [producto, setProducto] = useState('Pantalla y Audio High-End');
  const [snack, setSnack] = useState('Snack Gourmet');
  const [comentarios, setComentarios] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    async function loadBranches() {
      const data = await api.getBranches();
      if (data && data.length > 0) {
        setBranches(data);
      }
    }
    loadBranches();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCitaSubmit({
      sucursal,
      fecha,
      horario,
      producto,
      snack,
      notas: comentarios,
    });
  };

  const setPresetDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setFecha(d.toISOString().split('T')[0]);
  };

  return (
    <div id="screen-cita" className="screen active px-4 pt-3 pb-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-[#002B66] flex items-center">
          <i className="fa-solid fa-calendar-plus text-amber-500 mr-2 text-base"></i>
          Agendar Cita en Zona Select
        </h3>
        {activeAppointment && (
          <button
            onClick={onShowPass}
            className="text-[10px] font-bold text-[#002B66] bg-amber-400 hover:bg-amber-300 px-2 py-1 rounded-lg btn-motion"
          >
            Ver Pase Activo
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-[#002B66] text-white p-3 sm:p-4 rounded-2xl mb-3.5 shadow-sm border border-blue-800 flex items-center gap-3">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
          <i className="fa-solid fa-bell-concierge"></i>
        </div>
        <div className="text-[11px] sm:text-xs leading-snug">
          <span className="font-bold text-amber-300">Experiencia Concierge VIP</span>
          <p className="text-blue-100 text-[10px] sm:text-[11px]">Atención individual sin esperas, sala privada y asesor especializado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Sucursal CDMX */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>Sucursal CDMX</span>
              <span className="text-[9px] text-[#002B66] font-medium">Zona Lounge VIP</span>
            </label>
            <div className="relative">
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full text-xs p-2.5 pr-8 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none transition-all shadow-sm"
                required
              >
                <option value="">Selecciona sucursal...</option>
                <option value="Monumento a la Revolución">Monumento a la Revolución - Lounge VIP</option>
                <option value="Villa Coapa">Villa Coapa - Zona Select</option>
                <option value="Doctores">Doctores - Centro de Experiencia</option>
                <option value="Insurgentes Sur">Insurgentes Sur - Flagship</option>
                <option value="Polanco">Polanco - Experiencia Premium</option>
                <option value="Santa Fe">Santa Fe - Select Showcase</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* Producto de Interés */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Producto de Interés
            </label>
            <div className="relative">
              <select
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="w-full text-xs p-2.5 pr-8 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#002B66] outline-none shadow-sm"
                required
              >
                <option value="Muebles y Recámara">Muebles / Juego de Sala / Comedor</option>
                <option value="Pantalla y Audio High-End">Pantallas OLED / Audio High-End</option>
                <option value="Línea Blanca Premium">Línea Blanca / Refrigerador Smart</option>
                <option value="Celulares y Tecnología">Smartphones / Laptops VIP</option>
                <option value="Joyería & Relojería Fina">Joyería & Relojería Fina</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>
        </div>

        {/* Fecha y Horario */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#002B66] outline-none shadow-sm"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Horario
            </label>
            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#002B66] outline-none shadow-sm"
              required
            />
          </div>
        </div>

        {/* Presets rápidos de fecha */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setPresetDate(0)}
            className="text-[10px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap btn-motion"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setPresetDate(1)}
            className="text-[10px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap btn-motion"
          >
            Mañana
          </button>
          <button
            type="button"
            onClick={() => setPresetDate(2)}
            className="text-[10px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap btn-motion"
          >
            En 2 días
          </button>
          <button
            type="button"
            onClick={() => setPresetDate(7)}
            className="text-[10px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap btn-motion"
          >
            Próx. Semana
          </button>
        </div>

        {/* Cortesías y Personalización (Original del prompt) */}
        <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-100 space-y-2.5">
          <p className="text-[11px] font-bold text-[#002B66] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-mug-hot text-amber-500"></i>
              Cortesías y Personalización
            </span>
            <span className="text-[9px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
              Gratis con Navy VIP
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label
              className={`flex items-center space-x-2 p-2 rounded-xl border transition-all cursor-pointer ${
                snack === 'Cafe'
                  ? 'bg-white border-[#002B66] shadow-xs'
                  : 'bg-white/60 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="snack"
                value="Cafe"
                checked={snack === 'Cafe'}
                onChange={() => setSnack('Cafe')}
                className="accent-[#002B66]"
              />
              <div className="leading-tight">
                <span className="text-[11px] font-bold text-slate-800 block">Café / Agua</span>
                <span className="text-[9px] text-slate-500">Expresso o mineral</span>
              </div>
            </label>

            <label
              className={`flex items-center space-x-2 p-2 rounded-xl border transition-all cursor-pointer ${
                snack === 'Snack Gourmet'
                  ? 'bg-white border-[#002B66] shadow-xs'
                  : 'bg-white/60 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="snack"
                value="Snack Gourmet"
                checked={snack === 'Snack Gourmet'}
                onChange={() => setSnack('Snack Gourmet')}
                className="accent-[#002B66]"
              />
              <div className="leading-tight">
                <span className="text-[11px] font-bold text-slate-800 block">Snack VIP</span>
                <span className="text-[9px] text-slate-500">Dulce o salado select</span>
              </div>
            </label>
          </div>

          <div>
            <label className="text-[10px] text-slate-600 font-medium block mb-1">
              ¿Alguna alergia o requerimiento especial?
            </label>
            <input
              type="text"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ej. Sin azúcar, asesor en tecnología, silla de ruedas..."
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            />
          </div>
        </div>

        {/* Botón Submit Confirmar */}
        <button
          type="submit"
          className="w-full py-3 text-xs font-extrabold text-slate-900 coppel-yellow hover:bg-amber-400 rounded-xl shadow-md btn-motion flex items-center justify-center space-x-2"
        >
          <i className="fa-solid fa-check-circle text-sm text-[#002B66]"></i>
          <span>Confirmar Cita VIP</span>
        </button>
      </form>
    </div>
  );
};
