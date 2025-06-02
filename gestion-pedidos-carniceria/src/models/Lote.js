const mongoose = require('mongoose');

// Modelo de lote para trazabilidad
const LoteSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  codigo: { type: String, required: true }, // Código/lote del proveedor o generado
  fechaCaducidad: { type: Date },
  cantidadInicial: { type: Number, required: true },
  cantidadActual: { type: Number, required: true },
  estado: { type: String, enum: ['activo', 'consumido', 'baja', 'caducado'], default: 'activo' },
  ubicacion: { type: String }, // Tienda o fábrica
  observaciones: { type: String },
}, { timestamps: true });

LoteSchema.index({ producto: 1, codigo: 1, ubicacion: 1 }, { unique: true });

module.exports = mongoose.model('Lote', LoteSchema);
