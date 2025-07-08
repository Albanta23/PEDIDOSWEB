const mongoose = require('mongoose');

const LineaLoteSchema = new mongoose.Schema({
  cestaId: String, // Referencia a la cesta o lote
  nombreCesta: String, // Nombre descriptivo
  cantidad: Number,
  precioUnitario: Number, // Precio de la cesta/lote
  comentario: String
});

const PedidoLoteSchema = new mongoose.Schema({
  clienteId: String,
  clienteNombre: String,
  direccion: String,
  estado: { type: String, default: 'pendiente' },
  numeroPedido: Number,
  lineas: [LineaLoteSchema],
  fechaCreacion: { type: Date, default: Date.now },
  fechaPedido: Date,
  fechaEnvio: Date,
  fechaRecepcion: Date,
  notas: String,
  tipo: { type: String, default: 'lote' },
  usuarioTramitando: String,
  historialEstados: [
    {
      estado: String,
      usuario: String,
      fecha: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

PedidoLoteSchema.index({ numeroPedido: 1 }, { unique: true });

module.exports = mongoose.model('PedidoLote', PedidoLoteSchema);
