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

/**
 * Función para obtener la dirección de envío correcta
 * Prioriza la dirección de envío si es diferente a la de facturación
 * @param {Object} pedido - Objeto pedido
 * @returns {Object} - Información de dirección de envío
 */
export function obtenerDireccionEnvio(pedido) {
  if (!pedido) return null;
  
  // Si hay datos específicos de envío de WooCommerce y son diferentes
  if (pedido.datosEnvioWoo && pedido.datosEnvioWoo.esEnvioAlternativo) {
    return {
      tipo: 'envio_alternativo',
      nombre: pedido.datosEnvioWoo.nombre,
      empresa: pedido.datosEnvioWoo.empresa,
      direccionCompleta: `${pedido.datosEnvioWoo.direccion1}${pedido.datosEnvioWoo.direccion2 ? ', ' + pedido.datosEnvioWoo.direccion2 : ''}`,
      codigoPostal: pedido.datosEnvioWoo.codigoPostal,
      ciudad: pedido.datosEnvioWoo.ciudad,
      provincia: pedido.datosEnvioWoo.provincia,
      telefono: pedido.datosEnvioWoo.telefono,
      pais: pedido.datosEnvioWoo.pais || 'ES'
    };
  }
  
  // Usar dirección de facturación (comportamiento normal)
  return {
    tipo: 'facturacion',
    nombre: pedido.clienteNombre,
    empresa: '',
    direccionCompleta: pedido.direccion,
    codigoPostal: pedido.codigoPostal,
    ciudad: pedido.poblacion,
    provincia: pedido.provincia,
    telefono: pedido.telefono,
    pais: pedido.pais || 'ES'
  };
}

/**
 * Función para formatear información de forma de pago
 * @param {Object} formaPago - Objeto con datos de forma de pago
 * @returns {string} - Forma de pago formateada
 */
export function formatearFormaPago(formaPago) {
  if (!formaPago) return 'No especificada';
  
  if (typeof formaPago === 'string') {
    return formaPago;
  }
  
  if (typeof formaPago === 'object') {
    // Si tiene estructura de WooCommerce
    if (formaPago.titulo && formaPago.codigo) {
      return `${formaPago.titulo} (${formaPago.codigo})`;
    }
    
    // Si solo tiene título
    if (formaPago.titulo) {
      return formaPago.titulo;
    }
    
    // Si solo tiene método
    if (formaPago.metodo) {
      return formaPago.metodo;
    }
  }
  
  return 'No especificada';
}

/**
 * Función para obtener el código de forma de pago para SAGE50
 * @param {Object} formaPago - Objeto con datos de forma de pago
 * @returns {string} - Código para SAGE50
 */
export function obtenerCodigoFormaPago(formaPago) {
  if (!formaPago) return '99';
  
  if (typeof formaPago === 'object' && formaPago.codigo) {
    return formaPago.codigo;
  }
  
  return '99'; // Código por defecto para "Otro"
}
