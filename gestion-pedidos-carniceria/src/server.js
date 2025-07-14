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
const Cliente = require('./models/Cliente'); // Nuevo modelo Cliente
const Presupuesto = require('./models/Presupuesto'); // Modelo de presupuestos
const Proveedor = require('./models/Proveedor'); // Modelo de proveedores
const { registrarEntradasStockPorPedido, registrarBajaStock, registrarMovimientoStock } = require('./utils/stock');

const pedidosTiendaController = require('./pedidosTiendaController');
const pedidosClientesController = require('./pedidosClientesController');
const pedidosLotesController = require('./pedidosLotesController'); // Controlador de pedidos de cestas/lotes

const app = express();
const server = http.createServer(app); // Usar solo HTTP, compatible con Render

// Middleware de logging para depuración de CORS
app.use((req, res, next) => {
  console.log(`[CORS] Origin recibido: ${req.headers.origin} | Ruta: ${req.originalUrl}`);
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  next();
});

// Configuración CORS explícita para frontend en Codespaces y Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3100',
  'http://127.0.0.1:5173',
  'https://localhost:3100',
  'https://127.0.0.1:3000',
  'https://127.0.0.1:3100',
  'https://pedidosweb-phi.vercel.app',
  'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3000.app.github.dev',
  'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-5173.app.github.dev',
  'https://pedidosweb-etl1eydr3-albanta23s-projects.vercel.app', // Dominio Vercel producción
  'https://pedidos-backend-0e1s.onrender.com', // Dominio Render backend
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
  const matchLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(originLc);
  if (
    allowedOriginsLc.includes(originLc) ||
    matchVercel ||
    matchRender ||
    matchLocalhost ||
    matchGithubDev // <-- Permitir cualquier subdominio de app.github.dev
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
        originLc.startsWith('http://localhost') ||
        originLc.startsWith('http://127.0.0.1')
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

// --- ENDPOINTS SEPARADOS ---
// Pedidos de tienda/fábrica
app.get('/api/pedidos-tienda', pedidosTiendaController.listar);
app.post('/api/pedidos-tienda', pedidosTiendaController.crear);
app.put('/api/pedidos-tienda/:id', pedidosTiendaController.actualizar);
app.delete('/api/pedidos-tienda/:id', pedidosTiendaController.eliminar);

// Pedidos de clientes/expediciones
app.get('/api/pedidos-clientes', pedidosClientesController.listar);
app.post('/api/pedidos-clientes', pedidosClientesController.crear);
app.put('/api/pedidos-clientes/:id', pedidosClientesController.actualizar);
app.delete('/api/pedidos-clientes/:id', pedidosClientesController.eliminar);
app.post('/api/pedidos-clientes/:id/devolucion-parcial', pedidosClientesController.devolucionParcial);
app.post('/api/pedidos-clientes/:id/devolucion-total', pedidosClientesController.devolucionTotal);

// --- ENDPOINTS REST ORIGINALES (DEPRECATED, SOLO PARA COMPATIBILIDAD TEMPORAL) ---
app.get('/api/pedidos', async (req, res) => {
  try {
    // Si la petición es para expedición de clientes, filtrar solo los pedidos de clientes
    if (req.query.clientesExpedicion === '1') {
      const pedidosClientes = await Pedido.find({ tiendaId: 'clientes' });
      return res.json(pedidosClientes);
    }
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
    // LOG DETALLADO DE ERROR
    console.error('[ERROR /api/pedidos]', {
      message: err.message,
      name: err.name,
      errors: err.errors,
      body: req.body
    });
    res.status(400).json({ error: err.message, details: err.errors });
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
    let movimientosCreados = 0;
    for (const prod of transferencia.productos) {
      try {
        // Salida en origen
        await registrarMovimientoStock({
          tiendaId: transferencia.origenId || transferencia.origen,
          tiendaDestino: transferencia.destinoId || transferencia.destino,
          producto: prod.producto,
          cantidad: prod.cantidad,
          unidad: prod.unidad || 'kg',
          lote: prod.lote || '',
          motivo: 'Transferencia enviada a ' + transferencia.destino,
          tipo: transferencia.destino === 'TIENDA FABRICA' ? 'devolucion_salida' : 'transferencia_salida',
          transferenciaId: transferencia._id.toString(),
          fecha: new Date(),
          peso: typeof prod.peso !== 'undefined' ? prod.peso : undefined
        });
        // Entrada en destino
        await registrarMovimientoStock({
          tiendaId: transferencia.destinoId || transferencia.destino,
          tiendaDestino: transferencia.origenId || transferencia.origen,
          producto: prod.producto,
          cantidad: prod.cantidad,
          unidad: prod.unidad || 'kg',
          lote: prod.lote || '',
          motivo: 'Transferencia recibida de ' + transferencia.origen,
          tipo: transferencia.destino === 'TIENDA FABRICA' ? 'devolucion_entrada' : 'transferencia_entrada',
          transferenciaId: transferencia._id.toString(),
          fecha: new Date(),
          peso: typeof prod.peso !== 'undefined' ? prod.peso : undefined
        });
        movimientosCreados += 2;
      } catch (movErr) {
        console.error('[TRANSFERENCIA][ERROR MOVIMIENTO]', movErr);
      }
    }
    console.log(`[TRANSFERENCIA] Total movimientos creados: ${movimientosCreados} para transferencia ${transferencia._id}`);
    res.json(transferencia);
  } catch (err) {
    console.error('[TRANSFERENCIA][ERROR PATCH /confirmar]', err);
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

// --- ENDPOINT: Importar clientes desde Excel (bulk upsert) ---
app.post('/api/clientes/importar', async (req, res) => {
  try {
    const clientes = req.body.clientes;
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return res.status(400).json({ ok: false, error: 'No se recibieron clientes para importar' });
    }
    let insertados = 0, actualizados = 0, errores = [];
    for (const cli of clientes) {
      // Filtro por NIF o código si existe, si no por nombre
      const filtro = cli.nif ? { nif: cli.nif } : cli.codigo ? { codigo: cli.codigo } : { nombre: cli.nombre };
      try {
        const existente = await Cliente.findOne(filtro);
        if (existente) {
          await Cliente.updateOne(filtro, { $set: cli });
          actualizados++;
        } else {
          await Cliente.create(cli);
          insertados++;
        }
      } catch (e) {
        errores.push({ nombre: cli.nombre, error: e.message });
      }
    }
    res.json({ ok: true, insertados, actualizados, errores });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINTS FUNCIONALES ---
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ nombre: 1 });
    res.json(clientes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/clientes/cestas-navidad', async (req, res) => {
  try {
    const { activos } = req.query;
    let filtro = { esCestaNavidad: true };
    if (activos === 'true') filtro.activo = true;
    const clientesCestas = await Cliente.find(filtro).sort({ nombre: 1 });
    res.json({ total: clientesCestas.length, clientes: clientesCestas });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/pedidos-lotes', pedidosLotesController.listar);
app.post('/api/pedidos-lotes', pedidosLotesController.crear);
app.put('/api/pedidos-lotes/:id', pedidosLotesController.actualizar);
app.delete('/api/pedidos-lotes/:id', pedidosLotesController.eliminar);

// --- ENDPOINTS MÍNIMOS SOLO PARA RUTAS SIN LÓGICA REAL ---
app.get('/api/presupuestos', async (req, res) => {
  res.json([]);
});
app.get('/api/pedidos', async (req, res) => {
  res.json([]);
});
// --- FIN ENDPOINTS MÍNIMOS ---

// Registrar endpoint de envío a proveedor (Mailjet V2)
require('./mailjetProveedorEmailV2')(app);

// --- ENDPOINT: Registrar baja de stock manual ---
app.post('/api/movimientos-stock/baja', async (req, res) => {
  try {
    const { tiendaId, producto, cantidad, unidad, lote, motivo, peso } = req.body;
    await registrarBajaStock({ tiendaId, producto, cantidad, unidad, lote, motivo, peso });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Registrar ENTRADA de stock manual ---
app.post('/api/movimientos-stock/entrada', async (req, res) => {
  try {
    const {
      tiendaId,
      producto,
      cantidad,
      unidad,
      lote,
      motivo,
      fecha, // Opcional, si no se provee, se usa Date.now() en registrarMovimientoStock
      pedidoId, // Opcional
      peso, // Opcional
      proveedorId, // Nuevo
      precioCoste, // Nuevo
      referenciaDocumento, // Nuevo
      notasEntrada // Nuevo
    } = req.body;

    // Validación básica
    if (!tiendaId || !producto || !cantidad) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: tiendaId, producto, cantidad.' });
    }

    await registrarMovimientoStock({
      tiendaId,
      producto,
      cantidad,
      unidad,
      lote,
      motivo: motivo || 'Entrada manual', // Motivo por defecto si no se especifica
      tipo: 'entrada', // Tipo fijo para este endpoint
      fecha,
      pedidoId,
      peso,
      proveedorId,
      precioCoste,
      referenciaDocumento,
      notasEntrada
    });
    res.status(201).json({ ok: true, message: 'Entrada de stock registrada correctamente.' });
  } catch (e) {
    console.error('Error al registrar entrada de stock:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Listar movimientos de stock por tienda o filtro ---
app.get('/api/movimientos-stock', async (req, res) => {
  try {
    const { tiendaId, producto, fechaInicio, fechaFin } = req.query;
    let filtro = {};
    if (tiendaId) filtro.tiendaId = tiendaId;
    if (producto) filtro.producto = producto;
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23,59,59,999);
        filtro.fecha.$lte = fin;
      }
    }
    const movimientos = await MovimientoStock.find(filtro).sort({ fecha: -1 });
    res.json(movimientos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ENDPOINT: Comparar y marcar/crear clientes de cestas de navidad ---
app.post('/api/clientes/marcar-cestas-navidad', async (req, res) => {
  try {
    const { clientesCestasNavidad } = req.body;
    
    if (!Array.isArray(clientesCestasNavidad) || clientesCestasNavidad.length === 0) {
      return res.status(400).json({ ok: false, error: 'No se recibieron clientes de cestas de navidad' });
    }

    console.log('[CESTAS-NAVIDAD] Recibidos clientes para procesar:', clientesCestasNavidad.length);
    
    let marcados = 0, creados = 0, errores = [];
    
    for (const clienteCesta of clientesCestasNavidad) {
      try {
        // Buscar cliente por diferentes criterios (nombre, email, teléfono, etc.)
        const criteriosBusqueda = [];
        
        if (clienteCesta.nombre) {
          criteriosBusqueda.push({ nombre: { $regex: clienteCesta.nombre.trim(), $options: 'i' } });
        }
        if (clienteCesta.email) {
          criteriosBusqueda.push({ email: { $regex: clienteCesta.email.trim(), $options: 'i' } });
        }
        if (clienteCesta.telefono) {
          criteriosBusqueda.push({ telefono: { $regex: clienteCesta.telefono.trim(), $options: 'i' } });
        }
        if (clienteCesta.nif) {
          criteriosBusqueda.push({ nif: { $regex: clienteCesta.nif.trim(), $options: 'i' } });
        }
        
        if (criteriosBusqueda.length === 0 && !clienteCesta.nombre) {
          errores.push({ cliente: clienteCesta, error: 'Datos insuficientes (falta nombre)' });
          continue;
        }
        
        // Buscar cliente en la base de datos
        const clienteEncontrado = await Cliente.findOne({ $or: criteriosBusqueda });
        
        if (clienteEncontrado) {
          // CLIENTE EXISTENTE: Marcarlo como cliente normal Y de cestas
          await Cliente.updateOne(
            { _id: clienteEncontrado._id },
            { 
              $set: { 
                esCestaNavidad: true,
                activo: true // También marcarlo como cliente normal
              } 
            }
          );
          marcados++;
          console.log(`[CESTAS-NAVIDAD] ✅ Cliente marcado: ${clienteEncontrado.nombre} → Normal + Cestas`);
        } else {
          // CLIENTE NUEVO: Crear como cliente de cestas únicamente
          const nuevoCliente = new Cliente({
            nombre: clienteCesta.nombre || 'Cliente sin nombre',
            email: clienteCesta.email || '',
            telefono: clienteCesta.telefono || '',
            nif: clienteCesta.nif || '',
            direccion: clienteCesta.direccion || '',
            codigoPostal: clienteCesta.codigoPostal || '',
            poblacion: clienteCesta.poblacion || '',
            provincia: clienteCesta.provincia || '',
            activo: false,          // NO es cliente normal todavía
            esCestaNavidad: true    // SÍ es cliente de cestas
          });
          
          await nuevoCliente.save();
          creados++;
          console.log(`[CESTAS-NAVIDAD] 🆕 Cliente creado: ${nuevoCliente.nombre} → Solo Cestas`);
        }
      } catch (e) {
        errores.push({ cliente: clienteCesta, error: e.message });
        console.error('[CESTAS-NAVIDAD][ERROR]', clienteCesta, e.message);
      }
    }
    
    console.log('[CESTAS-NAVIDAD] Resultado:', { marcados, creados, errores: errores.length });
    res.json({ 
      ok: true, 
      marcados, 
      creados,
      errores,
      resumen: `${marcados} clientes marcados como Normal+Cestas, ${creados} clientes nuevos creados como Solo Cestas`
    });
  } catch (e) {
    console.error('[CESTAS-NAVIDAD][FATAL]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- ENDPOINT: Obtener estadísticas de cestas de navidad ---
app.get('/api/clientes/estadisticas-cestas', async (req, res) => {
  try {
    const totalClientes = await Cliente.countDocuments();
    const clientesCestasNavidad = await Cliente.countDocuments({ esCestaNavidad: true });
    const clientesNormales = totalClientes - clientesCestasNavidad;
    
    res.json({
      totalClientes,
      clientesCestasNavidad,
      clientesNormales,
      porcentajeCestas: totalClientes > 0 ? Math.round((clientesCestasNavidad / totalClientes) * 100) : 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ENDPOINT: Desmarcar todos los clientes de cestas de navidad ---
app.post('/api/clientes/limpiar-cestas-navidad', async (req, res) => {
  try {
    const resultado = await Cliente.updateMany(
      { esCestaNavidad: true },
      { $set: { esCestaNavidad: false } }
    );
    
    res.json({ 
      ok: true, 
      desmarcados: resultado.modifiedCount,
      mensaje: `${resultado.modifiedCount} clientes desmarcados como cestas de navidad`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- API presupuestos ---
app.get('/api/presupuestos', async (req, res) => {
  try {
    const presupuestos = await Presupuesto.find();
    res.json({ ok: true, presupuestos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/presupuestos', async (req, res) => {
  try {
    const data = req.body;
    // Generar quoteNumber simple (puedes mejorar la lógica)
    const count = await Presupuesto.countDocuments();
    const quoteNumber = `PRESUP-${count + 1}`;
    const presupuesto = new Presupuesto({ ...data, quoteNumber });
    await presupuesto.save();
    res.json({ ok: true, presupuesto });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- FIN API presupuestos ---

// --- ENDPOINTS DE PROVEEDORES ---
// Listar todos los proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true }).sort({ nombre: 1 });
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo proveedor
app.post('/api/proveedores', async (req, res) => {
  try {
    const nuevoProveedor = new Proveedor(req.body);
    await nuevoProveedor.save();
    res.status(201).json(nuevoProveedor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener un proveedor por ID
app.get('/api/proveedores/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un proveedor
app.put('/api/proveedores/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un proveedor (o marcar como inactivo)
app.delete('/api/proveedores/:id', async (req, res) => {
  try {
    // Considerar marcar como inactivo en lugar de borrar si hay referencias
    const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    // const proveedor = await Proveedor.findByIdAndDelete(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor marcado como inactivo' });
    // res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// --- FIN ENDPOINTS DE PROVEEDORES ---

const PORT = process.env.PORT || 10001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor backend HTTP escuchando en puerto', PORT);
});