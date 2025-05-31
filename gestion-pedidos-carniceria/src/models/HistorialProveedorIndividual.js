const mongoose = require('mongoose');

const HistorialProveedorIndividualSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true },
  tiendaNombre: { type: String, required: true },
  fechaPedido: { type: Date, required: true },
  lineas: { type: Array, required: true },
  proveedor: { type: String, required: true },
});

HistorialProveedorIndividualSchema.index({ tiendaId: 1, fechaPedido: -1 });

module.exports = mongoose.model('HistorialProveedorIndividual', HistorialProveedorIndividualSchema);
