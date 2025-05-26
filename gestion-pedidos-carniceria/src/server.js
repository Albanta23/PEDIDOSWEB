// Servidor Express con Socket.io para pedidos en tiempo real
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Añadido
const Pedido = require('./models/Pedido'); // Añadido

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
const MONGODB_URI = process.env.MONGODB_URI; // Usar solo la variable estándar MONGODB_URI
if (!MONGODB_URI) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida.');
  process.exit(1);
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
    // Permitir todos los campos modernos
    const nuevoPedido = new Pedido({
      ...req.body,
      fechaCreacion: req.body.fechaCreacion || new Date(),
      fechaPedido: req.body.fechaPedido,
      fechaEnvio: req.body.fechaEnvio,
      fechaRecepcion: req.body.fechaRecepcion
    });
    const pedidoGuardado = await nuevoPedido.save();
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

// Importar y montar el endpoint de Mailgun para enviar proveedor
require('./enviarProveedorEmail')(app);

// Endpoint de prueba para enviar solo la plantilla HTML al proveedor (sin PDF)
app.post('/api/enviar-proveedor-html-test', async (req, res) => {
  try {
    // Usa la misma lógica de plantilla que en enviarProveedorEmail.js
    const mailgun = require('mailgun-js');
    const DOMAIN = process.env.MAILGUN_DOMAIN || process.env.MAILGUN_SANDBOX_DOMAIN;
    const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
    const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
    const fromEmail = 'fabricaembutidosballesteros@gmail.com';
    const { tienda, fecha, lineas } = req.body;

    // Construcción simple de la plantilla HTML (ajusta según tu plantilla real)
    let html = `<h2>Pedido de ${tienda}</h2><p>Fecha: ${fecha}</p><table border="1" cellpadding="5"><tr><th>Referencia</th><th>Cantidad</th><th>Unidad</th></tr>`;
    for (const l of lineas) {
      html += `<tr><td>${l.referencia}</td><td>${l.cantidad}</td><td>${l.unidad}</td></tr>`;
    }
    html += '</table>';

    const data = {
      from: fromEmail,
      to: proveedorEmail,
      subject: `Pedido TEST solo HTML - ${tienda} (${fecha})`,
      html
    };

    mg.messages().send(data, function (error, body) {
      if (error) {
        console.error('Error enviando email:', error);
        return res.status(500).json({ error: 'Error enviando email', details: error });
      }
      res.json({ ok: true, enviado: true, body });
    });
  } catch (err) {
    console.error('Error en endpoint /api/enviar-proveedor-html-test:', err);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Servidor backend escuchando en puerto', PORT);
});