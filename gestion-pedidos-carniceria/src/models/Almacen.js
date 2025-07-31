const mongoose = require('mongoose');

const AlmacenSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  direccion: { type: String },
  telefono: { type: String },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('Almacen', AlmacenSchema);
