// Script para migrar movimientos antiguos de traspasos y devoluciones para añadir tiendaDestino y transferenciaId
// Ejecutar: node migrar_movimientos_traspasos.js

const mongoose = require('mongoose');
const MovimientoStock = require('./src/models/MovimientoStock');
const Transferencia = require('./src/models/Transferencia');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/pedidos';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Buscar todos los movimientos de traspaso y devolucion sin tiendaDestino
  const movimientos = await MovimientoStock.find({
    tipo: { $in: ['transferencia_entrada', 'transferencia_salida', 'devolucion_entrada', 'devolucion_salida'] },
    $or: [ { tiendaDestino: { $exists: false } }, { tiendaDestino: null } ]
  });
  let actualizados = 0;
  for (const mov of movimientos) {
    if (!mov.transferenciaId) continue;
    const transferencia = await Transferencia.findById(mov.transferenciaId);
    if (!transferencia) continue;
    if (['transferencia_salida','devolucion_salida'].includes(mov.tipo)) {
      mov.tiendaDestino = transferencia.destinoId || transferencia.destino;
    } else if (['transferencia_entrada','devolucion_entrada'].includes(mov.tipo)) {
      mov.tiendaDestino = transferencia.origenId || transferencia.origen;
    }
    await mov.save();
    actualizados++;
  }
  console.log(`Movimientos actualizados: ${actualizados}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
