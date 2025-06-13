// Script para forzar la creación de movimientos de stock para el pedido 137
// USO: node migrarMovimientosPedido137.js
// IMPORTANTE: Cambia la cadena de conexión a tu MongoDB remota

const mongoose = require('mongoose');

const MONGO_URI = 'TU_CADENA_DE_CONEXION_MONGODB'; // <-- PON AQUÍ TU URI

const Pedido = require('./gestion-pedidos-carniceria/src/models/Pedido');
const MovimientoStock = require('./gestion-pedidos-carniceria/src/models/MovimientoStock');

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Conectado a MongoDB');

  const pedido = await Pedido.findOne({ numeroPedido: 137 });
  if (!pedido) {
    console.error('No se encontró el pedido 137');
    process.exit(1);
  }
  if (!pedido.tiendaId || !Array.isArray(pedido.lineas)) {
    console.error('Pedido sin tiendaId o sin líneas');
    process.exit(1);
  }

  let creados = 0;
  for (const linea of pedido.lineas) {
    if (!linea.producto || !linea.cantidadEnviada) continue;
    // Comprobar si ya existe el movimiento
    const existe = await MovimientoStock.findOne({
      tiendaId: pedido.tiendaId,
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      pedidoId: pedido._id.toString(),
      tipo: 'entrada',
      motivo: 'Pedido fábrica'
    });
    if (existe) continue;
    await MovimientoStock.create({
      tiendaId: pedido.tiendaId,
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      unidad: linea.formato || 'kg',
      lote: linea.lote || '',
      motivo: 'Pedido fábrica',
      tipo: 'entrada',
      pedidoId: pedido._id.toString(),
      fecha: new Date()
    });
    creados++;
  }
  console.log(`Movimientos creados: ${creados}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
