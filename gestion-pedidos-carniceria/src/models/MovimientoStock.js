const mongoose = require('mongoose');

// Modelo de movimiento de stock (entrada, salida, ajuste, transferencia, fabricación, baja, etc.)
const MovimientoStockSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  lote: { type: mongoose.Schema.Types.ObjectId, ref: 'Lote' },
  tipo: { type: String, enum: ['entrada', 'salida', 'ajuste', 'transferencia', 'fabricacion', 'baja'], required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, default: 'kg' },
  ubicacion: { type: String, required: true }, // tiendaId o 'FABRICA'
  usuario: { type: String },
  motivo: { type: String },
  referencia: { type: String }, // id de pedido, transferencia, etc.
  observaciones: { type: String },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MovimientoStock', MovimientoStockSchema);
