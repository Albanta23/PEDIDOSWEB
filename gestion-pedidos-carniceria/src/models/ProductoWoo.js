const mongoose = require('mongoose');

const ProductoWooSchema = new mongoose.Schema({
  sku: String,
  descripcion: String,
  descripcionCorta: String,
  categorias: [mongoose.Schema.Types.Mixed],
  imagenes: [mongoose.Schema.Types.Mixed],
  tags: [mongoose.Schema.Types.Mixed],
  stock_status: String,
  meta_data: [mongoose.Schema.Types.Mixed],
  dimensiones: mongoose.Schema.Types.Mixed,
  price_html: String,
  related_ids: [Number],
  brands: [mongoose.Schema.Types.Mixed],
  translations: mongoose.Schema.Types.Mixed,
  idWoo: { type: Number, unique: true },
  nombre: String,
  tipo: String,
  precio: Number,
  peso: Number,
  atributos: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('ProductoWoo', ProductoWooSchema);
