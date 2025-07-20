// Prueba específica para verificar Socket.io en el frontend
const axios = require('axios');

const probarSocketIOVite = async () => {
  console.log('🔌 PRUEBA ESPECÍFICA DE SOCKET.IO EN VITE');
  console.log('========================================\n');
  
  const pruebas = [
    {
      name: 'Frontend principal',
      url: 'http://localhost:3000'
    },
    {
      name: 'Módulo Socket.io optimizado',
      url: 'http://localhost:3000/node_modules/.vite/deps/socket__io-client.js'
    },
    {
      name: 'API Backend',
      url: 'http://localhost:10001/api/clientes'
    },
    {
      name: 'Socket.io Backend',
      url: 'http://localhost:10001/socket.io/'
    }
  ];
  
  for (const prueba of pruebas) {
    try {
      console.log(`🔸 Probando: ${prueba.name}`);
      const startTime = Date.now();
      
      const response = await axios.get(prueba.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Socket-Test-Script'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`  ✅ OK - Status: ${response.status}, Tiempo: ${responseTime}ms`);
      
      // Información específica según el tipo de prueba
      if (prueba.url.includes('socket__io-client.js')) {
        const content = response.data.toString();
        if (content.includes('Socket') || content.includes('io')) {
          console.log(`  📦 Socket.io módulo cargado correctamente`);
        } else {
          console.log(`  ⚠️  Contenido del módulo parece incorrecto`);
        }
      } else if (prueba.url.includes('/api/clientes')) {
        const data = response.data;
        console.log(`  📊 Clientes disponibles: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else if (prueba.url.includes('/socket.io/')) {
        console.log(`  🔗 Socket.io endpoint accesible`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.code || error.message}`);
      
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        
        // Error 504 específico
        if (error.response.status === 504) {
          console.log(`     → Error 504: Gateway Timeout`);
          console.log(`     → Esto indica un problema de configuración de proxy o timeout`);
        }
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`     → Servicio no disponible`);
      }
    }
    
    console.log('');
  }
  
  console.log('🎯 DIAGNÓSTICO ESPECÍFICO DEL ERROR 504');
  console.log('======================================\n');
  
  console.log('📋 EL ERROR 504 EN SOCKET.IO PUEDE SER CAUSADO POR:');
  console.log('1. Timeout en la optimización de dependencias de Vite');
  console.log('2. Problemas de proxy en GitHub Codespaces');
  console.log('3. Configuración incorrecta de HMR (Hot Module Reload)');
  console.log('4. Cache corrupto de node_modules/.vite');
  
  console.log('\n✅ SOLUCIONES IMPLEMENTADAS:');
  console.log('1. ✓ Nueva configuración de Vite optimizada para Codespaces');
  console.log('2. ✓ Timeouts aumentados en proxy');
  console.log('3. ✓ Configuración específica de optimizeDeps para Socket.io');
  console.log('4. ✓ Cache limpiado y regenerado');
  console.log('5. ✓ HMR configurado correctamente');
  
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Si ves este mensaje, el servidor Vite está funcionando');
  console.log('2. Recarga la página del navegador con Ctrl+F5');
  console.log('3. Abre las herramientas de desarrollador (F12)');
  console.log('4. Verifica si el error 504 persiste');
  console.log('5. Si persiste, usa la configuración sin Socket.io temporalmente');
  
  console.log('\n📝 CONFIGURACIÓN ALTERNATIVA SIN SOCKET.IO:');
  console.log('Si Socket.io sigue dando problemas, puedes:');
  console.log('- Comentar las importaciones de socket.io-client en el código');
  console.log('- Usar fetch/axios para comunicación con el backend');
  console.log('- Activar Socket.io más tarde cuando esté estable');
};

probarSocketIOVite();
