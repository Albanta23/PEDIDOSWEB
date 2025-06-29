const mongoose = require('mongoose');

const LineaClienteSchema = new mongoose.Schema({
  producto: String,
  cantidad: Number,
  peso: Number,
  formato: String,
  comentario: String,
  cantidadEnviada: Number,
  lote: String,
  preparada: Boolean,
  esComentario: Boolean
});

const PedidoClienteSchema = new mongoose.Schema({
  clienteId: String,
  clienteNombre: String,
  direccion: String,
  estado: { type: String, default: 'enviado' },
  numeroPedido: Number,
  lineas: [LineaClienteSchema],
  fechaCreacion: { type: Date, default: Date.now },
  fechaPedido: Date,
  fechaEnvio: Date,
  fechaRecepcion: Date,
  peso: { type: Number, min: 0 },
  tipo: { type: String, default: 'cliente' }
}, { timestamps: true });

PedidoClienteSchema.index({ numeroPedido: 1 }, { unique: true });

module.exports = mongoose.model('PedidoCliente', PedidoClienteSchema);
