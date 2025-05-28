// Servidor Express con Socket.io para pedidos en tiempo real
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Añadido
const Pedido = require('./models/Pedido'); // Añadido
const Aviso = require('./models/Aviso'); // Añadido
const fs = require('fs');
const https = require('https');

const app = express();
// const server = http.createServer(app); // Desactivado HTTP, solo HTTPS


// Configuración CORS explícita para frontend en Codespaces y Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-5173.app.github.dev',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-3000.app.github.dev',
  'https://pedidosweb-phi.vercel.app',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-10001.app.github.dev'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// --- HTTPS SERVER ---
const httpsOptions = {
  key: fs.readFileSync(__dirname + '/../key.pem'),
  cert: fs.readFileSync(__dirname + '/../cert.pem')
};
const secureServer = https.createServer(httpsOptions, app);

const io = new Server(secureServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Conexión a MongoDB
// La variable de entorno MONGODB_URI se configura en el dashboard de Render.
// Para desarrollo local, puedes definirla en un archivo .env o directamente aquí como fallback.
const MONGODB_URI = process.env.MONGODB_URI; // Usar la variable estándar

if (!MONGODB_URI) {
  console.error('Error: La variable de entorno mongodb no está definida.');
  // Considera salir del proceso si la conexión a la BD es crítica para el inicio
  // process.exit(1);
  // O usa una URI local por defecto para desarrollo si lo prefieres, pero asegúrate de que no se use en producción sin querer.
  // MONGODB_URI = 'mongodb://localhost:27017/pedidos_db_local'; 
  // console.warn('Usando URI de MongoDB local por defecto.');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB conectado exitosamente.'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

app.use(express.json());

// Nueva ruta para health check
app.get('/', (req, res) => {
  res.status(200).send('Backend service is running');
});

// Endpoints REST
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    // Obtener el último numeroPedido actual de forma atómica
    // Usar sort y limit para encontrar el mayor actual
    const ultimoPedido = await Pedido.findOne({}, {}, { sort: { numeroPedido: -1 } });
    const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;

    // Crear el nuevo pedido con el siguiente numeroPedido
    const nuevoPedido = new Pedido({
      ...req.body,
      numeroPedido: siguienteNumero,
      fechaCreacion: req.body.fechaCreacion || new Date(),
      fechaPedido: req.body.fechaPedido,
      fechaEnvio: req.body.fechaEnvio,
      fechaRecepcion: req.body.fechaRecepcion
    });
    const pedidoGuardado = await nuevoPedido.save();
    io.emit('pedido_nuevo', pedidoGuardado);
    res.status(201).json(pedidoGuardado);
  } catch (err) {
    // Si hay error de duplicado, intentar de nuevo (muy raro, pero posible en concurrencia)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.numeroPedido) {
      // Reintentar una vez más
      try {
        const ultimoPedido = await Pedido.findOne({}, {}, { sort: { numeroPedido: -1 } });
        const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
        const nuevoPedido = new Pedido({
          ...req.body,
          numeroPedido: siguienteNumero,
          fechaCreacion: req.body.fechaCreacion || new Date(),
          fechaPedido: req.body.fechaPedido,
          fechaEnvio: req.body.fechaEnvio,
          fechaRecepcion: req.body.fechaRecepcion
        });
        const pedidoGuardado = await nuevoPedido.save();
        io.emit('pedido_nuevo', pedidoGuardado);
        return res.status(201).json(pedidoGuardado);
      } catch (err2) {
        return res.status(400).json({ error: err2.message });
      }
    }
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[BACKEND] PUT /api/pedidos/:id', id, 'Body:', req.body);
    // Permitir actualización de todos los campos
    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
    console.log('[BACKEND] Pedido actualizado:', pedidoActualizado);
    if (!pedidoActualizado) return res.status(404).json({ error: 'Pedido no encontrado' });
    io.emit('pedido_actualizado', pedidoActualizado);
    console.log('[BACKEND] Emitiendo evento pedido_actualizado:', pedidoActualizado);
    res.json(pedidoActualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoEliminado = await Pedido.findByIdAndDelete(id);
    if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
    io.emit('pedido_eliminado', pedidoEliminado); // Emitir el pedido completo o solo su ID
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINTS DE AVISOS ---

// Listar avisos (opcionalmente filtrados por tiendaId)
app.get('/api/avisos', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.tiendaId) filtro.tiendaId = req.query.tiendaId;
    const avisos = await Aviso.find(filtro).sort({ fecha: -1 });
    res.json(avisos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un aviso
app.post('/api/avisos', async (req, res) => {
  try {
    const aviso = new Aviso(req.body);
    await aviso.save();
    res.status(201).json(aviso);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Marcar aviso como visto por una tienda/usuario
app.patch('/api/avisos/:id/visto', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;
    if (!usuario) return res.status(400).json({ error: 'Usuario requerido' });
    const aviso = await Aviso.findByIdAndUpdate(
      id,
      { $addToSet: { vistoPor: usuario } },
      { new: true }
    );
    if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });
    res.json(aviso);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// --- FIN ENDPOINTS DE AVISOS ---

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

// SOLO Mailjet para enviar proveedor
const mailjetProveedorEmail = require('./mailjetProveedorEmail');
mailjetProveedorEmail(app);

const PORT = process.env.PORT || 10001;
secureServer.listen(PORT, () => {
  console.log('Servidor backend HTTPS escuchando en puerto', PORT);
});