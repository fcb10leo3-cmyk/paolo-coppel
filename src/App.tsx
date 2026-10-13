import React, { useState } from 'react';
import { UserRole } from './types';
import { AdminDashboardView } from './components/AdminDashboardView';
import { StaffAttendantView } from './components/StaffAttendantView';
import { ShareDevicesModal } from './components/ShareDevicesModal';

export default function App() {
  // Detectar rol inicial según parámetro URL (?role=admin o ?role=staff) o por defecto Administrador
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'staff' || roleParam === 'personal') return 'staff';
      if (roleParam === 'admin' || roleParam === 'supervisor') return 'admin';
    }
    return 'admin';
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareModalTab, setShareModalTab] = useState<'staff' | 'admin' | 'kiosk_api' | 'deploy'>('staff');

  const handleOpenShareModal = (tab: 'staff' | 'admin' | 'kiosk_api' | 'deploy' = 'staff') => {
    setShareModalTab(tab);
    setIsShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col justify-start relative overflow-x-hidden selection:bg-[#FFD100] selection:text-[#0047BA]">
      {/* 1. APP HEADER ESTILO APLICACIÓN COPPEL COLABORADORES (NO PÁGINA WEB) */}
      <header className="w-full bg-[#0047BA] text-white shadow-md sticky top-0 z-40 border-b-2 border-[#FFD100]">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* IDENTIDAD DE LA APP COPPEL */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Ícono Oficial: 3 puntos amarillos Coppel */}
            <div className="flex items-center space-x-1 bg-white/15 px-2 py-1 rounded-xl border border-white/20 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100] shadow-sm"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100] shadow-sm"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD100] shadow-sm"></span>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none font-sans">
                  Coppel
                </span>
                <span className="bg-[#FFD100] text-[#0047BA] text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                  App Piso
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span className="text-[10px] text-blue-100 font-medium leading-none">
                  Red de Asistencia en Tienda
                </span>
              </div>
            </div>
          </div>

          {/* ACCIONES DE APP: SELECTOR DE ROL Y CONEXIÓN */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* BOTÓN CONECTAR / QR */}
            <button
              onClick={() => handleOpenShareModal('kiosk_api')}
              className="py-1.5 px-2.5 sm:px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 shadow flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              title="Vincular con Kiosco o compartir códigos QR para celular"
            >
              <i className="fa-solid fa-qrcode text-[#FFD100]"></i>
              <span className="hidden sm:inline">QR / Vincular</span>
              <span className="sm:hidden">QR</span>
            </button>

            {/* SELECTOR RÁPIDO DE MODO EN LA APP: SUPERVISOR (ADMIN) VS ASESOR (STAFF) */}
            <div className="flex items-center bg-[#003899] p-1 rounded-2xl border border-white/20 shadow-inner">
              <button
                onClick={() => setActiveRole('staff')}
                className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer ${
                  activeRole === 'staff'
                    ? 'bg-[#FFD100] text-[#0047BA] shadow font-black'
                    : 'text-blue-100 hover:text-white font-bold'
                }`}
                title="Modo Asesor en Piso (Atender clientes y registrar puntos)"
              >
                <i className="fa-solid fa-headset text-xs"></i>
                <span>Asesor</span>
              </button>

              <button
                onClick={() => setActiveRole('admin')}
                className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-[#FFD100] text-[#0047BA] shadow font-black'
                    : 'text-blue-100 hover:text-white font-bold'
                }`}
                title="Modo Supervisor / Tablero de tienda"
              >
                <i className="fa-solid fa-shield-halved text-xs"></i>
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL DE LA APP (CONSERVA POSICIONES Y DISEÑO) */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-2 sm:p-4 pb-24 sm:pb-12">
        {activeRole === 'admin' ? (
          /* VISTA 1: TABLERO DEL ADMINISTRADOR (SUPERVISOR EN PISO) */
          <AdminDashboardView
            onSwitchToStaffRole={() => setActiveRole('staff')}
            onOpenShareModal={handleOpenShareModal}
          />
        ) : (
          /* VISTA 2: TERMINAL DEL ASESOR EN PISO */
          <StaffAttendantView
            onSwitchToAdminRole={() => setActiveRole('admin')}
            onOpenShareModal={handleOpenShareModal}
          />
        )}
      </main>

      {/* 3. BARRA DE NAVEGACIÓN INFERIOR ESTILO APP NATIVA (MÓVIL / PANTALLA TÁCTIL) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t-2 border-[#0047BA] shadow-2xl z-40 px-3 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveRole('staff')}
          className={`flex-1 py-1 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeRole === 'staff'
              ? 'text-[#0047BA] font-black'
              : 'text-slate-500 font-bold hover:text-slate-700'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
            activeRole === 'staff' ? 'bg-[#0047BA] text-[#FFD100] shadow' : 'bg-slate-100'
          }`}>
            <i className="fa-solid fa-headset"></i>
          </div>
          <span className="text-[10px] mt-0.5">Asesor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRole('admin')}
          className={`flex-1 py-1 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeRole === 'admin'
              ? 'text-[#0047BA] font-black'
              : 'text-slate-500 font-bold hover:text-slate-700'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
            activeRole === 'admin' ? 'bg-[#0047BA] text-[#FFD100] shadow' : 'bg-slate-100'
          }`}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="text-[10px] mt-0.5">Supervisor</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenShareModal('kiosk_api')}
          className="flex-1 py-1 px-2 rounded-xl flex flex-col items-center justify-center text-slate-500 font-bold hover:text-[#0047BA] transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm text-[#0047BA]">
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <span className="text-[10px] mt-0.5">Vincular QR</span>
        </button>
      </nav>

      {/* 4. MODAL DE VINCULACIÓN QR / CONEXIÓN KIOSCO */}
      <ShareDevicesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        initialTab={shareModalTab}
      />
    </div>
  );
}
