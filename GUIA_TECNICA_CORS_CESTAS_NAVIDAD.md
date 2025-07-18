# 🧑‍💻 Guía Técnica para Desarrolladores: CORS y Cestas Navideñas

## 📅 Fecha: 18 de Julio, 2025

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Frontend     │     │  Backend      │     │  MongoDB      │
│  (React)      │◄────►  (Express.js) │◄────►  (Atlas)      │
└───────────────┘     └───────────────┘     └───────────────┘
       ▲                     ▲
       │                     │
       ▼                     ▼
┌───────────────┐     ┌───────────────┐
│  Gestor       │     │  Socket.IO    │
│  Cestas       │◄────►  (WebSockets) │
└───────────────┘     └───────────────┘
```

### Flujo de Datos para Cestas Navideñas

1. El frontend carga una lista de clientes desde CSV
2. Envía la lista al endpoint `/api/clientes/marcar-cestas-navidad`
3. El backend compara con los clientes existentes
4. Marca los clientes encontrados con `esCestaNavidad: true`
5. Crea nuevos clientes si no existen
6. Devuelve estadísticas y resultados al frontend

## 🔒 Implementación de CORS

### Configuración CORS en Express

```javascript
// Middleware CORS principal
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Configuración CORS para Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
```

### Función corsOrigin Mejorada

```javascript
function corsOrigin(origin, callback) {
  console.log(`[CORS DEBUG] Verificando origen: ${origin}`);
  
  // Log específico para depurar peticiones de gestor de cestas
  if (origin && (origin.includes('gestor-cestas') || origin.includes('debug-cestas'))) {
    console.log(`[CORS-CESTAS] ⚠️ Petición de Gestor de Cestas detectada: ${origin}`);
  }
  
  if (!origin) {
    console.log('[CORS DEBUG] Petición sin origen, permitida');
    return callback(null, true); // Permitir peticiones sin origen (curl, Postman)
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
    return callback(null, origin); // Refleja el origin válido
  }
  
  console.log(`[CORS DEBUG] Origen rechazado: ${origin}`);
  return callback(new Error('Not allowed by CORS: ' + origin));
}
```

### Aplicación Específica a Rutas

```javascript
// Rutas de clientes
app.get('/api/clientes', clientesController.listar);
// Colocar primero rutas específicas para evitar conflictos con :id
app.post('/api/clientes/buscar-coincidencias', cors(), clientesController.buscarCoincidencias);
// Aplicar middleware cors() explícitamente a la ruta problemática
app.post('/api/clientes/importar', cors(), clientesController.importarClientes);

// Rutas con parámetros después
app.get('/api/clientes/:id', clientesController.obtener);
app.post('/api/clientes', clientesController.crear);
app.put('/api/clientes/:id', clientesController.actualizar);
app.delete('/api/clientes/:id', clientesController.eliminar);
```

## 🔍 Puntos Clave del Problema CORS

### 1. Orden de Rutas en Express.js

Express.js procesa las rutas en el orden en que se definen. El problema original era:

```javascript
// INCORRECTO: Las rutas genéricas capturan primero
app.get('/api/clientes/:id', clientesController.obtener);
app.post('/api/clientes/:action', clientesController.handleAction);

// La ruta específica nunca se alcanza
app.post('/api/clientes/importar', clientesController.importarClientes);
```

La solución fue reorganizar para que las rutas específicas se definan primero:

```javascript
// CORRECTO: Rutas específicas primero
app.post('/api/clientes/importar', cors(), clientesController.importarClientes);
app.post('/api/clientes/marcar-cestas-navidad', cors(), clientesController.marcarCestasNavidad);

// Rutas genéricas después
app.get('/api/clientes/:id', clientesController.obtener);
app.post('/api/clientes/:action', clientesController.handleAction);
```

### 2. Aplicación de Middleware CORS

Express.js permite aplicar middleware a nivel global o a rutas específicas:

```javascript
// Aplicación global (afecta a todas las rutas)
app.use(cors({ origin: corsOrigin }));

