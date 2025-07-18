/**
 * Script de depuración para verificar la funcionalidad de marcado de cestas navideñas
 * Este script prueba la conexión al endpoint de cestas navideñas y muestra resultados detallados
 */

const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:10001';
const ENDPOINT_MARCAR = '/api/clientes/marcar-cestas-navidad';
const ENDPOINT_ESTADISTICAS = '/api/clientes/estadisticas-cestas';

// Datos de prueba
const clientesDePrueba = [
  {
    nombre: "Cliente Prueba Cestas 1",
    email: "test1@example.com",
    telefono: "666123456",
    nif: "12345678A"
  },
  {
    nombre: "Cliente Prueba Cestas 2",
    email: "test2@example.com",
    telefono: "677987654",
    nif: "87654321B"
  }
];

// Función para probar el marcado de cestas
async function probarMarcadoCestas() {
  console.log('🎄 PRUEBA DE MARCADO DE CESTAS NAVIDEÑAS 🎄');
  console.log('==========================================');
  console.log(`🔍 URL de API: ${API_URL}`);
  console.log(`📌 Endpoint: ${ENDPOINT_MARCAR}`);
  console.log(`📦 Clientes de prueba: ${clientesDePrueba.length}`);
  console.log('------------------------------------------');
  
  try {
    console.log('⏳ Enviando petición...');
    const response = await axios.post(`${API_URL}${ENDPOINT_MARCAR}`, {
      clientesCestasNavidad: clientesDePrueba
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa!');
    console.log('------------------------------------------');
    console.log('📊 Detalles de la respuesta:');
    console.log(`Marcados: ${response.data.marcados}`);
    console.log(`Creados: ${response.data.creados}`);
    console.log(`Errores: ${response.data.errores?.length || 0}`);
    console.log(`Resumen: ${response.data.resumen}`);
    console.log('------------------------------------------');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al realizar la petición:');
    console.error(`Código HTTP: ${error.response?.status || 'N/A'}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.response?.data) {
      console.error('Detalles del error:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('------------------------------------------');
    console.error('🔍 Analizando el error:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('- El servidor parece estar caído o no responde.');
      console.error('- Verifica que el backend esté corriendo en el puerto correcto.');
    } else if (error.response?.status === 401) {
      console.error('- Error de autenticación. Verifica credenciales si son necesarias.');
    } else if (error.response?.status === 403) {
      console.error('- Error de permisos. El servidor rechazó la petición.');
    } else if (error.response?.status === 404) {
      console.error('- La ruta no existe. Verifica que el endpoint sea correcto.');
    } else if (error.response?.status === 400) {
      console.error('- La petición es incorrecta. Verifica el formato de los datos.');
    } else if (error.response?.status === 500) {
      console.error('- Error interno del servidor. Revisa los logs del backend.');
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

// Función para probar las estadísticas
async function probarEstadisticasCestas() {
  console.log('\n\n🎄 PRUEBA DE ESTADÍSTICAS DE CESTAS NAVIDEÑAS 🎄');
  console.log('================================================');
  console.log(`🔍 URL de API: ${API_URL}`);
  console.log(`📌 Endpoint: ${ENDPOINT_ESTADISTICAS}`);
  console.log('------------------------------------------');
  
  try {
    console.log('⏳ Enviando petición...');
    const response = await axios.get(`${API_URL}${ENDPOINT_ESTADISTICAS}`);
    
    console.log('✅ Respuesta exitosa!');
    console.log('------------------------------------------');
    console.log('📊 Estadísticas:');
    console.log(`Total clientes: ${response.data.totalClientes}`);
    console.log(`Clientes de cestas: ${response.data.clientesCestasNavidad}`);
    console.log(`Clientes normales: ${response.data.clientesNormales}`);
    console.log(`Porcentaje de cestas: ${response.data.porcentajeCestas}%`);
    console.log('------------------------------------------');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:');
    console.error(`Código HTTP: ${error.response?.status || 'N/A'}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.response?.data) {
      console.error('Detalles del error:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

// Ejecutar las pruebas
async function ejecutarPruebas() {
  console.log('🔍 INICIANDO PRUEBAS DE CESTAS NAVIDEÑAS');
  console.log('========================================');
  
  // Probar estadísticas primero
  const estadisticas1 = await probarEstadisticasCestas();
  
  // Probar marcado de cestas
  const resultadoMarcado = await probarMarcadoCestas();
  
  // Probar estadísticas después para ver cambios
  const estadisticas2 = await probarEstadisticasCestas();
  
  console.log('\n\n📋 RESUMEN DE PRUEBAS');
  console.log('====================');
  console.log(`Estadísticas iniciales: ${estadisticas1.success ? 'OK' : 'ERROR'}`);
  console.log(`Marcado de cestas: ${resultadoMarcado.success ? 'OK' : 'ERROR'}`);
  console.log(`Estadísticas finales: ${estadisticas2.success ? 'OK' : 'ERROR'}`);
  
  // Comparar estadísticas
  if (estadisticas1.success && estadisticas2.success) {
    const diferencia = estadisticas2.data.clientesCestasNavidad - estadisticas1.data.clientesCestasNavidad;
    console.log(`\nCambio en clientes de cestas: ${diferencia >= 0 ? '+' : ''}${diferencia}`);
  }
}

// Ejecutar el script
ejecutarPruebas();
