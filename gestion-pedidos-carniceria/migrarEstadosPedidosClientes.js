// Script de migración para añadir campo 'estado' y 'historialEstados' a pedidos antiguos
const mongoose = require('mongoose');
const PedidoCliente = require('./src/models/PedidoCliente');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pedidos';

async function migrarEstados() {
  await mongoose.connect(MONGO_URI);
  const pedidos = await PedidoCliente.find({ $or: [ { estado: { $exists: false } }, { historialEstados: { $exists: false } } ] });
  console.log(`Pedidos a migrar: ${pedidos.length}`);
  for (const pedido of pedidos) {
    let modificado = false;
    if (!pedido.estado) {
      pedido.estado = 'en_espera';
      modificado = true;
    }
    if (!pedido.historialEstados || !Array.isArray(pedido.historialEstados) || pedido.historialEstados.length === 0) {
      pedido.historialEstados = [{
        estado: pedido.estado || 'en_espera',
        usuario: pedido.usuarioTramitando || 'migracion',
        fecha: pedido.fechaPedido || pedido.fechaCreacion || new Date()
      }];
      modificado = true;
    }
    if (modificado) {
      await pedido.save();
      console.log(`Pedido ${pedido._id} migrado.`);
    }
  }
  await mongoose.disconnect();
  console.log('Migración completada.');
}

migrarEstados().catch(err => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
