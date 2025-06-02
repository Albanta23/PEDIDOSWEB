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
const Receta = require('./models/Receta'); // Modelo de receta
const ExcelJS = require('exceljs');

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
    const pedidoAntes = await Pedido.findById(id);
    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
    if (!pedidoActualizado) return res.status(404).json({ error: 'Pedido no encontrado' });
    io.emit('pedido_actualizado', pedidoActualizado);
    // Si el estado cambia a 'enviadoTienda' y antes no lo era, registrar movimientos de entrada
    if (pedidoAntes && req.body.estado === 'enviadoTienda' && pedidoAntes.estado !== 'enviadoTienda') {
      if (pedidoActualizado.lineas && pedidoActualizado.tiendaId) {
        for (const l of pedidoActualizado.lineas) {
          // Buscar producto por nombre exacto
          const producto = await Producto.findOne({ nombre: l.producto });
          if (producto) {
            await MovimientoStock.create({
              producto: producto._id,
              tipo: 'entrada',
              cantidad: Math.abs(l.cantidadEnviada || l.cantidad || 0),
              unidad: l.unidad || 'kg',
              ubicacion: pedidoActualizado.tiendaId,
              usuario: req.body.usuario || '',
              motivo: 'Recepción de pedido',
              referencia: pedidoActualizado._id,
              observaciones: l.comentario || '',
              fecha: new Date()
            });
          }
        }
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

// Middleware simple de roles para avisos (solo ejemplo, para producción usar JWT o similar)
function requireRole(roles) {
  return (req, res, next) => {
    // En producción, extraer el rol del usuario autenticado (por ejemplo, de req.user)
    // Aquí, para demo, se permite pasar ?rol=admin o ?rol=fabrica en la query
    const rol = req.query.rol || req.headers['x-rol'] || 'usuario';
    if (!roles.includes(rol)) {
      return res.status(403).json({ error: 'No autorizado: rol insuficiente' });
    }
    next();
  };
}

// Lista estática de IDs de tiendas válidas (debe mantenerse sincronizada con frontend)
const TIENDAS_VALIDAS = [
  'tienda1', 'tienda2', 'tienda3', 'tienda4', 'tienda5',
  'tienda6', 'tienda7', 'tienda8', 'tienda9', 'tienda10', 'clientes'
];

// Proteger creación de avisos: solo admin, supervisor o fabrica pueden crear
app.post('/api/avisos', requireRole(['admin', 'supervisor', 'fabrica']), async (req, res) => {
  try {
    const { titulo, mensaje, tipo, tiendaId } = req.body;
    if (!titulo || !mensaje || !tipo || !tiendaId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (título, mensaje, tipo, tiendaId)' });
    }
    if (titulo.length < 3 || mensaje.length < 5) {
      return res.status(400).json({ error: 'Título o mensaje demasiado corto' });
    }
    // Validar existencia real de tienda
    if (!TIENDAS_VALIDAS.includes(tiendaId)) {
      return res.status(400).json({ error: 'Tienda destino no existe' });
    }
    // Validar duplicados recientes (últimos 10 minutos)
    const ahora = new Date();
    const hace10min = new Date(ahora.getTime() - 10*60*1000);
    const duplicado = await Aviso.findOne({
      titulo,
      mensaje,
      tiendaId,
      fecha: { $gte: hace10min }
    });
    if (duplicado) {
      return res.status(409).json({ error: 'Ya existe un aviso similar recientemente para esta tienda' });
    }
    // (Opcional) Validar que la tienda existe
    // const tiendaExiste = await Tienda.findOne({ id: tiendaId });
    // if (!tiendaExiste) return res.status(400).json({ error: 'Tienda destino no existe' });
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
        const producto = await Producto.findOne({ nombre: p.producto });
        if (producto) {
          // Salida en origen
          await MovimientoStock.create({
            producto: producto._id,
            tipo: 'salida',
            cantidad: -Math.abs(p.cantidad),
            unidad: p.unidad || 'kg',
            ubicacion: transferencia.origen,
            usuario: transferencia.usuario || '',
            motivo: 'Transferencia enviada',
            referencia: transferencia._id,
            observaciones: p.comentario || '',
            fecha: new Date()
          });
          // Entrada en destino
          await MovimientoStock.create({
            producto: producto._id,
            tipo: 'entrada',
            cantidad: Math.abs(p.cantidad),
            unidad: p.unidad || 'kg',
            ubicacion: transferencia.destino,
            usuario: transferencia.usuario || '',
            motivo: 'Transferencia recibida',
            referencia: transferencia._id,
            observaciones: p.comentario || '',
            fecha: new Date()
          });
        }
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
    // Registrar movimiento de entrada
    await MovimientoStock.create({
      producto: lote.producto,
      lote: lote._id,
      tipo: 'entrada',
      cantidad: lote.cantidadInicial,
      unidad: req.body.unidad || 'kg',
      ubicacion: lote.ubicacion,
      motivo: 'Alta de lote',
      observaciones: req.body.observaciones || '',
      fecha: new Date()
    });
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
    // Si el movimiento afecta a un lote, actualizar cantidadActual
    if (movimiento.lote) {
      const lote = await Lote.findById(movimiento.lote);
      if (lote) {
        lote.cantidadActual += movimiento.cantidad;
        // Cambiar estado si se consume o baja
        if (lote.cantidadActual <= 0) {
          lote.estado = movimiento.tipo === 'baja' ? 'baja' : 'consumido';
          lote.cantidadActual = 0;
        }
        await lote.save();
      }
    }
    res.status(201).json(movimiento);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENDPOINTS DE RECETAS ---
// Listar recetas
app.get('/api/recetas', async (req, res) => {
  try {
    const recetas = await Receta.find().populate('productoFinal ingredientes.producto');
    res.json(recetas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear receta
app.post('/api/recetas', async (req, res) => {
  try {
    const receta = new Receta(req.body);
    await receta.save();
    res.status(201).json(receta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Editar receta
app.put('/api/recetas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const receta = await Receta.findByIdAndUpdate(id, req.body, { new: true });
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    res.json(receta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- FABRICACIÓN DE PRODUCTOS EN FÁBRICA ---
// Endpoint para fabricar producto (con receta o libre)
app.post('/api/fabricar', async (req, res) => {
  try {
    const { recetaId, productoFinal, cantidad, unidad, ingredientes, usuario, loteCodigo, fechaCaducidad, observaciones } = req.body;
    let receta = null;
    let ingredientesUsar = [];
    if (recetaId) {
      receta = await Receta.findById(recetaId).populate('ingredientes.producto productoFinal');
      if (!receta) return res.status(400).json({ error: 'Receta no encontrada' });
      ingredientesUsar = receta.ingredientes.map(i => ({ producto: i.producto._id, cantidad: i.cantidad * cantidad, unidad: i.unidad }));
    } else if (ingredientes && Array.isArray(ingredientes)) {
      ingredientesUsar = ingredientes;
    } else {
      return res.status(400).json({ error: 'Faltan ingredientes para fabricación libre' });
    }
    // Descontar ingredientes del stock y registrar movimientos
    for (const ing of ingredientesUsar) {
      await MovimientoStock.create({
        producto: ing.producto,
        tipo: 'salida',
        cantidad: -Math.abs(ing.cantidad),
        unidad: ing.unidad || 'kg',
        ubicacion: 'FABRICA',
        usuario: usuario || '',
        motivo: 'Fabricación',
        referencia: null,
        observaciones: observaciones || '',
        fecha: new Date()
      });
    }
    // Crear lote del producto final
    const lote = new Lote({
      producto: productoFinal,
      codigo: loteCodigo || `FAB-${Date.now()}`,
      fechaCaducidad: fechaCaducidad || null,
      cantidadInicial: cantidad,
      cantidadActual: cantidad,
      estado: 'activo',
      ubicacion: 'FABRICA',
      observaciones: observaciones || ''
    });
    await lote.save();
    // Registrar movimiento de entrada del producto fabricado
    await MovimientoStock.create({
      producto: productoFinal,
      lote: lote._id,
      tipo: 'entrada',
      cantidad: cantidad,
      unidad: unidad || 'kg',
      ubicacion: 'FABRICA',
      usuario: usuario || '',
      motivo: 'Fabricación',
      referencia: lote._id,
      observaciones: observaciones || '',
      fecha: new Date()
    });
    res.status(201).json({ lote, movimientosIngredientes: ingredientesUsar });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- EXPORTACIÓN AVANZADA A EXCEL (MEJORADA) ---
// Endpoint: /api/exportar/:entidad?filtros
app.get('/api/exportar/:entidad', async (req, res) => {
  try {
    const { entidad } = req.params;
    let datos = [];
    let columnas = [];
    let nombreHoja = 'Datos';
    // Filtros generales
    const filtros = { ...req.query };
    // Eliminar parámetros de paginación o especiales
    delete filtros.page; delete filtros.limit; delete filtros.sort;
    // Selección de entidad y datos
    if (entidad === 'productos') {
      datos = await Producto.find(filtros);
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Nombre', key: 'nombre' },
        { header: 'Unidad', key: 'unidad' },
        { header: 'Stock Mínimo', key: 'stockMinimo' },
        { header: 'Activo', key: 'activo' },
        { header: 'Fecha Creación', key: 'createdAt' },
        { header: 'Última Modificación', key: 'updatedAt' }
      ];
      nombreHoja = 'Productos';
    } else if (entidad === 'avisos') {
      datos = await Aviso.find(filtros);
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Referencia', key: 'referenciaId' },
        { header: 'Tienda', key: 'tiendaId' },
        { header: 'Texto', key: 'texto' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Visto Por', key: 'vistoPor' }
      ];
      nombreHoja = 'Avisos';
    } else if (entidad === 'movimientos') {
      datos = await MovimientoStock.find(filtros).populate('producto lote');
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Producto', key: 'producto' },
        { header: 'Lote', key: 'lote' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Cantidad', key: 'cantidad' },
        { header: 'Unidad', key: 'unidad' },
        { header: 'Ubicación', key: 'ubicacion' },
        { header: 'Motivo', key: 'motivo' },
        { header: 'Referencia', key: 'referencia' },
        { header: 'Observaciones', key: 'observaciones' },
        { header: 'Fecha', key: 'fecha' }
      ];
      nombreHoja = 'Movimientos';
    } else if (entidad === 'transferencias') {
      datos = await Transferencia.find(filtros);
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Origen', key: 'origen' },
        { header: 'Destino', key: 'destino' },
        { header: 'Estado', key: 'estado' },
        { header: 'Usuario', key: 'usuario' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Productos', key: 'productos' }
      ];
      nombreHoja = 'Transferencias';
    } else if (entidad === 'lotes') {
      datos = await Lote.find(filtros).populate('producto');
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Producto', key: 'producto' },
        { header: 'Código', key: 'codigo' },
        { header: 'Cantidad Inicial', key: 'cantidadInicial' },
        { header: 'Cantidad Actual', key: 'cantidadActual' },
        { header: 'Estado', key: 'estado' },
        { header: 'Ubicación', key: 'ubicacion' },
        { header: 'Fecha Caducidad', key: 'fechaCaducidad' },
        { header: 'Observaciones', key: 'observaciones' },
        { header: 'Fecha Creación', key: 'createdAt' }
      ];
      nombreHoja = 'Lotes';
    } else if (entidad === 'recetas') {
      datos = await Receta.find(filtros).populate('productoFinal ingredientes.producto');
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Producto Final', key: 'productoFinal' },
        { header: 'Ingredientes', key: 'ingredientes' },
        { header: 'Fecha Creación', key: 'createdAt' }
      ];
      nombreHoja = 'Recetas';
    } else if (entidad === 'pedidos') {
      datos = await Pedido.find(filtros);
      columnas = [
        { header: 'ID', key: '_id' },
        { header: 'Número Pedido', key: 'numeroPedido' },
        { header: 'Tienda', key: 'tiendaId' },
        { header: 'Estado', key: 'estado' },
        { header: 'Fecha Pedido', key: 'fechaPedido' },
        { header: 'Fecha Envío', key: 'fechaEnvio' },
        { header: 'Fecha Recepción', key: 'fechaRecepcion' },
        { header: 'Usuario', key: 'usuario' },
        { header: 'Total Líneas', key: 'lineas' }
      ];
      nombreHoja = 'Pedidos';
    } else {
      return res.status(400).json({ error: 'Entidad no soportada para exportación' });
    }
    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(nombreHoja);
    worksheet.columns = columnas;
    // Formatear datos para Excel (avanzado)
    datos.forEach(d => {
      const row = {};
      columnas.forEach(col => {
        if (col.key === 'producto' && d.producto && d.producto.nombre) {
          row[col.key] = d.producto.nombre;
        } else if (col.key === 'productoFinal' && d.productoFinal && d.productoFinal.nombre) {
          row[col.key] = d.productoFinal.nombre;
        } else if (col.key === 'lote' && d.lote && d.lote.codigo) {
          row[col.key] = d.lote.codigo;
        } else if (col.key === 'ingredientes' && Array.isArray(d.ingredientes)) {
          row[col.key] = d.ingredientes.map(i => `${i.producto?.nombre || i.producto}: ${i.cantidad} ${i.unidad}`).join('; ');
        } else if (col.key === 'vistoPor' && Array.isArray(d.vistoPor)) {
          row[col.key] = d.vistoPor.join(', ');
        } else if (col.key === 'productos' && Array.isArray(d.productos)) {
          row[col.key] = d.productos.map(p => `${p.producto || ''} (${p.cantidad || ''})`).join('; ');
        } else if (col.key === 'lineas' && Array.isArray(d.lineas)) {
          row[col.key] = d.lineas.length;
        } else {
          row[col.key] = d[col.key] || '';
        }
      });
      worksheet.addRow(row);
    });
    // Cabeceras para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${entidad}_export_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// === AVISOS AUTOMÁTICOS DE STOCK BAJO Y CADUCIDAD PRÓXIMA ===
const AVISO_STOCK_MINIMO = 5; // kg o unidades mínimas para aviso
const AVISO_DIAS_CADUCIDAD = 5; // días antes de caducidad para aviso

async function generarAvisosAutomaticos() {
  // 1. Avisos de stock bajo
  const stocks = await Stock.find({});
  for (const s of stocks) {
    if (s.cantidad <= AVISO_STOCK_MINIMO) {
      // Buscar si ya existe un aviso activo para este producto y tienda
      const existe = await Aviso.findOne({
        tipo: 'stock',
        referenciaId: s.producto + '_' + s.tiendaId,
        tiendaId: s.tiendaId,
        texto: { $regex: 'Stock bajo' },
        fecha: { $gte: new Date(Date.now() - 1000*60*60*24) } // Solo uno por día
      });
      if (!existe) {
        // Buscar nombre del producto
        const prod = await Producto.findOne({ _id: s.producto });
        await Aviso.create({
          tipo: 'stock',
          referenciaId: s.producto + '_' + s.tiendaId,
          tiendaId: s.tiendaId,
          texto: `Stock bajo de ${prod ? prod.nombre : s.producto} en ${s.tiendaId}: ${s.cantidad} ${s.unidad}`
        });
      }
    }
  }
  // 2. Avisos de caducidad próxima
  const hoy = new Date();
  const fechaLimite = new Date(hoy.getTime() + AVISO_DIAS_CADUCIDAD*24*60*60*1000);
  const lotes = await Lote.find({ fechaCaducidad: { $lte: fechaLimite, $gte: hoy }, estado: 'activo' });
  for (const l of lotes) {
    // Buscar si ya existe un aviso para este lote
    const existe = await Aviso.findOne({
      tipo: 'caducidad',
      referenciaId: l._id.toString(),
      tiendaId: l.ubicacion,
      texto: { $regex: 'caducidad' },
      fecha: { $gte: new Date(Date.now() - 1000*60*60*24) }
    });
    if (!existe) {
      const prod = await Producto.findOne({ _id: l.producto });
      await Aviso.create({
        tipo: 'caducidad',
        referenciaId: l._id.toString(),
        tiendaId: l.ubicacion,
        texto: `Lote ${l.codigo} (${prod ? prod.nombre : l.producto}) caduca el ${l.fechaCaducidad.toLocaleDateString()}`
      });
    }
  }
}
// Ejecutar cada 30 minutos
setInterval(generarAvisosAutomaticos, 1000*60*30);
// Ejecutar al iniciar
setTimeout(generarAvisosAutomaticos, 10000);

const PORT = process.env.PORT || 10001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor backend HTTP escuchando en puerto', PORT);
});