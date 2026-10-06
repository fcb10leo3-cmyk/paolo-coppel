export type KioskScreen = 
  | 'home' 
  | 'catalog' 
  | 'product_detail'
  | 'simulator'
  | 'aisle_map' 
  | 'pay' 
  | 'receipt_view'
  | 'assistance_active'
  | 'hardware_guide';

export type TabId = 'home' | 'cita' | 'tarjetas' | 'compra';

export interface CategoryCard {
  id: string;
  name: string;
  sublabel: string;
  iconClass: string;
  aisle: string;
  color: string;
  popularItems: string[];
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  cashPrice: number;
  originalPrice?: number;
  quincenalBase: number;
  aisle: string;
  stock: number;
  imageIcon: string;
  specs: string[];
  badge?: string;
  description: string;
}

export interface CreditSimulation {
  product: ProductCatalogItem;
  downPayment: number;
  downPaymentPercent: number;
  terms: number; // 12, 18, 24, 36 quincenas
  amountPerQuincena: number;
  totalCreditCost: number;
  punctualitySavings: number;
  monthlyEquivalent: number;
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
}

export interface AssistanceAlert {
  id: string;
  timestamp: string;
  createdAt: number;
  status: 'calling' | 'in_transit' | 'resolved' | 'cancelled';
  aisle: string;
  storeDepartment: string;
  reason: string;
  preferredEmployeeId?: string;
  assignedAssociateName?: string;
  assignedAssociateRole?: string;
  assignedAssociateId?: string;
  estimatedArrivalSeconds: number;
  resolvedAt?: string;
  clientNotes?: string;
}

export interface AssistanceStatus {
  isActive: boolean;
  timestamp: string;
  associateName: string;
  associateRole: string;
  estimatedArrivalSeconds: number;
  aisle: string;
  isAudioConnected: boolean;
  status?: 'calling' | 'in_transit' | 'resolved';
  alertId?: string;
}

export interface PaymentData {
  clientNumber: string;
  clientName: string;
  debtAmount: number;
  minPayment: number;
  punctualityBonus: string;
}

export interface KioskReceipt {
  ticketNumber: string;
  clientNumber: string;
  clientName: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  date: string;
  time: string;
  kioskId: string;
  branch: string;
  authCode: string;
  barcode: string;
  details?: {
    quincenas?: number;
    pagoQuincenal?: number;
    pagoContado?: number;
    aisle?: string;
  };
}

export interface HardwareSpecItem {
  category: string;
  component: string;
  recommendedModel: string;
  specs: string;
  approxPriceUSD: number;
  approxPriceMXN: number;
  whyThisOption: string;
  wiringConnection: string;
}

export interface Appointment {
  id: string;
  sucursal: string;
  fecha: string;
  horario: string;
  producto: string;
  snack: string;
  notas?: string;
  codigoCita: string;
  createdAt: string;
  status: 'confirmada' | 'en_curso' | 'completada';
}

export interface LoyaltyProfile {
  name: string;
  tier: string;
  punctualityScore: number;
  creditLine: number;
  availableCredit: number;
  coppelMaxPoints: number;
  progressToNextTier: number;
  purchasesNeededForGold: number;
  memberSince: string;
  accountNumber: string;
}

export interface CreditCardItem {
  id: string;
  tier: 'Navy VIP' | 'Gold VIP' | 'Coppel Plus' | 'Clásica';
  name: string;
  maskedNumber: string;
  creditLimit: number;
  available: number;
  points: number;
  isCurrent: boolean;
  isUnlocked: boolean;
  accentColor: string;
  themeGradient: string;
  perks: string[];
}
