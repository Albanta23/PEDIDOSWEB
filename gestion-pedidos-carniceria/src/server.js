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
const Producto = require('./models/Producto'); // Importar modelo de productos
const MovimientoStock = require('./models/MovimientoStock'); // Modelo de movimientos de almacén

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
    const pedidoPrevio = await Pedido.findById(id);
    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
    if (!pedidoActualizado) return res.status(404).json({ error: 'Pedido no encontrado' });
    // LOG para depuración de estados
    console.log('[DEBUG] Estado previo:', pedidoPrevio.estado, '| Estado actualizado:', pedidoActualizado.estado);
    // LOG para ver lineas y cantidadEnviada
    if (pedidoActualizado.lineas) {
      pedidoActualizado.lineas.forEach((l, idx) => {
        console.log(`[DEBUG] Línea ${idx}: producto=${l.producto}, cantidadEnviada=${l.cantidadEnviada}`);
      });
    }
    // Si el estado cambió a 'enviadoTienda' y antes no lo estaba, registrar entradas
    if (pedidoActualizado.estado === 'enviadoTienda' && pedidoPrevio.estado !== 'enviadoTienda') {
      console.log('[DEBUG] Registrando movimientos de stock para pedido', pedidoActualizado.numeroPedido);
      await registrarEntradasStockPorPedido(pedidoActualizado);
    } else {
      console.log('[DEBUG] No se cumplen condiciones para registrar movimientos de stock');
    }
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

