const mongoose = require('mongoose');

const LoteSchema = new mongoose.Schema({
  lote: { type: String, required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  proveedorId: { type: String, required: false },
  fechaEntrada: { type: Date, default: Date.now },
  cantidadInicial: { type: Number, required: true },
  pesoInicial: { type: Number, required: true },
  cantidadDisponible: { type: Number, required: true },
  pesoDisponible: { type: Number, required: true },
  referenciaDocumento: { type: String },
  precioCoste: { type: Number },
  notas: { type: String }
}, { timestamps: true });

LoteSchema.index({ producto: 1, lote: 1 }, { unique: true });

module.exports = mongoose.model('Lote', LoteSchema);
