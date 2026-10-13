export type UserRole = 'admin' | 'staff';

export type ResolutionOutcome = 'resuelto_exitoso' | 'no_resuelto';

export type VerificationProofType = 'photo' | 'customer_pin' | 'signature' | 'ticket_folio' | 'in_person';

export interface AssistanceVerificationProof {
  type: VerificationProofType;
  photoUrl?: string;
  customerPin?: string;
  verifiedPin?: boolean;
  signatureDataUrl?: string;
  ticketFolio?: string;
  timestamp: string;
  verifiedByAssociateId?: string;
  verifiedByAssociateName?: string;
  notes?: string;
}

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
  outcomeCategory?: string; // Motivo común específico seleccionado
  resolutionNotes?: string;
  customerPin?: string; // PIN de 4 dígitos para comprobación de presencia
  verificationProof?: AssistanceVerificationProof; // Evidencia que avala que el asesor atendió al cliente
}

export interface StoreMetrics {
  totalCallsToday: number;
  averageResponseSeconds: number;
  resolvedCallsToday: number;
  unresolvedCallsToday: number;
  satisfactionRating: number;
  activeAssociatesCount: number;
}
