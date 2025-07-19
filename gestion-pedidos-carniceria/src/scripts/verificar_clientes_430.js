// Script para verificar clientes con código SAGE 430... en la colección principal
const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pedidos_db_local';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[OK] Conectado a MongoDB');
    const clientes430 = await Cliente.find({ codigoSage: /^430/ });
    console.log(`Clientes con código SAGE que empieza por 430: ${clientes430.length}`);
    if (clientes430.length > 0) {
      console.log('Ejemplo de clientes encontrados:');
      clientes430.slice(0, 10).forEach(c => {
        console.log(`- ${c.codigoSage} | ${c.nombre}`);
      });
    } else {
      console.log('No se encontraron clientes con código SAGE 430...');
    }
  } catch (err) {
    console.error('[ERROR]', err);
  } finally {
    await mongoose.connection.close();
    console.log('[INFO] Conexión cerrada');
  }
}

main();
