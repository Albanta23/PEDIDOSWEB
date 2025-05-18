// Servidor Express con Socket.io para pedidos en tiempo real
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Añadido
const Pedido = require('./models/Pedido'); // Añadido
const Transferencia = require('./models/Transferencia'); // Añadido
const Aviso = require('./models/Aviso'); // <--- NUEVO

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Conexión a MongoDB
// La variable de entorno MONGODB_URI se configura en el dashboard de Render.
// Para desarrollo local, puedes definirla en un archivo .env o directamente aquí como fallback.
const MONGODB_URI = process.env.MONGODB_URI || process.env.mongodb;

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

app.use(cors());
app.use(express.json());

// Nueva ruta para health check
app.get('/', (req, res) => {
  res.status(200).send('Backend service is running');
});

// Función para crear avisos automáticos
async function crearAvisoAutom({ tipo, referenciaId, tiendaId, texto }) {
  try {
    const existe = await Aviso.findOne({ tipo, referenciaId, tiendaId });
    if (!existe) {
      await Aviso.create({ tipo, referenciaId, tiendaId, texto });
    }
  } catch (e) { console.error('Error creando aviso automático:', e); }
}

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
    const nuevoPedido = new Pedido({
      ...req.body,
      fechaCreacion: req.body.fechaCreacion || new Date(),
      fechaPedido: req.body.fechaPedido,
      fechaEnvio: req.body.fechaEnvio,
      fechaRecepcion: req.body.fechaRecepcion
    });
    const pedidoGuardado = await nuevoPedido.save();
    // AVISO AUTOMÁTICO: nuevo pedido para la tienda
    await crearAvisoAutom({
      tipo: 'pedido',
      referenciaId: pedidoGuardado._id.toString(),
      tiendaId: pedidoGuardado.tiendaId,
      texto: `¡Tienes un nuevo pedido recibido! Nº ${pedidoGuardado.numeroPedido || ''}`
    });
    io.emit('pedido_nuevo', pedidoGuardado);
    res.status(201).json(pedidoGuardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[BACKEND] PUT /api/pedidos/:id', id, 'Body:', req.body);
    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
    console.log('[BACKEND] Pedido actualizado:', pedidoActualizado);
    // AVISO AUTOMÁTICO: si cambia a preparado o enviadoTienda
    if (pedidoActualizado && ['preparado', 'enviadoTienda'].includes(pedidoActualizado.estado)) {
      await crearAvisoAutom({
        tipo: 'pedido',
        referenciaId: pedidoActualizado._id.toString(),
        tiendaId: pedidoActualizado.tiendaId,
        texto: `¡Tienes un nuevo pedido recibido! Nº ${pedidoActualizado.numeroPedido || ''}`
      });
    }
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

// ENDPOINTS TRANSFERENCIAS
app.get('/api/transferencias', async (req, res) => {
  try {
    const transferencias = await Transferencia.find();
    res.json(transferencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transferencias', async (req, res) => {
  try {
    const nueva = new Transferencia(req.body);
    const guardada = await nueva.save();
    // AVISO AUTOMÁTICO: para destino y origen si aplica
    if (guardada.origen && guardada.destino) {
      await crearAvisoAutom({
        tipo: 'traspaso',
        referenciaId: guardada._id.toString(),
        tiendaId: guardada.destino,
        texto: `¡Tienes un nuevo traspaso/devolución recibido!` });
      await crearAvisoAutom({
        tipo: 'traspaso',
        referenciaId: guardada._id.toString(),
        tiendaId: guardada.origen,
        texto: `¡Has realizado un traspaso/devolución!` });
    }
    res.status(201).json(guardada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/transferencias/:id', async (req, res) => {
  try {
    const actualizada = await Transferencia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ error: 'No encontrada' });
    res.json(actualizada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/transferencias/:id/confirmar', async (req, res) => {
  try {
    const confirmada = await Transferencia.findByIdAndUpdate(
      req.params.id,
      { estado: 'recibida', ...req.body },
      { new: true }
    );
    if (!confirmada) return res.status(404).json({ error: 'No encontrada' });
    res.json(confirmada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ENDPOINTS AVISOS (MENSAJES)
app.get('/api/avisos', async (req, res) => {
  try {
    const { tiendaId } = req.query;
    let query = {};
    if (tiendaId) query.tiendaId = tiendaId;
    const avisos = await Aviso.find(query).sort({ fecha: -1 });
    res.json(avisos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/avisos', async (req, res) => {
  try {
    const aviso = new Aviso(req.body);
    const guardado = await aviso.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/avisos/:id/visto', async (req, res) => {
  try {
    const { usuario } = req.body;
    const aviso = await Aviso.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { vistoPor: usuario } },
      { new: true }
    );
    if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });
    res.json(aviso);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Servidor backend escuchando en puerto', PORT);
});