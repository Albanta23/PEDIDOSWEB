const MovimientoStock = require('./models/MovimientoStock'); // Ensure this path is correct

const registrarEntradasStockPorPedido = async (pedido) => {
  if (!pedido || !pedido.tiendaId || !Array.isArray(pedido.lineas)) {
    console.log('[DEBUG] Pedido inválido para registrar movimientos de stock');
    return;
  }
  let movimientosCreados = 0;
  for (const [idx, linea] of pedido.lineas.entries()) {
    if (!linea.producto || !linea.cantidadEnviada) {
      console.log(`[DEBUG] Línea ${idx} omitida: producto=${linea.producto}, cantidadEnviada=${linea.cantidadEnviada}`);
      continue;
    }
    // Log de depuración para ver el peso que se va a guardar
    console.log(`[DEBUG] MovimientoStock: producto=${linea.producto}, cantidadEnviada=${linea.cantidadEnviada}, peso=${linea.peso}, linea=`, JSON.stringify(linea));
    await MovimientoStock.create({
      tiendaId: pedido.tiendaId,
      producto: linea.producto,
      cantidad: linea.cantidadEnviada,
      unidad: linea.formato || 'kg',
      lote: linea.lote || '',
      motivo: 'Pedido fábrica',
      tipo: 'entrada',
      pedidoId: pedido._id?.toString() || pedido.id?.toString() || '',
      fecha: new Date(),
      peso: linea.peso ?? null // Copiar el peso si existe
    });
    movimientosCreados++;
    console.log(`[DEBUG] Movimiento de stock creado para producto=${linea.producto}, cantidad=${linea.cantidadEnviada}`);
  }
  console.log(`[DEBUG] Total movimientos de stock creados: ${movimientosCreados}`);
};

module.exports = {
  registrarEntradasStockPorPedido,
};
