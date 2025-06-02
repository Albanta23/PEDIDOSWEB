const mongoose = require('mongoose');

// Modelo de stock por producto y tienda
const StockSchema = new mongoose.Schema({
  producto: { type: String, required: true },
  tiendaId: { type: String, required: true }, // Puede ser 'FABRICA' o id de tienda
  cantidad: { type: Number, required: true, default: 0 },
  unidad: { type: String, default: 'kg' },
}, { timestamps: true });

StockSchema.index({ producto: 1, tiendaId: 1 }, { unique: true });

module.exports = mongoose.model('Stock', StockSchema);
