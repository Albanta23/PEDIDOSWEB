// Script para migrar movimientos antiguos y añadir el campo 'peso' si no existe
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-pedidos';

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const MovimientoStock = mongoose.connection.collection('movimientostocks');
  const result = await MovimientoStock.updateMany(
    { peso: { $exists: false } },
    { $set: { peso: 0 } }
  );
  console.log(`Movimientos actualizados: ${result.modifiedCount}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
