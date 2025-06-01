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
const Pedido = require('./models/Pedido'); // Añadido
const Aviso = require('./models/Aviso'); // Añadido
const HistorialProveedor = require('./models/HistorialProveedor'); // Usar modelo global
const Transferencia = require('./models/Transferencia'); // Importar modelo de transferencias
const Stock = require('./models/Stock'); // Modelo de stock
const Producto = require('./models/Producto'); // Modelo de producto
const Lote = require('./models/Lote'); // Modelo de lote
const MovimientoStock = require('./models/MovimientoStock'); // Modelo de movimiento de stock

const app = express();
const server = http.createServer(app); // Usar solo HTTP, compatible con Render

// Middleware de logging para depuración de CORS
app.use((req, res, next) => {
  console.log(`[CORS] Origin recibido: ${req.headers.origin} | Ruta: ${req.originalUrl}`);
  next();
});

// Configuración CORS explícita para frontend en Codespaces y Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-5173.app.github.dev',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-3000.app.github.dev',
  'https://pedidosweb-phi.vercel.app',
  'https://scaling-chainsaw-px9jv6jjr4rcrg4-10001.app.github.dev',
  'https://pedidos-backend-0e1s.onrender.com',
  'https://pedidos-frontend-0e1s.onrender.com', // Si tienes frontend en Render
  // Añade aquí cualquier otro dominio de frontend que uses
];

// Nueva función para permitir cualquier subdominio de .vercel.app y localhost
function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true); // Permitir peticiones sin origen (como curl o Postman)
  if (
    allowedOrigins.includes(origin) ||
    /\.vercel\.app$/.test(origin) ||
    /\.onrender\.com$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS: ' + origin));
}

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

