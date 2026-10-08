import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// In-memory state for Employees and Real-time Kiosk Asistencia
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
const sseClients: Response[] = [];

function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

let kioskHardwareConfig = {
  totemId: 'KIOSK-COP-CDMX-04',
  storeName: 'Coppel Revolución Flagship',
  locationZone: 'Pasillo Central - Electro & Muebles',
  status: 'ONLINE',
  printerPaperLevel: 88,
  touchscreenHealth: 'OPTIMAL',
  buttonLedColor: 'BLUE_PULSE',
};

// Store catalog with aisles for the friendly in-store locator
const catalogItems = [
  {
    id: 'prod-01',
    name: 'Smartphones y Celulares Samsung / iPhone',
    category: 'Celulares',
    aisle: 'Pasillo 1A - Telefonía & Accesorios',
    priceEstimate: 'Desde $120/quincena',
    stockStatus: 'En exhibición y bodega',
    popularQuestions: ['¿Tienen el Samsung A55?', '¿Cómo desbloqueo mi línea?', '¿Aceptan crédito Coppel?'],
  },
  {
    id: 'prod-02',
    name: 'Pantallas Smart TV OLED & QLED 4K',
    category: 'Electrónica',
    aisle: 'Pasillo 2B - Audio y Video High-End',
    priceEstimate: 'Desde $340/quincena',
    stockStatus: '12 modelos en exhibición',
    popularQuestions: ['¿Cuál es la mejor para sala iluminada?', '¿Tienen entrega a domicilio gratis?', '¿Incluye garantía?'],
  },
  {
    id: 'prod-03',
    name: 'Salas, Sillones Reclinables y Comedores',
    category: 'Muebles',
    aisle: 'Pasillo 3 y 4 - Mueblería Central',
    priceEstimate: 'Desde $280/quincena',
    stockStatus: 'Modelos disponibles para entrega inmediata',
    popularQuestions: ['¿Tienen colores en gris o beige?', '¿El flete es gratuito a mi colonia?'],
  },
  {
    id: 'prod-04',
    name: 'Refrigeradores Inverter & Lavadoras Carga Frontal',
    category: 'Línea Blanca',
    aisle: 'Pasillo 5A - Línea Blanca & Cocina',
    priceEstimate: 'Desde $310/quincena',
    stockStatus: 'Amplio surtido Mabe, Whirlpool, Samsung',
    popularQuestions: ['¿Qué modelo ahorra más luz?', '¿Se llevan mi refrigerador viejo?'],
  },
  {
    id: 'prod-05',
    name: 'Colchones Matrimoniales, Queen y King',
    category: 'Colchones',
    aisle: 'Pasillo 6B - Zona Descanso & Blancos',
    priceEstimate: 'Desde $195/quincena',
    stockStatus: 'Spring Air, Sealy y Restonic',
    popularQuestions: ['¿Puedo probarlo?', '¿Cuánto dura la garantía de resortes?'],
  },
  {
    id: 'prod-06',
    name: 'Ropa para Dama, Caballero e Infantil',
    category: 'Ropa',
    aisle: 'Pasillo 7 y 8 - Moda & Vestidores',
    priceEstimate: 'Desde $60/quincena',
    stockStatus: 'Colección temporada actual',
    popularQuestions: ['¿Dónde están los probadores?', '¿Hay tallas extras?'],
  },
  {
    id: 'prod-07',
    name: 'Zapatos, Tenis Deportivos y Botas',
    category: 'Calzado',
    aisle: 'Pasillo 9 - Zapatería y Sneakers',
    priceEstimate: 'Desde $90/quincena',
    stockStatus: 'Nike, Adidas, Flexi, Coqueta',
    popularQuestions: ['¿Tienen número 27.5?', '¿Se puede medir antes de pagar?'],
  },
  {
    id: 'prod-08',
    name: 'Muebles para Baño, Grifería y Accesorios',
    category: 'Baño & Hogar',
    aisle: 'Pasillo 10A - Baño y Ferretería Ligera',
    priceEstimate: 'Desde $85/quincena',
    stockStatus: 'Disponible en estantería baja',
    popularQuestions: ['¿Tienen juego de baño completo?', '¿Incluye instalación?'],
  },
];

interface IntegrationLog {
  id: string;
  timestamp: string;
  origin: string;
  aisle: string;
  reason: string;
  status: 'received' | 'processed';
}

