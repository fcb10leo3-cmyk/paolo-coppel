# 🚀 Despliegue en GitHub y Netlify: Coppel Staff Móvil & Despacho

Este repositorio contiene la aplicación **Coppel Staff & Despacho** con soporte completo para:
1. **App Celular para Asesores en Piso (`/?role=staff`)** con pantalla completa responsiva y botones de acción rápida.
2. **Tablero de Control para el Administrador / Supervisor (`/?role=admin`)** para despachar, reasignar o tomar casos con un clic.
3. **Códigos QR Multidispositivo sin Error 404**: Permite escanear desde cualquier teléfono celular para abrir la app en vivo.
4. **Netlify Functions Backend (`netlify/functions/api.ts`)**: API REST con CORS habilitado para conectar otra app (como el Kiosco Tótem).

---

## 🔍 ¿Por qué salía "Error 404" con el Código QR y cómo quedó resuelto?

1. **Causa del 404 anterior:** Al generar el código QR dentro del entorno de desarrollo o sandbox de Google AI Studio, la URL apuntaba a `localhost` o al subdominio interno del contenedor, al cual tu teléfono celular no puede acceder directamente.
2. **Solución implementada:**
   - Se añadió un **Configurador de Dominio Público** en el modal de compartir (`Compartir / QR`).
   - Puedes colocar la URL pública de tu Netlify (por ejemplo: `https://mi-coppel-staff.netlify.app`).
   - El código QR se genera automáticamente apuntando a tu Netlify en vivo.
   - Tanto `_redirects` como `netlify.toml` tienen configuradas las reglas SPA:
     ```toml
     [[redirects]]
       from = "/api/*"
       to = "/.netlify/functions/api/:splat"
       status = 200

     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```
   - Al escanear el QR desde cualquier celular Android o iPhone, la página carga al 100% de la pantalla sin ningún error 404.

---

## 📋 Pasos para Subir a GitHub (Git Push)

Abre tu terminal en la carpeta raíz del proyecto y ejecuta:

```bash
# 1. Agregar todos los cambios
git add .

# 2. Crear el commit
git commit -m "feat: Coppel Staff con Netlify Functions, QR multidispositivo y webhook para Kiosco"

# 3. Establecer rama principal
git branch -M main

# 4. Vincular tu repositorio remoto de GitHub (reemplaza con tu URL real de GitHub)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 5. Enviar a GitHub
git push -u origin main
```

*(Si ya tenías el remoto agregado, simplemente corre `git push origin main`)*.

---

## 🌐 Pasos para Desplegar en Netlify

1. Entra a [app.netlify.com](https://app.netlify.com).
2. Da clic en **"Add new site"** ➜ **"Import an existing project"**.
3. Elige **GitHub** y selecciona tu repositorio.
4. Netlify detectará automáticamente el archivo `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Da clic en **"Deploy"**.
6. Una vez desplegado, copia tu URL pública (ejemplo: `https://coppel-staff-demo.netlify.app`).
7. Abre la app, da clic en el botón superior **"Conectar Kiosco / QR"**, pega tu URL en la barra superior del modal y ¡listo! Tus códigos QR y enlaces estarán listos para ser escaneados por todos los asesores en piso.

---

## 🔌 ¿Cómo conectar la otra app del Kiosco Tótem a esta aplicación?

Cuando en la otra aplicación del kiosco el cliente presione el botón **"Necesito un Asesor"** o el botón físico **"PUSH TO SPEAK"**, la app del kiosco solo debe hacer una petición HTTP `POST` a tu servidor de Netlify.

### 1. Endpoint del Webhook:
```http
POST https://TU_SITIO.netlify.app/api/external/call
Content-Type: application/json
```

### 2. Formato del Payload (JSON):
```json
{
  "aisle": "Pasillo 4 - Mueblería Central",
  "department": "Muebles & Salas",
  "reason": "Cliente solicita asesoría en Kiosco Digital",
  "preferredEmployeeId": "emp-01"
}
```

### 3. Código JavaScript listo para pegar en la otra app del Kiosco:
```javascript
async function llamarAsesorEnPiso() {
  try {
    const res = await fetch("https://TU_SITIO.netlify.app/api/external/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aisle: "Pasillo 4 - Mueblería Central",
        department: "Muebles & Electrónica",
        reason: "Llamada desde Kiosco Tótem"
      })
    });

    const data = await res.json();
    console.log("¡Llamada despachada a Coppel Staff!", data);
  } catch (error) {
    console.error("Error al conectar con Coppel Staff:", error);
  }
}
```

**Nota sobre CORS:** Los endpoints de Netlify y el servidor Express tienen habilitado `Access-Control-Allow-Origin: *`, por lo que la otra app del kiosco puede estar en cualquier dominio, servidor local o dispositivo Android/Tablet sin bloqueos de red.
