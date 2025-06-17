const express = require('express');
const router = express.Router();
const MovimientoStock = require('../models/MovimientoStock');
const { defaultLimiter } = require('../middlewares/rateLimit');

// GET /api/movimientos-stock (Consultar movimientos de stock)
router.get('/', async (req, res) => {
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
    console.error('Error in GET /api/movimientos-stock:', e);
    res.status(500).json({ error: 'Error al obtener los movimientos de stock: ' + e.message });
  }
});

// POST /api/movimientos-stock/baja (Registrar baja de stock)
router.post('/baja', defaultLimiter, async (req, res) => {
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
    console.error('Error in POST /api/movimientos-stock/baja:', e);
    if (e.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al registrar la baja de stock: ' + e.message, details: e.errors });
    } else {
      res.status(400).json({ error: 'Error al registrar la baja de stock: ' + e.message });
    }
  }
});

// POST /api/movimientos-stock/entrada (Registrar entrada de stock)
router.post('/entrada', defaultLimiter, async (req, res) => {
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
    console.error('Error in POST /api/movimientos-stock/entrada:', e);
    if (e.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al registrar la entrada de stock: ' + e.message, details: e.errors });
    } else {
      res.status(400).json({ error: 'Error al registrar la entrada de stock: ' + e.message });
    }
  }
});

module.exports = router;
