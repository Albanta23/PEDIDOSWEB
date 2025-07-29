/**
 * Utilidades para formatear nombres completos con apellidos separados
 */

/**
 * Construye el nombre completo desde campos separados de apellidos
 * @param {object} cliente - Objeto cliente con campos nombre, primerApellido, segundoApellido
 * @param {string} fallbackNombre - Nombre de respaldo si no hay campos separados
 * @returns {string} - Nombre completo formateado
 */
export function formatearNombreCompleto(cliente, fallbackNombre = '') {
  if (!cliente) {
    return fallbackNombre || 'Cliente';
  }

  // Si hay apellidos separados, usar esos
  if (cliente.nombre || cliente.primerApellido || cliente.segundoApellido) {
    const partes = [
      cliente.nombre || '',
      cliente.primerApellido || '',
      cliente.segundoApellido || ''
    ].filter(parte => parte.trim().length > 0);
    
    if (partes.length > 0) {
      return partes.join(' ');
    }
  }

  // Fallback al nombre original o nombre de respaldo
  return cliente.nombre || fallbackNombre || 'Cliente';
}

/**
 * Formatea el nombre del cliente desde un pedido, intentando usar apellidos separados
 * @param {object} pedido - Objeto pedido que puede tener cliente con apellidos
 * @returns {string} - Nombre completo formateado
 */
export function formatearNombreClientePedido(pedido) {
  if (!pedido) {
    return 'Cliente';
  }

  // Intentar usar datos del cliente con apellidos separados
  if (pedido.cliente && typeof pedido.cliente === 'object') {
    const nombreFormateado = formatearNombreCompleto(pedido.cliente, pedido.clienteNombre);
    if (nombreFormateado && nombreFormateado !== 'Cliente') {
      return nombreFormateado;
    }
  }

  // Fallback a campos directos del pedido
  return pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'Cliente';
}

/**
 * Versión para backend - construye nombre completo para SAGE50
 * @param {object} cliente - Objeto cliente con datos de nombre y apellidos
 * @param {string} fallbackNombre - Nombre de respaldo desde pedido
 * @returns {string} - Nombre completo para SAGE50
 */
export function generarNombreCompletoSage(cliente, fallbackNombre = '') {
  if (!cliente) {
    return fallbackNombre || 'Cliente';
  }

  // Construir nombre con apellidos separados si están disponibles
  if (cliente.nombre || cliente.primerApellido || cliente.segundoApellido) {
    const partes = [
      cliente.nombre || '',
      cliente.primerApellido || '',
      cliente.segundoApellido || ''
    ].filter(parte => parte.trim().length > 0);
    
    if (partes.length > 0) {
      return partes.join(' ');
    }
  }

  // Fallback al nombre original
  return cliente.nombre || fallbackNombre;
}
