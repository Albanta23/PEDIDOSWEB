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
  atributos: mongoose.Schema.Types.Mixed,
  // Nuevos campos estandarizados
  tipoIva: { type: Number, default: 10 }, // Porcentaje de IVA (por defecto 10%)
  formatoEstandar: { type: String, default: 'Unidad' }, // Formato estándar del producto
  pesoUnidad: { type: Number }, // Peso por unidad en gramos
  requierePeso: { type: Boolean, default: false }, // Si el producto requiere especificar peso
  codigoSage: { type: String } // Código del producto en SAGE50
});

module.exports = mongoose.model('ProductoWoo', ProductoWooSchema);
