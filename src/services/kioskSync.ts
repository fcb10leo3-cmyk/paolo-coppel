import { Employee, AssistanceAlert, KioskReceipt } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    name: 'Mariana Gómez',
    role: 'Asesora Senior de Crédito y Préstamos',
    department: 'Servicios Financieros Coppel',
    status: 'disponible',
    currentAisle: 'Pasillo 3 y 4 - Mueblería',
    avatarColor: 'bg-emerald-600',
    initials: 'MG',
    phone: '55 1234 5678',
    rating: 4.9,
    totalHelpedToday: 14,
    badge: 'Top Asesora',
  },
  {
    id: 'emp-02',
    name: 'Jorge Valenzuela',
    role: 'Especialista en Telefonía & Computo',
    department: 'Electrónica & Celulares',
    status: 'disponible',
    currentAisle: 'Pasillo 1A - Telefonía & Accesorios',
    avatarColor: 'bg-blue-600',
    initials: 'JV',
    phone: '55 8765 4321',
    rating: 4.8,
    totalHelpedToday: 19,
    badge: 'Tech Guru',
  },
  {
    id: 'emp-03',
    name: 'Claudia Navarro',
    role: 'Atención al Cliente & Cajas Express',
    department: 'Cajas & Garantías',
    status: 'disponible',
    currentAisle: 'Módulo Central de Cajas',
    avatarColor: 'bg-purple-600',
    initials: 'CN',
    phone: '55 4321 8765',
    rating: 5.0,
    totalHelpedToday: 22,
    badge: 'Servicio Estrella',
  },
  {
    id: 'emp-04',
    name: 'Roberto Morales',
    role: 'Especialista en Mueblería & Línea Blanca',
    department: 'Muebles & Hogar',
    status: 'en_piso',
    currentAisle: 'Pasillo 5A - Línea Blanca & Cocina',
    avatarColor: 'bg-amber-600',
    initials: 'RM',
    phone: '55 9876 5432',
    rating: 4.7,
    totalHelpedToday: 9,
  },
  {
    id: 'emp-05',
    name: 'Elena Ramírez',
    role: 'Asesora de Moda, Zapatería & Blancos',
    department: 'Ropa & Calzado',
    status: 'disponible',
    currentAisle: 'Pasillo 7 y 8 - Moda & Vestidores',
    avatarColor: 'bg-rose-600',
    initials: 'ER',
    phone: '55 3456 7890',
    rating: 4.9,
    totalHelpedToday: 11,
  },
];

interface KioskState {
  activeCall: AssistanceAlert | null;
  history: AssistanceAlert[];
  employees: Employee[];
}

const STORAGE_KEY = 'coppel_kiosk_sync_state_v1';

