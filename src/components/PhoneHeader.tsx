import React from 'react';

export type DeviceMode = 'iphone' | 'samsung' | 'tablet' | 'fluid';

interface PhoneHeaderProps {
  isWireframe: boolean;
  onToggleWireframe: () => void;
  deviceMode?: DeviceMode;
  currentTime?: string;
}

export const PhoneHeader: React.FC<PhoneHeaderProps> = ({
  isWireframe,
  onToggleWireframe,
  deviceMode = 'iphone',
  currentTime = '10:24',
}) => {
  return (
    <div className="shrink-0 relative z-40 select-none">
      {/* Dynamic Camera / Notch based on device */}
      {deviceMode === 'iphone' && (
        <div className="notch">
          <div className="notch-camera"></div>
          <div className="notch-sensor"></div>
        </div>
      )}

      {deviceMode === 'samsung' && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50">
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-700/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-blue-900/50"></div>
          </div>
        </div>
      )}

      {deviceMode === 'tablet' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50">
          <div className="w-2.5 h-2.5 rounded-full bg-black border border-slate-700"></div>
        </div>
      )}

      {/* System Status Bar */}
      <div className={`px-5 text-white flex justify-between items-center text-[11px] font-semibold tracking-tight coppel-navy ${
        deviceMode === 'fluid' ? 'pt-2 pb-1' : 'pt-2.5 pb-1'
      }`}>
        <span className="font-mono">{currentTime}</span>
        <div className="flex items-center space-x-2 opacity-90 text-[10px]">
          <span className="font-bold text-[9px] tracking-wider text-amber-300">
            {deviceMode === 'iphone' ? 'iOS' : deviceMode === 'samsung' ? 'OneUI' : deviceMode === 'tablet' ? 'Tablet' : 'PWA'}
          </span>
          <i className="fa-solid fa-signal"></i>
          <span className="font-bold text-[9px] tracking-wide">5G</span>
          <i className="fa-solid fa-wifi"></i>
          <div className="flex items-center space-x-1 ml-1">
            <span className="text-[9px] font-mono">100%</span>
            <i className="fa-solid fa-battery-full text-xs text-green-400"></i>
          </div>
        </div>
      </div>

      {/* Main Coppel Navy Header Bar */}
      <div className="px-4 py-2.5 coppel-navy text-white flex justify-between items-center shadow-md border-b border-blue-950/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-400 shadow-sm flex items-center justify-center font-extrabold text-[#002B66] text-xs transition-transform hover:scale-105 shrink-0">
            C
          </div>
          <div className="flex flex-col">
            <div className="font-extrabold tracking-wider text-sm leading-tight flex items-center gap-1.5">
              <span>Coppel</span>
              <span className="text-amber-400 font-light tracking-widest text-[11px] px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                SELECT
              </span>
            </div>
            <span className="text-[9px] text-blue-200 tracking-wider font-semibold uppercase">
              Experiencia VIP
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onToggleWireframe}
            title="Alternar vista técnica de wireframe"
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full btn-motion flex items-center space-x-1 transition-all ${
              isWireframe
                ? 'bg-amber-400 text-slate-900 font-bold shadow'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <i className="fa-solid fa-vector-square text-[10px]"></i>
            <span className="hidden sm:inline">{isWireframe ? 'Wireframe ON' : 'Wireframe'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
