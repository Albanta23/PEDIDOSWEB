/**
 * Función auxiliar para obtener la dirección de envío correcta
 * Si hay datos de envío específicos de WooCommerce y son diferentes, los usa
 * Sino, usa los datos de facturación por defecto
 */
export function obtenerDireccionEnvio(pedido) {
  // Si hay datos de envío específicos de WooCommerce y son diferentes a la facturación
  if (pedido.datosEnvioWoo && pedido.datosEnvioWoo.esEnvioAlternativo) {
    const envio = pedido.datosEnvioWoo;
    return {
      nombre: envio.nombre || `${pedido.clienteNombre}`,
      direccionCompleta: `${envio.direccion1}${envio.direccion2 ? ', ' + envio.direccion2 : ''}`,
      codigoPostal: envio.codigoPostal,
      poblacion: envio.ciudad,
      provincia: envio.provincia,
      telefono: envio.telefono || pedido.telefono,
      esEnvioAlternativo: true,
      empresa: envio.empresa || ''
    };
  }
  
  // Usar datos de facturación por defecto
  return {
    nombre: pedido.clienteNombre,
    direccionCompleta: pedido.direccion,
    codigoPostal: pedido.codigoPostal,
    poblacion: pedido.poblacion,
    provincia: pedido.provincia,
    telefono: pedido.telefono,
    esEnvioAlternativo: false,
    empresa: ''
  };
}

/**
 * Función para formatear el nombre del destinatario incluyendo empresa si la hay
 */
export function formatearNombreDestinatario(datosEnvio) {
  let nombre = datosEnvio.nombre;
  
  if (datosEnvio.empresa) {
    nombre = `${datosEnvio.empresa}\n${nombre}`;
  }
  
  return nombre;
}
