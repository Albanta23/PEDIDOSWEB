# Solución al Problema de CORS entre Frontend (Vercel) y Backend (Render)

## Fecha: Julio 2025

### Problema Identificado

Se han detectado errores de CORS (Cross-Origin Resource Sharing) cuando el frontend alojado en Vercel intenta comunicarse con el backend alojado en Render. Específicamente, el dominio `pedidosweb-x158.vercel.app` está siendo bloqueado por la configuración CORS del servidor.

El error típico en la consola del navegador es:

```
Access to XMLHttpRequest at 'https://pedidos-backend-0e1s.onrender.com/api/pedidos' 
from origin 'https://pedidosweb-x158.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Causa del Problema

Aunque la configuración actual del servidor incluye reglas para permitir dominios de Vercel (usando la expresión regular `/\.vercel\.app$/`), podría haber un problema con:

1. La forma en que se está evaluando el origen de la solicitud
2. Cómo se está aplicando la lógica de validación CORS
3. Alguna condición especial que está impidiendo que el dominio específico `pedidosweb-x158.vercel.app` sea reconocido correctamente

### Solución Propuesta

#### 1. Actualizar la configuración CORS en el servidor

Modificar el archivo `gestion-pedidos-carniceria/src/server.js` para añadir explícitamente el dominio `pedidosweb-x158.vercel.app` a la lista de orígenes permitidos:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3100',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:3000',
  'https://127.0.0.1:3100',
  'https://pedidosweb-phi.vercel.app',
  'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3000.app.github.dev',
  'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-5173.app.github.dev',
  'https://pedidosweb-etl1eydr3-albanta23s-projects.vercel.app',
  'https://pedidos-backend-0e1s.onrender.com',
  'https://pedidosweb-x158.vercel.app' // Añadir el nuevo dominio de Vercel
];
```

#### 2. Mejorar la función de validación CORS

Añadir logs adicionales para depuración y asegurar que la lógica funciona correctamente:

```javascript
function corsOrigin(origin, callback) {
  console.log(`[CORS DEBUG] Verificando origen: ${origin}`);
  
  if (!origin) {
    console.log('[CORS DEBUG] Petición sin origen, permitida');
    return callback(null, true);
  }
  
  const originLc = origin.toLowerCase();
  const allowedOriginsLc = allowedOrigins.map(o => o.toLowerCase());
  
  const githubDevRegex = /^https?:\/\/[a-z0-9-]+(-[a-z0-9]+)*(\.[0-9]+)?\.app\.github\.dev$/;
  const matchGithubDev = githubDevRegex.test(originLc);
  const matchVercel = /\.vercel\.app$/.test(originLc);
  const matchRender = /\.onrender\.com$/.test(originLc);
  const matchLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(originLc);
  
  console.log(`[CORS DEBUG] Evaluación: 
    - En lista: ${allowedOriginsLc.includes(originLc)}
    - Vercel: ${matchVercel}
    - Render: ${matchRender}
    - Localhost: ${matchLocalhost}
    - GitHub: ${matchGithubDev}`);
  
  if (
    allowedOriginsLc.includes(originLc) ||
    matchVercel ||
    matchRender ||
    matchLocalhost ||
    matchGithubDev
  ) {
    console.log(`[CORS DEBUG] Origen permitido: ${origin}`);
    return callback(null, origin);
  }
  
  console.log(`[CORS DEBUG] Origen rechazado: ${origin}`);
  return callback(new Error('Not allowed by CORS: ' + origin));
}
```

#### 3. Asegurar consistencia en la configuración de Socket.IO

Asegurar que la configuración CORS de Socket.IO sea consistente con la del servidor Express:

```javascript
const io = new Server(server, {
  cors: {
    origin: corsOrigin, // Usar la misma función para mantener consistencia
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
```

### Implementación

1. Realizar los cambios mencionados en el archivo `gestion-pedidos-carniceria/src/server.js`
2. Hacer commit de los cambios
3. Desplegar la versión actualizada en Render
4. Verificar que el frontend en `pedidosweb-x158.vercel.app` puede comunicarse correctamente con el backend

### Pruebas Recomendadas

Después de implementar los cambios:

1. Acceder al frontend desde `pedidosweb-x158.vercel.app` y verificar en la consola del navegador que no hay errores CORS
2. Comprobar que las operaciones que requieren comunicación con el backend funcionan correctamente
3. Revisar los logs del servidor para ver los mensajes de depuración CORS y confirmar que el origen está siendo validado correctamente

### Consideraciones Adicionales

- La solución temporal de añadir un dominio específico funcionará, pero el enfoque a largo plazo debería ser robusto para manejar cualquier dominio de Vercel asociado con el proyecto
- Es recomendable configurar variables de entorno para los dominios permitidos en lugar de codificarlos directamente en el código
- Para entornos de producción, es importante limitar los orígenes permitidos solo a los dominios realmente necesarios

Esta solución debería resolver los problemas de CORS actuales mientras se mantiene un nivel adecuado de seguridad en la aplicación.
