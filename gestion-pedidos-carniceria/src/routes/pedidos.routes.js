const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const { registrarEntradasStockPorPedido } = require('../utils'); // Adjusted path
const { defaultLimiter } = require('../middlewares/rateLimit');

module.exports = function(io) {
  // GET /api/pedidos
  router.get('/', async (req, res) => {
    try {
      const pedidos = await Pedido.find();
      res.json(pedidos);
    } catch (err) {
      console.error('Error in GET /api/pedidos:', err);
      res.status(500).json({ error: 'Error al obtener los pedidos: ' + err.message });
    }
  });

  // POST /api/pedidos
  router.post('/', defaultLimiter, async (req, res) => {
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
      io.emit('pedido_nuevo', pedidoGuardado); // Use io here
      res.status(201).json(pedidoGuardado);
    } catch (err) {
      console.error('Error in POST /api/pedidos:', {
        message: err.message,
        name: err.name,
        code: err.code,
        keyPattern: err.keyPattern,
        errors: err.errors,
        body: req.body
      });
      if (err.code === 11000 && err.keyPattern && err.keyPattern.numeroPedido) {
        res.status(500).json({ error: 'Error al crear el pedido: conflicto con número de pedido existente. Intente nuevamente.' });
      } else if (err.name === 'ValidationError') {
        res.status(400).json({ error: 'Error de validación al crear el pedido: ' + err.message, details: err.errors });
      } else {
        res.status(400).json({ error: 'Error al crear el pedido: ' + err.message });
      }
    }
  });

  // PUT /api/pedidos/:id
  router.put('/:id', defaultLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const pedidoPrevio = await Pedido.findById(id);
      const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
      if (!pedidoActualizado) return res.status(404).json({ error: 'Pedido no encontrado' });

      console.log('[DEBUG] Estado previo:', pedidoPrevio.estado, '| Estado actualizado:', pedidoActualizado.estado);
      if (pedidoActualizado.lineas) {
        pedidoActualizado.lineas.forEach((l, idx) => {
          console.log(`[DEBUG] Línea ${idx}: producto=${l.producto}, cantidadEnviada=${l.cantidadEnviada}`);
        });
      }

      if (pedidoActualizado.estado === 'enviadoTienda' && pedidoPrevio.estado !== 'enviadoTienda') {
        console.log('[DEBUG] Registrando movimientos de stock para pedido', pedidoActualizado.numeroPedido);
        await registrarEntradasStockPorPedido(pedidoActualizado); // Use imported function
      } else {
        console.log('[DEBUG] No se cumplen condiciones para registrar movimientos de stock');
      }
      io.emit('pedido_actualizado', pedidoActualizado); // Use io here
      console.log('[BACKEND] Emitiendo evento pedido_actualizado:', pedidoActualizado);
      res.json(pedidoActualizado);
    } catch (err) {
      console.error(`Error in PUT /api/pedidos/${req.params.id}:`, err);
      if (err.name === 'ValidationError') {
        res.status(400).json({ error: 'Error de validación al actualizar el pedido: ' + err.message, details: err.errors });
      } else if (err.name === 'CastError') {
        res.status(400).json({ error: 'ID de pedido inválido: ' + err.message });
      } else {
        res.status(500).json({ error: 'Error al actualizar el pedido: ' + err.message });
      }
    }
  });

  // DELETE /api/pedidos/:id
  router.delete('/:id', defaultLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const pedidoEliminado = await Pedido.findByIdAndDelete(id);
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      io.emit('pedido_eliminado', pedidoEliminado); // Use io here
      res.status(204).end();
    } catch (err) {
      console.error(`Error in DELETE /api/pedidos/${req.params.id}:`, err);
      if (err.name === 'CastError') {
        res.status(400).json({ error: 'ID de pedido inválido: ' + err.message });
      } else {
        res.status(500).json({ error: 'Error al eliminar el pedido: ' + err.message });
      }
    }
  });

  return router;
};
