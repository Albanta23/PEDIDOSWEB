// Script para actualizar el campo 'peso' de la línea 0 del pedido número 57 a 3.7
const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

const MONGODB_URI = process.env.MONGODB_URI || process.env.mongodb || 'mongodb://localhost:27017/tu_basededatos';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const pedido = await Pedido.findOne({ numeroPedido: 57 });
  if (!pedido) {
    console.log('No se encontró el pedido con numeroPedido 57');
    mongoose.disconnect();
    return;
  }
  if (pedido.lineas.length > 0) {
    pedido.lineas[0].peso = 3.7;
    await pedido.save();
    console.log('Actualizado: línea 0 del pedido 57 ahora tiene peso = 3.7');
  } else {
    console.log('El pedido 57 no tiene líneas.');
  }
  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
