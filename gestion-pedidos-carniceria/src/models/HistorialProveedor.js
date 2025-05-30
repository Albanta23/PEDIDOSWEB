const mongoose = require('mongoose');

const HistorialProveedorSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true },
  tiendaOriginal: { type: String }, // ID de la tienda que originó el pedido
  proveedor: { type: String, required: true }, // nombre o id del proveedor
  pedido: { type: Object, required: true }, // snapshot del pedido enviado
  fechaEnvio: { type: Date, default: Date.now },
  pdfBase64: { type: String } // PDF del pedido enviado (base64)
});

HistorialProveedorSchema.index({ tiendaId: 1, proveedor: 1, fechaEnvio: -1 });

module.exports = mongoose.model('HistorialProveedor', HistorialProveedorSchema);