// Aplicación específica (solo afecta a esta ruta)
app.post('/api/clientes/importar', cors(), clientesController.importarClientes);
```

Para el endpoint problemático, aplicamos el middleware específicamente para asegurarnos de que siempre se procese correctamente.

### 3. Respuesta Preflight OPTIONS

Para peticiones complejas (como POST con JSON), el navegador envía primero una petición OPTIONS:

```
OPTIONS /api/clientes/importar HTTP/1.1
Host: localhost:10001
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

El servidor debe responder con las cabeceras CORS apropiadas:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: Content-Type
```

## 🧪 Herramientas de Diagnóstico y Pruebas

### 1. debug-cestas-import.js

Este script simula peticiones al endpoint desde diferentes orígenes:

```javascript
// Simular petición OPTIONS (preflight)
const optionsResponse = await axios({
  method: 'OPTIONS',
  url: `${API_URL}${ENDPOINT}`,
  headers: {
    'Origin': origenPrueba,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
});

// Simular petición POST
const response = await axios.post(
  `${API_URL}${ENDPOINT}`, 
  { clientes: clientesDePrueba },
  { 
    headers: {
      'Content-Type': 'application/json',
      'Origin': origenPrueba
    }
  }
);
```

### 2. actualizar-cors-cestas.js

Este script automatiza la corrección de problemas:

```javascript
// Detectar y corregir rutas
const importarClientesRouteRegex = /app\.(?:post|use)\s*\(['"]\/api\/clientes\/importar['"]/;
let routeMatch = serverContent.match(importarClientesRouteRegex);

if (!routeMatch) {
  // Agregar la ruta si no existe
  // ...
} else {
  // Verificar si la ruta ya tiene cors() aplicado
  const routeLine = serverContent.substring(routeStartIndex, routeEndOfLine);
  
  if (!routeLine.includes('cors()')) {
    // Agregar cors() a la ruta existente
    const updatedRouteLine = routeLine.replace(
      /app\.(post|use)\s*\(['"]\/api\/clientes\/importar['"],\s*/,
      `app.$1('/api/clientes/importar', cors(), `
    );
    
    serverContent = serverContent.replace(routeLine, updatedRouteLine);
  }
}
```

## 📝 Modelo de Datos

### Cliente

```javascript
const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  razonSocial: { type: String },
  nif: { type: String },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  codigoPostal: { type: String },
  poblacion: { type: String },
  provincia: { type: String },
  // ... otros campos ...
  
  // Campo para cestas navideñas
  esCestaNavidad: { type: Boolean, default: false }
});
```

## 🛠️ Mejores Prácticas para Rutas Express

1. **Organizar rutas por especificidad**:
   - Rutas específicas antes que rutas con parámetros
   - Ejemplo: `/api/clientes/importar` antes de `/api/clientes/:id`

2. **Aplicar CORS de forma consistente**:
   - Global con `app.use(cors())`
   - Específico para rutas problemáticas `app.post('/ruta', cors(), controller)`

3. **Evitar rutas duplicadas**:
   - Verificar que no haya múltiples definiciones de la misma ruta
   - Usar controladores para mantener organizado el código

4. **Implementar logs adecuados**:
   - Logs de depuración para CORS
   - Información específica para tipos de peticiones (ej: cestas navideñas)

## 🔄 Proceso de Actualización en Producción

1. Completar pruebas locales con las herramientas de diagnóstico
2. Hacer commit de los cambios:
   ```bash
   git add gestion-pedidos-carniceria/src/server.js
   git commit -m "Actualiza configuración CORS para endpoint de importación de clientes de cestas navideñas"
   ```
3. Subir al repositorio:
   ```bash
   git push
   ```
4. Desplegar en Render:
   - Acceder al dashboard en [dashboard.render.com](https://dashboard.render.com)
   - Seleccionar el servicio `pedidos-backend`
   - Hacer clic en "Manual Deploy" > "Deploy latest commit"

## 🔍 Recursos Adicionales

- [MDN Web Docs: CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Express.js: Using middleware](https://expressjs.com/es/guide/using-middleware.html)
- [Socket.IO: Handling CORS](https://socket.io/docs/v4/handling-cors/)

---

**Documento elaborado por el Equipo de Desarrollo - Sistema de Gestión de Pedidos**
