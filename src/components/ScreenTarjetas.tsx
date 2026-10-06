import React, { useState } from 'react';
import { CreditCardItem, LoyaltyProfile } from '../types';
import { api } from '../services/api';

interface ScreenTarjetasProps {
  profile: LoyaltyProfile;
  onShowToast: (msg: string) => void;
}

export const ScreenTarjetas: React.FC<ScreenTarjetasProps> = ({
  profile,
  onShowToast,
}) => {
  const [activeCardId, setActiveCardId] = useState<string>('navy');
  const [showCvv, setShowCvv] = useState<boolean>(false);
  const [dynamicCvv, setDynamicCvv] = useState<string>('419');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const cards: CreditCardItem[] = [
    {
      id: 'navy',
      tier: 'Navy VIP',
      name: 'Coppel Navy VIP',
      maskedNumber: '•••• •••• •••• 8842',
      creditLimit: profile.creditLine,
      available: profile.availableCredit,
      points: profile.coppelMaxPoints,
      isCurrent: true,
      isUnlocked: true,
      accentColor: '#FFD100',
      themeGradient: 'from-blue-950 via-[#002B66] to-indigo-950',
      perks: ['24 quincenas tasa preferencial', 'Snacks en sucursal', 'Atención sin filas'],
    },
    {
      id: 'gold',
      tier: 'Gold VIP',
      name: 'Coppel Gold VIP Prestige',
      maskedNumber: '•••• •••• •••• 9901',
      creditLimit: 80000,
      available: 80000,
      points: 7500,
      isCurrent: false,
      isUnlocked: false,
      accentColor: '#F59E0B',
      themeGradient: 'from-amber-600 via-amber-700 to-yellow-800',
      perks: ['Línea ampliada a $80k', 'Doble puntos Coppel Max', 'Asesor personal 24/7'],
    },
    {
      id: 'plus',
      tier: 'Coppel Plus',
      name: 'Coppel Departamental Plus',
      maskedNumber: '•••• •••• •••• 4120',
      creditLimit: 25000,
      available: 25000,
      points: 1200,
      isCurrent: false,
      isUnlocked: true,
      accentColor: '#60A5FA',
      themeGradient: 'from-slate-800 via-slate-900 to-blue-950',
      perks: ['Compras departamentales', 'Abonos quincenales'],
    },
  ];

  const currentCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleCardClick = (id: string) => {
    setActiveCardId(id);
    if (id === 'gold') {
      onShowToast('Tarjeta Gold VIP: Próximo nivel tras 2 pagos puntuales.');
    } else {
      onShowToast(`Tarjeta ${id.toUpperCase()} seleccionada.`);
    }
  };

  const toggleFreeze = async () => {
    try {
      const res = await api.toggleFreezeCard(activeCardId);
      setIsFrozen(res.isFrozen);
      onShowToast(res.message);
    } catch {
      setIsFrozen(!isFrozen);
      onShowToast(
        isFrozen
          ? 'Tarjeta reactivada exitosamente.'
          : 'Tarjeta bloqueada temporalmente por seguridad.'
      );
    }
  };

  const handleShowCvv = async () => {
    if (!showCvv) {
      try {
        const res = await api.getDynamicCVV(activeCardId);
        if (res.cvv) {
          setDynamicCvv(res.cvv);
          setSecondsRemaining(res.secondsRemaining || 300);
        }
      } catch {
        // Fallback
      }
    }
    setShowCvv(!showCvv);
  };

  return (
    <div id="screen-tarjetas" className="screen active px-4 pt-3 pb-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-[#002B66]">
          Billetera de Lealtad & Tarjetas
        </h3>
        <span className="text-[10px] text-slate-500 font-medium">
          Apple Pay Style
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Columna Izquierda: Tarjetas Stack */}
        <div>
          {/* Stack de Tarjetas Interactivas */}
          <div className="relative mb-3 pt-1">
            <div className="space-y-2">
              {cards.map((card) => {
                const isSelected = card.id === activeCardId;

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`transition-all duration-300 cursor-pointer rounded-2xl p-4 text-white relative overflow-hidden shadow-xl btn-motion border ${
                      isSelected
                        ? `bg-gradient-to-tr ${card.themeGradient} border-amber-400/50 scale-100 z-20 ring-2 ring-amber-400/30`
                        : 'bg-slate-800/90 border-slate-700/60 opacity-80 hover:opacity-100 scale-98 z-10'
                    }`}
                  >
                    {/* Chip EMV & Contactless */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                          {card.tier}
                        </span>
                        {!card.isUnlocked && (
                          <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 flex items-center gap-1 font-mono">
                            <i className="fa-solid fa-lock text-[8px]"></i> Próximo nivel
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300 text-sm">
                        {isFrozen && isSelected && (
                          <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Pausada
                          </span>
                        )}
                        <i className="fa-solid fa-wifi rotate-90 text-xs text-amber-300"></i>
                      </div>
                    </div>

                    {/* EMV Gold Chip visual */}
                    <div className="w-9 h-7 rounded bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 border border-yellow-200/50 shadow-inner mb-3 flex flex-col justify-around p-1">
                      <div className="w-full h-0.5 bg-amber-700/40"></div>
                      <div className="w-full h-0.5 bg-amber-700/40"></div>
                    </div>

                    {/* Número de Tarjeta */}
                    <p className="text-xs tracking-widest font-mono mb-3 text-slate-100 font-semibold drop-shadow-sm">
                      {card.maskedNumber}
                    </p>

                    {/* Footer de Tarjeta con Línea y Puntos */}
                    <div className="flex justify-between items-end border-t border-white/10 pt-2">
                      <div>
                        <p className="text-[9px] text-blue-200 uppercase tracking-wider font-semibold">
                          LÍNEA DE CRÉDITO
                        </p>
                        <p className="text-sm sm:text-base font-extrabold text-white">
                          ${card.creditLimit.toLocaleString('es-MX')} MXN
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-amber-300 uppercase tracking-wider font-semibold">
                          PUNTOS COPPEL MAX
                        </p>
                        <p className="text-sm sm:text-base font-extrabold text-amber-400">
                          {card.points.toLocaleString('es-MX')} pts
                        </p>
                      </div>
                    </div>

                    {/* Watermark Logo */}
                    <div className="absolute right-3 bottom-3 opacity-15 pointer-events-none text-4xl font-extrabold text-white">
                      C
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controles de Seguridad Digital */}
          {currentCard.isUnlocked && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleShowCvv}
                className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-center btn-motion hover:bg-slate-50"
              >
                <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px]">
                  <i className="fa-solid fa-shield-halved text-blue-600 text-xs"></i>
                  <span className="font-bold">CVV Dinámico</span>
                </div>
                <p className="text-xs font-mono font-bold text-[#002B66] mt-1">
                  {showCvv ? `${dynamicCvv} (Vence en ${Math.floor(secondsRemaining / 60)}:00)` : '••• Mostrar'}
                </p>
              </button>

              <button
                onClick={toggleFreeze}
                className={`p-2.5 rounded-xl border shadow-sm text-center btn-motion transition-colors ${
                  isFrozen
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 text-[10px]">
                  <i className={`fa-solid ${isFrozen ? 'fa-lock-open text-amber-600' : 'fa-snowflake text-cyan-600'} text-xs`}></i>
                  <span className="font-bold">{isFrozen ? 'Reactivar' : 'Congelar Tarjeta'}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isFrozen ? 'Tarjeta pausada' : 'Bloqueo temporal'}
                </p>
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Niveles y Movimientos */}
        <div className="space-y-3">
          {/* Avance de Niveles (Original del prompt) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
            <span className="text-slate-700 font-bold text-[11px]">Tarjetas Disponibles:</span>
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="text-slate-400">Básica</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">Plus</span>
              <span className="text-slate-300">|</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#002B66] font-extrabold border border-blue-200">
                Navy VIP
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600 font-semibold">Gold</span>
            </div>
          </div>

          {/* Felicitación por pagos puntuales (Original del prompt) */}
          <div className="p-3.5 bg-green-50 rounded-xl border border-green-200 text-green-800 text-[11px] flex items-center space-x-2.5">
            <i className="fa-solid fa-circle-check text-green-600 text-lg shrink-0"></i>
            <div>
              <span className="font-bold block">¡Felicidades! Mantienes pagos puntuales este mes.</span>
              <span className="text-[10px] text-green-700">Tu historial 100% limpio te califica para incremento de saldo automático.</span>
            </div>
          </div>

          {/* Movimientos Recientes de la Billetera */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-bold text-slate-700">Movimientos Recientes</span>
              <span className="text-[9px] text-[#002B66] font-semibold cursor-pointer">Ver todos</span>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Abono Quincenal Puntual</p>
                  <p className="text-slate-400 text-[9px]">05 Oct 2026 · Coppel App</p>
                </div>
                <span className="font-bold text-emerald-600">-$625.00 MXN</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Bonificación Puntos Max</p>
                  <p className="text-slate-400 text-[9px]">05 Oct 2026 · Recompensa VIP</p>
                </div>
                <span className="font-bold text-amber-600">+120 pts</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <div>
                  <p className="font-bold text-slate-800">Compra Samsung OLED 65"</p>
                  <p className="text-slate-400 text-[9px]">Kiosco Sucursal Monumento</p>
                </div>
                <span className="font-bold text-slate-800">$14,999.00 MXN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
