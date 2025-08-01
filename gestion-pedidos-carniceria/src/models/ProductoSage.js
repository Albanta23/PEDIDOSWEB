const mongoose = require('mongoose');

const ProductoSageSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  codigoSage: { type: String },
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('ProductoSage', ProductoSageSchema);
