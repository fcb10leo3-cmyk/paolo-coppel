# 🚀 Despliegue en GitHub y Netlify: Coppel Staff Móvil

Esta aplicación está enfocada y optimizada para ser la **App Móvil de Empleados y Asesores de Tienda Coppel**. Al desplegarla en Netlify, cargará de forma inmediata la aplicación móvil.

---

## ⚡ ¿Por qué ahora sí funciona al 100% en Netlify?

1. **Pantalla Principal Directa**: La ruta raíz `/` abre directamente la **App Móvil de Empleados (Coppel Staff Móvil)**. Ya no requiere parámetros especiales.
2. **Simulador de Clientes Incluido**: Cuenta con un botón **"Simular Llamada de Cliente"** con 5 escenarios reales (Muebles, Celulares, Pantallas, Línea Blanca, Botón Físico) para probar el sonido, cronómetro y respuesta en vivo desde Netlify.
3. **Persistencia y Sincronización sin Backend**: Si Netlify actúa como host estático, el servicio `kioskSync` maneja las alertas con `localStorage` y `BroadcastChannel`. Si abres la app en 2 pestañas o celulares, se sincronizan al instante.
4. **`_redirects` y `netlify.toml`**: Configurados para evitar cualquier error 404 al recargar la página.

---

## 📋 Pasos para Subir a GitHub

Abre la terminal en la carpeta de este proyecto:

```bash
# 1. Asegurar que todos los cambios estén agregados
git add .

# 2. Hacer commit
git commit -m "feat: Coppel Staff Móvil enfocado y listo para Netlify"

# 3. Vincular con tu repositorio de GitHub (reemplaza con tu URL real)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 4. Subir a la rama main
git push -u origin main
```

*(Si ya habías vinculado el origen previamente, solo corre `git push -u origin main`)*

---

## 🌐 Pasos para Desplegar en Netlify

1. Entra a [app.netlify.com](https://app.netlify.com).
2. Da clic en **"Add new site"** ➜ **"Import an existing project"**.
3. Selecciona **GitHub** y busca tu repositorio.
4. Netlify detectará la configuración de `netlify.toml`:
   - **Branch:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Da clic en **"Deploy"**.

¡En 30 segundos tu app estará visible y funcionando en la URL pública que te dé Netlify!
