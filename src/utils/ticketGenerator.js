import { DATOS_EMPRESA } from '../configDatosEmpresa';

export function generarTicket(pedido, bultoNum = 1, totalBultos = 1) {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');
  const { nombre, direccion, telefono, web } = DATOS_EMPRESA;

  let ticket = `
----------------------------------------
      ETIQUETA DE ENVÍO
----------------------------------------
BULTO: ${bultoNum} de ${totalBultos}
Fecha: ${fecha} Hora: ${hora}
Pedido Nº: ${pedido.numeroPedido || pedido.id}
Operario: ${pedido.usuarioTramitando || 'N/A'}
----------------------------------------
REMITENTE:
${nombre}
${direccion}
Tel: ${telefono}
Web: ${web}
----------------------------------------
DESTINATARIO:
${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente}
${pedido.direccion || pedido.direccionEnvio || ''}
${pedido.codigoPostal || ''} ${pedido.poblacion || ''}
Tel: ${pedido.telefono || ''}
----------------------------------------
`;

  if (pedido.notasCliente) {
    ticket += `
OBSERVACIONES:
${pedido.notasCliente}
----------------------------------------
`;
  }

  ticket += `
GRACIAS POR SU PEDIDO
`;

  return ticket;
}
