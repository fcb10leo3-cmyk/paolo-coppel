import { Employee, AssistanceAlert, ResolutionOutcome } from '../types';

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

interface StaffState {
  activeCall: AssistanceAlert | null;
  history: AssistanceAlert[];
  employees: Employee[];
}

const STORAGE_KEY = 'coppel_staff_sync_state_v3';
const RESOLVED_IDS_KEY = 'coppel_resolved_alert_ids_v3';

class StaffSyncService {
  private state: StaffState;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: StaffState) => void> = new Set();
  private resolvedAlertIds: Set<string> = new Set();

  constructor() {
    this.resolvedAlertIds = this.loadResolvedIds();
    this.state = this.loadInitialState();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('coppel_staff_dispatch_bus_v3');
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'STATE_UPDATE') {
              this.state = event.data.payload;
              this.notify();
            }
          };
        } catch {
          // ignore
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

  private loadResolvedIds(): Set<string> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RESOLVED_IDS_KEY);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    }
    return new Set();
  }

  private saveResolvedId(id: string) {
    this.resolvedAlertIds.add(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(RESOLVED_IDS_KEY, JSON.stringify(Array.from(this.resolvedAlertIds).slice(-100)));
      } catch {
        // ignore
      }
    }
  }

  private loadInitialState(): StaffState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const active = parsed.activeCall;
          // Si estaba en la lista de resueltos, no revivirla
          const finalActive = active && !this.resolvedAlertIds.has(active.id) ? active : null;

          return {
            activeCall: finalActive,
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
        // ignore
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

  public subscribe(cb: (state: StaffState) => void): () => void {
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
        console.warn('Listener error in staffSync:', err);
      }
    });
  }

  public getState(): StaffState {
    return this.state;
  }

  public async fetchAlerts(): Promise<{ success: boolean; activeCall: AssistanceAlert | null; history: AssistanceAlert[]; employees: Employee[] }> {
    try {
      const res = await fetch('/api/assistance/alerts');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          // PROTECCIÓN CRÍTICA ANTI-REGRESIÓN: Si la llamada ya fue resuelta localmente, NUNCA revivirla
          if (data.activeCall && this.resolvedAlertIds.has(data.activeCall.id)) {
            // El backend aún tenía la alerta; notificar al backend que la resuelva
            fetch('/api/assistance/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ alertId: data.activeCall.id }),
            }).catch(() => {});
            this.state.activeCall = null;
          } else if (data.activeCall) {
            this.state.activeCall = data.activeCall;
          } else {
            this.state.activeCall = null;
          }

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
      // Fallback estático
    }

    return {
      success: true,
      activeCall: this.state.activeCall,
      history: this.state.history,
      employees: this.state.employees,
    };
  }

  public async fetchStatus(): Promise<{ success: boolean; activeCall: AssistanceAlert | null; employees: Employee[] }> {
    return this.fetchAlerts();
  }

  // Crear nueva llamada (Simulador o cliente en pasillo)
  public async triggerCall(payload: {
    aisle?: string;
    department?: string;
    reason?: string;
    preferredEmployeeId?: string;
  }): Promise<AssistanceAlert> {
    const now = new Date();
    const newAlertId = `CALL-${Date.now()}`;

    // Quitar de resolvedIds si por casualidad existía
    this.resolvedAlertIds.delete(newAlertId);

    let assigned = this.state.employees.find(
      (e) => e.id === payload.preferredEmployeeId && e.status === 'disponible'
    );
    if (!assigned) {
      assigned = this.state.employees.find((e) => e.status === 'disponible') || this.state.employees[0];
    }

    const newAlert: AssistanceAlert = {
      id: newAlertId,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: Date.now(),
      status: 'calling',
      aisle: payload.aisle || 'Pasillo 4 - Mueblería Central',
      storeDepartment: payload.department || 'Muebles & Electrónica',
      reason: payload.reason || 'Atención personalizada solicitada en pasillo',
      preferredEmployeeId: payload.preferredEmployeeId,
      assignedAssociateName: assigned?.name || 'Mariana Gómez',
      assignedAssociateRole: assigned?.role || 'Asesora Senior de Crédito',
      assignedAssociateId: assigned?.id || 'emp-01',
      estimatedArrivalSeconds: 30,
      rejectedBy: [],
    };

    // Actualizar localmente inmediatamente
    this.state.activeCall = newAlert;
    this.state.history = [newAlert, ...this.state.history.filter((a) => a.id !== newAlert.id)].slice(0, 40);
    this.saveState();

    // Notificar al servidor en paralelo pasando el ID exacto
    try {
      fetch('/api/assistance/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          id: newAlertId,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    return newAlert;
  }

  // ADMINISTRADOR: Asignar o redirigir a un asesor
  public async assignCall(alertId: string, employeeId: string): Promise<void> {
    const emp = this.state.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    if (this.state.activeCall && (this.state.activeCall.id === alertId || !alertId)) {
      this.state.activeCall.assignedAssociateId = emp.id;
      this.state.activeCall.assignedAssociateName = emp.name;
      this.state.activeCall.assignedAssociateRole = emp.role;
      this.state.activeCall.status = 'calling';
      this.state.activeCall.dispatchedByAdmin = true;
      this.state.activeCall.lastRejectionReason = undefined;
      this.state.activeCall.lastRejectedByName = undefined;
    }

    const item = this.state.history.find((a) => a.id === alertId);
    if (item) {
      item.assignedAssociateId = emp.id;
      item.assignedAssociateName = emp.name;
      item.assignedAssociateRole = emp.role;
      item.status = 'calling';
      item.dispatchedByAdmin = true;
    }

    this.saveState();

    try {
      fetch('/api/assistance/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, employeeId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // ADMINISTRADOR: Tomar la alerta personalmente
  public async takeCallDirectly(alertId: string, adminName: string = 'Supervisor de Turno'): Promise<void> {
    if (this.state.activeCall && (this.state.activeCall.id === alertId || !alertId)) {
      this.state.activeCall.assignedAssociateId = 'admin-01';
      this.state.activeCall.assignedAssociateName = adminName;
      this.state.activeCall.assignedAssociateRole = 'Supervisor de Piso';
      this.state.activeCall.status = 'in_transit';
      this.state.activeCall.dispatchedByAdmin = true;
    }

    const item = this.state.history.find((a) => a.id === alertId);
    if (item) {
      item.assignedAssociateId = 'admin-01';
      item.assignedAssociateName = adminName;
      item.assignedAssociateRole = 'Supervisor de Piso';
      item.status = 'in_transit';
    }

    this.saveState();

    try {
      fetch('/api/assistance/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          associateId: 'admin-01',
          associateName: adminName,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // PERSONAL: Aceptar la solicitud ("Voy en camino")
  public async acceptCall(alertId?: string, associateId?: string, associateName?: string): Promise<void> {
    const emp = associateId ? this.state.employees.find((e) => e.id === associateId) : null;
    const finalName = emp ? emp.name : associateName || 'Mariana Gómez';
    const finalRole = emp ? emp.role : 'Asesora de Piso';

    if (this.state.activeCall) {
      this.state.activeCall.status = 'in_transit';
      this.state.activeCall.assignedAssociateName = finalName;
      this.state.activeCall.assignedAssociateRole = finalRole;
      if (emp) this.state.activeCall.assignedAssociateId = emp.id;
    }

    if (emp) {
      emp.status = 'en_piso';
    }

    this.saveState();

    try {
      fetch('/api/assistance/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alertId || this.state.activeCall?.id,
          associateId: emp?.id || 'emp-01',
          associateName: finalName,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // PERSONAL: Rechazar porque está atendiendo a otro cliente
  public async rejectCall(alertId: string, employeeId: string, reason: string = 'Atendiendo a otro cliente en este momento'): Promise<void> {
    const emp = this.state.employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.name : 'Asesor de Tienda';

    if (emp) {
      emp.status = 'ocupado';
    }

    if (this.state.activeCall && (this.state.activeCall.id === alertId || !alertId)) {
      const prevRejected = this.state.activeCall.rejectedBy || [];
      this.state.activeCall.rejectedBy = [...prevRejected, employeeId];
      this.state.activeCall.lastRejectionReason = reason;
      this.state.activeCall.lastRejectedByName = empName;
      this.state.activeCall.status = 'calling'; // Regresa al supervisor
      this.state.activeCall.assignedAssociateId = undefined;
      this.state.activeCall.assignedAssociateName = undefined;
    }

    this.saveState();

    try {
      fetch('/api/assistance/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alertId || this.state.activeCall?.id,
          employeeId,
          employeeName: empName,
          reason,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // ACCIÓN DEFINITIVA: MARCAR COMO RESUELTO (O NO RESUELTO)
  // Esta función destruye la alerta activa para que NUNCA regrese
  public async resolveCall(
    alertId?: string,
    outcome: ResolutionOutcome = 'resuelto_exitoso',
    resolutionNotes?: string
  ): Promise<void> {
    const currentActive = this.state.activeCall;
    const targetId = alertId || currentActive?.id;
    if (targetId) {
      this.saveResolvedId(targetId);
    }
    if (currentActive?.id) {
      this.saveResolvedId(currentActive.id);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    // Actualizar historial local
    if (currentActive) {
      const existing = this.state.history.find((a) => a.id === currentActive.id);
      if (existing) {
        existing.status = 'resolved';
        existing.resolvedAt = timeStr;
        existing.outcome = outcome;
        existing.resolutionNotes = resolutionNotes || (outcome === 'resuelto_exitoso' ? 'Resuelto exitosamente en piso' : 'No se pudo resolver en piso');
      } else {
        this.state.history.unshift({
          ...currentActive,
          status: 'resolved',
          resolvedAt: timeStr,
          outcome,
          resolutionNotes: resolutionNotes || (outcome === 'resuelto_exitoso' ? 'Resuelto exitosamente en piso' : 'No se pudo resolver en piso'),
        });
      }

      // Si el asesor estaba asignado, sumar estadística y liberarlo
      if (currentActive.assignedAssociateId) {
        const emp = this.state.employees.find((e) => e.id === currentActive.assignedAssociateId);
        if (emp) {
          emp.totalHelpedToday += 1;
          emp.status = 'disponible';
        }
      }
    } else if (targetId) {
      const match = this.state.history.find((a) => a.id === targetId);
      if (match) {
        match.status = 'resolved';
        match.resolvedAt = timeStr;
        match.outcome = outcome;
        match.resolutionNotes = resolutionNotes || (outcome === 'resuelto_exitoso' ? 'Resuelto exitosamente en piso' : 'No se pudo resolver en piso');
      }
    }

    // ELIMINAR DE ALERTA ACTIVA INMEDIATAMENTE
    this.state.activeCall = null;
    this.saveState();

    // Enviar confirmación al backend server
    try {
      fetch('/api/assistance/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: targetId,
          outcome,
          resolutionNotes,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // Cancelar / Descartar
  public async cancelCall(alertId?: string): Promise<void> {
    const targetId = alertId || this.state.activeCall?.id;
    if (targetId) {
      this.saveResolvedId(targetId);
    }

    if (this.state.activeCall) {
      const match = this.state.history.find((a) => a.id === this.state.activeCall?.id);
      if (match) match.status = 'cancelled';
    }

    this.state.activeCall = null;
    this.saveState();

    try {
      fetch('/api/assistance/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: targetId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // Actualizar estado de empleado
  public async updateEmployeeStatus(empId: string, status: Employee['status']): Promise<void> {
    this.state.employees = this.state.employees.map((e) => (e.id === empId ? { ...e, status } : e));
    this.saveState();

    try {
      fetch(`/api/employees/${empId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

export const staffSync = new StaffSyncService();
export const kioskSync = staffSync;
