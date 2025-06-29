/**
 * Función para formatear la dirección completa del cliente
 * @param {Object} cliente - Objeto cliente con campos de dirección
 * @returns {string} - Dirección completa formateada
 */
export function formatearDireccionCompleta(cliente) {
  if (!cliente) return '-';
  
  const partes = [];
  
  // Agregar calle y número (dirección principal)
  if (cliente.direccion && cliente.direccion.trim()) {
    partes.push(cliente.direccion.trim());
  }
  
  // Agregar código postal y población
  const cpPoblacion = [];
  if (cliente.codigoPostal && cliente.codigoPostal.trim()) {
    cpPoblacion.push(cliente.codigoPostal.trim());
  }
  if (cliente.poblacion && cliente.poblacion.trim()) {
    cpPoblacion.push(cliente.poblacion.trim());
  }
  if (cpPoblacion.length > 0) {
    partes.push(cpPoblacion.join(' '));
  }
  
  // Agregar provincia
  if (cliente.provincia && cliente.provincia.trim()) {
    partes.push(cliente.provincia.trim());
  }
  
  return partes.length > 0 ? partes.join(', ') : '-';
}

/**
 * Función para formatear dirección completa desde un pedido 
 * (que puede tener los campos directamente o dentro de un cliente)
 * @param {Object} pedido - Objeto pedido
 * @returns {string} - Dirección completa formateada
 */
export function formatearDireccionCompletaPedido(pedido) {
  if (!pedido) return '-';
  
  // Si el pedido tiene un objeto cliente completo
  if (pedido.cliente && typeof pedido.cliente === 'object') {
    return formatearDireccionCompleta(pedido.cliente);
  }
  
  // Si el pedido tiene los campos de dirección directamente
  const cliente = {
    direccion: pedido.direccion || pedido.clienteDireccion,
    codigoPostal: pedido.codigoPostal || pedido.clienteCodigoPostal,
    poblacion: pedido.poblacion || pedido.clientePoblacion,
    provincia: pedido.provincia || pedido.clienteProvincia
  };
  
  return formatearDireccionCompleta(cliente);
}
