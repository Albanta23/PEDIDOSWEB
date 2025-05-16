const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  producto: String,
  cantidad: Number,
  formato: String,
  comentario: String,
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', PedidoSchema);