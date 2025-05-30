// Test adicional: verificar que funciona tanto con texto plano como con HTML

const axios = require('axios');

async function testBothFormats() {
  console.log('🧪 [TEST] Probando ambos formatos: HTML y texto plano...');
  
  const baseData = {
    tienda: 'Tienda Test',
    tiendaId: 'test_123',
    fecha: new Date().toLocaleDateString(),
    lineas: [
      { referencia: 'lomo', cantidad: 2, unidad: 'kg' },
      { referencia: 'panceta', cantidad: 1, unidad: 'kg' }
    ],
    pdfBase64: 'dGVzdCBwZGYgY29udGVudA=='
  };

  // Test 1: Con formato HTML (forzarTextoPlano: false)
  console.log('\n📧 [TEST 1] Probando con formato HTML...');
  try {
    const htmlResponse = await axios.post('http://localhost:10001/api/enviar-proveedor', {
      ...baseData,
      forzarTextoPlano: false
    });
    console.log('✅ [TEST 1] HTML - Exitoso:', htmlResponse.data.message);
  } catch (error) {
    console.log('❌ [TEST 1] HTML - Error:', error.message);
  }

  // Esperar un poco antes del siguiente test
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Con formato texto plano (forzarTextoPlano: true)
  console.log('\n📝 [TEST 2] Probando con formato texto plano...');
  try {
    const textResponse = await axios.post('http://localhost:10001/api/enviar-proveedor', {
      ...baseData,
      forzarTextoPlano: true
    });
    console.log('✅ [TEST 2] Texto plano - Exitoso:', textResponse.data.message);
  } catch (error) {
    console.log('❌ [TEST 2] Texto plano - Error:', error.message);
  }

  console.log('\n🎯 [TEST] Ambas pruebas completadas. Verificar logs del servidor para detalles.');
}

testBothFormats();
