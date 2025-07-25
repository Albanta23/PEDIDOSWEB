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
  esComentario: Boolean,
  precio: Number,
  iva: Number,
  tipoProducto: String, // 'simple' o 'variable'
  variaciones: mongoose.Schema.Types.Mixed,
  idWoo: Number, // ID del producto en WooCommerce
  codigoSage: String // Código del producto en SAGE50
});

const PedidoClienteSchema = new mongoose.Schema({
  datosFacturaWoo: mongoose.Schema.Types.Mixed, // Guardar todos los datos de factura recibidos de WooCommerce
  numeroPedidoWoo: Number, // Número de pedido original de WooCommerce
  clienteId: String,
  clienteNombre: String,
  nif: String,
  direccion: String,
  codigoPostal: String, // Nuevo campo para código postal
  poblacion: String, // Nuevo campo para población
  provincia: String, // Nuevo campo para provincia
  pais: String, // Nuevo campo para país
  email: String, // Nuevo campo para email
  telefono: String, // Nuevo campo para teléfono
  codigoCliente: String, // Código de cliente para SAGE50
  estado: { type: String, default: 'en_espera' },
  numeroPedido: Number,
  lineas: [LineaClienteSchema],
  fechaCreacion: { type: Date, default: Date.now },
  fechaPedido: Date,
  fechaEnvio: Date,
  fechaRecepcion: Date,
  peso: { type: Number, min: 0 },
  tipo: { type: String, default: 'cliente' },
  usuarioTramitando: String,
  historialEstados: [
    {
      estado: String,
      usuario: String,
      fecha: { type: Date, default: Date.now }
    }
  ],
  origen: {
    tipo: String, // 'manual', 'woocommerce'
    id: String
  },
  notasCliente: String,
  subtotal: Number,
  totalIva: Number,
  total: Number,
  clienteExistente: Boolean, // Indica si el cliente ya existía en la BD
  clienteCreado: Boolean, // Indica si se creó un nuevo cliente
  verificadoManualmente: Boolean, // Indica si el usuario verificó manualmente los datos
  yaActualizado: { type: Boolean, default: false }, // Indica si el pedido ya fue sincronizado (para pedidos de WooCommerce)
  esTiendaOnline: { type: Boolean, default: false } // Indica si el pedido proviene de la tienda online
  ,
  bultos: { type: Number, default: null }, // Campo para el número de bultos
  historialBultos: [
    {
      bultos: Number,
      usuario: String,
      fecha: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

PedidoClienteSchema.index({ numeroPedido: 1 }, { unique: true });

module.exports = mongoose.model('PedidoCliente', PedidoClienteSchema);
