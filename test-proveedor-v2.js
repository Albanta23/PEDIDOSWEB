#!/usr/bin/env node

/**
 * Test del nuevo endpoint V2 para envío de pedidos a proveedor
 * Este endpoint debería funcionar correctamente con texto plano y PDF adjunto
 */

const axios = require('axios');

async function testProveedorV2() {
  console.log('🧪 [TEST-V2] Iniciando test del nuevo endpoint /api/enviar-proveedor-v2...\n');

  try {
    // Datos de prueba idénticos a los que sabemos que funcionan
    const testData = {
      tienda: 'Tienda Test V2',
      tiendaId: 'test-v2-001',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2, unidad: 'kg' },
        { referencia: 'panceta', cantidad: 1, unidad: 'kg' },
        { referencia: 'costilla', cantidad: 3, unidad: 'kg' },
        { referencia: 'secreto', cantidad: 500, unidad: 'g' }
      ],
      // PDF válido pequeño en base64
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA0OEIKVGEKMTI4IDcwMCBUZAooVGVzdCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MjEKJSVFT0Y=',
      forzarTextoPlano: true // IMPORTANTE: Probar con texto plano
    };

    console.log('📋 [TEST-V2] Datos de prueba:', {
      tienda: testData.tienda,
      tiendaId: testData.tiendaId,
      fecha: testData.fecha,
      lineasCount: testData.lineas.length,
      forzarTextoPlano: testData.forzarTextoPlano,
      pdfSize: testData.pdfBase64.length
    });

    console.log('\n📤 [TEST-V2] Enviando petición a localhost:10001...');
    
    const response = await axios.post('http://localhost:10001/api/enviar-proveedor-v2', testData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 [TEST-V2] Respuesta recibida:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.ok) {
      console.log('\n✅ [TEST-V2] ¡ÉXITO! El endpoint V2 funciona correctamente');
      console.log('✅ [TEST-V2] Email enviado con texto plano y PDF adjunto');
      
      if (response.data.debug) {
        console.log('🔍 [TEST-V2] Debug info:', response.data.debug);
      }
    } else {
      console.log('\n❌ [TEST-V2] El endpoint devolvió un error');
      console.log('Error:', response.data.error || 'Error desconocido');
    }

  } catch (error) {
    console.log('\n❌ [TEST-V2] Error durante la prueba:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else if (error.request) {
      console.log('Error de red - el servidor no respondió');
      console.log('¿Está el servidor ejecutándose en localhost:10001?');
    } else {
      console.log('Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('[TEST-V2] Test completado');
}

// Test adicional sin PDF para comparar
async function testProveedorV2SinPDF() {
  console.log('\n🧪 [TEST-V2-SIN-PDF] Test sin PDF adjunto...');

  try {
    const testData = {
      tienda: 'Tienda Test V2 Sin PDF',
      tiendaId: 'test-v2-002',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'chorizo', cantidad: 1, unidad: 'kg' }
      ],
      forzarTextoPlano: true
      // Sin pdfBase64
    };

    const response = await axios.post('http://localhost:10001/api/enviar-proveedor-v2', testData);
    
    if (response.status === 200 && response.data.ok) {
      console.log('✅ [TEST-V2-SIN-PDF] Éxito - email enviado sin PDF adjunto');
    } else {
      console.log('❌ [TEST-V2-SIN-PDF] Error:', response.data.error);
    }

  } catch (error) {
    console.log('❌ [TEST-V2-SIN-PDF] Error:', error.message);
  }
}

// Ejecutar tests
async function runAllTests() {
  await testProveedorV2();
  await testProveedorV2SinPDF();
}

runAllTests();
