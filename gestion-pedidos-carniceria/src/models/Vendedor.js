const mongoose = require('mongoose');

const VendedorSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  email: { type: String },
  telefono: { type: String },
  activo: { type: Boolean, default: true }
}, {
  collection: 'vendedors' // Especifica el nombre correcto de la colección
});

module.exports = mongoose.model('Vendedor', VendedorSchema);
