const mongoose = require('mongoose');

// Modelo de receta para fabricación
const RecetaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  productoFinal: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  ingredientes: [
    {
      producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
      cantidad: { type: Number, required: true },
      unidad: { type: String, default: 'kg' }
    }
  ],
  observaciones: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Receta', RecetaSchema);
