const mongoose = require('mongoose');

const TransferenciaSchema = new mongoose.Schema({
  origen: { type: String, required: true }, // tienda origen (nombre)
  origenId: { type: String }, // id real de la tienda origen
  destino: { type: String, required: true }, // tienda destino (nombre)
  destinoId: { type: String }, // id real de la tienda destino
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'enviada', 'recibida', 'cancelada'], default: 'pendiente' },
  productos: [
    {
      producto: { type: String, required: true },
      cantidad: { type: Number, required: true },
      lote: { type: String },
      comentario: { type: String },
      peso: { type: Number, min: 0 } // <-- Añadido campo peso
    }
  ],
  observaciones: { type: String },
  usuario: { type: String }, // usuario que crea la transferencia
}, { timestamps: true });

module.exports = mongoose.model('Transferencia', TransferenciaSchema);
