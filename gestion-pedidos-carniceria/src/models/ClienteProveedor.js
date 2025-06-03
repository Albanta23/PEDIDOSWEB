// Modelo para clientes y proveedores importados desde Excel
const mongoose = require('mongoose');

const ClienteProveedorSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: String,
  razonComercial: String,
  nif: String,
  email: String,
  telefono: String,
  direccion: String,
  cpostal: String,
  poblacion: String,
  provincia: String,
  contacto: String,
  mensajeVentas: String,
  bloqueadoVentas: { type: Boolean, default: false },
  observaciones: String,
  tipo: { type: String, enum: ['cliente', 'proveedor'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('ClienteProveedor', ClienteProveedorSchema);
