const mongoose = require('mongoose');

const AvisoSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['pedido', 'traspaso'], required: true },
  referenciaId: { type: String, required: true }, // id de pedido o traspaso
  tiendaId: { type: String, required: true },
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  vistoPor: [{ type: String }] // lista de usuarios/tiendas que han visto el aviso
}, { timestamps: true });

module.exports = mongoose.model('Aviso', AvisoSchema);
