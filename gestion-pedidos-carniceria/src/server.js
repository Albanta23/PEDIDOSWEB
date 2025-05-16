// Servidor Express con Socket.io para pedidos en tiempo real
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
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
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    io.emit('pedido_nuevo', pedido);
    res.status(201).json(pedido);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear pedido' });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    io.emit('pedido_actualizado', pedido);
    res.json(pedido);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar pedido' });
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    io.emit('pedido_eliminado', pedido);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: 'Error al eliminar pedido' });
  }
});

// WebSocket para tiempo real
io.on('connection', async (socket) => {
  console.log('Cliente conectado:', socket.id);
  const pedidos = await Pedido.find();
  socket.emit('pedidos_inicial', pedidos);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('Falta la variable de entorno MONGODB_URI');
  process.exit(1);
}
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Servidor backend escuchando en puerto', PORT);
});