// Confirmar una transferencia (cambiar estado y reflejar movimientos de stock solo al recibir)
app.patch('/api/transferencias/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;
    const transferencia = await Transferencia.findByIdAndUpdate(id, { estado: 'recibida' }, { new: true });
    if (!transferencia) return res.status(404).json({ error: 'Transferencia no encontrada' });
    // Solo al confirmar, registrar movimientos de stock reales
    for (const prod of transferencia.productos) {
      // Entrada en destino (si no existe ya)
      await MovimientoStock.create({
        tiendaId: transferencia.destino,
        producto: prod.producto,
        cantidad: prod.cantidad,
        unidad: prod.unidad || 'kg',
        lote: prod.lote || '',
        motivo: 'Transferencia recibida de ' + transferencia.origen,
        tipo: transferencia.destino === 'TIENDA FABRICA' ? 'devolucion_entrada' : 'transferencia_entrada',
        fecha: new Date(),
        transferenciaId: transferencia._id.toString()
      });
    }
    res.json(transferencia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINT: Importar productos desde Excel (bulk upsert) ---
app.post('/api/productos/importar', async (req, res) => {
  try {
    console.log('[IMPORTAR][HEADERS]', req.headers);
    console.log('[IMPORTAR][RAW BODY]', JSON.stringify(req.body));
    const productos = req.body.productos;
    console.log('[IMPORTAR] Recibidos productos:', productos?.length, productos?.[0]);
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ ok: false, error: 'No se recibieron productos para importar' });
    }
    let insertados = 0, actualizados = 0, errores = [];
    // Función para mapear los campos del Excel a los del modelo Producto
    function mapearProductoExcel(prodExcel) {
      return {
        referencia: prodExcel['Cód.'] || prodExcel['Cod.'] || prodExcel['Código'] || '',
        nombre: prodExcel['Descripción'] || prodExcel['Nombre'] || '',
        // Guardar ambos campos: código y nombre de familia
        familia: prodExcel['C.Fam.'] || prodExcel['Familia'] || '',
        nombreFamilia: prodExcel['Nombre Familia'] || '',
        unidad: prodExcel['Unidad'] || 'kg',
        activo: prodExcel['Activo'] !== undefined ? Boolean(prodExcel['Activo']) : true,
        descripcion: prodExcel['Descripción'] || '',
        // Puedes añadir más campos si el modelo se amplía
      };
    }
    for (const prod of productos) {
      // Mapear campos del Excel al modelo Producto
      const prodMapeado = mapearProductoExcel(prod);
      if (!prodMapeado.nombre) continue;
      try {
        const filtro = prodMapeado.referencia ? { referencia: prodMapeado.referencia } : { nombre: prodMapeado.nombre };
        // Buscar si ya existe
        const existente = await Producto.findOne(filtro);
        if (existente) {
          await Producto.updateOne(filtro, { $set: prodMapeado });
          actualizados++;
        } else {
          await Producto.create(prodMapeado);
          insertados++;
        }
      } catch (e) {
        errores.push({ nombre: prodMapeado.nombre, error: e.message });
        console.error('[IMPORTAR][ERROR]', prodMapeado.nombre, e.message);
      }
    }
    console.log('[IMPORTAR] Resultado:', {insertados, actualizados, errores});
    res.json({ ok: true, insertados, actualizados, errores });
  } catch (e) {
    console.error('[IMPORTAR][FATAL]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Obtener todos los productos ---
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Actualizar productos masivamente ---
app.post('/api/productos/actualizar-masivo', async (req, res) => {
  try {
    const productos = req.body.productos;
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ ok: false, error: 'No se recibieron productos para actualizar' });
    }
    let actualizados = 0, errores = [];
    for (const prod of productos) {
      if (!prod._id) continue;
      try {
        await Producto.updateOne({ _id: prod._id }, { $set: prod });
        actualizados++;
      } catch (e) {
        errores.push({ nombre: prod.nombre, error: e.message });
      }
    }
    res.json({ ok: true, actualizados, errores });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Borrar producto por ID ---
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Producto.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Crear producto individual ---
app.post('/api/productos', async (req, res) => {
  try {
    const nuevo = req.body;
    if (!nuevo.nombre) return res.status(400).json({ ok: false, error: 'El nombre es obligatorio' });
    // Validar unicidad por nombre o referencia
    const existe = await Producto.findOne({ $or: [ { nombre: nuevo.nombre }, { referencia: nuevo.referencia } ] });
    if (existe) return res.status(400).json({ ok: false, error: 'Ya existe un producto con ese nombre o referencia' });
    const creado = await Producto.create(nuevo);
    res.json(creado);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINTS DE MOVIMIENTOS DE STOCK ---
// Consultar movimientos de stock de una tienda (con filtros)
app.get('/api/movimientos-stock', async (req, res) => {
  try {
    const { tiendaId, producto, lote, desde, hasta } = req.query;
    const filtro = {};
    if (tiendaId) filtro.tiendaId = tiendaId;
    if (producto) filtro.producto = producto;
    if (lote) filtro.lote = lote;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const movimientos = await MovimientoStock.find(filtro).sort({ fecha: -1 });
    res.json(movimientos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Registrar baja de stock
app.post('/api/movimientos-stock/baja', async (req, res) => {
  try {
    const { tiendaId, producto, cantidad, unidad, lote, motivo, peso } = req.body;
    if (!tiendaId || !producto || !cantidad || !motivo) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para la baja' });
    }
    const mov = await MovimientoStock.create({
      tiendaId, producto, cantidad, unidad, lote, motivo, tipo: 'baja', fecha: new Date(), peso
    });
    res.json(mov);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Registrar entrada de stock (por pedido recibido de fábrica)
app.post('/api/movimientos-stock/entrada', async (req, res) => {
  try {
    const { tiendaId, producto, cantidad, unidad, lote, motivo, pedidoId, peso } = req.body;
    if (!tiendaId || !producto || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para la entrada' });
    }
    const mov = await MovimientoStock.create({
      tiendaId, producto, cantidad, unidad, lote, motivo, tipo: 'entrada', pedidoId, fecha: new Date(), peso
    });
    res.json(mov);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- REGISTRO AUTOMÁTICO DE ENTRADAS DE STOCK AL ENVIAR PEDIDO A TIENDA ---
const registrarEntradasStockPorPedido = async (pedido) => {
  if (!pedido || !pedido.tiendaId || !Array.isArray(pedido.lineas)) {
    console.log('[DEBUG] Pedido inválido para registrar movimientos de stock');
    return;
  }
  let movimientosCreados = 0;
  for (const [idx, linea] of pedido.lineas.entries()) {
    if (!linea.producto || !linea.cantidadEnviada) {
      console.log(`[DEBUG] Línea ${idx} omitida: producto=${linea.producto}, cantidadEnviada=${linea.cantidadEnviada}`);
      continue;
    }
    // Log de depuración para ver el peso que se va a guardar
    console.log(`[DEBUG] MovimientoStock: producto=${linea.producto}, cantidadEnviada=${linea.cantidadEnviada}, peso=${linea.peso}, linea=`, JSON.stringify(linea));
    await MovimientoStock.create({
      tiendaId: pedido.tiendaId,
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      unidad: linea.formato || 'kg',
      lote: linea.lote || '',
      motivo: 'Pedido fábrica',
      tipo: 'entrada',
      pedidoId: pedido._id?.toString() || pedido.id?.toString() || '',
      fecha: new Date(),
      peso: linea.peso ?? null // Copiar el peso si existe
    });
    movimientosCreados++;
    console.log(`[DEBUG] Movimiento de stock creado para producto=${linea.producto}, cantidad=${linea.cantidadEnviada}`);
  }
  console.log(`[DEBUG] Total movimientos de stock creados: ${movimientosCreados}`);
};

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

// --- ENDPOINT: Registrar transferencia entre tiendas y reflejar en movimientos de stock ---
app.post('/api/transferencias/registrar', async (req, res) => {
  try {
    const { origenId, destinoId, productos, observaciones, usuario } = req.body;
    if (!origenId || !destinoId || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos para la transferencia' });
    }
    // Registrar transferencia en colección Transferencia
    const transferencia = await Transferencia.create({
      origen: origenId,
      destino: destinoId,
      productos,
      observaciones,
      usuario,
      fecha: new Date(),
      estado: 'realizada'
    });
    // Registrar movimientos de stock: salida en origen, entrada en destino
    for (const prod of productos) {
      // Salida en origen
      await MovimientoStock.create({
        tiendaId: origenId,
        producto: prod.producto,
        cantidad: prod.cantidad,
        unidad: prod.unidad || 'kg',
        lote: prod.lote || '',
        motivo: 'Transferencia a ' + destinoId,
        tipo: 'transferencia_salida',
        fecha: new Date(),
        transferenciaId: transferencia._id.toString()
      });
      // Entrada en destino
      await MovimientoStock.create({
        tiendaId: destinoId,
        producto: prod.producto,
        cantidad: prod.cantidad,
        unidad: prod.unidad || 'kg',
        lote: prod.lote || '',
        motivo: 'Transferencia desde ' + origenId,
        tipo: 'transferencia_entrada',
        fecha: new Date(),
        transferenciaId: transferencia._id.toString()
      });
    }
    res.json({ ok: true, transferencia });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 10001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor backend HTTP escuchando en puerto', PORT);
});