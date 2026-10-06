import React, { useState, useEffect } from 'react';
import { Employee, AssistanceAlert } from '../types';
import { voice } from '../services/voice';
import { soundEffects } from '../services/soundEffects';

interface AssistanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: AssistanceAlert | null;
  onTriggerAssistance: (reason: string, preferredEmployeeId?: string) => void;
  onCancelAssistance: () => void;
  isVoiceEnabled?: boolean;
}

export const AssistanceRequestModal: React.FC<AssistanceRequestModalProps> = ({
  isOpen,
  onClose,
  activeCall,
  onTriggerAssistance,
  onCancelAssistance,
  isVoiceEnabled,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('Duda general sobre productos o crédito');
  const [selectedAisle, setSelectedAisle] = useState<string>('Pasillo Central de Muebles & Electrónica');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch employees list
  useEffect(() => {
    if (!isOpen) return;

    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        if (data.success && data.employees) {
          setEmployees(data.employees);
        }
      } catch (err) {
        console.warn('Error fetching employees:', err);
      }
    };

    fetchEmployees();
    const interval = setInterval(fetchEmployees, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const availableEmployees = employees.filter((e) => e.status === 'disponible');
  const otherEmployees = employees.filter((e) => e.status !== 'disponible');

  const commonReasons = [
    { label: '💡 Dudas de productos', icon: 'fa-solid fa-tag' },
    { label: '💳 Cotizar crédito o pagos', icon: 'fa-solid fa-calculator' },
    { label: '📦 Envío a domicilio o garantía', icon: 'fa-solid fa-truck-fast' },
    { label: '💰 Pagar abono o saldo', icon: 'fa-solid fa-receipt' },
    { label: '🗣️ Asesoría general en piso', icon: 'fa-solid fa-comments' },
  ];

  const handleCallFirstAvailable = () => {
    setIsLoading(true);
    soundEffects.playSuccessChime();
    if (isVoiceEnabled) {
      voice.speak('Solicitud enviada. Un asesor disponible viene en camino a tu pasillo.');
    }
    onTriggerAssistance(selectedReason);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleCallSpecificEmployee = (emp: Employee) => {
    setIsLoading(true);
    soundEffects.playSuccessChime();
    if (isVoiceEnabled) {
      voice.speak(`Llamando a ${emp.name}. Recibirá la alerta en su celular de inmediato.`);
    }
    onTriggerAssistance(`Solicitud dirigida para ${emp.name}: ${selectedReason}`, emp.id);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-[32px] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-[#002B66] overflow-hidden">
        {/* Encabezado Principal */}
        <div className="bg-gradient-to-r from-blue-900 via-[#002B66] to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center text-2xl font-black shadow-md">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Pedir Asesoría a tu Pasillo</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  ● Servicio en Vivo
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Llama a un empleado a tu ubicación exacta con notificación directa a su celular
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition-colors"
            title="Cerrar ventana"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto screen-scroll space-y-5">
          {/* SI YA HAY UNA LLAMADA ACTIVA */}
          {activeCall && activeCall.status !== 'resolved' && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-2xl shadow animate-bounce">
                    <i className="fa-solid fa-person-walking-arrow-right"></i>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {activeCall.status === 'in_transit' ? '🏃‍♂️ Asesor en Camino' : '🚨 Notificación Enviada al Celular'}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#002B66] mt-0.5">
                      {activeCall.assignedAssociateName || 'Personal de Tienda Coppel'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {activeCall.assignedAssociateRole || 'Asesor de Piso y Crédito'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-[#002B66] font-mono">
                    ~{activeCall.estimatedArrivalSeconds}s
                  </div>
                  <div className="text-[10px] text-slate-500">Llegada estimada</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#002B66]">Ubicación solicitada: </span>
                  <span>{activeCall.aisle}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <i className="fa-solid fa-check mr-1"></i> Notificado en móvil
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    onCancelAssistance();
                    onClose();
                  }}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 transition-colors"
                >
                  <i className="fa-solid fa-ban mr-1.5 text-red-500"></i>
                  Cancelar solicitud
                </button>
              </div>
            </div>
          )}

          {/* ACCIÓN RÁPIDA: LLAMAR AL PRIMER ASESOR DISPONIBLE */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 sm:p-5 rounded-3xl border-2 border-amber-400 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  {availableEmployees.length} asesores disponibles ahora mismo
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#002B66] mt-0.5">
                ¿Necesitas atención inmediata?
              </h3>
              <p className="text-xs text-slate-600">
                Enviará una alerta con sonido al radiolocalizador del asesor más cercano.
              </p>
            </div>

            <button
              onClick={handleCallFirstAvailable}
              disabled={isLoading}
              className="w-full sm:w-auto py-3.5 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#002B66] font-black rounded-2xl text-sm shadow-md flex items-center justify-center space-x-2 btn-motion shrink-0"
            >
              <i className="fa-solid fa-bell text-base animate-pulse"></i>
              <span>Llamar al Primer Asesor Libre</span>
            </button>
          </div>

          {/* MOTIVO DE LA ASISTENCIA */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>¿En qué te podemos ayudar?</span>
              <span className="text-[11px] text-slate-400 font-normal">Toca para seleccionar</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((reason) => (
                <button
                  key={reason.label}
                  type="button"
                  onClick={() => setSelectedReason(reason.label)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    selectedReason === reason.label
                      ? 'bg-[#002B66] text-amber-300 shadow-sm scale-102'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <i className={reason.icon}></i>
                  <span>{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE EMPLEADOS Y DISPONIBILIDAD EN TIEMPO REAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-users text-[#002B66]"></i>
                <span>Equipo de Tienda en Turno ({employees.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Actualizado en tiempo real
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Empleados disponibles */}
              {availableEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white border-2 border-emerald-300/80 hover:border-emerald-500 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-300 relative">
                      {emp.initials}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-xs text-[#002B66] truncate block">
                          {emp.name}
                        </span>
                        {emp.badge && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                            ★ {emp.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {emp.role}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold block">
                        ● Disponible en {emp.currentAisle.split('-')[0]}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallSpecificEmployee(emp)}
                    disabled={isLoading}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs group-hover:scale-105"
                    title={`Solicitar atención de ${emp.name}`}
                  >
                    Pedir
                  </button>
                </div>
              ))}

              {/* Otros empleados (en piso / ocupados) */}
              {otherEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2.5 opacity-75"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {emp.initials}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 truncate block">
                        {emp.name}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {emp.role}
                      </span>
                      <span className="text-[9px] text-amber-700 font-medium block">
                        {emp.status === 'en_piso'
                          ? '○ En piso de venta con cliente'
                          : emp.status === 'ocupado'
                          ? '○ Ocupado en caja'
                          : '○ En descanso de turno'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-200/50 rounded-lg">
                    {emp.status === 'descanso' ? 'En descanso' : 'Con cliente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>
            <i className="fa-solid fa-mobile-screen-button mr-1 text-[#002B66]"></i>
            Conectado al sistema de radiolocalización y celulares Coppel Staff
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
