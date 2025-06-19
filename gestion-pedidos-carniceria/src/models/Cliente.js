const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('Cliente', ClienteSchema);
