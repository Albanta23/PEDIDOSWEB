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
  if (!tiendaId || !producto || !cantidad) return;
  
  console.log(`[STOCK] Registrando baja stock:`, { tiendaId, producto, cantidad, unidad, lote, motivo, peso });
  
  // Para bajas de stock, aseguramos que la cantidad sea negativa pero el peso sea positivo
  // La cantidad negativa indica salida, el peso positivo cumple con la restricción del modelo
  const cantidadAjustada = cantidad <= 0 ? cantidad : -Math.abs(cantidad);
  const pesoAjustado = typeof peso !== 'undefined' ? Math.abs(peso) : undefined;
  
  console.log(`[STOCK] Valores ajustados: cantidad=${cantidadAjustada}, peso=${pesoAjustado}`);
  
  await registrarMovimientoStock({
    tiendaId,
    producto,
    cantidad: cantidadAjustada,
    unidad,
    lote,
    motivo: motivo || 'Baja manual',
    tipo: 'baja',
    peso: pesoAjustado
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
  if (!tiendaId || !producto || !cantidad || !tipo) return;

  // Validaciones adicionales para el campo peso
  let pesoValidado = undefined;
  if (typeof peso !== 'undefined') {
    // Para cualquier tipo de movimiento, el peso en la BD debe ser positivo
    pesoValidado = Math.abs(peso);
    console.log(`[INFO] Registrando movimiento stock. Tipo: ${tipo}, Producto: ${producto}, Peso original: ${peso}, Peso validado: ${pesoValidado}`);
  }

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
    peso: pesoValidado, // Usamos el peso validado (positivo)
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
        loteDoc.cantidadDisponible += cantidad;
        loteDoc.pesoDisponible += peso || 0;
        await loteDoc.save();
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
      }
    }
  } else if ((tipo === 'baja' || tipo === 'transferencia_salida') && lote) {
    const productoDoc = await Producto.findOne({ nombre: producto });
    if (productoDoc) {
      const loteDoc = await Lote.findOne({ lote: lote, producto: productoDoc._id });
      if (loteDoc) {
        console.log(`[LOTES] Actualizando lote ${lote} para producto ${producto}:`);
        console.log(`  - Cantidad antes: ${loteDoc.cantidadDisponible}, Peso antes: ${loteDoc.pesoDisponible}`);
        console.log(`  - Cantidad movimiento: ${cantidad}, Peso movimiento: ${pesoValidado || 0}`);
        
        // Para bajas y transferencias, la cantidad siempre debe ser negativa
        // Si por alguna razón viene positiva, convertirla
        const cantidadAjuste = cantidad <= 0 ? cantidad : -Math.abs(cantidad);
        
        // Actualizamos la cantidad disponible
        loteDoc.cantidadDisponible += cantidadAjuste;
        
        // Si hay peso, siempre lo restamos del disponible
        if (typeof pesoValidado !== 'undefined' && pesoValidado > 0) {
          loteDoc.pesoDisponible -= pesoValidado;
        }
        
        // Nos aseguramos de que nunca queden valores negativos, ya que eso haría que
        // el lote desaparezca del selector
        if (loteDoc.cantidadDisponible < 0) loteDoc.cantidadDisponible = 0;
        if (loteDoc.pesoDisponible < 0) loteDoc.pesoDisponible = 0;
        
        console.log(`  - Cantidad después: ${loteDoc.cantidadDisponible}, Peso después: ${loteDoc.pesoDisponible}`);
        await loteDoc.save();
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
