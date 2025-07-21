// Modelo de movimiento de stock para almacén de tienda
const mongoose = require('mongoose');

const MovimientoStockSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true },
  producto: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, default: 'kg' },
  lote: { type: String },
  fecha: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['entrada', 'baja', 'transferencia_salida', 'transferencia_entrada', 'devolucion_salida', 'devolucion_entrada'], required: true }, // entrada: pedido recibido, baja: caducidad/deterioro
  motivo: { type: String }, // Ej: "Pedido fábrica", "Caducidad", "Deterioro"
  pedidoId: { type: String }, // Si viene de un pedido
  peso: { type: Number, min: 0 }, // Peso en kg (opcional)
  tiendaDestino: { type: String }, // Para traspasos y devoluciones, almacena el destino
  transferenciaId: { type: String }, // Para enlazar con la transferencia
  // Campos adicionales para entradas de stock
  proveedorId: { type: String }, // Podría ser mongoose.Schema.Types.ObjectId si Proveedor es un modelo referenciado
  precioCoste: { type: Number }, // Precio de coste total de la entrada o por unidad, según se defina
  referenciaDocumento: { type: String }, // Nro de albarán o factura de compra
  notas: { type: String } // Notas específicas de la entrada (anteriormente notasEntrada)
});

module.exports = mongoose.model('MovimientoStock', MovimientoStockSchema);
