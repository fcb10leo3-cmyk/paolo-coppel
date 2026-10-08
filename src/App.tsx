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
    <div className="min-h-screen bg-[#040915] text-slate-100 flex flex-col justify-start relative overflow-x-hidden selection:bg-amber-400 selection:text-[#002B66]">
      {/* Luces ambientales showroom de fondo */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[200px]"></div>
      </div>

      {/* BARRA SUPERIOR: SELECTOR DE PERFILES Y BOTÓN DE COMPARTIR */}
      <nav className="w-full bg-slate-950/95 border-b border-slate-800 px-3 sm:px-6 py-2.5 backdrop-blur-md sticky top-0 z-40 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#002B66] flex items-center justify-center font-black text-sm shadow">
            <i className="fa-solid fa-key"></i>
          </div>
          <div>
            <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight block leading-none">
              Coppel Staff & Despacho
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              Sistema de Asistencia en Piso
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* BOTÓN RÁPIDO: COMPARTIR / CONECTAR KIOSCO */}
          <button
            onClick={() => handleOpenShareModal('kiosk_api')}
            className="py-1.5 px-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold border border-blue-500/40 shadow flex items-center space-x-1.5 transition-all active:scale-95"
            title="Conectar con Kiosco Tótem externo o compartir links con QR"
          >
            <i className="fa-solid fa-plug-circle-bolt text-amber-400"></i>
            <span className="hidden sm:inline">Conectar Kiosco / QR</span>
            <span className="sm:hidden">Conectar</span>
          </button>

          {/* SELECTOR RÁPIDO DE PERFIL CON 1 CLIC */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
            <button
              onClick={() => setActiveRole('admin')}
              className={`py-1.5 px-2.5 sm:px-4 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeRole === 'admin'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-shield-halved text-xs"></i>
              <span>Admin</span>
            </button>

            <button
              onClick={() => setActiveRole('staff')}
              className={`py-1.5 px-2.5 sm:px-4 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeRole === 'staff'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user-tag text-xs"></i>
              <span>Asesor</span>
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL SEGÚN EL ROL SELECCIONADO */}
      <main className="flex-1 w-full pb-8 pt-2">
        {activeRole === 'admin' ? (
          /* PERFIL 1: TABLERO DEL ADMINISTRADOR (SUPERVISOR DE TIENDA) */
          <AdminDashboardView
            onSwitchToStaffRole={() => setActiveRole('staff')}
            onOpenShareModal={handleOpenShareModal}
          />
        ) : (
          /* PERFIL 2: PERSONAL QUE ATIENDE (ASESOR EN PISO - ACEPTAR O RECHAZAR) */
          <StaffAttendantView
            onSwitchToAdminRole={() => setActiveRole('admin')}
            onOpenShareModal={handleOpenShareModal}
          />
        )}
      </main>

      {/* MODAL DE COMPARTIR LINKS, CÓDIGOS QR Y CONEXIÓN CON KIOSCO EXTERNO */}
      <ShareDevicesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        initialTab={shareModalTab}
      />
    </div>
  );
}
