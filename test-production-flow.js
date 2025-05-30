#!/usr/bin/env node

/**
 * Test del flujo completo en el servidor de producción (Render)
 */

const fetch = require('node-fetch');

// URL del servidor de producción
const API_URL = 'https://pedidos-backend-0e1s.onrender.com';

async function testProductionFlow() {
  console.log('🔄 Iniciando test del flujo en producción...\n');

  try {
    // 1. Crear datos de prueba
    const testData = {
      tienda: 'Tienda Test',
      tiendaId: 'test-001',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2, unidad: 'kg' },
        { referencia: 'costilla', cantidad: 1, unidad: 'kg' },
        { referencia: 'secreto', cantidad: 500, unidad: 'g' }
      ],
      // PDF simulado (pequeño PDF válido en base64)
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA0ODIKVGEKMTI4IDcwMCBUZAooVGVzdCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MjEKJSVFT0Y=',
      forzarTextoPlano: true // Test con texto plano
    };

    console.log('📤 Enviando petición al servidor de producción...');
    console.log(`URL: ${API_URL}/api/enviar-proveedor`);
    console.log('Datos:', {
      tienda: testData.tienda,
      tiendaId: testData.tiendaId,
      fecha: testData.fecha,
      lineas: testData.lineas,
      forzarTextoPlano: testData.forzarTextoPlano,
      pdfIncluido: !!testData.pdfBase64
    });

    // 2. Realizar petición al servidor de producción
    const response = await fetch(`${API_URL}/api/enviar-proveedor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📊 Respuesta del servidor:`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Body: ${responseText}`);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ ÉXITO: El flujo funciona correctamente en producción');
        console.log('Resultado:', result);
      } catch (e) {
        console.log('\n✅ ÉXITO: Respuesta recibida (no JSON)');
      }
    } else {
      console.log('\n❌ ERROR: El servidor devolvió un error');
      if (response.status === 404) {
        console.log('El endpoint no existe en el servidor de producción');
      } else if (response.status === 500) {
        console.log('Error interno del servidor');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test de producción completado');

  } catch (error) {
    console.error('\n❌ ERROR durante el test:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('No se pudo conectar al servidor de producción');
    }
  }
}

// Ejecutar test
testProductionFlow();
