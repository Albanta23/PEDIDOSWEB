// Servidor de prueba sin MongoDB para testing de comentarios
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "https://studious-eureka-4gvp6jr7r4v236q6-3000.app.github.dev"
    ],
    credentials: true
}));

app.use(express.json());

// Socket.IO con CORS
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000", 
            "https://studious-eureka-4gvp6jr7r4v236q6-3000.app.github.dev"
        ],
        credentials: true
    }
});

// Datos de ejemplo para testing
let pedidosEjemplo = [
    {
        _id: 'test1',
        numeroFactura: 'F001',
        tienda: { nombre: 'Tienda Test' },
        fechaFactura: new Date(),
        estado: 'pendiente',
        lineas: [
            { nombre: 'Producto 1', cantidad: 2, precio: 10.50 },
            { esComentario: true, comentario: 'Este es un comentario de ejemplo' },
            { nombre: 'Producto 2', cantidad: 1, precio: 15.00 }
        ]
    }
];

// Rutas básicas
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor de prueba funcionando' });
});

app.get('/api/pedidos', (req, res) => {
    console.log('GET /api/pedidos - Enviando pedidos de ejemplo');
    res.json(pedidosEjemplo);
});

app.post('/api/pedidos', (req, res) => {
    console.log('POST /api/pedidos - Pedido recibido:', JSON.stringify(req.body, null, 2));
    const nuevoPedido = {
        _id: 'test' + Date.now(),
        ...req.body,
        fechaFactura: new Date()
    };
    pedidosEjemplo.push(nuevoPedido);
    
    // Emitir el nuevo pedido via socket
    io.emit('nuevoPedido', nuevoPedido);
    
    res.json({ success: true, pedido: nuevoPedido });
});

// Socket.IO eventos
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Enviar pedidos iniciales
    socket.emit('pedidosIniciales', pedidosEjemplo);
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
    
    // Manejar actualización de pedidos
    socket.on('actualizarPedido', (data) => {
        console.log('Actualizando pedido:', data);
        const index = pedidosEjemplo.findIndex(p => p._id === data._id);
        if (index !== -1) {
            pedidosEjemplo[index] = { ...pedidosEjemplo[index], ...data };
            io.emit('pedidoActualizado', pedidosEjemplo[index]);
        }
    });
});

const PORT = process.env.PORT || 10001;
server.listen(PORT, () => {
    console.log(`Servidor de prueba escuchando en puerto ${PORT}`);
    console.log('Sistema listo para probar funcionalidades de comentarios');
});
