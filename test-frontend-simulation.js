// Script que simula exactamente la funcionalidad del frontend
const axios = require('axios');

// Simular la función arrayBufferToBase64 del frontend
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function testFromFrontend() {
  try {
    console.log('🎯 Simulando envío desde frontend...');
    
    // Datos que el frontend enviaría
    const frontendData = {
      tienda: 'Tienda Principal',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2 },
        { referencia: 'panceta', cantidad: 1 },
        { referencia: 'solomillos', cantidad: 3 }
      ],
      pdfBase64: 'JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjUwIDc1MiBUZAooUERGIGRlIFBydWViYSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago='
    };
    
    console.log('📊 Datos que enviará el frontend:', {
      tienda: frontendData.tienda,
      fecha: frontendData.fecha,
      lineasCount: frontendData.lineas.length,
      pdfSize: frontendData.pdfBase64.length,
      lineas: frontendData.lineas
    });
    
    // Usar la URL que usa el frontend
    const apiUrl = 'http://localhost:10001';
    const endpoint = `${apiUrl}/api/enviar-proveedor`;
    
    console.log('📤 Enviando a:', endpoint);
    
    const response = await axios.post(endpoint, frontendData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Respuesta del backend:', response.data);
    console.log('📧 Status:', response.status);
    
  } catch (error) {
    console.error('❌ Error completo:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
  }
}

// Función similar a la de Node.js para btoa
if (typeof btoa === 'undefined') {
  global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

testFromFrontend();
