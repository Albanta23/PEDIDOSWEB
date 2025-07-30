/**
 * Script simple para migrar nombres de clientes via API
 * Soluciona el problema de pérdida de apellidos tras implementación WooCommerce
 */

const axios = require('axios');

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

const migrarNombresViaAPI = async () => {
  try {
    console.log('🚀 Iniciando migración de nombres de clientes via API...');
    
    const API_URL = 'http://localhost:3001/api';
    
    // Obtener todos los clientes
    console.log('📥 Obteniendo lista de clientes...');
    const response = await axios.get(`${API_URL}/clientes`);
    const clientes = response.data;
    
    console.log(`📊 Encontrados ${clientes.length} clientes totales`);
    
    // Filtrar clientes que necesitan migración
    const clientesParaMigrar = clientes.filter(cliente => {
      return cliente.nombre && 
             cliente.nombre.trim() && 
             cliente.nombre.includes(' ') && // Contiene espacios
             (!cliente.primerApellido && !cliente.segundoApellido); // No tiene apellidos separados
    });
    
    console.log(`📊 Encontrados ${clientesParaMigrar.length} clientes para migrar`);
    
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
          // Actualizar vía API
          await axios.put(`${API_URL}/clientes/${cliente._id}`, {
            ...cliente,
            nombre: partesNombre.nombre,
            primerApellido: partesNombre.primerApellido,
            segundoApellido: partesNombre.segundoApellido
          });
          
          console.log(`✅ MIGRADO: "${nombreOriginal}" → Nombre: "${partesNombre.nombre}", 1º Apellido: "${partesNombre.primerApellido}", 2º Apellido: "${partesNombre.segundoApellido}"`);
          migrados++;
        }
        
        // Pausa pequeña para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 50));
        
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
    console.log('\n🔍 VERIFICACIÓN - Algunos clientes migrados:');
    const clientesVerificacion = await axios.get(`${API_URL}/clientes?limit=5`);
    const clientesMigrados = clientesVerificacion.data.filter(cliente => 
      cliente.primerApellido || cliente.segundoApellido
    );
    
    clientesMigrados.forEach(cliente => {
      const nombreCompleto = [cliente.nombre, cliente.primerApellido, cliente.segundoApellido]
        .filter(parte => parte && parte.trim())
        .join(' ');
      console.log(`   - ${nombreCompleto} (Código: ${cliente.codigoSage || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Asegúrate de que el servidor backend esté ejecutándose en http://localhost:3001');
    }
  }
};

// Función principal
const main = async () => {
  const accion = process.argv[2];
  
  if (accion === '--migrar' || !accion) {
    await migrarNombresViaAPI();
  } else {
    console.log('❓ Uso:');
    console.log('  node migrarNombresViaAPI.js --migrar   (migrar nombres a apellidos separados)');
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrarNombresViaAPI,
  separarNombreCompleto,
  esNombreEmpresa
};
