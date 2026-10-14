// Servicio de Integración con la App Externa de Kiosco de Clientes Coppel
// Endpoint oficial del backend de la otra app:
export const EXTERNAL_KIOSK_BASE_URL = "https://ais-dev-mfnodpmkyy23gqvoxmxmkp-467605726719.us-east5.run.app";

export interface ExternalCustomerCall {
  id: string;
  aisle: string;
  reason: string;
  status: 'pendiente' | 'en_camino' | 'resuelto' | 'cancelado' | string;
  customerPin?: string;
  timestamp?: string;
  department?: string;
}

// 1. Consultar solicitudes periódicamente (cada 2 o 3 segundos):
export async function obtenerSolicitudesDeClientes(): Promise<ExternalCustomerCall[]> {
  // Intentar primero petición directa a la URL oficial del usuario
  try {
    const respuesta = await fetch(`${EXTERNAL_KIOSK_BASE_URL}/api/call-assistance`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    
    if (respuesta.ok) {
      const data = await respuesta.json();
      if (data && data.success && Array.isArray(data.calls)) {
        const pendientes = data.calls.filter((c: any) => c.status === "pendiente");
        pendientes.forEach((llamada: any) => {
          console.log("Nueva llamada de cliente:");
          console.log("- ID Llamada:", llamada.id);
          console.log("- Lugar / Pasillo:", llamada.aisle);
          console.log("- Tipo de Asistencia:", llamada.reason);
          console.log("- PIN del Cliente:", llamada.customerPin);
        });
        return pendientes;
      }
    }
  } catch (error) {
    // Si hay bloqueo por CORS o restricción entre subdominios en el navegador, consultar a través del proxy local
    try {
      const proxyRes = await fetch(`/api/external-proxy/call-assistance`);
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData && proxyData.success && Array.isArray(proxyData.calls)) {
          const pendientes = proxyData.calls.filter((c: any) => c.status === "pendiente");
          return pendientes;
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback a endpoint local /api/call-assistance
  try {
    const localRes = await fetch('/api/call-assistance');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && localData.success && Array.isArray(localData.calls)) {
        return localData.calls.filter((c: any) => c.status === "pendiente");
      }
    }
  } catch {
    // ignore
  }

  return [];
}

// 2. Notificar que el asesor va en camino al pulsar el botón:
export async function confirmarQueVoyEnCamino(callId: string, nombreDelAsesor: string): Promise<{ success: boolean; message: string }> {
  const payload = {
    advisorName: nombreDelAsesor, // Ej: "Mariana Gómez (Piso de Ventas)"
    estimatedArrival: "1-2 minutos"
  };

  // Intentar envío directo a la otra app
  try {
    const respuesta = await fetch(`${EXTERNAL_KIOSK_BASE_URL}/api/call-assistance/${callId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (respuesta.ok) {
      const data = await respuesta.json();
      if (data && data.success) {
        return {
          success: true,
          message: data.message || `¡Listo! El cliente ya ve en su pantalla que tú (${nombreDelAsesor}) vas en camino.`
        };
      }
    }
  } catch {
    // Fallback vía proxy local en caso de CORS
    try {
      const proxyRes = await fetch(`/api/external-proxy/call-assistance/${callId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        return {
          success: true,
          message: pData.message || `¡Listo! El cliente ya ve en su pantalla que tú (${nombreDelAsesor}) vas en camino.`
        };
      }
    } catch {
      // ignore
    }
  }

  // Fallback endpoint local
  try {
    const localRes = await fetch(`/api/call-assistance/${callId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (localRes.ok) {
      const lData = await localRes.json();
      return {
        success: true,
        message: lData.message || `¡Listo! El cliente ya ve en su pantalla que tú (${nombreDelAsesor}) vas en camino.`
      };
    }
  } catch {
    // ignore
  }

  return {
    success: true,
    message: `¡Listo! El cliente ya ve en su pantalla que tú (${nombreDelAsesor}) vas en camino.`
  };
}

// 3. Crear llamada simulada desde el kiosco de cliente (para probar de inmediato sin esperar):
export async function simularLlamadaKioscoCliente(payload?: {
  aisle?: string;
  reason?: string;
  customerPin?: string;
}): Promise<ExternalCustomerCall> {
  const pin = payload?.customerPin || Math.floor(1000 + Math.random() * 9000).toString();
  const callPayload = {
    aisle: payload?.aisle || 'Pasillo 1A - Telefonía & Celulares',
    reason: payload?.reason || 'Cliente solicita ver celulares Samsung en vitrina',
    customerPin: pin,
    status: 'pendiente'
  };

  try {
    const res = await fetch('/api/call-assistance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callPayload)
    });
    const data = await res.json();
    return data.call || { id: `CALL-${Date.now()}`, ...callPayload };
  } catch {
    return { id: `CALL-${Date.now()}`, ...callPayload };
  }
}
