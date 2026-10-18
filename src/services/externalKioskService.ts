// Servicio Oficial Firebase Firestore para Asistencias Coppel
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  Unsubscribe
} from "firebase/firestore";
import { AssistanceAlert } from "../types";

// Your web app's Firebase configuration proporcionada por el usuario
export const firebaseConfig = {
  apiKey: "AIzaSyCCeLrgPDOLERlr0lHe8Y1ugliPxWcyab0",
  authDomain: "coppel-asistencia.firebaseapp.com",
  projectId: "coppel-asistencia",
  storageBucket: "coppel-asistencia.firebasestorage.app",
  messagingSenderId: "484673873075",
  appId: "1:484673873075:web:7f483347a495126122bcc6"
};

// Initialize Firebase (evitando reinicializaciones en dev)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface FirestoreAsistenciaDoc {
  id?: string;
  aisle: string;
  reason: string;
  customerPin?: string;
  status: "pendiente" | "en_camino" | "resuelto" | string;
  createdAt?: any;
  advisorName?: string;
  estimatedArrival?: string;
  department?: string;
  storeDepartment?: string;
  requesterRole?: string;
  requesterName?: string;
  urgency?: string;
}

// 1. Escuchar solicitudes en tiempo real vía onSnapshot sobre la colección "asistencias",
// usando SOLO orderBy("createdAt", "desc") para evitar requerir índices compuestos en Firestore,
// y filtrando status == "pendiente" en el cliente:
export function suscribirAsistenciasPendientes(
  onPendientes: (llamadas: AssistanceAlert[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const asistenciasCol = collection(db, "asistencias");

  const parseDocs = (snapshot: any) => {
    const pendientes: AssistanceAlert[] = [];

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      // Filtrar status == "pendiente" en el cliente
      if (data && data.status === "pendiente") {
        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();

        if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        } else if (rawCreated && typeof rawCreated.toMillis === 'function') {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated && typeof rawCreated.seconds === 'number') {
          createdAtMs = rawCreated.seconds * 1000;
        }

        const alertItem: AssistanceAlert = {
          id: docSnap.id,
          timestamp:
            data.timestamp ||
            new Date(createdAtMs).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          createdAt: createdAtMs,
          status: 'calling', // para que el asesor vea la alerta entrante y suene la sirena
          aisle: data.aisle || 'Pasillo Central de Tienda',
          storeDepartment: data.department || data.storeDepartment || 'Piso de Venta',
          reason: data.reason || 'Atención solicitada en kiosco',
          customerPin: data.customerPin ? String(data.customerPin) : undefined,
          estimatedArrivalSeconds: 60,
          requesterRole: (data.requesterRole as any) || 'cliente',
          requesterName: data.requesterName || 'Kiosco de Cliente',
          urgency: (data.urgency as any) || 'alta',
        };

        pendientes.push(alertItem);
      }
    });

    // Ordenar de más reciente a más antiguo
    pendientes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Console logs requeridos para cada llamada
    pendientes.forEach((llamada) => {
      console.log("Nueva llamada de cliente (Firestore):");
      console.log("- ID Llamada:", llamada.id);
      console.log("- Lugar / Pasillo:", llamada.aisle);
      console.log("- Tipo de Asistencia:", llamada.reason);
      console.log("- PIN del Cliente:", llamada.customerPin);
    });

    onPendientes(pendientes);
  };

  try {
    // Consulta con SOLO orderBy('createdAt', 'desc') para evitar warning de índice compuesto
    const qWithOrder = query(
      asistenciasCol,
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      qWithOrder,
      (snapshot) => parseDocs(snapshot),
      (err) => {
        // En caso de que algunos documentos no tengan createdAt o falte índice básico
        console.warn("Firestore query orderBy fallback:", err);
        return onSnapshot(
          asistenciasCol,
          (snapshot) => parseDocs(snapshot),
          (e2) => {
            console.error("Error en onSnapshot asistencias:", e2);
            onError?.(e2);
          }
        );
      }
    );
  } catch (err) {
    return onSnapshot(asistenciasCol, (snapshot) => parseDocs(snapshot), onError);
  }
}

// 2. Al pulsar "Voy en camino", updateDoc del documento con status="en_camino",
// advisorName=<nombre del asesor> y estimatedArrival="1-2 minutos"
export async function confirmarQueVoyEnCamino(
  callId: string,
  nombreDelAsesor: string
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, "asistencias", callId);
    await updateDoc(docRef, {
      status: "en_camino",
      advisorName: nombreDelAsesor, // Ej: "Mariana Gómez (Piso de Ventas)"
      estimatedArrival: "1-2 minutos",
      acceptedAt: Date.now()
    });

    console.log(
      `Firestore: Documento ${callId} actualizado a status='en_camino' con advisorName='${nombreDelAsesor}'`
    );

    return {
      success: true,
      message: `¡Listo! El cliente ya ve en su pantalla que tú (${nombreDelAsesor}) vas en camino.`
    };
  } catch (error) {
    console.error("Error al actualizar asistencia en Firestore:", error);
    return {
      success: false,
      message: `Error al actualizar en Firestore: ${(error as any)?.message || error}`
    };
  }
}

// 3. El botón "Probar Kiosco" debe crear un documento de prueba en "asistencias":
export async function simularLlamadaKioscoCliente(payload?: {
  aisle?: string;
  reason?: string;
  customerPin?: string;
}): Promise<{ id: string; [key: string]: any }> {
  const pin = payload?.customerPin || Math.floor(1000 + Math.random() * 9000).toString();
  const testDoc: FirestoreAsistenciaDoc = {
    aisle: payload?.aisle || "Pasillo 1A - Telefonía & Celulares",
    reason: payload?.reason || "Cliente solicita ver celulares Samsung en vitrina",
    customerPin: pin,
    status: "pendiente",
    createdAt: Date.now(),
    department: "Electrónica & Celulares",
    storeDepartment: "Electrónica & Celulares",
    requesterRole: "cliente",
    requesterName: "Kiosco de Cliente",
    urgency: "alta"
  };

  try {
    const docRef = await addDoc(collection(db, "asistencias"), testDoc);
    console.log("Documento de prueba creado en Firestore con ID:", docRef.id);
    console.log("- PIN generado:", pin);
    return { id: docRef.id, ...testDoc };
  } catch (err) {
    console.error("Error al crear documento de prueba en Firestore:", err);
    throw err;
  }
}

// 4. Marcar como resuelto en Firestore cuando el asesor termine la atención
export async function resolverAsistenciaEnFirestore(
  callId: string,
  outcome: string
): Promise<void> {
  try {
    const docRef = doc(db, "asistencias", callId);
    await updateDoc(docRef, {
      status: "resuelto",
      resolvedAt: Date.now(),
      outcome
    });
  } catch (err) {
    // ignore
  }
}
