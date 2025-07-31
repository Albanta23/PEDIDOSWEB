const mongoose = require('mongoose');

const FormaPagoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('FormaPago', FormaPagoSchema);
