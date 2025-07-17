const mongoose = require('mongoose');

const ProductoWooSchema = new mongoose.Schema({
  idWoo: { type: Number, unique: true },
  nombre: String,
  tipo: String,
  precio: Number,
  peso: Number,
  atributos: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('ProductoWoo', ProductoWooSchema);
