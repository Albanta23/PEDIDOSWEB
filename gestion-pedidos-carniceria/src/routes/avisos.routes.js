const express = require('express');
const router = express.Router();
const Aviso = require('../models/Aviso');
const { defaultLimiter } = require('../middlewares/rateLimit');

// GET /api/avisos (Listar avisos)
router.get('/', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.tiendaId) filtro.tiendaId = req.query.tiendaId;
    const avisos = await Aviso.find(filtro).sort({ fecha: -1 });
    res.json(avisos);
  } catch (err) {
    console.error('Error in GET /api/avisos:', err);
    res.status(500).json({ error: 'Error al obtener los avisos: ' + err.message });
  }
});

// POST /api/avisos (Crear un aviso)
router.post('/', defaultLimiter, async (req, res) => {
  try {
    const aviso = new Aviso(req.body);
    await aviso.save();
    res.status(201).json(aviso);
  } catch (err) {
    console.error('Error in POST /api/avisos:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al crear el aviso: ' + err.message, details: err.errors });
    } else {
      res.status(400).json({ error: 'Error al crear el aviso: ' + err.message });
    }
  }
});

// PATCH /api/avisos/:id/visto (Marcar aviso como visto)
router.patch('/:id/visto', defaultLimiter, async (req, res) => {
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
    console.error(`Error in PATCH /api/avisos/${req.params.id}/visto:`, err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al actualizar el aviso: ' + err.message, details: err.errors });
    } else if (err.name === 'CastError') {
      res.status(400).json({ error: 'ID de aviso inválido: ' + err.message });
    } else {
      res.status(500).json({ error: 'Error al actualizar el aviso: ' + err.message });
    }
  }
});

module.exports = router;
