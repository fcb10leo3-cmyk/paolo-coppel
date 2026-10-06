# 📱 Coppel Staff Móvil - App de Empleados y Asesores de Tienda

Aplicación móvil oficial para colaboradores y asesores de tienda Coppel para la atención en tiempo real de llamadas y solicitudes de clientes en piso de venta.

## 🌟 Características de la App Móvil de Empleados
- **Recepción Inmediata de Alertas**: Avisos sonoros, síntesis de voz ("¡Atención! Solicitud de asistencia en Pasillo 4") y vibración cuando un cliente requiere apoyo.
- **Detalle de Pasillo y Motivo**: Ubicación precisa del cliente (ej. Pasillo 4 Muebles, Pasillo 1A Celulares) y consulta específica.
- **Acciones Rápidas de Piso**:
  - `Aceptar y Voy en Camino`: Asigna la solicitud al colaborador y activa el cronómetro de llegada (< 30s).
  - `Marcar como Atendido / Resuelto`: Finaliza la atención y registra la estadística del colaborador.
  - `Reasignar / Transferir`: Permite pasar la llamada a otro compañero si estás ocupado.
- **Gestión de Disponibilidad del Equipo**: Monitoreo y cambio de estado del personal en turno (`Disponible`, `En Piso`, `Ocupado`, `Descanso`).
- **Simulador de Clientes Integrado**: Botón con 5 escenarios reales para probar la aplicación de inmediato en Netlify sin necesidad de hardware adicional.
- **Sincronización P2P / Multi-Pestaña**: Funciona 100% en servidores estáticos como Netlify mediante `BroadcastChannel` y `localStorage`, y con API en servidores Node.js.

---

## 🚀 Cómo Subir a GitHub y Desplegar en Netlify

### 1. Subir a GitHub (en tu terminal):
```bash
git add .
git commit -m "feat: App Móvil de Empleados Coppel Staff lista para Netlify"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Desplegar en Netlify:
1. Ve a [app.netlify.com](https://app.netlify.com)
2. Haz clic en **"Add new site"** > **"Import an existing project"**
3. Selecciona **GitHub** y tu repositorio
4. Netlify ya tiene todo preconfigurado gracias a `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Haz clic en **"Deploy"** y ¡listo! Tu enlace público abrirá directamente la **App Móvil de Empleados**.
