const mongoose = require('mongoose');

// Modelo de producto centralizado
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  referencia: { type: String, unique: true },
  unidad: { type: String, default: 'kg' },
  familia: { type: String },
  nombreFamilia: { type: String }, // Nuevo campo para el nombre de la familia
  activo: { type: Boolean, default: true },
  descripcion: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);
