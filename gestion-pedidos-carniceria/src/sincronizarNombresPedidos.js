/**
 * Script para actualizar clienteNombre en pedidos existentes usando apellidos separados
 * Sincroniza los nombres de clientes en pedidos con los apellidos migrados
 */

// Cargar variables de entorno
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Cliente = require('./models/Cliente');
const PedidoCliente = require('./models/PedidoCliente');

/**
 * Construye el nombre completo desde campos separados de apellidos
 * @param {object} cliente - Objeto cliente con campos nombre, primerApellido, segundoApellido
 * @param {string} fallbackNombre - Nombre de respaldo si no hay campos separados
 * @returns {string} - Nombre completo formateado
 */
function construirNombreCompleto(cliente, fallbackNombre = '') {
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

  // Fallback al nombre original
  return cliente.nombre || fallbackNombre || 'Cliente';
}

/**
 * Sincroniza los nombres de cliente en pedidos usando apellidos separados
 */
async function sincronizarNombresPedidos() {
  try {
    console.log('[SINCRONIZACIÓN] Iniciando sincronización de nombres en pedidos...');
    
    // Obtener todos los pedidos que tienen clienteId
    const pedidosConClienteId = await PedidoCliente.find({
      clienteId: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`[SINCRONIZACIÓN] Encontrados ${pedidosConClienteId.length} pedidos con clienteId`);

    let pedidosActualizados = 0;
    let pedidosOmitidos = 0;

    for (const pedido of pedidosConClienteId) {
      try {
        // Buscar el cliente por ID
        const cliente = await Cliente.findById(pedido.clienteId);

        if (!cliente) {
          console.log(`[SINCRONIZACIÓN] ⚠️  Pedido ${pedido._id} - cliente ${pedido.clienteId} no encontrado`);
          pedidosOmitidos++;
          continue;
        }

        // Construir nombre completo usando apellidos
        const nombreCompleto = construirNombreCompleto(cliente, pedido.clienteNombre);
        
        // Solo actualizar si hay diferencias significativas
        if (nombreCompleto && nombreCompleto !== pedido.clienteNombre) {
          await PedidoCliente.findByIdAndUpdate(pedido._id, {
            $set: { clienteNombre: nombreCompleto }
          });

          console.log(`[SINCRONIZACIÓN] ✅ Pedido ${pedido._id}:`);
          console.log(`  Cliente: ${cliente.nombre} → ${cliente.primerApellido} ${cliente.segundoApellido}`);
          console.log(`  Antes: "${pedido.clienteNombre}"`);
          console.log(`  Después: "${nombreCompleto}"`);
          
          pedidosActualizados++;
        } else {
          pedidosOmitidos++;
        }
      } catch (error) {
        console.error(`[SINCRONIZACIÓN] Error procesando pedido ${pedido._id}:`, error.message);
        pedidosOmitidos++;
      }
    }

    console.log(`[SINCRONIZACIÓN] ✅ Sincronización completada:`);
    console.log(`  - Pedidos actualizados: ${pedidosActualizados}`);
    console.log(`  - Pedidos omitidos: ${pedidosOmitidos}`);
    console.log(`  - Total procesados: ${pedidosConClienteId.length}`);

  } catch (error) {
    console.error('[SINCRONIZACIÓN] ❌ Error durante la sincronización:', error);
    throw error;
  }
}

/**
 * Función para ejecutar la sincronización desde línea de comandos
 */
async function ejecutarSincronizacion() {
  try {
    // Conectar a MongoDB Atlas usando la configuración del .env
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en el archivo .env');
    }
    
    console.log('[SINCRONIZACIÓN] Conectando a MongoDB Atlas...');
    console.log(`[SINCRONIZACIÓN] URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales en log
    
    await mongoose.connect(mongoUri);
    
    console.log('[SINCRONIZACIÓN] ✅ Conectado exitosamente a MongoDB Atlas');
    
    // Ejecutar sincronización
    await sincronizarNombresPedidos();
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('[SINCRONIZACIÓN] Conexión cerrada');
    
  } catch (error) {
    console.error('[SINCRONIZACIÓN] Error fatal:', error);
    process.exit(1);
  }
}

// Exportar funciones para uso programático
module.exports = {
  sincronizarNombresPedidos,
  construirNombreCompleto
};

// Si se ejecuta directamente desde línea de comandos
if (require.main === module) {
  ejecutarSincronizacion();
}
