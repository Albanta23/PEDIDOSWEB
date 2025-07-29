const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  codigo: { type: String },
  codigoSage: { type: String }, // Código SAGE del cliente (ejemplo: 430007506)
  nombre: { type: String, required: true },
  primerApellido: { type: String }, // Primer apellido extraído de WooCommerce
  segundoApellido: { type: String }, // Segundo apellido extraído de WooCommerce
  razonSocial: { type: String },
  razonComercial: { type: String }, // Nueva campo para Razón comercial
  nif: { type: String },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  codigoPostal: { type: String },
  poblacion: { type: String },
  provincia: { type: String },
  contacto: { type: String },
  mensajeVentas: { type: String },
  bloqueadoVentas: { type: Boolean, default: false },
  observaciones: { type: String },
  activo: { type: Boolean, default: true },
  esCestaNavidad: { type: Boolean, default: false } // Campo para marcar clientes de cestas de navidad
});

module.exports = mongoose.model('Cliente', ClienteSchema);
