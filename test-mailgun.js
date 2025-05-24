// Script de prueba para verificar el funcionamiento de Mailgun
const axios = require('axios');

async function testMailgun() {
  try {
    console.log('🚀 Iniciando prueba de Mailgun...');
    
    // Crear un PDF de prueba en base64 (pequeño)
    const pdfBase64 = 'JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjUwIDc1MiBUZAooUERGIGRlIFBydWViYSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago=';
    
    const testData = {
      tienda: 'Tienda de Prueba',
      fecha: new Date().toISOString().split('T')[0],
      lineas: [
        { codigo: 'TEST001', descripcion: 'Producto de prueba', cantidad: 1, peso: 1000 }
      ],
      pdfBase64: pdfBase64
    };
    
    console.log('📤 Enviando solicitud a:', 'http://localhost:10001/api/enviar-proveedor');
    console.log('📊 Datos:', {
      tienda: testData.tienda,
      fecha: testData.fecha,
      lineasCount: testData.lineas.length,
      pdfSize: testData.pdfBase64.length
    });
    
    const response = await axios.post('http://localhost:10001/api/enviar-proveedor', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Respuesta exitosa:', response.data);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testMailgun();
