# Cambios y configuración CORS en el backend

## Resumen
Este documento describe los cambios realizados en la configuración de CORS y orígenes permitidos en el backend Express para asegurar la integración correcta con el frontend en entornos locales y de producción (Vercel, Render, Codespaces, subdominios efímeros).

## Cambios principales

- **Middleware de logging CORS**: Se añadió un middleware que registra el `Origin` y la ruta de cada petición para depuración.
- **Cabeceras CORS explícitas**: Se establecen manualmente las cabeceras `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` y `Access-Control-Allow-Methods` en todas las peticiones.
- **Lista de orígenes permitidos (`allowedOrigins`)**: Incluye dominios locales, de Vercel, Render y subdominios efímeros de Codespaces/GitHub Dev.
- **Función personalizada `corsOrigin`**: Permite peticiones desde orígenes válidos, incluyendo subdominios dinámicos y peticiones sin origen (curl, Postman).
- **Configuración de CORS en Socket.IO**: Se replica la lógica de orígenes permitidos para conexiones en tiempo real.
- **Aclaración**: Todos estos cambios afectan únicamente al backend. El frontend solo debe usar la URL correcta del backend.

## Ejemplo de configuración
```js
// Middleware de logging para depuración de CORS
app.use((req, res, next) => {
  console.log(`[CORS] Origin recibido: ${req.headers.origin} | Ruta: ${req.originalUrl}`);
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  next();
});

// allowedOrigins y función corsOrigin
const allowedOrigins = [
  'http://localhost:5173',
  'https://pedidosweb-phi.vercel.app',
  'https://pedidos-backend-0e1s.onrender.com',
  // ...otros orígenes
];
function corsOrigin(origin, callback) {
  // ...lógica para validar origen
}
app.use(cors({ origin: corsOrigin, credentials: true }));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // ...lógica similar
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
```

## Impacto y recomendaciones
- **Solo backend**: El frontend no requiere cambios para CORS, salvo la URL de la API.
- **Validar en producción**: Es necesario reiniciar el backend en Render/Vercel para aplicar los cambios y probar desde el frontend desplegado.
- **Depuración**: El logging permite identificar rápidamente problemas de origen bloqueado.

## Referencias
- Archivo principal: `gestion-pedidos-carniceria/src/server.js`
- Documentación previa: `RESUMEN_CAMBIOS_JUL2025.md`

---
GitHub Copilot · Actualizado: 12/07/2025
