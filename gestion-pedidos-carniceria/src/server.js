// Servidor Express con Socket.io para pedidos en tiempo real
require('dotenv').config();
// DEBUG: Comprobar carga de MAILJET_API_KEY
if (process.env.MAILJET_API_KEY) {
  console.log('[DEBUG] MAILJET_API_KEY cargada:', process.env.MAILJET_API_KEY.slice(0, 4) + '...' + process.env.MAILJET_API_KEY.slice(-4));
} else {
  console.error('[DEBUG] MAILJET_API_KEY NO está definida');
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Añadido
const helmet = require('helmet'); // Import helmet
const Pedido = require('./models/Pedido'); // Still needed for io.on('connection')

// Import Routers
const pedidosRouter = require('./routes/pedidos.routes');
const avisosRouter = require('./routes/avisos.routes');
const historialProveedorRouter = require('./routes/historialProveedor.routes');
const transferenciasRouter = require('./routes/transferencias.routes');
const productosRouter = require('./routes/productos.routes');
const movimientosStockRouter = require('./routes/movimientosStock.routes');

const app = express();
const server = http.createServer(app); // Usar solo HTTP, compatible con Render

app.use(helmet()); // Use helmet for security headers

// Middleware de logging para depuración de CORS
app.use((req, res, next) => {
  console.log(`[CORS] Origin recibido: ${req.headers.origin} | Ruta: ${req.originalUrl}`);
  next();
});

// Configuración CORS explícita para frontend en Codespaces y Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://pedidosweb-phi.vercel.app', // Desarrollo
  'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3000.app.github.dev', // Codespace actual
  'https://pedidos-backend-0e1s.onrender.com',
  'https://pedidosweb-phi.vercel.app', // Producción (añadido explícitamente)
  // No incluyas aquí URLs efímeras de Codespaces, se permite por regex
];

// Permitir cualquier subdominio de app.github.dev y dominios válidos
function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true); // Permitir peticiones sin origen (curl, Postman)
  const originLc = origin.toLowerCase();
  const allowedOriginsLc = allowedOrigins.map(o => o.toLowerCase());
  const githubDevRegex = /^https?:\/\/[a-z0-9-]+(-[a-z0-9]+)*(\.[0-9]+)?\.app\.github\.dev$/;
  const matchGithubDev = githubDevRegex.test(originLc);
  const matchVercel = /\.vercel\.app$/.test(originLc);
  const matchRender = /\.onrender\.com$/.test(originLc);
  const matchLocalhost = /^http:\/\/localhost(:\d+)?$/.test(originLc);
  if (
    allowedOriginsLc.includes(originLc) ||
    matchVercel ||
    matchRender ||
    matchLocalhost ||
    matchGithubDev
  ) {
    return callback(null, origin); // Refleja el origin válido
  }
  return callback(new Error('Not allowed by CORS: ' + origin));
}

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// --- Socket.IO: CORS seguro y compatible con subdominios efímeros ---
const githubDevRegex = /^https?:\/\/[a-z0-9-]+(-[a-z0-9]+)*(\.[0-9]+)?\.app\.github\.dev$/;
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const originLc = origin.toLowerCase();
      if (
        allowedOrigins.includes(originLc) ||
        githubDevRegex.test(originLc) ||
        originLc.endsWith('.vercel.app') ||
        originLc.endsWith('.onrender.com') ||
        originLc.startsWith('http://localhost')
      ) {
        return callback(null, origin); // Refleja el origin válido
      }
      return callback(new Error('Not allowed by CORS (Socket.IO): ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Conexión a MongoDB robusta: usa Atlas si está definido, si no, usa local SOLO en desarrollo
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // Fallback solo para desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    MONGODB_URI = 'mongodb://localhost:27017/pedidos_db_local';
    console.warn('MONGODB_URI no definida. Usando base de datos local para desarrollo.');
  } else {
    console.error('Error: La variable de entorno MONGODB_URI no está definida y no se permite fallback en producción.');
    process.exit(1);
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB conectado exitosamente.'))
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
  });

// Middleware para aceptar payloads grandes (hasta 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Nueva ruta para health check
app.get('/', (req, res) => {
  res.status(200).send('Backend service is running');
});

// Use Routers
// Pass io instance to pedidosRouter as it needs to emit WebSocket events
app.use('/api/pedidos', pedidosRouter(io));
app.use('/api/avisos', avisosRouter);
app.use('/api/historial-proveedor', historialProveedorRouter);
app.use('/api/transferencias', transferenciasRouter);
app.use('/api/productos', productosRouter);
app.use('/api/movimientos-stock', movimientosStockRouter);


// WebSocket para tiempo real
io.on('connection', async (socket) => { // Hacerla async para cargar pedidos iniciales desde DB
  console.log('Cliente conectado:', socket.id);
  try {
    const pedidosActuales = await Pedido.find();
    socket.emit('pedidos_inicial', pedidosActuales);
  } catch (err) {
    console.error('Error al enviar pedidos iniciales:', err);
    // Opcionalmente emitir un error al cliente
    socket.emit('error_pedidos_inicial', { message: 'No se pudieron cargar los pedidos.' });
  }
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// DESACTIVADO: Endpoint antiguo de proveedor (solo historial global)
// const mailjetProveedorEmail = require('./mailjetProveedorEmail');
// mailjetProveedorEmail(app);

const mailjetProveedorEmailV2 = require('./mailjetProveedorEmailV2');
mailjetProveedorEmailV2(app);

const PORT = process.env.PORT || 10001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor backend HTTP escuchando en puerto', PORT);
});