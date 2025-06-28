// Script para migrar y crear movimientos de salida en el almacén central para todos los pedidos históricos enviados a tiendas
// Ejecutar con: node migrarMovimientosSalidasCentral.js

const mongoose = require('mongoose');
const Pedido = require('./src/models/Pedido');
const MovimientoStock = require('./src/models/MovimientoStock');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pedidos_db_local';
const ALMACEN_CENTRAL_ID = 'almacen_central';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Buscar todos los pedidos enviados a tienda (estado enviadoTienda) que tengan lineas
  const pedidos = await Pedido.find({ estado: 'enviadoTienda', lineas: { $exists: true, $ne: [] } });
  let creados = 0, yaExistentes = 0;
  for (const pedido of pedidos) {
    for (const linea of pedido.lineas) {
      if (!linea.producto || !linea.cantidadEnviada) continue;
      // Comprobar si ya existe el movimiento de salida en el almacén central
      const existe = await MovimientoStock.findOne({
        tiendaId: ALMACEN_CENTRAL_ID,
        producto: linea.producto,
        cantidad: linea.cantidadEnviada,
        pedidoId: pedido._id.toString(),
        tipo: 'transferencia_salida',
      });
      if (existe) { yaExistentes++; continue; }
      await MovimientoStock.create({
        tiendaId: ALMACEN_CENTRAL_ID,
        producto: linea.producto,
        cantidad: linea.cantidadEnviada,
        unidad: linea.formato || 'kg',
        lote: linea.lote || '',
        motivo: 'Salida a tienda por pedido',
        tipo: 'transferencia_salida',
        pedidoId: pedido._id.toString(),
        fecha: pedido.fechaEnvio || pedido.updatedAt || new Date(),
        peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
      });
      creados++;
    }
  }
  console.log(`Movimientos de salida creados: ${creados}, ya existentes: ${yaExistentes}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
