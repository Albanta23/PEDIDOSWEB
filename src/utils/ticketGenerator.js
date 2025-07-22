// Función para generar un ticket de texto plano a partir de los datos de un pedido
export function generarTicket(pedido) {
  let ticket = '';

  // Encabezado
  ticket += '****************************************\n';
  ticket += '*          PEDIDO DE CLIENTE           *\n';
  ticket += '****************************************\n\n';

  // Datos del cliente
  ticket += `Pedido Nº: ${pedido.numeroPedido || pedido.id}\n`;
  ticket += `Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()}\n\n`;
  ticket += `Cliente: ${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || '-'}\n`;
  ticket += `Dirección: ${pedido.direccion || pedido.direccionEnvio || '-'}\n`;
  if (pedido.codigoPostal || pedido.poblacion || pedido.provincia) {
    ticket += `         ${pedido.codigoPostal || ''} ${pedido.poblacion || ''} (${pedido.provincia || ''})\n`;
  }
  ticket += '\n';

  // Líneas de pedido
  ticket += '----------------------------------------\n';
  ticket += 'Producto          Cant.   Peso(kg)  Lote\n';
  ticket += '----------------------------------------\n';

  if (pedido.lineas && Array.isArray(pedido.lineas)) {
    pedido.lineas.forEach(linea => {
      if (linea.esComentario) {
        ticket += `\n* ${linea.comentario}\n\n`;
      } else {
        const producto = (linea.producto || '').padEnd(18, ' ').substring(0, 18);
        const cantidad = String(linea.cantidad || '').padStart(5, ' ');
        const peso = String(linea.peso || '').padStart(8, ' ');
        const lote = String(linea.lote || '').padEnd(8, ' ').substring(0, 8);
        ticket += `${producto} ${cantidad} ${peso} ${lote}\n`;
      }
    });
  }

  ticket += '----------------------------------------\n\n';

  // Notas del cliente
  if (pedido.notasCliente) {
    ticket += 'Notas del cliente:\n';
    ticket += `${pedido.notasCliente}\n\n`;
  }

  // Pie de página
  ticket += '****************************************\n';
  ticket += '*       GRACIAS POR SU CONFIANZA       *\n';
  ticket += '****************************************\n';

  return ticket;
}
