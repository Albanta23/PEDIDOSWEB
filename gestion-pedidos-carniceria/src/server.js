// Servidor Express con Socket.io para pedidos en tiempo real
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

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

const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

// Función para leer pedidos desde el archivo
function cargarPedidos() {
  try {
    const data = fs.readFileSync(PEDIDOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Función para guardar pedidos en el archivo
function guardarPedidos() {
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
}

let pedidos = cargarPedidos();

// Endpoints REST
app.get('/api/pedidos', (req, res) => {
  res.json(pedidos);
});

app.post('/api/pedidos', (req, res) => {
  const pedido = req.body;
  pedidos.push(pedido);
  guardarPedidos();
  io.emit('pedido_nuevo', pedido);
  res.status(201).json(pedido);
});

app.put('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const idx = pedidos.findIndex(p => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Pedido no encontrado' });
  pedidos[idx] = { ...pedidos[idx], ...req.body };
  guardarPedidos();
  io.emit('pedido_actualizado', pedidos[idx]);
  res.json(pedidos[idx]);
});

app.delete('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const idx = pedidos.findIndex(p => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Pedido no encontrado' });
  const eliminado = pedidos.splice(idx, 1)[0];
  guardarPedidos();
  io.emit('pedido_eliminado', eliminado);
  res.status(204).end();
});

// WebSocket para tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.emit('pedidos_inicial', pedidos);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Servidor backend escuchando en puerto', PORT);
});