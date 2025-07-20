// Script de diagnóstico de conectividad frontend-backend
const axios = require('axios');

const diagnositicConnectivity = async () => {
  console.log('🔍 DIAGNÓSTICO DE CONECTIVIDAD FRONTEND-BACKEND');
  console.log('===============================================\n');
  
  const tests = [
    {
      name: 'Backend API Health Check',
      url: 'http://localhost:10001/api/clientes',
      expectedStatus: 200
    },
    {
      name: 'Frontend Port 3000',
      url: 'http://localhost:3000',
      expectedStatus: 200
    },
    {
      name: 'Frontend Port 3100', 
      url: 'http://localhost:3100',
      expectedStatus: 200
    },
    {
      name: 'Frontend Port 5173',
      url: 'http://localhost:5173',
      expectedStatus: 200
    },
    {
      name: 'Frontend Port 5174',
      url: 'http://localhost:5174',
      expectedStatus: 200
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔸 Probando: ${test.name}`);
      const startTime = Date.now();
      
      const response = await axios.get(test.url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Diagnostic-Script'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.status === test.expectedStatus) {
        console.log(`  ✅ OK - Status: ${response.status}, Tiempo: ${responseTime}ms`);
        
        // Si es la API, mostrar más detalles
        if (test.url.includes('/api/clientes')) {
          const data = response.data;
          console.log(`  📊 Clientes en DB: ${Array.isArray(data) ? data.length : 'N/A'}`);
        }
      } else {
        console.log(`  ⚠️  ADVERTENCIA - Status: ${response.status} (esperado ${test.expectedStatus})`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.code || error.message}`);
      
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`     → Servicio no disponible en ${test.url}`);
      } else if (error.code === 'TIMEOUT') {
        console.log(`     → Timeout después de 5 segundos`);
      }
    }
    
    console.log('');
  }
  
  // Diagnóstico adicional de Socket.io
  console.log('🔌 DIAGNÓSTICO DE SOCKET.IO');
  console.log('============================\n');
  
  const socketTests = [
    'http://localhost:3000/socket.io/',
    'http://localhost:3100/socket.io/',
    'http://localhost:5173/socket.io/',
    'http://localhost:5174/socket.io/',
    'http://localhost:10001/socket.io/'
  ];
  
  for (const socketUrl of socketTests) {
    try {
      console.log(`🔸 Probando Socket.io: ${socketUrl}`);
      const response = await axios.get(socketUrl, { timeout: 3000 });
      console.log(`  ✅ Socket.io disponible - Status: ${response.status}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`  ⚠️  Socket.io detectado pero requiere handshake`);
      } else {
        console.log(`  ❌ Socket.io no disponible: ${error.code || error.message}`);
      }
    }
    console.log('');
  }
  
  // Información del entorno
  console.log('🌐 INFORMACIÓN DEL ENTORNO');
  console.log('===========================\n');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  console.log('\n📋 RECOMENDACIONES');
  console.log('==================\n');
  console.log('🔸 Si ves errores 504 en Socket.io:');
  console.log('   → Puede ser un problema de timeout o proxy');
  console.log('   → Verifica que no hay conflictos de puertos');
  
  console.log('\n🔸 Si ves errores de "extension port moved to cache":');
  console.log('   → Es un problema de extensiones del navegador');
  console.log('   → Recarga la página (F5) o cierra/abre las pestañas');
  
  console.log('\n🔸 Si ves errores de "No tab with id":');
  console.log('   → Problema específico de extensiones de Chrome/Edge');
  console.log('   → Deshabilita extensiones temporalmente para diagnosticar');
  
  console.log('\n🔸 Para resolver problemas de Socket.io:');
  console.log('   → Asegúrate de que solo un servidor esté corriendo por puerto');
  console.log('   → Verifica que CORS esté configurado correctamente');
  console.log('   → Usa conexiones HTTP polling como fallback');
};

diagnositicConnectivity();
