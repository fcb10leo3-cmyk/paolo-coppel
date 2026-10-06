import React from 'react';
import { TabId } from '../types';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  citaBadgeCount?: number;
  kioscoReady?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  citaBadgeCount = 0,
  kioscoReady = false,
}) => {
  const tabs: { id: TabId; label: string; icon: string; badge?: boolean | number }[] = [
    { id: 'home', label: 'Inicio', icon: 'fa-solid fa-house' },
    { id: 'cita', label: 'Cita VIP', icon: 'fa-solid fa-calendar-check', badge: citaBadgeCount > 0 ? citaBadgeCount : false },
    { id: 'tarjetas', label: 'Wallet', icon: 'fa-solid fa-wallet' },
    { id: 'compra', label: 'Kiosco', icon: 'fa-solid fa-cart-shopping', badge: kioscoReady },
  ];

  return (
    <nav className="coppel-yellow py-2 px-2 flex justify-around items-center border-t border-amber-500/40 z-40 select-none shrink-0 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1 flex flex-col items-center justify-center relative btn-motion focus:outline-none ${
              isActive
                ? 'text-[#002B66] font-extrabold'
                : 'text-blue-950/60 hover:text-[#002B66] font-medium'
            }`}
          >
            <div className="relative">
              <i
                className={`${tab.icon} text-base transition-transform duration-150 ${
                  isActive ? 'scale-110 drop-shadow-sm' : ''
                }`}
              ></i>
              {tab.badge && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#002B66] text-amber-300 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-amber-300 animate-pulse">
                  {typeof tab.badge === 'number' ? tab.badge : '•'}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight transition-all ${
                isActive ? 'font-bold scale-105' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#002B66] mt-0.5"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
