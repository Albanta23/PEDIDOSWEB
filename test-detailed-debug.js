// Test detallado para debuggear el problema de plantilla y PDF
const axios = require('axios');

async function testDetailedFlow() {
  console.log('🔍 [DEBUG TEST] Prueba detallada del flujo...');
  
  const testData = {
    tienda: 'Tienda Debug',
    tiendaId: 'debug_123',
    fecha: new Date().toLocaleDateString(),
    lineas: [
      { referencia: 'lomo', cantidad: 2, unidad: 'kg' },
      { referencia: 'panceta', cantidad: 1, unidad: 'kg' }
    ],
    forzarTextoPlano: true,
    pdfBase64: 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFRlc3QgUERGKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDAxMTUgMDAwMDAgbgowMDAwMDAwMjA0IDAwMDAwIG4KdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NDUKJSVFT0Y='
  };

  console.log('📨 [DEBUG TEST] Enviando a:', 'http://localhost:10001/api/enviar-proveedor');
  console.log('📋 [DEBUG TEST] Datos de prueba:', {
    tienda: testData.tienda,
    forzarTextoPlano: testData.forzarTextoPlano,
    lineasCount: testData.lineas.length,
    pdfLength: testData.pdfBase64.length
  });

  try {
    const response = await axios.post('http://localhost:10001/api/enviar-proveedor', testData);
    console.log('✅ [DEBUG TEST] Respuesta exitosa:', response.data);
  } catch (error) {
    console.log('❌ [DEBUG TEST] Error:', error.message);
    if (error.response) {
      console.log('❌ [DEBUG TEST] Detalles:', error.response.data);
    }
  }
}

testDetailedFlow();
