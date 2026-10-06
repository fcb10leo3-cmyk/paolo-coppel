import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'gold';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div
      id="toast"
      className="absolute top-20 left-4 right-4 bg-[#002B66] text-white text-xs p-3.5 rounded-2xl shadow-2xl z-50 flex items-center space-x-2.5 border border-amber-400/40 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
        {type === 'gold' ? (
          <i className="fa-solid fa-crown text-amber-300 text-sm"></i>
        ) : (
          <i className="fa-solid fa-circle-check text-amber-400 text-sm"></i>
        )}
      </div>
      <span className="font-medium text-slate-100 flex-1 leading-snug">
        {message}
      </span>
      <span className="text-[10px] text-amber-300/80 font-mono">SELECT</span>
    </div>
  );
};