let integrationLogs: IntegrationLog[] = [];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Soporte CORS universal para permitir conexión desde el Kiosco externo u otros dominios
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Kiosk Asistencia & Employees Endpoints
  app.get('/api/kiosk/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      config: kioskHardwareConfig,
      activeAssistanceCall,
      availableEmployeesCount: employeesList.filter((e) => e.status === 'disponible').length,
    });
  });

  // Get list of all employees and their availability
  app.get('/api/employees', (_req: Request, res: Response) => {
    res.json({
      success: true,
      employees: employeesList,
      availableCount: employeesList.filter((e) => e.status === 'disponible').length,
    });
  });

  // Update employee status (e.g. from Employee Mobile App)
  app.patch('/api/employees/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const emp = employeesList.find((e) => e.id === id);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    if (['disponible', 'en_piso', 'ocupado', 'descanso'].includes(status)) {
      emp.status = status;
      broadcastSSE({
        type: 'employee_status_changed',
        employee: emp,
        employees: employeesList,
      });
      return res.json({ success: true, employee: emp });
    }

    res.status(400).json({ success: false, message: 'Estado inválido' });
  });

  // Real-time Server-Sent Events (SSE) Stream for Instant Multi-Device Sync
  app.get('/api/assistance/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.push(res);

    // Send immediate initial snapshot
    res.write(
      `data: ${JSON.stringify({
        type: 'init',
        activeCall: activeAssistanceCall,
        employees: employeesList,
        history: alertsHistory.slice(0, 15),
      })}\n\n`
    );

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  // Get current active alerts + alert history
  app.get('/api/assistance/alerts', (_req: Request, res: Response) => {
    res.json({
      success: true,
      activeCall: activeAssistanceCall,
      history: alertsHistory.slice(0, 25),
      employees: employeesList,
    });
  });

  // Trigger assistance button ("Push to Speak" / "Pedir Asistencia" from client or simulator)
  app.post('/api/assistance/call', (req: Request, res: Response) => {
    const { id, aisle, department, reason, preferredEmployeeId } = req.body;

    // Pick preferred employee if available, or first available, or fallback
    let assigned = employeesList.find((e) => e.id === preferredEmployeeId && e.status === 'disponible');
    if (!assigned) {
      assigned = employeesList.find((e) => e.status === 'disponible');
    }
    if (!assigned) {
      assigned = employeesList[0];
    }

    const now = new Date();
    const alertId = id || `CALL-${Date.now()}`;
    const newAlert: AssistanceAlertRecord = {
      id: alertId,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: Date.now(),
      status: 'calling', // initially calling, associates get loud notification on phone!
      aisle: aisle || 'Pasillo Central de Asistencia 04',
      storeDepartment: department || 'Muebles & Electrónica',
      reason: reason || 'Atención personalizada solicitada en pasillo',
      preferredEmployeeId: preferredEmployeeId || undefined,
      assignedAssociateName: assigned.name,
      assignedAssociateRole: assigned.role,
      assignedAssociateId: assigned.id,
      estimatedArrivalSeconds: 30,
    };

    activeAssistanceCall = newAlert;
    alertsHistory.unshift(newAlert);
    if (alertsHistory.length > 50) alertsHistory.pop();

    const originHeader = (req.headers['origin'] || req.headers['referer'] || req.ip || 'Kiosco Externo').toString();
    integrationLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      origin: originHeader,
      aisle: newAlert.aisle,
      reason: newAlert.reason,
      status: 'processed',
    });
    if (integrationLogs.length > 30) integrationLogs.pop();

    broadcastSSE({
      type: 'new_call',
      alert: newAlert,
      activeCall: activeAssistanceCall,
    });

    res.json({
      success: true,
      message: 'Llamada enviada al radiolocalizador y celular del personal en tienda.',
      call: activeAssistanceCall,
      alert: newAlert,
    });
  });

  // Alias dedicado para Kiosco Externo: POST /api/external/call
  app.post('/api/external/call', (req: Request, res: Response) => {
    // Redirigir al manejador estándar de llamada
    const { id, aisle, department, reason, preferredEmployeeId } = req.body;
    let assigned = employeesList.find((e) => e.id === preferredEmployeeId && e.status === 'disponible') ||
      employeesList.find((e) => e.status === 'disponible') || employeesList[0];

    const now = new Date();
    const alertId = id || `EXT-${Date.now()}`;
    const newAlert: AssistanceAlertRecord = {
      id: alertId,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: Date.now(),
      status: 'calling',
      aisle: aisle || 'Kiosco Tótem Interactivo Piso 1',
      storeDepartment: department || 'Piso General',
      reason: reason || 'Cliente solicita asistencia desde Kiosco Tótem',
      preferredEmployeeId: preferredEmployeeId || undefined,
      assignedAssociateName: assigned.name,
      assignedAssociateRole: assigned.role,
      assignedAssociateId: assigned.id,
      estimatedArrivalSeconds: 30,
    };

    activeAssistanceCall = newAlert;
    alertsHistory.unshift(newAlert);
    if (alertsHistory.length > 50) alertsHistory.pop();

    const originHeader = (req.headers['origin'] || req.headers['referer'] || req.ip || 'Kiosco Tótem Externo').toString();
    integrationLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      origin: originHeader,
      aisle: newAlert.aisle,
      reason: newAlert.reason,
      status: 'processed',
    });

    broadcastSSE({
      type: 'new_call',
      alert: newAlert,
      activeCall: activeAssistanceCall,
    });

    res.json({
      success: true,
      message: 'Solicitud del Kiosco recibida y despachada al personal en piso exitosamente.',
      alertId: newAlert.id,
      assignedTo: assigned.name,
      call: activeAssistanceCall,
    });
  });

  // Health check y estado para integración con Kiosco Externo
  app.get('/api/external/ping', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'Coppel Staff & Despacho API',
      status: 'ONLINE',
      serverTime: new Date().toISOString(),
      activeCall: activeAssistanceCall ? { id: activeAssistanceCall.id, aisle: activeAssistanceCall.aisle, status: activeAssistanceCall.status } : null,
      availableStaffCount: employeesList.filter((e) => e.status === 'disponible').length,
    });
  });

  // Registro de peticiones recibidas desde Kioscos externos
  app.get('/api/external/logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      logs: integrationLogs,
    });
  });

  // Employee accepts call from their mobile phone or admin panel ("Voy en camino")
  app.post('/api/assistance/respond', (req: Request, res: Response) => {
    const { alertId, associateId, associateName } = req.body;

    let targetAlert = activeAssistanceCall && activeAssistanceCall.id === alertId ? activeAssistanceCall : null;
    if (!targetAlert) {
      targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
    }

    const assignedEmp = associateId ? employeesList.find((e) => e.id === associateId) : null;
    const finalName = assignedEmp ? assignedEmp.name : associateName || 'Mariana Gómez';
    const finalRole = assignedEmp ? assignedEmp.role : 'Asesora de Piso y Crédito';

    if (targetAlert) {
      targetAlert.status = 'in_transit';
      targetAlert.assignedAssociateName = finalName;
      targetAlert.assignedAssociateRole = finalRole;
      if (assignedEmp) {
        targetAlert.assignedAssociateId = assignedEmp.id;
      }
    }

    if (activeAssistanceCall && (activeAssistanceCall.id === alertId || !alertId)) {
      activeAssistanceCall.status = 'in_transit';
      activeAssistanceCall.assignedAssociateName = finalName;
      activeAssistanceCall.assignedAssociateRole = finalRole;
    }

    broadcastSSE({
      type: 'call_responded',
      alertId,
      associateName: finalName,
      activeCall: activeAssistanceCall,
    });

    res.json({
      success: true,
      message: `${finalName} va en camino a atender al cliente.`,
      call: activeAssistanceCall,
    });
  });

  // Employee or Admin marks request as completed / resolved ("Atendido y Resuelto" con resultado)
  app.post('/api/assistance/resolve', (req: Request, res: Response) => {
    const { alertId, outcome, resolutionNotes } = req.body;

    let targetAlert = activeAssistanceCall;
    if (!targetAlert && alertId) {
      targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    if (targetAlert) {
      targetAlert.status = 'resolved';
      targetAlert.resolvedAt = timeStr;
      targetAlert.outcome = outcome || 'resuelto_exitoso';
      targetAlert.resolutionNotes = resolutionNotes || (outcome === 'no_resuelto' ? 'No se pudo resolver en piso' : 'Atendido exitosamente');

      if (targetAlert.assignedAssociateId) {
        const emp = employeesList.find((e) => e.id === targetAlert.assignedAssociateId);
        if (emp) {
          emp.totalHelpedToday += 1;
          emp.status = 'disponible';
          const pointsToAdd = outcome === 'resuelto_exitoso' ? 100 : 10;
          emp.points = (emp.points || 0) + pointsToAdd;
          if (outcome === 'resuelto_exitoso') {
            emp.successfulAssistsToday = (emp.successfulAssistsToday || 0) + 1;
            emp.streak = (emp.streak || 0) + 1;
          } else {
            emp.streak = 0;
          }
        }
      }

      // Asegurar que esté en el historial
      if (!alertsHistory.some((a) => a.id === targetAlert.id)) {
        alertsHistory.unshift(targetAlert);
      }
    }

    // Terminar llamada activa permanentemente
    activeAssistanceCall = null;

    broadcastSSE({
      type: 'call_resolved',
      alertId: targetAlert?.id || alertId,
      resolvedAt: timeStr,
      outcome: outcome || 'resuelto_exitoso',
      resolutionNotes,
      employees: employeesList,
      activeCall: null,
    });

    res.json({
      success: true,
      message: 'Asistencia finalizada y registrada correctamente.',
      activeCall: null,
    });
  });

  // Employee rejects call because they are attending another case
  app.post('/api/assistance/reject', (req: Request, res: Response) => {
    const { alertId, employeeId, employeeName, reason } = req.body;

    const emp = employeesList.find((e) => e.id === employeeId);
    const finalName = emp ? emp.name : employeeName || 'Asesor de Tienda';
    if (emp) {
      emp.status = 'ocupado';
    }

    let targetAlert = activeAssistanceCall && (!alertId || activeAssistanceCall.id === alertId) ? activeAssistanceCall : null;
    if (!targetAlert && alertId) {
      targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
    }

    if (targetAlert) {
      const prevRejected = (targetAlert as any).rejectedBy || [];
      (targetAlert as any).rejectedBy = [...prevRejected, employeeId];
      (targetAlert as any).lastRejectionReason = reason || 'Atendiendo a otro cliente';
      (targetAlert as any).lastRejectedByName = finalName;
      targetAlert.status = 'calling'; // Devuelve la alerta al supervisor
      targetAlert.assignedAssociateId = undefined;
      targetAlert.assignedAssociateName = undefined;
    }

    broadcastSSE({
      type: 'call_rejected',
      alertId,
      employeeId,
      employeeName: finalName,
      reason,
      employees: employeesList,
      activeCall: activeAssistanceCall,
    });

    res.json({
      success: true,
      message: `${finalName} rechazó la llamada. Supervisor notificado.`,
      activeCall: activeAssistanceCall,
    });
  });

  // Admin assigns call to specific employee
  app.post('/api/assistance/assign', (req: Request, res: Response) => {
    const { alertId, employeeId } = req.body;

    const emp = employeesList.find((e) => e.id === employeeId);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    let targetAlert = activeAssistanceCall && (!alertId || activeAssistanceCall.id === alertId) ? activeAssistanceCall : null;
    if (!targetAlert && alertId) {
      targetAlert = alertsHistory.find((a) => a.id === alertId) || null;
    }

    if (targetAlert) {
      targetAlert.assignedAssociateId = emp.id;
      targetAlert.assignedAssociateName = emp.name;
      targetAlert.assignedAssociateRole = emp.role;
      targetAlert.status = 'calling';
      (targetAlert as any).dispatchedByAdmin = true;
      (targetAlert as any).lastRejectionReason = undefined;
      (targetAlert as any).lastRejectedByName = undefined;
    }

    broadcastSSE({
      type: 'call_assigned',
      alertId,
      employeeId: emp.id,
      employeeName: emp.name,
      activeCall: activeAssistanceCall,
    });

    res.json({
      success: true,
      message: `Alerta asignada a ${emp.name}`,
      activeCall: activeAssistanceCall,
    });
  });

  // Cancel assistance request
  app.post('/api/assistance/cancel', (_req: Request, res: Response) => {
    if (activeAssistanceCall) {
      const match = alertsHistory.find((a) => a.id === activeAssistanceCall?.id);
      if (match) match.status = 'cancelled';
    }
    activeAssistanceCall = null;

    broadcastSSE({
      type: 'call_cancelled',
      activeCall: null,
    });

    res.json({
      success: true,
      message: 'Solicitud de asistencia cancelada.',
    });
  });

  // Otorgar bono de supervisor a empleado
  app.post('/api/employees/bonus', (req: Request, res: Response) => {
    const { employeeId, bonusPoints, reason } = req.body;
    const emp = employeesList.find((e) => e.id === employeeId);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    const pts = parseInt(bonusPoints, 10) || 50;
    emp.points = (emp.points || 0) + pts;

    broadcastSSE({
      type: 'bonus_awarded',
      employeeId,
      employeeName: emp.name,
      bonusPoints: pts,
      reason: reason || 'Reconocimiento del Supervisor',
      employees: employeesList,
    });

    res.json({
      success: true,
      message: `Bono de +${pts} puntos otorgado a ${emp.name}`,
      employee: emp,
    });
  });

  // Catalog and search
  app.get('/api/catalog', (req: Request, res: Response) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    if (!q) {
      return res.json({ success: true, items: catalogItems });
    }
    const filtered = catalogItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.aisle.toLowerCase().includes(q)
    );
    res.json({ success: true, items: filtered });
  });

  // Mount Vite in dev or serve static in prod
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kiosco Coppel Asistencia] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
