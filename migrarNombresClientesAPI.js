/**
 * Script para migrar nombres de clientes SAGE50 a formato con apellidos separados
 * Versión que funciona con el backend en desarrollo via API REST
 */

const API_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';

// Funciones utilitarias
const separarNombreCompleto = (nombreCompleto) => {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  }
  
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 1) {
    return {
      nombre: partes[0],
      primerApellido: '',
      segundoApellido: ''
    };
  } else if (partes.length === 2) {
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: ''
    };
  } else if (partes.length >= 3) {
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: partes.slice(2).join(' ')
    };
  }
  
  return { nombre: '', primerApellido: '', segundoApellido: '' };
};

const esNombreEmpresa = (nombre) => {
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

async function obtenerClientes() {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    throw error;
  }
}

async function actualizarCliente(clienteId, datosActualizados) {
  try {
    const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosActualizados)
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error actualizando cliente ${clienteId}:`, error);
    throw error;
  }
}

async function migrarNombresClientes() {
  try {
    console.log('🚀 Iniciando migración de nombres de clientes via API...');
    console.log(`📡 Conectando a: ${API_URL}`);
    
    // Obtener todos los clientes
    const clientes = await obtenerClientes();
    console.log(`📊 Total de clientes obtenidos: ${clientes.length}`);
    
    // Filtrar clientes que necesitan migración
    const clientesParaMigrar = clientes.filter(cliente => {
      return cliente.nombre && 
             cliente.nombre.trim() &&
             (!cliente.primerApellido && !cliente.segundoApellido) &&
             cliente.nombre.includes(' '); // Contiene espacios, probablemente apellidos
    });
    
    console.log(`📊 Clientes que necesitan migración: ${clientesParaMigrar.length}`);
    
    if (clientesParaMigrar.length === 0) {
      console.log('✅ No hay clientes que requieran migración');
      return;
    }
    
    let migrados = 0;
    let empresas = 0;
    let errores = 0;
    
    // Procesar cada cliente
    for (const cliente of clientesParaMigrar) {
      try {
        const nombreOriginal = cliente.nombre;
        
        // Verificar si es una empresa
        if (esNombreEmpresa(nombreOriginal)) {
          console.log(`🏢 EMPRESA detectada: "${nombreOriginal}" - manteniendo como está`);
          empresas++;
          continue;
        }
        
        // Separar el nombre completo
        const partesNombre = separarNombreCompleto(nombreOriginal);
        
        // Solo actualizar si realmente hay apellidos para extraer
        if (partesNombre.primerApellido || partesNombre.segundoApellido) {
          const datosActualizados = {
            ...cliente,
            nombre: partesNombre.nombre,
            primerApellido: partesNombre.primerApellido,
            segundoApellido: partesNombre.segundoApellido
          };
          
          await actualizarCliente(cliente._id, datosActualizados);
          
          console.log(`✅ MIGRADO: "${nombreOriginal}" → Nombre: "${partesNombre.nombre}", 1º Apellido: "${partesNombre.primerApellido}", 2º Apellido: "${partesNombre.segundoApellido}"`);
          migrados++;
        }
        
      } catch (error) {
        console.error(`❌ Error migrando cliente ${cliente._id}:`, error.message);
        errores++;
      }
    }
    
    console.log('\n📈 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Clientes migrados: ${migrados}`);
    console.log(`🏢 Empresas detectadas (sin cambios): ${empresas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📊 Total procesados: ${clientesParaMigrar.length}`);
    
    // Verificar algunos resultados
    if (migrados > 0) {
      console.log('\n🔍 VERIFICACIÓN - Obteniendo clientes actualizados...');
      const clientesActualizados = await obtenerClientes();
      const clientesMigrados = clientesActualizados.filter(cliente => 
        cliente.primerApellido || cliente.segundoApellido
      ).slice(0, 5);
      
      console.log('Primeros 5 clientes con apellidos separados:');
      clientesMigrados.forEach(cliente => {
        const nombreCompleto = [cliente.nombre, cliente.primerApellido, cliente.segundoApellido]
          .filter(parte => parte && parte.trim())
          .join(' ');
        console.log(`   - ${nombreCompleto} (Código: ${cliente.codigoSage || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  }
}

// Función para verificar el estado de los clientes
async function verificarEstadoClientes() {
  try {
    console.log('🔍 Verificando estado actual de los clientes...');
    
    const clientes = await obtenerClientes();
    console.log(`📊 Total de clientes: ${clientes.length}`);
    
    const conApellidos = clientes.filter(c => c.primerApellido || c.segundoApellido);
    const sinApellidos = clientes.filter(c => c.nombre && (!c.primerApellido && !c.segundoApellido));
    const conEspacios = sinApellidos.filter(c => c.nombre.includes(' '));
    
    console.log(`📊 Clientes con apellidos separados: ${conApellidos.length}`);
    console.log(`📊 Clientes sin apellidos separados: ${sinApellidos.length}`);
    console.log(`📊 Clientes sin apellidos que contienen espacios: ${conEspacios.length}`);
    
    if (conEspacios.length > 0) {
      console.log('\n📋 Ejemplos de clientes que podrían necesitar migración:');
      conEspacios.slice(0, 10).forEach(cliente => {
        console.log(`   - "${cliente.nombre}" (${cliente.codigoSage || 'Sin código'})`);
      });
    }
    
    if (conApellidos.length > 0) {
      console.log('\n📋 Ejemplos de clientes ya migrados:');
      conApellidos.slice(0, 5).forEach(cliente => {
        const nombreCompleto = [cliente.nombre, cliente.primerApellido, cliente.segundoApellido]
          .filter(parte => parte && parte.trim())
          .join(' ');
        console.log(`   - "${nombreCompleto}" (${cliente.codigoSage || 'Sin código'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const accion = args[0];
  
  if (accion === '--verificar') {
    await verificarEstadoClientes();
  } else if (accion === '--migrar' || !accion) {
    await migrarNombresClientes();
  } else {
    console.log('❓ Uso:');
    console.log('  node migrarNombresClientesAPI.js --verificar  (verificar estado actual)');
    console.log('  node migrarNombresClientesAPI.js --migrar    (migrar nombres a apellidos separados)');
  }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined' && require.main === module) {
  main().catch(console.error);
}

// Exportar para uso en browser
if (typeof window !== 'undefined') {
  window.migrarNombresClientes = migrarNombresClientes;
  window.verificarEstadoClientes = verificarEstadoClientes;
}

module.exports = {
  migrarNombresClientes,
  verificarEstadoClientes,
  separarNombreCompleto,
  esNombreEmpresa
};
