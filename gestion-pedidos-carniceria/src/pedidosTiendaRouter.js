const express = require('express');
const router = express.Router();
const pedidosTiendaController = require('./pedidosTiendaController');

// Rutas para etiquetas de bultos
router.get('/pedidos/:id/etiquetas-bultos', pedidosTiendaController.etiquetasBultos);
router.post('/pedidos/:id/etiquetas-bultos-preview', pedidosTiendaController.etiquetasBultosPreview);
router.get('/pedidos/:id/etiquetas-bultos-pdf', pedidosTiendaController.etiquetasBultosPDF);

// Aquí puedes añadir el resto de rutas de pedidos si lo necesitas

module.exports = router;
