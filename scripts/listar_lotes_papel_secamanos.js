// Script para listar los lotes del producto "papel secamanos" y ver sus cantidades y pesos
const mongoose = require('mongoose');

const Lote = require('../gestion-pedidos-carniceria/src/models/Lote');

const PRODUCTO_ID = '68541a883b2283ce1d76e02d'; // Papel secamanos
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/pedidosweb';

async function main() {
  console.log('Conectando a MongoDB con URI:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Conexión exitosa. Buscando lotes...');
  const { Types } = require('mongoose');
  const lotes = await Lote.find({ producto: Types.ObjectId(PRODUCTO_ID) });
  if (lotes.length === 0) {
    console.log('No se encontraron lotes para el producto papel secamanos.');
  } else {
    lotes.forEach(lote => {
      console.log(`Lote: ${lote.lote} | cantidadDisponible: ${lote.cantidadDisponible} | pesoDisponible: ${lote.pesoDisponible} | producto: ${lote.producto}`);
    });
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error al consultar lotes:', err);
  process.exit(1);
});