const io = new Server(server, { // Usar el servidor HTTP
  cors: {
    origin: corsOrigin,
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
    // Si el estado cambia a 'enviadoTienda' y antes no lo era, sumar stock
    if (req.body.estado === 'enviadoTienda') {
      for (const linea of req.body.lineas) {
        await Stock.findOneAndUpdate(
          { producto: linea.producto, tiendaId: req.body.tiendaId },
          { $inc: { cantidad: Math.abs(linea.cantidadEnviada || linea.cantidad || 0) } },
          { upsert: true }
        );
      }
    }
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

// Guardar en historial de proveedor
app.post('/api/historial-proveedor', async (req, res) => {
  try {
    const { tiendaId, tiendaNombre, fechaPedido, lineas, proveedor } = req.body;
    if (!tiendaId || !fechaPedido || !lineas || !proveedor || !tiendaNombre) {
      return res.status(400).json({ ok: false, error: 'Faltan datos obligatorios' });
    }
    await HistorialProveedor.create({
      tiendaId,
      tiendaNombre,
      fechaPedido: new Date(fechaPedido),
      lineas,
      proveedor
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint para consultar historial de pedidos a proveedor por tienda y rango de fechas
app.get('/api/historial-proveedor', async (req, res) => {
  try {
    const { tiendaId, periodo = 'semana' } = req.query;
    if (!tiendaId) return res.status(400).json({ ok: false, error: 'Falta tiendaId' });

    // Calcular rango de fechas según el periodo
    const ahora = new Date();
    let fechaInicio;
    if (periodo === 'mes') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else if (periodo === 'año') {
      fechaInicio = new Date(ahora.getFullYear(), 0, 1);
    } else { // semana por defecto
      const diaSemana = ahora.getDay() || 7;
      fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - diaSemana + 1);
      fechaInicio.setHours(0,0,0,0);
    }

    // Buscar solo los pedidos de la tienda y en el rango
    const historial = await HistorialProveedor.find({
      tiendaId,
      fechaEnvio: { $gte: fechaInicio }
    }).sort({ fechaEnvio: -1 });

    // Agrupar y mapear para frontend: fecha, referencia (tienda/nombre), número de líneas, etc.
    const resultado = historial.map(item => ({
      id: item._id,
      fecha: item.pedido?.fecha || item.fechaEnvio,
      tienda: item.pedido?.tienda || '',
      numeroLineas: Array.isArray(item.pedido?.lineas) ? item.pedido.lineas.length : 0,
      proveedor: item.proveedor,
      pedido: item.pedido,
      fechaEnvio: item.fechaEnvio
    }));

    res.json({ ok: true, historial: resultado });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINTS DE TRANSFERENCIAS ENTRE TIENDAS ---
// Listar todas las transferencias
app.get('/api/transferencias', async (req, res) => {
  try {
    const transferencias = await Transferencia.find().sort({ fecha: -1 });
    res.json(transferencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva transferencia
app.post('/api/transferencias', async (req, res) => {
  try {
    const transferencia = new Transferencia(req.body);
    await transferencia.save();
    res.status(201).json(transferencia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar una transferencia
app.put('/api/transferencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transferencia = await Transferencia.findByIdAndUpdate(id, req.body, { new: true });
    if (!transferencia) return res.status(404).json({ error: 'Transferencia no encontrada' });
    res.json(transferencia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirmar una transferencia (cambiar estado)
app.patch('/api/transferencias/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;
    const transferencia = await Transferencia.findByIdAndUpdate(id, { estado: 'recibida' }, { new: true });
    if (!transferencia) return res.status(404).json({ error: 'Transferencia no encontrada' });

    // Actualizar stock automáticamente
    if (transferencia.productos && transferencia.origen && transferencia.destino) {
      for (const p of transferencia.productos) {
        // Restar del origen
        await Stock.findOneAndUpdate(
          { producto: p.producto, tiendaId: transferencia.origen },
          { $inc: { cantidad: -Math.abs(p.cantidad) } },
          { upsert: true }
        );
        // Sumar al destino
        await Stock.findOneAndUpdate(
          { producto: p.producto, tiendaId: transferencia.destino },
          { $inc: { cantidad: Math.abs(p.cantidad) } },
          { upsert: true }
        );
      }
    }
    res.json(transferencia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINTS DE STOCK ---
// Obtener stock de una tienda (o fábrica)
app.get('/api/stock', async (req, res) => {
  try {
    const { tiendaId } = req.query;
    if (!tiendaId) return res.status(400).json({ error: 'Falta tiendaId' });
    const stock = await Stock.find({ tiendaId });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar movimiento de stock (entrada/salida)
app.post('/api/stock/movimiento', async (req, res) => {
  try {
    const { producto, tiendaId, cantidad, unidad } = req.body;
    if (!producto || !tiendaId || typeof cantidad !== 'number') {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    // Actualiza stock (suma o resta)
    const stock = await Stock.findOneAndUpdate(
      { producto, tiendaId },
      { $inc: { cantidad }, $set: { unidad: unidad || 'kg' } },
      { new: true, upsert: true }
    );
    res.json(stock);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINTS DE PRODUCTOS ---
// Listar productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Editar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndUpdate(id, req.body, { new: true });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Desactivar producto
app.patch('/api/productos/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndUpdate(id, { activo: false }, { new: true });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINTS DE LOTES ---
// Listar lotes (por producto o ubicación)
app.get('/api/lotes', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.producto) filtro.producto = req.query.producto;
    if (req.query.ubicacion) filtro.ubicacion = req.query.ubicacion;
    const lotes = await Lote.find(filtro).populate('producto');
    res.json(lotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear lote
app.post('/api/lotes', async (req, res) => {
  try {
    const lote = new Lote(req.body);
    await lote.save();
    res.status(201).json(lote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Editar lote
app.put('/api/lotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lote = await Lote.findByIdAndUpdate(id, req.body, { new: true });
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
    res.json(lote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINTS DE MOVIMIENTOS DE STOCK ---
// Listar movimientos (por producto, lote, ubicación, tipo, etc.)
app.get('/api/movimientos-stock', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.producto) filtro.producto = req.query.producto;
    if (req.query.lote) filtro.lote = req.query.lote;
    if (req.query.ubicacion) filtro.ubicacion = req.query.ubicacion;
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    const movimientos = await MovimientoStock.find(filtro).populate('producto lote');
    res.json(movimientos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear movimiento de stock
app.post('/api/movimientos-stock', async (req, res) => {
  try {
    const movimiento = new MovimientoStock(req.body);
    await movimiento.save();
    res.status(201).json(movimiento);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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