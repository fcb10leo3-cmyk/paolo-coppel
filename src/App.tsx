import React, { useState } from 'react';
import { UserRole } from './types';
import { StaffAttendantView } from './components/StaffAttendantView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { RequesterKioskView } from './components/RequesterKioskView';
import { ShareDevicesModal } from './components/ShareDevicesModal';
import { RequestSupportModal } from './components/RequestSupportModal';

export default function App() {
  // En esta app y versión: Modo Asesor de Piso por defecto
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'admin' || roleParam === 'supervisor' || roleParam === 'gerente') return 'admin';
      if (roleParam === 'requester' || roleParam === 'solicitar' || roleParam === 'caja') return 'requester';
    }
    return 'staff'; // "en esta app y versión solo asesor, quedemonos aquí"
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareModalTab, setShareModalTab] = useState<'multi_pc' | 'staff' | 'admin' | 'requester' | 'kiosk_api' | 'deploy'>('staff');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const handleOpenShareModal = (tab: 'multi_pc' | 'staff' | 'admin' | 'requester' | 'kiosk_api' | 'deploy' = 'staff') => {
    setShareModalTab(tab);
    setIsShareModalOpen(true);
  };

  const handleOpenRequestModal = () => {
    setIsRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col justify-start relative overflow-x-hidden selection:bg-[#FFD100] selection:text-[#0047BA]">
      {/* 1. APP HEADER OFICIAL COPPEL ASESORES DE PISO */}
      <header className="w-full bg-[#0047BA] text-white shadow-md sticky top-0 z-40 border-b-2 border-[#FFD100]">
        <div className="max-w-4xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* IDENTIDAD DE LA APP COPPEL ASESORES */}
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
                  Asesor Piso
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span className="text-[10px] text-blue-100 font-medium leading-none">
                  App Asesores · Firebase Firestore en Vivo
                </span>
              </div>
            </div>
          </div>

          {/* ACCIONES DE APP ASESOR */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* BOTÓN SOLICITAR APOYO / REFUERZO A COMPAÑERO O GERENTE */}
            <button
              onClick={handleOpenRequestModal}
              className="py-1.5 px-2.5 sm:px-3 bg-[#FFD100] hover:bg-amber-300 active:scale-95 text-[#0047BA] rounded-xl text-xs font-black shadow-md border border-white/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Solicitar apoyo o refuerzo a compañeros o al gerente"
            >
              <i className="fa-solid fa-bullhorn text-[#0047BA]"></i>
              <span className="hidden sm:inline">Pedir Apoyo</span>
              <span className="sm:hidden">Apoyo</span>
            </button>

            {/* BOTÓN QR PARA ABRIR EN EL CELULAR */}
            <button
              onClick={() => handleOpenShareModal('staff')}
              className="py-1.5 px-2.5 sm:px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 shadow flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              title="Escanear código QR para abrir en tu celular"
            >
              <i className="fa-solid fa-qrcode text-[#FFD100]"></i>
              <span className="hidden md:inline">QR Celular</span>
              <span className="md:hidden">QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL: VISTA DE ASESOR EN PISO */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-2 sm:p-4 pb-24 sm:pb-12">
        {activeRole === 'admin' ? (
          <AdminDashboardView
            onSwitchToStaffRole={() => setActiveRole('staff')}
            onOpenShareModal={handleOpenShareModal}
          />
        ) : activeRole === 'requester' ? (
          <RequesterKioskView
            onSwitchToAdminRole={() => setActiveRole('admin')}
            onSwitchToStaffRole={() => setActiveRole('staff')}
            onOpenShareModal={handleOpenShareModal}
          />
        ) : (
          /* MODO PRINCIPAL: ASESOR DE PISO */
          <StaffAttendantView
            onSwitchToAdminRole={() => setActiveRole('admin')}
            onOpenShareModal={handleOpenShareModal}
          />
        )}
      </main>

      {/* 3. BARRA DE NAVEGACIÓN INFERIOR ESTILO APP MÓVIL ASESOR */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t-2 border-[#0047BA] shadow-2xl z-40 px-3 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveRole('staff')}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
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
          <span className="text-[10px] mt-0.5">Mi Turno</span>
        </button>

        <button
          type="button"
          onClick={handleOpenRequestModal}
          className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-[#0047BA] font-black hover:text-blue-800 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFD100] text-[#0047BA] flex items-center justify-center text-sm shadow border border-amber-400">
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <span className="text-[10px] mt-0.5">Pedir Apoyo</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenShareModal('staff')}
          className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-slate-500 font-bold hover:text-[#0047BA] transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm text-[#0047BA]">
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <span className="text-[10px] mt-0.5">QR Celular</span>
        </button>
      </nav>

      {/* 4. MODAL DE SOLICITUD DE APOYO A PISO */}
      <RequestSupportModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        defaultRequester="asesor"
      />

      {/* 5. MODAL DE VINCULACIÓN QR / CONEXIÓN MULTI-DISPOSITIVO */}
      <ShareDevicesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        initialTab={shareModalTab}
      />
    </div>
  );
}
