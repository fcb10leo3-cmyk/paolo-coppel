export type UserRole = 'admin' | 'staff';

export type ResolutionOutcome = 'resuelto_exitoso' | 'no_resuelto';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'disponible' | 'en_piso' | 'ocupado' | 'descanso';
  currentAisle: string;
  avatarColor: string;
  initials: string;
  phone: string;
  rating: number;
  totalHelpedToday: number;
  badge?: string;
  currentActiveAlertId?: string;
  // Gamificación y Puntos por Asistencia
  points: number;
  successfulAssistsToday: number;
  unsuccessfulAssistsToday?: number;
  level: number;
  levelTitle: string;
  streak: number;
  badges?: string[];
  recentPointsDelta?: number;
}

export interface AssistanceAlert {
  id: string;
  timestamp: string;
  createdAt: number;
  status: 'calling' | 'in_transit' | 'resolved' | 'cancelled';
  aisle: string;
  storeDepartment: string;
  reason: string;
  urgency?: 'normal' | 'alta' | 'vip';
  preferredEmployeeId?: string;
  assignedAssociateName?: string;
  assignedAssociateRole?: string;
  assignedAssociateId?: string;
  estimatedArrivalSeconds: number;
  resolvedAt?: string;
  clientNotes?: string;
  rejectedBy?: string[]; // IDs de colaboradores que rechazaron la alerta
  lastRejectionReason?: string;
  lastRejectedByName?: string;
  dispatchedByAdmin?: boolean;
  outcome?: ResolutionOutcome;
  resolutionNotes?: string;
}

export interface StoreMetrics {
  totalCallsToday: number;
  averageResponseSeconds: number;
  resolvedCallsToday: number;
  unresolvedCallsToday: number;
  satisfactionRating: number;
  activeAssociatesCount: number;
}
