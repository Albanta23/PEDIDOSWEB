const mongoose = require('mongoose');

const LineaSchema = new mongoose.Schema({
  producto: String,
  cantidad: Number,
  formato: String,
  comentario: String,
  cantidadEnviada: Number, // ahora representa los kilos enviados
  unidadesEnviadas: { type: Number, default: null }, // nuevo campo para unidades/piezas enviadas
  lote: String,
  preparada: Boolean
}, { minimize: false }); // <--- No omitir campos null

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

module.exports = mongoose.model('Pedido', PedidoSchema);