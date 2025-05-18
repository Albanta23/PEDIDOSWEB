const mongoose = require('mongoose');

const TransferenciaSchema = new mongoose.Schema({
  origen: { type: String, required: true }, // tienda origen (id o nombre)
  destino: { type: String, required: true }, // tienda destino (id o nombre)
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'enviada', 'recibida', 'cancelada'], default: 'pendiente' },
  productos: [
    {
      producto: { type: String, required: true },
      cantidad: { type: Number, required: true },
      lote: { type: String },
      comentario: { type: String }
    }
  ],
  observaciones: { type: String },
  usuario: { type: String }, // usuario que crea la transferencia
}, { timestamps: true });

module.exports = mongoose.model('Transferencia', TransferenciaSchema);
