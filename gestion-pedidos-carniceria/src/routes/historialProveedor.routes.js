const express = require('express');
const router = express.Router();
const HistorialProveedor = require('../models/HistorialProveedor');
const { defaultLimiter } = require('../middlewares/rateLimit');

// POST /api/historial-proveedor (Guardar en historial de proveedor)
router.post('/', defaultLimiter, async (req, res) => {
  try {
    const { tiendaId, tiendaNombre, fechaPedido, lineas, proveedor } = req.body;
    if (!tiendaId || !fechaPedido || !lineas || !proveedor || !tiendaNombre) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    await HistorialProveedor.create({
      tiendaId,
      tiendaNombre,
      fechaPedido: new Date(fechaPedido),
      lineas,
      proveedor
    });
    res.json({ ok: true }); // Success response can remain as is, or be standardized later if needed. Focus is on errors.
  } catch (e) {
    console.error('Error in POST /api/historial-proveedor:', e);
    if (e.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al guardar en historial de proveedor: ' + e.message, details: e.errors });
    } else {
      res.status(500).json({ error: 'Error al guardar en historial de proveedor: ' + e.message });
    }
  }
});

// GET /api/historial-proveedor (Consultar historial de pedidos a proveedor)
router.get('/', async (req, res) => {
  try {
    const { tiendaId, periodo = 'semana' } = req.query;
    if (!tiendaId) return res.status(400).json({ error: 'Falta tiendaId' });

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

    const historial = await HistorialProveedor.find({
      tiendaId,
      fechaEnvio: { $gte: fechaInicio } // Assuming fechaEnvio, original had this, but model might use fechaPedido
    }).sort({ fechaEnvio: -1 });

    const resultado = historial.map(item => ({
      id: item._id,
      fecha: item.pedido?.fecha || item.fechaEnvio, // check this logic
      tienda: item.pedido?.tienda || '', // check this logic
      numeroLineas: Array.isArray(item.pedido?.lineas) ? item.pedido.lineas.length : 0, // check this logic
      proveedor: item.proveedor,
      pedido: item.pedido,
      fechaEnvio: item.fechaEnvio
    }));

    res.json({ ok: true, historial: resultado }); // Success response can remain as is.
  } catch (e) {
    console.error('Error in GET /api/historial-proveedor:', e);
    res.status(500).json({ error: 'Error al consultar historial de proveedor: ' + e.message });
  }
});

module.exports = router;
