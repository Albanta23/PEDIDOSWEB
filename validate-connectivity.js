// Script para validar conectividad frontend-backend
const axios = require('axios');

async function validateConnection() {
  console.log('🔍 Validando conectividad frontend-backend...\n');
  
  const tests = [
    {
      name: 'Backend Health Check',
      url: 'http://localhost:10001/',
      method: 'GET'
    },
    {
      name: 'Frontend Health Check', 
      url: 'http://localhost:3000/',
      method: 'GET'
    },
    {
      name: 'API Mailgun Endpoint',
      url: 'http://localhost:10001/api/enviar-proveedor',
      method: 'POST',
      data: {
        tienda: 'Test',
        fecha: '2025-05-24',
        lineas: [{ referencia: 'test', cantidad: 1 }],
        pdfBase64: 'dGVzdA==' // base64 de "test"
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Probando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000,
        headers: test.data ? { 'Content-Type': 'application/json' } : {}
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      console.log(`   ✅ Status: ${response.status}`);
      if (response.data) {
        if (typeof response.data === 'string') {
          console.log(`   📄 Response: ${response.data.substring(0, 100)}${response.data.length > 100 ? '...' : ''}`);
        } else {
          console.log(`   📦 Response:`, response.data);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📄 Status: ${error.response.status}`);
        console.log(`   📄 Data:`, error.response.data);
      }
    }
    console.log('');
  }
  
  console.log('🎯 Validación completada!');
}

validateConnection();
