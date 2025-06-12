const mongoose = require('mongoose');

const LineaSchema = new mongoose.Schema({
  producto: String,
  cantidad: Number,
  peso: Number, // <--- NUEVO: peso por línea
  formato: String,
  comentario: String,
  cantidadEnviada: Number,
  lote: String,
  preparada: Boolean,
  esComentario: Boolean // <--- NUEVO: campo para identificar líneas de comentario
});

const PedidoSchema = new mongoose.Schema({
  tiendaId: String,
  estado: { type: String, default: 'enviado' },
  numeroPedido: Number,
  lineas: [LineaSchema],
  fechaCreacion: { type: Date, default: Date.now },
  fechaPedido: Date,
  fechaEnvio: Date,
  fechaRecepcion: Date,
  peso: { type: Number, min: 0 }
}, { timestamps: true });

PedidoSchema.index({ numeroPedido: 1 }, { unique: true });

module.exports = mongoose.model('Pedido', PedidoSchema);