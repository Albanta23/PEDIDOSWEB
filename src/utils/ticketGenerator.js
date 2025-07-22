// Función para generar un ticket de texto plano a partir de los datos de un pedido
export function generarTicket(pedido) {
  // Ancho fijo para el ticket (40 caracteres para asegurar que no se salga)
  const ANCHO_TICKET = 40;
  let ticket = '';

  // Encabezado
  const lineaAsteriscos = '*'.repeat(ANCHO_TICKET) + '\n';
  ticket += lineaAsteriscos;
  
  // Centramos el título
  const titulo = 'PEDIDO DE CLIENTE';
  const espaciosTitulo = Math.floor((ANCHO_TICKET - titulo.length - 2) / 2);
  ticket += '*' + ' '.repeat(espaciosTitulo) + titulo + ' '.repeat(espaciosTitulo) + '*\n';
  
  ticket += lineaAsteriscos + '\n';

  // Datos del cliente
  ticket += `Pedido Nº: ${pedido.numeroPedido || pedido.id}\n`;
  ticket += `Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()}\n`;
  
  // Truncamos el nombre del cliente si es demasiado largo
  const clienteNombre = pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || '-';
  ticket += `Cliente: ${clienteNombre.substring(0, ANCHO_TICKET - 10)}\n`;
  
  // Dirección con truncamiento para asegurar que no se salga
  const direccion = pedido.direccion || pedido.direccionEnvio || '-';
  if (direccion.length > ANCHO_TICKET - 11) {
    // Si es muy larga, la dividimos en dos líneas
    ticket += `Dirección: ${direccion.substring(0, ANCHO_TICKET - 11)}\n`;
    ticket += `          ${direccion.substring(ANCHO_TICKET - 11, 2 * ANCHO_TICKET - 22)}\n`;
  } else {
    ticket += `Dirección: ${direccion}\n`;
  }
  
  if (pedido.codigoPostal || pedido.poblacion || pedido.provincia) {
    const ubicacion = `${pedido.codigoPostal || ''} ${pedido.poblacion || ''} (${pedido.provincia || ''})`;
    ticket += `          ${ubicacion.substring(0, ANCHO_TICKET - 11)}\n`;
  }
  
  ticket += '\n';

  // Líneas de pedido - ajustamos el ancho
  const lineaSeparadora = '-'.repeat(ANCHO_TICKET) + '\n';
  ticket += lineaSeparadora;
  
  // Cabecera de líneas ajustada al ancho
  ticket += 'Producto      Cant.    Peso(kg) Lote\n';
  ticket += lineaSeparadora;

  if (pedido.lineas && Array.isArray(pedido.lineas)) {
    pedido.lineas.forEach(linea => {
      if (linea.esComentario) {
        const comentario = linea.comentario || '';
        ticket += `\n* ${comentario.substring(0, ANCHO_TICKET - 3)}\n\n`;
      } else {
        // Ajustamos los anchos para asegurar que todo quepa
        const producto = (linea.producto || '').padEnd(14, ' ').substring(0, 14);
        const cantidad = String(linea.cantidad || '').padStart(5, ' ').substring(0, 5);
        const peso = String(linea.peso || '').padStart(10, ' ').substring(0, 10);
        const lote = String(linea.lote || '').padEnd(8, ' ').substring(0, 8);
        ticket += `${producto} ${cantidad} ${peso} ${lote}\n`;
      }
    });
  }

  ticket += lineaSeparadora + '\n';

  // Notas del cliente
  if (pedido.notasCliente) {
    const notasCliente = pedido.notasCliente || '';
    ticket += 'Notas del cliente:\n';
    
    // Dividimos las notas en líneas para asegurar que no se salgan
    let notasRestantes = notasCliente;
    while (notasRestantes.length > 0) {
      ticket += `${notasRestantes.substring(0, ANCHO_TICKET - 1)}\n`;
      notasRestantes = notasRestantes.substring(ANCHO_TICKET - 1);
    }
    ticket += '\n';
  }

  // Pie de página
  ticket += lineaAsteriscos;
  
  // Centramos el mensaje de agradecimiento
  const agradecimiento = 'GRACIAS POR SU CONFIANZA';
  const espaciosAgradecimiento = Math.floor((ANCHO_TICKET - agradecimiento.length - 2) / 2);
  ticket += '*' + ' '.repeat(espaciosAgradecimiento) + agradecimiento + ' '.repeat(espaciosAgradecimiento) + '*\n';
  
  ticket += lineaAsteriscos;

  return ticket;
}
