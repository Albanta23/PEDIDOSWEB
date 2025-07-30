/**
 * Utilidades para manejo de nombres de clientes
 * Soluciona el problema de separación nombre/apellidos tras migración WooCommerce
 */

/**
 * Obtiene el nombre completo de un cliente
 * Maneja tanto clientes de SAGE50 (nombre completo en campo 'nombre')
 * como clientes de WooCommerce (nombre + apellidos separados)
 * 
 * @param {Object} cliente - Objeto cliente
 * @returns {string} - Nombre completo del cliente
 */
export const obtenerNombreCompleto = (cliente) => {
  if (!cliente) return '';
  
  // Si tiene apellidos separados (cliente de WooCommerce), usar formato separado
  if (cliente.primerApellido || cliente.segundoApellido) {
    const partes = [
      cliente.nombre || '',
      cliente.primerApellido || '',
      cliente.segundoApellido || ''
    ].filter(parte => parte && parte.trim());
    
    return partes.join(' ').trim();
  }
  
  // Si no tiene apellidos separados, usar el campo nombre tal como está (SAGE50)
  return cliente.nombre || '';
};

/**
 * Obtiene el nombre para mostrar en la interfaz
 * Alias de obtenerNombreCompleto para mayor claridad
 */
export const obtenerNombreParaMostrar = (cliente) => {
  return obtenerNombreCompleto(cliente);
};

/**
 * Separa un nombre completo en partes (nombre, primer apellido, segundo apellido)
 * Útil para migrar datos de SAGE50 a formato WooCommerce
 * 
 * @param {string} nombreCompleto - Nombre completo a separar
 * @returns {Object} - {nombre, primerApellido, segundoApellido}
 */
export const separarNombreCompleto = (nombreCompleto) => {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  }
  
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 1) {
    // Solo nombre
    return {
      nombre: partes[0],
      primerApellido: '',
      segundoApellido: ''
    };
  } else if (partes.length === 2) {
    // Nombre + primer apellido
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: ''
    };
  } else if (partes.length >= 3) {
    // Nombre + primer apellido + segundo apellido (y posibles partes adicionales)
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: partes.slice(2).join(' ') // Une el resto como segundo apellido
    };
  }
  
  return { nombre: '', primerApellido: '', segundoApellido: '' };
};

/**
 * Verifica si un cliente necesita migración de nombres
 * (tiene nombre pero no apellidos separados)
 */
export const necesitaMigracionNombre = (cliente) => {
  return cliente && 
         cliente.nombre && 
         cliente.nombre.trim() &&
         (!cliente.primerApellido && !cliente.segundoApellido) &&
         cliente.nombre.includes(' '); // Contiene espacios, probablemente apellidos
};

/**
 * Detecta si un nombre parece ser de empresa (razón social)
 * en lugar de persona física
 */
export const esNombreEmpresa = (nombre) => {
  if (!nombre) return false;
  
  const indicadoresEmpresa = [
    'S.L.', 'S.A.', 'SL', 'SA', 'SLU', 'SOCIEDAD', 'EMPRESA', 'COMERCIAL',
    'INDUSTRIAS', 'DISTRIBUCIONES', 'SERVICIOS', 'GRUPO', 'CORPORACION',
    'FUNDACION', 'ASOCIACION', 'COOPERATIVA', 'COOP', 'LTD', 'LIMITED',
    'RESTAURANT', 'BAR', 'HOTEL', 'CAFÉ', 'CAFETERIA', 'PANADERIA',
    'CARNICERIA', 'CHARCUTERIA', 'SUPERMERCADO', 'TIENDA'
  ];
  
  const nombreUpper = nombre.toUpperCase();
  return indicadoresEmpresa.some(indicador => nombreUpper.includes(indicador));
};

export default {
  obtenerNombreCompleto,
  obtenerNombreParaMostrar,
  separarNombreCompleto,
  necesitaMigracionNombre,
  esNombreEmpresa
};
