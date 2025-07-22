// Utilidades para registrar movimientos de stock por pedido de tienda/fábrica
const MovimientoStock = require('../models/MovimientoStock');
const Lote = require('../models/Lote');
const Producto = require('../models/Producto');

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
  console.log('Registrando baja de stock:', { tiendaId, producto, cantidad, unidad, lote, motivo, peso });
  if (!tiendaId || !producto || !cantidad) return;
  await registrarMovimientoStock({
    tiendaId,
    producto,
    cantidad,
    unidad,
    lote,
    motivo: motivo || 'Baja manual',
    tipo: 'baja',
    peso
  });
}

/**
 * Registra un movimiento genérico de stock (entrada, baja, transferencia, devolución, etc)
 * @param {Object} params - { tiendaId, producto, cantidad, unidad, lote, motivo, tipo, fecha, pedidoId, transferenciaId, peso, proveedorId, precioCoste, referenciaDocumento, notasEntrada }
 */
async function registrarMovimientoStock({
  tiendaId, producto, cantidad, unidad, lote, motivo, tipo, fecha,
  pedidoId, transferenciaId, peso, proveedorId, precioCoste, referenciaDocumento, notas
}) {
  console.log('Registrando movimiento de stock:', { tiendaId, producto, cantidad, unidad, lote, motivo, tipo, peso, proveedorId });
  if (!tiendaId || !producto || !cantidad || !tipo) return;

  const movimiento = await MovimientoStock.create({
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
    peso: typeof peso !== 'undefined' ? peso : undefined,
    proveedorId,
    precioCoste,
    referenciaDocumento,
    notas
  });

  if (tipo === 'entrada' && lote) {
    const productoDoc = await Producto.findOne({ nombre: producto });
    if (productoDoc) {
      let loteDoc = await Lote.findOne({ lote: lote, producto: productoDoc._id });
      if (loteDoc) {
        console.log('Lote existente encontrado:', loteDoc);
        loteDoc.cantidadDisponible += cantidad;
        loteDoc.pesoDisponible += peso || 0;
        await loteDoc.save();
        console.log('Lote actualizado:', loteDoc);
      } else {
        loteDoc = await Lote.create({
          lote,
          producto: productoDoc._id,
          proveedorId,
          fechaEntrada: fecha ? new Date(fecha) : new Date(),
          cantidadInicial: cantidad,
          pesoInicial: peso || 0,
          cantidadDisponible: cantidad,
          pesoDisponible: peso || 0,
          referenciaDocumento,
          precioCoste,
          notas
        });
        console.log('Nuevo lote creado:', loteDoc);
      }
    }
  } else if ((tipo === 'baja' || tipo === 'transferencia_salida') && lote) {
    const productoDoc = await Producto.findOne({ nombre: producto });
    if (productoDoc) {
      const loteDoc = await Lote.findOne({ lote: lote, producto: productoDoc._id });
      if (loteDoc) {
        console.log('Lote existente encontrado:', loteDoc);
        loteDoc.cantidadDisponible -= Math.abs(cantidad);
        loteDoc.pesoDisponible -= Math.abs(peso || 0);
        await loteDoc.save();
        console.log('Lote actualizado:', loteDoc);
      }
    }
  }

  return movimiento;
}

module.exports = {
  registrarEntradasStockPorPedido,
  registrarBajaStock,
  registrarMovimientoStock
};
