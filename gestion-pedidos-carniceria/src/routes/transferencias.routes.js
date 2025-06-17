const express = require('express');
const router = express.Router();
const Transferencia = require('../models/Transferencia');
const MovimientoStock = require('../models/MovimientoStock');
const { defaultLimiter } = require('../middlewares/rateLimit');

// GET /api/transferencias (Listar todas las transferencias)
router.get('/', async (req, res) => {
  try {
    const transferencias = await Transferencia.find().sort({ fecha: -1 });
    res.json(transferencias);
  } catch (err) {
    console.error('Error in GET /api/transferencias:', err);
    res.status(500).json({ error: 'Error al obtener las transferencias: ' + err.message });
  }
});

// POST /api/transferencias (Crear una nueva transferencia)
router.post('/', defaultLimiter, async (req, res) => {
  try {
    const transferencia = new Transferencia(req.body);
    await transferencia.save();
    res.status(201).json(transferencia);
  } catch (err) {
    console.error('Error in POST /api/transferencias:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al crear la transferencia: ' + err.message, details: err.errors });
    } else {
      res.status(400).json({ error: 'Error al crear la transferencia: ' + err.message });
    }
  }
});

// PUT /api/transferencias/:id (Actualizar una transferencia)
router.put('/:id', defaultLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const transferencia = await Transferencia.findByIdAndUpdate(id, req.body, { new: true });
    if (!transferencia) return res.status(404).json({ error: 'Transferencia no encontrada' });
    res.json(transferencia);
  } catch (err) {
    console.error(`Error in PUT /api/transferencias/${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al actualizar la transferencia: ' + err.message, details: err.errors });
    } else if (err.name === 'CastError') {
      res.status(400).json({ error: 'ID de transferencia inválido: ' + err.message });
    } else {
      res.status(500).json({ error: 'Error al actualizar la transferencia: ' + err.message });
    }
  }
});

// PATCH /api/transferencias/:id/confirmar (Confirmar una transferencia)
router.patch('/:id/confirmar', defaultLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const transferencia = await Transferencia.findByIdAndUpdate(id, { estado: 'recibida' }, { new: true });
    if (!transferencia) return res.status(404).json({ error: 'Transferencia no encontrada' });

    for (const prod of transferencia.productos) {
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
    console.error(`Error in PATCH /api/transferencias/${req.params.id}/confirmar:`, err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al confirmar la transferencia: ' + err.message, details: err.errors });
    } else if (err.name === 'CastError') {
      res.status(400).json({ error: 'ID de transferencia inválido: ' + err.message });
    } else {
      res.status(500).json({ error: 'Error al confirmar la transferencia: ' + err.message });
    }
  }
});

// POST /api/transferencias/registrar (Registrar transferencia y reflejar en stock)
// This endpoint seems more comprehensive than the simple POST /api/transferencias
// Consider if the simple POST / is still needed or if this one should be the primary create mechanism.
// For now, refactoring as is.
router.post('/registrar', defaultLimiter, async (req, res) => {
  try {
    const { origenId, destinoId, productos, observaciones, usuario } = req.body;
    if (!origenId || !destinoId || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos para la transferencia' });
    }
    const transferencia = await Transferencia.create({
      origen: origenId,
      destino: destinoId,
      productos,
      observaciones,
      usuario,
      fecha: new Date(),
      estado: 'realizada' // Default state, confirm endpoint changes it to 'recibida'
    });

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
      // Entrada en destino (NOTE: PATCH /:id/confirmar also creates an entry. This might lead to double entries if not handled carefully)
      // The original code in server.js for THIS route also created an 'entrada' here.
      // The PATCH confirm route is meant for when the destination store *confirms* receipt.
      // This 'registrar' route implies the transfer is happening *now* from the origin's perspective.
      // It is possible that stock movements are registered at origin upon sending, and at destination upon confirming.
      await MovimientoStock.create({
        tiendaId: destinoId,
        producto: prod.producto,
        cantidad: prod.cantidad,
        unidad: prod.unidad || 'kg',
        lote: prod.lote || '',
        motivo: 'Transferencia desde ' + origenId,
        tipo: 'transferencia_entrada', // This implies immediate entry at destination
        fecha: new Date(),
        transferenciaId: transferencia._id.toString()
      });
    }
    res.json({ ok: true, transferencia });
  } catch (e) {
    console.error('Error in POST /api/transferencias/registrar:', e);
    if (e.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al registrar la transferencia: ' + e.message, details: e.errors });
    } else {
      res.status(500).json({ error: 'Error al registrar la transferencia y movimientos de stock: ' + e.message });
    }
  }
});

module.exports = router;
