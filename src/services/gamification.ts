// Sistema de Gamificación y Niveles para Asesores Coppel
export interface GamificationLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  badgeIcon: string;
  badgeColor: string;
  badgeTextColor: string;
  borderColor: string;
  perks: string;
}

export const GAMIFICATION_LEVELS: GamificationLevel[] = [
  {
    level: 1,
    title: 'Novato de Tienda',
    minPoints: 0,
    maxPoints: 499,
    badgeIcon: 'fa-seedling',
    badgeColor: 'bg-emerald-950',
    badgeTextColor: 'text-emerald-300',
    borderColor: 'border-emerald-600',
    perks: 'Primeros pasos en piso de venta',
  },
  {
    level: 2,
    title: 'Asesor Bronce',
    minPoints: 500,
    maxPoints: 999,
    badgeIcon: 'fa-medal',
    badgeColor: 'bg-amber-950',
    badgeTextColor: 'text-amber-400',
    borderColor: 'border-amber-700',
    perks: 'Atención ágil demostrada',
  },
  {
    level: 3,
    title: 'Especialista Plata',
    minPoints: 1000,
    maxPoints: 1799,
    badgeIcon: 'fa-award',
    badgeColor: 'bg-slate-800',
    badgeTextColor: 'text-slate-200',
    borderColor: 'border-slate-400',
    perks: 'Dominio de catálogo y garantías',
  },
  {
    level: 4,
    title: 'Master Oro',
    minPoints: 1800,
    maxPoints: 2599,
    badgeIcon: 'fa-crown',
    badgeColor: 'bg-yellow-950',
    badgeTextColor: 'text-yellow-300',
    borderColor: 'border-yellow-500',
    perks: 'Referente de calidad en sucursal',
  },
  {
    level: 5,
    title: 'Líder Diamante',
    minPoints: 2600,
    maxPoints: 3499,
    badgeIcon: 'fa-gem',
    badgeColor: 'bg-cyan-950',
    badgeTextColor: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    perks: 'Top ventas y resolución perfecta',
  },
  {
    level: 6,
    title: 'Leyenda Coppel',
    minPoints: 3500,
    maxPoints: 99999,
    badgeIcon: 'fa-shield-halved',
    badgeColor: 'bg-purple-950',
    badgeTextColor: 'text-purple-300',
    borderColor: 'border-purple-400',
    perks: 'Máximo prestigio en piso nacional',
  },
];

export interface RoadMilestone {
  id: string;
  targetPoints: number;
  title: string;
  reward: string;
  icon: string;
  color: string;
}

export const ROAD_MILESTONES: RoadMilestone[] = [
  {
    id: 'm1',
    targetPoints: 500,
    title: 'Hito 1: Despegue en Piso',
    reward: 'Insignia Bronce + Felicitación',
    icon: 'fa-flag-checkered',
    color: 'from-amber-600 to-amber-700',
  },
  {
    id: 'm2',
    targetPoints: 1000,
    title: 'Hito 2: Maestro de Pasillo',
    reward: 'Insignia Plata + Bono de Rapidez',
    icon: 'fa-bolt',
    color: 'from-slate-400 to-slate-600',
  },
  {
    id: 'm3',
    targetPoints: 1800,
    title: 'Hito 3: Estrella de Clientes',
    reward: 'Insignia Oro + Reconocimiento Admin',
    icon: 'fa-star',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'm4',
    targetPoints: 2600,
    title: 'Hito 4: Guardián Diamante',
    reward: 'Insignia Diamante + Bono Quincenal',
    icon: 'fa-gem',
    color: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'm5',
    targetPoints: 3500,
    title: 'Hito 5: Salón de la Fama Coppel',
    reward: 'Trofeo Leyenda + Bono Especial',
    icon: 'fa-crown',
    color: 'from-purple-500 to-pink-600',
  },
];

export function getGamificationLevel(points: number): GamificationLevel {
  const pts = Math.max(0, points);
  for (let i = GAMIFICATION_LEVELS.length - 1; i >= 0; i--) {
    if (pts >= GAMIFICATION_LEVELS[i].minPoints) {
      return GAMIFICATION_LEVELS[i];
    }
  }
  return GAMIFICATION_LEVELS[0];
}

export function getLevelProgress(points: number): {
  currentLevel: GamificationLevel;
  nextLevel: GamificationLevel | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const currentLevel = getGamificationLevel(points);
  const nextLevel =
    GAMIFICATION_LEVELS.find((lvl) => lvl.level === currentLevel.level + 1) || null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }

  const range = nextLevel.minPoints - currentLevel.minPoints;
  const currentInRange = Math.max(0, points - currentLevel.minPoints);
  const progressPercent = Math.min(100, Math.round((currentInRange / range) * 100));
  const pointsToNext = Math.max(0, nextLevel.minPoints - points);

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    pointsToNext,
  };
}

export function calculatePointsForAssistance(params: {
  outcome: 'resuelto_exitoso' | 'no_resuelto';
  elapsedSeconds?: number;
  currentStreak?: number;
}): {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  totalPoints: number;
  reasons: string[];
} {
  if (params.outcome !== 'resuelto_exitoso') {
    return {
      basePoints: 10, // Pequeño incentivo por acudir y atender en piso
      speedBonus: 0,
      streakBonus: 0,
      totalPoints: 10,
      reasons: ['+10 PTS por esfuerzo de atención en piso'],
    };
  }

  const basePoints = 100;
  const reasons: string[] = ['+100 PTS por asistencia exitosa'];

  // Bono de rapidez (si atendió en menos de 50 segundos)
  let speedBonus = 0;
  if (params.elapsedSeconds && params.elapsedSeconds <= 45) {
    speedBonus = 50;
    reasons.push(`+50 PTS Bono de rapidez (${params.elapsedSeconds}s)`);
  } else if (params.elapsedSeconds && params.elapsedSeconds <= 90) {
    speedBonus = 25;
    reasons.push(`+25 PTS Bono de atención ágil (${params.elapsedSeconds}s)`);
  }

  // Bono de racha de éxitos consecutivos
  let streakBonus = 0;
  const streak = (params.currentStreak || 0) + 1;
  if (streak >= 5) {
    streakBonus = 50;
    reasons.push(`+50 PTS Racha de fuego (${streak} consecutivas) 🔥🔥`);
  } else if (streak >= 3) {
    streakBonus = 25;
    reasons.push(`+25 PTS Racha activa (${streak} consecutivas) 🔥`);
  }

  const totalPoints = basePoints + speedBonus + streakBonus;

  return {
    basePoints,
    speedBonus,
    streakBonus,
    totalPoints,
    reasons,
  };
}