class KioskSyncService {
  private state: KioskState;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: KioskState) => void> = new Set();
  private hasBackendChecked = false;
  private isBackendAvailable = true;

  constructor() {
    this.state = this.loadInitialState();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('coppel_kiosk_sync_bus');
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'STATE_UPDATE') {
              this.state = event.data.payload;
              this.notify();
            }
          };
        } catch {
          // BroadcastChannel blocked or unsupported
        }
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private loadInitialState(): KioskState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            activeCall: parsed.activeCall || null,
            history: Array.isArray(parsed.history) ? parsed.history : [],
            employees: Array.isArray(parsed.employees) && parsed.employees.length > 0 ? parsed.employees : INITIAL_EMPLOYEES,
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      activeCall: null,
      history: [],
      employees: INITIAL_EMPLOYEES,
    };
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // storage quota exceeded or disabled
      }
    }
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'STATE_UPDATE', payload: this.state });
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  public subscribe(cb: (state: KioskState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.state);
      } catch (err) {
        console.warn('Listener error in kioskSync:', err);
      }
    });
  }

  public getState(): KioskState {
    return this.state;
  }

  public async fetchStatus(): Promise<{ success: boolean; activeCall: AssistanceAlert | null; employees: Employee[] }> {
    try {
      const res = await fetch('/api/kiosk/status');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        this.isBackendAvailable = true;
        if (data.activeAssistanceCall !== undefined) {
          this.state.activeCall = data.activeAssistanceCall;
        }
        return {
          success: true,
          activeCall: this.state.activeCall,
          employees: this.state.employees,
        };
      }
    } catch {
      // Backend not running (e.g. Netlify static SPA hosting)
      this.isBackendAvailable = false;
    }

    return {
      success: true,
      activeCall: this.state.activeCall,
      employees: this.state.employees,
    };
  }

  public async fetchAlerts(): Promise<{ success: boolean; activeCall: AssistanceAlert | null; history: AssistanceAlert[]; employees: Employee[] }> {
    try {
      const res = await fetch('/api/assistance/alerts');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          this.state.activeCall = data.activeCall || null;
          if (data.history) this.state.history = data.history;
          if (data.employees) this.state.employees = data.employees;
          this.saveState();
          return {
            success: true,
            activeCall: this.state.activeCall,
            history: this.state.history,
            employees: this.state.employees,
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      activeCall: this.state.activeCall,
      history: this.state.history,
      employees: this.state.employees,
    };
  }

  public async triggerCall(payload: {
    aisle?: string;
    department?: string;
    reason?: string;
    preferredEmployeeId?: string;
  }): Promise<AssistanceAlert> {
    // 1. Try real server API if available
    try {
      const res = await fetch('/api/assistance/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.call) {
          this.state.activeCall = data.call;
          if (data.alert) {
            this.state.history = [data.alert, ...this.state.history.filter((a) => a.id !== data.alert.id)];
          }
          this.saveState();
          return data.call;
        }
      }
    } catch {
      // Netlify static fallback
    }

    // 2. Client-side fallback for Netlify static deployment
    let assigned = this.state.employees.find(
      (e) => e.id === payload.preferredEmployeeId && e.status === 'disponible'
    );
    if (!assigned) {
      assigned = this.state.employees.find((e) => e.status === 'disponible') || this.state.employees[0];
    }

    const now = new Date();
    const newAlert: AssistanceAlert = {
      id: `CALL-${Date.now()}`,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: Date.now(),
      status: 'calling',
      aisle: payload.aisle || 'Pasillo 4 - Mueblería Central',
      storeDepartment: payload.department || 'Muebles & Electrónica',
      reason: payload.reason || 'Atención personalizada solicitada en Tótem Kiosco',
      preferredEmployeeId: payload.preferredEmployeeId,
      assignedAssociateName: assigned?.name || 'Mariana Gómez',
      assignedAssociateRole: assigned?.role || 'Asesora Senior de Crédito',
      assignedAssociateId: assigned?.id || 'emp-01',
      estimatedArrivalSeconds: 30,
    };

    this.state.activeCall = newAlert;
    this.state.history = [newAlert, ...this.state.history.filter((a) => a.id !== newAlert.id)].slice(0, 30);
    this.saveState();

    return newAlert;
  }

  public async respondCall(alertId?: string, associateId?: string, associateName?: string): Promise<void> {
    try {
      const res = await fetch('/api/assistance/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, associateId, associateName }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.call) {
          this.state.activeCall = data.call;
          this.saveState();
          return;
        }
      }
    } catch {
      // Netlify fallback
    }

    const emp = associateId ? this.state.employees.find((e) => e.id === associateId) : null;
    const finalName = emp ? emp.name : associateName || 'Mariana Gómez';
    const finalRole = emp ? emp.role : 'Asesora de Piso y Crédito';

    if (this.state.activeCall) {
      this.state.activeCall.status = 'in_transit';
      this.state.activeCall.assignedAssociateName = finalName;
      this.state.activeCall.assignedAssociateRole = finalRole;
      if (emp) this.state.activeCall.assignedAssociateId = emp.id;
    }

    this.saveState();
  }

  public async resolveCall(alertId?: string): Promise<void> {
    try {
      const res = await fetch('/api/assistance/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        this.state.activeCall = null;
        this.saveState();
        return;
      }
    } catch {
      // Netlify fallback
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    if (this.state.activeCall) {
      const match = this.state.history.find((a) => a.id === this.state.activeCall?.id);
      if (match) {
        match.status = 'resolved';
        match.resolvedAt = timeStr;
      }
      if (this.state.activeCall.assignedAssociateId) {
        const emp = this.state.employees.find((e) => e.id === this.state.activeCall?.assignedAssociateId);
        if (emp) emp.totalHelpedToday += 1;
      }
    }

    this.state.activeCall = null;
    this.saveState();
  }

  public async cancelCall(): Promise<void> {
    try {
      await fetch('/api/assistance/cancel', { method: 'POST' });
    } catch {
      // Netlify fallback
    }

    if (this.state.activeCall) {
      const match = this.state.history.find((a) => a.id === this.state.activeCall?.id);
      if (match) match.status = 'cancelled';
    }
    this.state.activeCall = null;
    this.saveState();
  }

  public async updateEmployeeStatus(empId: string, status: Employee['status']): Promise<void> {
    try {
      const res = await fetch(`/api/employees/${empId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.employee) {
          this.state.employees = this.state.employees.map((e) => (e.id === empId ? data.employee : e));
          this.saveState();
          return;
        }
      }
    } catch {
      // Netlify fallback
    }

    this.state.employees = this.state.employees.map((e) => (e.id === empId ? { ...e, status } : e));
    this.saveState();
  }

  public async processKioskPayment(payload: {
    clientNumber: string;
    amount: number;
    concept: string;
    paymentType?: string;
  }): Promise<{ success: boolean; receipt: KioskReceipt }> {
    try {
      const res = await fetch('/api/kiosk/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.receipt) {
          return { success: true, receipt: data.receipt };
        }
      }
    } catch {
      // Netlify fallback
    }

    const ticketNumber = `CP-TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const receipt: KioskReceipt = {
      ticketNumber,
      clientNumber: payload.clientNumber || '98421092',
      clientName: 'Cliente Coppel VIP',
      concept: payload.concept || 'Abono a Cuenta Coppel',
      amount: Number(payload.amount) || 450,
      paymentMethod: payload.paymentType || 'Tarjeta Bancaria / NFC',
      date: now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      kioskId: 'KIOSK-COP-CDMX-04',
      branch: 'Coppel Revolución Flagship',
      authCode: `AUT-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: `*${ticketNumber}*`,
    };

    return { success: true, receipt };
  }
}

export const kioskSync = new KioskSyncService();
