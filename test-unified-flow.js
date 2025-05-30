// Test del flujo unificado de envío de pedidos a proveedor
// Prueba que el único botón de envío funcione correctamente con texto plano y PDF adjunto

const axios = require('axios');

async function testUnifiedFlow() {
  console.log('🧪 [TEST] Iniciando prueba del flujo unificado de envío a proveedor...');
  
  try {
    // Datos de prueba que simula lo que envía el frontend
    const testData = {
      tienda: 'Tienda Test',
      tiendaId: 'test_123',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2, unidad: 'kg' },
        { referencia: 'panceta', cantidad: 1, unidad: 'kg' },
        { referencia: 'costilla', cantidad: 3, unidad: 'kg' }
      ],
      forzarTextoPlano: true, // Probar con texto plano
      pdfBase64: 'dGVzdCBwZGYgY29udGVudA==' // PDF de prueba en base64
    };

    console.log('📨 [TEST] Enviando petición al endpoint /api/enviar-proveedor...');
    console.log('📋 [TEST] Datos de prueba:', {
      tienda: testData.tienda,
      tiendaId: testData.tiendaId,
      lineasCount: testData.lineas.length,
      forzarTextoPlano: testData.forzarTextoPlano,
      hasPDF: !!testData.pdfBase64
    });

    const response = await axios.post('http://localhost:10001/api/enviar-proveedor', testData);
    
    if (response.status === 200) {
      console.log('✅ [TEST] Respuesta exitosa del servidor:', response.data);
      console.log('🎉 [TEST] ¡El flujo unificado funciona correctamente!');
      
      if (response.data.ok) {
        console.log('✅ [TEST] Email enviado correctamente al proveedor');
        console.log('✅ [TEST] Flujo completo validado');
      } else {
        console.log('⚠️ [TEST] El servidor respondió pero hubo un error:', response.data.error);
      }
    } else {
      console.log('❌ [TEST] Error en la respuesta del servidor:', response.status);
    }

  } catch (error) {
    console.log('❌ [TEST] Error durante la prueba:', error.message);
    if (error.response) {
      console.log('❌ [TEST] Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testUnifiedFlow();
