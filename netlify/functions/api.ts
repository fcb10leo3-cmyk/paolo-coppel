// Netlify Serverless Function for Coppel Staff & Despacho
// Provee endpoints REST con CORS habilitado para sincronización en tiempo real y conexión con Kioscos externos

interface EmployeeRecord {
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
  points: number;
  successfulAssistsToday: number;
  level: number;
  levelTitle: string;
  streak: number;
}

interface AssistanceAlertRecord {
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
  rejectedBy?: string[];
  lastRejectionReason?: string;
  lastRejectedByName?: string;
  dispatchedByAdmin?: boolean;
  outcome?: string;
  resolutionNotes?: string;
}

interface ExternalLog {
  id: string;
  timestamp: string;
  origin: string;
  aisle: string;
  reason: string;
  status: string;
}

// Global in-memory state across function invocations in the same instance
let employeesList: EmployeeRecord[] = [
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
    points: 1450,
    successfulAssistsToday: 14,
    level: 3,
    levelTitle: 'Especialista Plata',
    streak: 5,
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
    points: 1920,
    successfulAssistsToday: 18,
    level: 4,
    levelTitle: 'Master Oro',
    streak: 6,
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
    points: 2280,
    successfulAssistsToday: 22,
    level: 4,
    levelTitle: 'Master Oro',
    streak: 9,
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
    points: 920,
    successfulAssistsToday: 8,
    level: 2,
    levelTitle: 'Asesor Bronce',
    streak: 2,
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
    points: 1180,
    successfulAssistsToday: 11,
    level: 3,
    levelTitle: 'Especialista Plata',
    streak: 4,
  },
];

