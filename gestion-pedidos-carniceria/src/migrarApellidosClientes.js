/**
 * Script de migración para separar apellidos en clientes existentes
 * Analiza el campo 'nombre' de los clientes existentes y extrae apellidos cuando es posible
 */

// Cargar variables de entorno
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Cliente = require('./models/Cliente');

/**
 * Función auxiliar para intentar separar nombre y apellidos de un nombre completo
 * @param {string} nombreCompleto - Nombre completo concatenado
 * @returns {object} - Objeto con nombre, primerApellido y segundoApellido separados
 */
function intentarSepararNombreCompleto(nombreCompleto) {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return {
      nombre: '',
      primerApellido: '',
      segundoApellido: ''
    };
  }

  // Dividir el nombre por espacios y filtrar elementos vacíos
  const partes = nombreCompleto.trim().split(/\s+/).filter(parte => parte.length > 0);
  
  if (partes.length === 0) {
    return {
      nombre: '',
      primerApellido: '',
      segundoApellido: ''
    };
  } else if (partes.length === 1) {
    // Solo un elemento - asumimos que es el nombre
    return {
      nombre: partes[0],
      primerApellido: '',
      segundoApellido: ''
    };
  } else if (partes.length === 2) {
    // Dos elementos - nombre y primer apellido
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: ''
    };
  } else if (partes.length === 3) {
    // Tres elementos - nombre, primer apellido y segundo apellido
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: partes[2]
    };
  } else {
    // Más de tres elementos - tomar el primero como nombre y los dos últimos como apellidos
    return {
      nombre: partes[0],
      primerApellido: partes[partes.length - 2],
      segundoApellido: partes[partes.length - 1]
    };
  }
}

/**
 * Ejecuta la migración de apellidos para todos los clientes
 */
async function migrarApellidosClientes() {
  try {
    console.log('[MIGRACIÓN] Iniciando migración de apellidos para clientes existentes...');
    
    // Buscar todos los clientes que no tienen apellidos separados
    const clientesSinApellidos = await Cliente.find({
      $or: [
        { primerApellido: { $exists: false } },
        { segundoApellido: { $exists: false } },
        { primerApellido: '' },
        { segundoApellido: '' }
      ]
    });

    console.log(`[MIGRACIÓN] Encontrados ${clientesSinApellidos.length} clientes para migrar`);

    let clientesActualizados = 0;
    let clientesOmitidos = 0;

    for (const cliente of clientesSinApellidos) {
      if (!cliente.nombre || cliente.nombre.trim() === '') {
        console.log(`[MIGRACIÓN] Omitiendo cliente ${cliente._id} - sin nombre`);
        clientesOmitidos++;
        continue;
      }

      // Separar el nombre completo
      const datosNombre = intentarSepararNombreCompleto(cliente.nombre);
      
      // Solo actualizar si hay cambios significativos
      if (datosNombre.primerApellido || datosNombre.segundoApellido) {
        await Cliente.findByIdAndUpdate(cliente._id, {
          $set: {
            nombre: datosNombre.nombre,
            primerApellido: datosNombre.primerApellido,
            segundoApellido: datosNombre.segundoApellido
          }
        });

        console.log(`[MIGRACIÓN] ✅ Cliente ${cliente._id}:`);
        console.log(`  Antes: "${cliente.nombre}"`);
        console.log(`  Después: "${datosNombre.nombre}" | "${datosNombre.primerApellido}" | "${datosNombre.segundoApellido}"`);
        
        clientesActualizados++;
      } else {
        console.log(`[MIGRACIÓN] ⚠️  Cliente ${cliente._id} - sin apellidos detectables: "${cliente.nombre}"`);
        clientesOmitidos++;
      }
    }

    console.log(`[MIGRACIÓN] ✅ Migración completada:`);
    console.log(`  - Clientes actualizados: ${clientesActualizados}`);
    console.log(`  - Clientes omitidos: ${clientesOmitidos}`);
    console.log(`  - Total procesados: ${clientesSinApellidos.length}`);

  } catch (error) {
    console.error('[MIGRACIÓN] ❌ Error durante la migración:', error);
    throw error;
  }
}

/**
 * Función para ejecutar la migración desde línea de comandos
 */
async function ejecutarMigracion() {
  try {
    // Conectar a MongoDB Atlas usando la configuración del .env
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en el archivo .env');
    }
    
    console.log('[MIGRACIÓN] Conectando a MongoDB Atlas...');
    console.log(`[MIGRACIÓN] URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales en log
    
    await mongoose.connect(mongoUri);
    
    console.log('[MIGRACIÓN] ✅ Conectado exitosamente a MongoDB Atlas');
    
    // Ejecutar migración
    await migrarApellidosClientes();
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('[MIGRACIÓN] Conexión cerrada');
    
  } catch (error) {
    console.error('[MIGRACIÓN] Error fatal:', error);
    process.exit(1);
  }
}

// Exportar funciones para uso programático
module.exports = {
  migrarApellidosClientes,
  intentarSepararNombreCompleto
};

// Si se ejecuta directamente desde línea de comandos
if (require.main === module) {
  ejecutarMigracion();
}
