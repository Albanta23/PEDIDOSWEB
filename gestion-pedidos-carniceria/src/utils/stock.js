// Utilidades para registrar movimientos de stock por pedido de tienda/fábrica
const MovimientoStock = require('../models/MovimientoStock');

/**
 * Registra movimientos de entrada de stock para cada línea de producto de un pedido
 * y la salida correspondiente en el almacén central
 * @param {Object} pedido - Pedido actualizado (de tienda/fábrica)
 */
async function registrarEntradasStockPorPedido(pedido) {
  if (!pedido || !pedido.tiendaId || !Array.isArray(pedido.lineas)) return;
  let creados = 0;
  for (const linea of pedido.lineas) {
    if (linea.esComentario) continue;
    if (!linea.producto || !linea.cantidadEnviada) continue;
    // Comprobar si ya existe el movimiento para evitar duplicados (entrada en tienda)
    const existe = await MovimientoStock.findOne({
      tiendaId: pedido.tiendaId,
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      pedidoId: pedido._id.toString(),
      tipo: 'entrada',
    });
    if (!existe) {
      await MovimientoStock.create({
        tiendaId: pedido.tiendaId,
        producto: linea.producto,
        cantidad: linea.cantidadEnviada,
        unidad: linea.formato || 'kg',
        lote: linea.lote || '',
        motivo: 'Pedido fábrica',
        tipo: 'entrada',
        pedidoId: pedido._id.toString(),
        fecha: new Date(),
        peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
      });
      creados++;
    }
    // Registrar salida en almacén central
    const existeSalida = await MovimientoStock.findOne({
      tiendaId: 'almacen_central',
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      pedidoId: pedido._id.toString(),
      tipo: 'transferencia_salida',
    });
    if (!existeSalida) {
      await MovimientoStock.create({
        tiendaId: 'almacen_central',
        producto: linea.producto,
        cantidad: linea.cantidadEnviada,
        unidad: linea.formato || 'kg',
        lote: linea.lote || '',
        motivo: `Salida a tienda (${pedido.tiendaId}) por pedido`,
        tipo: 'transferencia_salida',
        pedidoId: pedido._id.toString(),
        fecha: new Date(),
        peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
      });
    }
  }
  return creados;
}

/**
 * Registra un movimiento de baja de stock manual para una tienda
 * @param {Object} params - { tiendaId, producto, cantidad, unidad, lote, motivo, peso }
 */
async function registrarBajaStock({ tiendaId, producto, cantidad, unidad, lote, motivo, peso }) {
  if (!tiendaId || !producto || !cantidad) return;
  await MovimientoStock.create({
    tiendaId,
    producto,
    cantidad,
    unidad: unidad || 'kg',
    lote: lote || '',
    motivo: motivo || 'Baja manual',
    tipo: 'baja',
    fecha: new Date(),
    peso: typeof peso !== 'undefined' ? peso : undefined
  });
}

/**
 * Registra un movimiento genérico de stock (entrada, baja, transferencia, devolución, etc)
 * @param {Object} params - { tiendaId, producto, cantidad, unidad, lote, motivo, tipo, fecha, pedidoId, transferenciaId, peso }
 */
async function registrarMovimientoStock({ tiendaId, producto, cantidad, unidad, lote, motivo, tipo, fecha, pedidoId, transferenciaId, peso }) {
  if (!tiendaId || !producto || !cantidad || !tipo) return;
  await MovimientoStock.create({
    tiendaId,
    producto,
    cantidad,
    unidad: unidad || 'kg',
    lote: lote || '',
    motivo: motivo || '',
    tipo,
    fecha: fecha ? new Date(fecha) : new Date(),
    pedidoId,
    transferenciaId,
    peso: typeof peso !== 'undefined' ? peso : undefined
  });
}

module.exports = {
  registrarEntradasStockPorPedido,
  registrarBajaStock,
  registrarMovimientoStock
};