let activeAssistanceCall: AssistanceAlertRecord | null = null;
let alertsHistory: AssistanceAlertRecord[] = [];
let externalLogs: ExternalLog[] = [];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event: any) => {
  // Manejo de preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }

  const rawPath = event.path || '';
  // Normalizar ruta: soportar tanto /.netlify/functions/api/ruta como /api/ruta
  const cleanPath = rawPath
    .replace('/.netlify/functions/api', '')
    .replace('/api', '')
    .replace(/\/$/, '') || '/';

  const method = event.httpMethod || 'GET';
  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  try {
    // 1. GET /assistance/alerts ó GET /alerts
    if (method === 'GET' && (cleanPath === '/assistance/alerts' || cleanPath === '/alerts')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          activeCall: activeAssistanceCall,
          history: alertsHistory.slice(-20),
          employees: employeesList,
        }),
      };
    }

    // 2. GET /employees
    if (method === 'GET' && cleanPath === '/employees') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          employees: employeesList,
          availableCount: employeesList.filter((e) => e.status === 'disponible').length,
        }),
      };
    }

    // 3. GET /external/logs
    if (method === 'GET' && cleanPath === '/external/logs') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          logs: externalLogs.slice(0, 20),
        }),
      };
    }

    // 4. POST /assistance/call ó POST /external/call (Llamadas desde Kiosco Tótem externo o simulator)
    if (method === 'POST' && (cleanPath === '/assistance/call' || cleanPath === '/external/call')) {
      const { id, aisle, department, reason, preferredEmployeeId } = body;

      let assignedEmp = employeesList.find((e) => e.id === preferredEmployeeId && e.status === 'disponible');
      if (!assignedEmp) {
        assignedEmp = employeesList.find((e) => e.status === 'disponible') || employeesList[0];
      }

      if (assignedEmp) {
        assignedEmp.status = 'ocupado';
      }

      const alertId = id || `ALT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      const nowStr = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const newAlert: AssistanceAlertRecord = {
        id: alertId,
        timestamp: nowStr,
        createdAt: Date.now(),
        status: 'calling',
        aisle: aisle || 'Pasillo Central',
        storeDepartment: department || 'Atención General',
        reason: reason || 'Solicitud de apoyo en piso',
        preferredEmployeeId,
        assignedAssociateName: assignedEmp ? assignedEmp.name : 'Personal de Piso',
        assignedAssociateRole: assignedEmp ? assignedEmp.role : 'Asesor Coppel',
        assignedAssociateId: assignedEmp ? assignedEmp.id : undefined,
        estimatedArrivalSeconds: 75,
        rejectedBy: [],
        dispatchedByAdmin: false,
      };

      activeAssistanceCall = newAlert;

      // Registrar log de integración si vino de un canal externo
      externalLogs.unshift({
        id: `EXT-${Date.now()}`,
        timestamp: nowStr,
        origin: 'Kiosco Tótem Externo (API)',
        aisle: newAlert.aisle,
        reason: newAlert.reason,
        status: 'DESPACHADA',
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Llamada despachada con éxito a Coppel Staff',
          call: newAlert,
          assignedTo: assignedEmp ? assignedEmp.name : 'Personal de Piso',
        }),
      };
    }

    // 5. POST /assistance/accept (Personal acepta atender)
    if (method === 'POST' && cleanPath === '/assistance/accept') {
      const { alertId, employeeId, employeeName } = body;
      let targetAlert = activeAssistanceCall;
      if (!targetAlert || (alertId && targetAlert.id !== alertId)) {
        targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
      }

      if (targetAlert) {
        targetAlert.status = 'in_transit';
        if (employeeName) targetAlert.assignedAssociateName = employeeName;
        if (employeeId) {
          targetAlert.assignedAssociateId = employeeId;
          const emp = employeesList.find((e) => e.id === employeeId);
          if (emp) emp.status = 'ocupado';
        }
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          call: targetAlert || activeAssistanceCall,
        }),
      };
    }

    // 6. POST /assistance/reject (Personal rechaza porque está ocupado)
    if (method === 'POST' && cleanPath === '/assistance/reject') {
      const { alertId, employeeId, rejectionReason } = body;
      let targetAlert = activeAssistanceCall;
      if (!targetAlert || (alertId && targetAlert.id !== alertId)) {
        targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
      }

      if (targetAlert) {
        targetAlert.rejectedBy = targetAlert.rejectedBy || [];
        if (employeeId && !targetAlert.rejectedBy.includes(employeeId)) {
          targetAlert.rejectedBy.push(employeeId);
        }

        const rejectingEmp = employeesList.find((e) => e.id === employeeId);
        targetAlert.lastRejectionReason = rejectionReason || 'Atendiendo otro cliente';
        targetAlert.lastRejectedByName = rejectingEmp ? rejectingEmp.name : 'Asesor de piso';

        // Reasignar al siguiente disponible
        const nextEmp = employeesList.find(
          (e) => e.status === 'disponible' && (!employeeId || !targetAlert!.rejectedBy?.includes(e.id))
        );

        if (nextEmp) {
          targetAlert.assignedAssociateId = nextEmp.id;
          targetAlert.assignedAssociateName = nextEmp.name;
          targetAlert.assignedAssociateRole = nextEmp.role;
        }
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          call: targetAlert || activeAssistanceCall,
        }),
      };
    }

    // 7. POST /assistance/resolve (Marcar caso como resuelto o no resuelto con resultado)
    if (method === 'POST' && cleanPath === '/assistance/resolve') {
      const { alertId, outcome, resolutionNotes } = body;

      let targetAlert = activeAssistanceCall;
      if (!targetAlert || (alertId && targetAlert.id !== alertId)) {
        targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
      }

      const nowStr = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      if (targetAlert) {
        targetAlert.status = 'resolved';
        targetAlert.resolvedAt = nowStr;
        targetAlert.outcome = outcome || 'resuelto_exitoso';
        if (resolutionNotes) targetAlert.resolutionNotes = resolutionNotes;

        if (targetAlert.assignedAssociateId) {
          const emp = employeesList.find((e) => e.id === targetAlert!.assignedAssociateId);
          if (emp) {
            emp.status = 'disponible';
            emp.totalHelpedToday = (emp.totalHelpedToday || 0) + 1;
            const pts = outcome === 'resuelto_exitoso' ? 100 : 10;
            emp.points = (emp.points || 0) + pts;
            if (outcome === 'resuelto_exitoso') {
              emp.successfulAssistsToday = (emp.successfulAssistsToday || 0) + 1;
              emp.streak = (emp.streak || 0) + 1;
            } else {
              emp.streak = 0;
            }
          }
        }

        const existingIdx = alertsHistory.findIndex((a) => a.id === targetAlert!.id);
        if (existingIdx >= 0) {
          alertsHistory[existingIdx] = { ...targetAlert };
        } else {
          alertsHistory.unshift({ ...targetAlert });
        }
      }

      activeAssistanceCall = null;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Atención concluida con éxito.',
        }),
      };
    }

    // 8. POST /assistance/cancel
    if (method === 'POST' && cleanPath === '/assistance/cancel') {
      if (activeAssistanceCall) {
        activeAssistanceCall.status = 'cancelled';
        alertsHistory.unshift({ ...activeAssistanceCall });
        if (activeAssistanceCall.assignedAssociateId) {
          const emp = employeesList.find((e) => e.id === activeAssistanceCall!.assignedAssociateId);
          if (emp) emp.status = 'disponible';
        }
        activeAssistanceCall = null;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Alerta cancelada' }),
      };
    }

    // 9. POST /employees/bonus (Otorgar bono de supervisor)
    if (method === 'POST' && cleanPath === '/employees/bonus') {
      const { employeeId, bonusPoints, reason } = body;
      const emp = employeesList.find((e) => e.id === employeeId);
      if (!emp) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Empleado no encontrado' }),
        };
      }

      const pts = parseInt(bonusPoints, 10) || 50;
      emp.points = (emp.points || 0) + pts;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: `Bono de +${pts} otorgado a ${emp.name}`,
          employee: emp,
          reason,
        }),
      };
    }

    // Fallback 404
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, message: `Ruta no encontrada: ${cleanPath}` }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message || 'Error interno' }),
    };
  }
};
