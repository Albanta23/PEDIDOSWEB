// Script para verificar el campo 'peso' en las líneas del pedido número 57
const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

const MONGODB_URI = process.env.MONGODB_URI || process.env.mongodb || 'mongodb://localhost:27017/tu_basededatos';

async function main() {
  await mongoose.connect(MONGODB_URI);
  // Buscar el pedido con numeroPedido 57
  const pedido = await Pedido.findOne({ numeroPedido: 57 });
  if (!pedido) {
    console.log('No se encontró el pedido con numeroPedido 57');
    mongoose.disconnect();
    return;
  }
  console.log(`Pedido ${pedido._id} (numeroPedido: 57):`);
  pedido.lineas.forEach((linea, idx) => {
    console.log(`  Línea ${idx}: producto=${linea.producto}, peso=${linea.peso}`);
  });
  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
