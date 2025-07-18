/**
 * Script de prueba específico para la importación de clientes con CORS
 * Verifica si el endpoint /api/clientes/importar está correctamente configurado
 */

const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:10001';
const ENDPOINT = '/api/clientes/importar';

// Colores para consola
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';

// Datos de prueba
const clientesDePrueba = [
  {
    nombre: "Cliente Prueba CORS",
    email: "test-cors@example.com",
    telefono: "666123456",
    nif: "12345678A"
  }
];

// Origen simulado (como si viniera del frontend)
const origenPrueba = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3000.app.github.dev';

async function probarImportacionClientes() {
  console.log(`${MAGENTA}🔍 DIAGNÓSTICO DE IMPORTACIÓN DE CLIENTES${RESET}`);
  console.log(`${MAGENTA}===========================================${RESET}`);
  console.log(`${BLUE}URL:${RESET} ${API_URL}${ENDPOINT}`);
  console.log(`${BLUE}Origen simulado:${RESET} ${origenPrueba}`);
  console.log('');

  // 1. Probar primero con OPTIONS (preflight)
  console.log(`${YELLOW}1. Probando OPTIONS (preflight CORS)...${RESET}`);
  try {
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `${API_URL}${ENDPOINT}`,
      headers: {
        'Origin': origenPrueba,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });

    console.log(`${GREEN}✅ Preflight exitoso: ${optionsResponse.status}${RESET}`);
    console.log('Cabeceras CORS recibidas:');
    console.log(`- Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin'] || 'NO PRESENTE'}`);
    console.log(`- Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods'] || 'NO PRESENTE'}`);
    console.log(`- Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers'] || 'NO PRESENTE'}`);
  } catch (error) {
    console.log(`${RED}❌ Error en preflight: ${error.message}${RESET}`);
    if (error.response) {
      console.log(`Código: ${error.response.status}`);
      console.log('Cabeceras recibidas:', error.response.headers);
    }
  }

  console.log('');

  // 2. Probar POST real
  console.log(`${YELLOW}2. Probando POST a ${ENDPOINT}...${RESET}`);
  try {
    const response = await axios.post(`${API_URL}${ENDPOINT}`, 
      { clientes: clientesDePrueba },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Origin': origenPrueba
        }
      }
    );

    console.log(`${GREEN}✅ POST exitoso: ${response.status}${RESET}`);
    console.log('Respuesta:', response.data);
  } catch (error) {
    console.log(`${RED}❌ Error en POST: ${error.message}${RESET}`);
    
    if (error.response) {
      console.log(`Código: ${error.response.status}`);
      console.log('Datos:', error.response.data);
    }
    
    // Análisis de posibles causas
    if (error.message.includes('CORS') || error.message.includes('Network Error')) {
      console.log(`${YELLOW}\n🔎 ANÁLISIS DE CORS:${RESET}`);
      console.log(`${YELLOW}El error parece estar relacionado con CORS. Posibles causas:${RESET}`);
      console.log('1. El endpoint no tiene configurado el middleware cors()');
      console.log('2. La configuración CORS no permite el origen: ' + origenPrueba);
      console.log('3. La ruta podría estar capturada por otro middleware');
      
      console.log(`${YELLOW}\n💡 SOLUCIONES SUGERIDAS:${RESET}`);
      console.log('1. Asegúrate de que la ruta esté definida EXPLÍCITAMENTE con cors:');
      console.log('   app.post(\'/api/clientes/importar\', cors(), clientesController.importarClientes);');
      console.log('2. Verifica que la función corsOrigin acepte el origen: ' + origenPrueba);
      console.log('3. Si el endpoint está en un controlador, asegúrate de aplicar cors allí también');
    }
  }
}

// Ejecutar prueba
probarImportacionClientes();
