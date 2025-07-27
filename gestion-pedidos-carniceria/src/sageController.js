const PedidoCliente = require('./models/PedidoCliente');
const { Parser } = require('json2csv');

/**
 * Exporta pedidos de clientes en un formato compatible con Sage 50.
 * Por ahora, devuelve los pedidos en JSON. La lógica de conversión
 * a CSV u otro formato de Sage 50 se debe implementar aquí.
 */
const exportarPedidos = async (req, res) => {
  try {
    console.log('[SAGE] Iniciando exportación de pedidos de clientes para Sage 50.');

    // TODO: Aplicar filtros si son necesarios (ej. por fecha, estado)
    // const { fechaInicio, fechaFin } = req.query;
    const filtro = {
      // Ejemplo: filtrar solo pedidos listos para facturar
      // estado: 'preparado'
    };

    const pedidos = await PedidoCliente.find(filtro)
      .populate('clienteId') // Opcional: si se necesitan datos completos del cliente
      .lean();

    console.log(`[SAGE] Encontrados ${pedidos.length} pedidos para exportar.`);

    // 1. Aplanar los datos: cada línea de pedido se convierte en una fila
    const datosAplanados = [];
    pedidos.forEach(pedido => {
      const datosBasePedido = {
        numeroPedido: pedido.numeroPedido,
        fechaPedido: pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString('es-ES') : '',
        codigoCliente: pedido.clienteId?.codigoSage || pedido.codigoCliente || '',
        nombreCliente: pedido.clienteNombre,
        nifCliente: pedido.nif,
        totalPedido: pedido.total,
        estado: pedido.estado,
        origen: pedido.origen?.tipo || 'manual'
      };

      if (pedido.lineas && pedido.lineas.length > 0) {
        pedido.lineas.forEach(linea => {
          if (!linea.esComentario) {
            datosAplanados.push({
              ...datosBasePedido,
              codigoProducto: linea.codigoSage || '',
              producto: linea.producto,
              cantidad: linea.cantidadEnviada || linea.cantidad,
              peso: linea.peso,
              precio: linea.precio,
              iva: linea.iva,
              subtotalLinea: ((linea.cantidadEnviada || linea.cantidad) || 0) * (linea.precio || 0)
            });
          }
        });
      } else {
        // Opcional: incluir pedidos sin líneas
        datosAplanados.push(datosBasePedido);
      }
    });

    if (datosAplanados.length === 0) {
      return res.status(200).json({ message: "No hay datos de pedidos para exportar." });
    }

    // 2. Definir las columnas del CSV (puedes personalizarlas para Sage 50)
    const camposCsv = ['numeroPedido', 'fechaPedido', 'codigoCliente', 'nombreCliente', 'nifCliente', 'codigoProducto', 'producto', 'cantidad', 'peso', 'precio', 'iva', 'subtotalLinea', 'totalPedido', 'estado', 'origen'];
    const json2csvParser = new Parser({ fields: camposCsv });
    const csv = json2csvParser.parse(datosAplanados);

    // 3. Enviar la respuesta como un archivo CSV descargable
    res.header('Content-Type', 'text/csv');
    res.attachment('exportacion-sage50.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('[SAGE] Error al exportar pedidos para Sage 50:', error);
    res.status(500).json({ error: 'Error interno del servidor al exportar para Sage 50.' });
  }
};

module.exports = {
  exportarPedidos,
};