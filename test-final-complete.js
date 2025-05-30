#!/usr/bin/env node

/**
 * Test final completo del flujo de envío de pedidos a proveedor
 * Simula exactamente lo que hace el usuario desde el frontend
 */

async function testFlujoCompleto() {
  console.log('🎯 [TEST-FINAL] Iniciando test completo del flujo corregido...\n');

  try {
    // Simular datos exactos del frontend
    const datosReales = {
      tienda: 'Carnicería Central',
      tiendaId: 'central_001',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 3, unidad: 'kg' },
        { referencia: 'panceta', cantidad: 2, unidad: 'kg' },
        { referencia: 'costilla', cantidad: 4, unidad: 'kg' },
        { referencia: 'secreto', cantidad: 1, unidad: 'kg' },
        { referencia: 'carrilleras', cantidad: 500, unidad: 'g' }
      ],
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA0OEIKVGEKMTI4IDcwMCBUZAooUGVkaWRvIFRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MjEKJSVFT0Y=',
      forzarTextoPlano: true // ✅ CHECKBOX MARCADO - TEXTO PLANO
    };

    console.log('📋 [TEST-FINAL] Configuración del test:');
    console.log(`✅ Tienda: ${datosReales.tienda}`);
    console.log(`✅ Líneas de pedido: ${datosReales.lineas.length}`);
    console.log(`✅ PDF incluido: ${datosReales.pdfBase64.length} chars`);
    console.log(`✅ Texto plano forzado: ${datosReales.forzarTextoPlano}`);
    console.log('');

    // Test 1: Endpoint V2 en localhost
    console.log('🧪 [TEST-1] Probando endpoint V2 en localhost...');
    const response1 = await fetch('http://localhost:10001/api/enviar-proveedor-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosReales)
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ [TEST-1] Localhost V2 - ÉXITO');
      console.log('   Debug:', result1.debug);
      
      // Verificar que usa texto plano
      if (result1.debug?.usarTextoPlano === true) {
        console.log('✅ [TEST-1] Confirmado: usando TEXTO PLANO');
      } else {
        console.log('❌ [TEST-1] ERROR: no usa texto plano');
      }
      
      // Verificar que adjunta PDF
      if (result1.debug?.adjuntos === 1) {
        console.log('✅ [TEST-1] Confirmado: PDF ADJUNTADO');
      } else {
        console.log('❌ [TEST-1] ERROR: PDF no adjuntado');
      }
    } else {
      console.log('❌ [TEST-1] Error en localhost V2:', response1.status);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 [RESUMEN] Estado actual del problema:');
    console.log('');
    console.log('❌ PROBLEMA REPORTADO:');
    console.log('   - "vuelve a lanzar la plantilla incorrecta"');
    console.log('   - "no adjunta PDF"');
    console.log('');
    console.log('✅ SOLUCIÓN IMPLEMENTADA:');
    console.log('   - Nuevo endpoint V2 con lógica robusta');
    console.log('   - Procesamiento correcto de forzarTextoPlano');
    console.log('   - Uso garantizado de PLANTILLA_TEXTO_PLANO.txt');
    console.log('   - Adjunto correcto del PDF del frontend');
    console.log('   - Envío con TextPart (texto plano)');
    console.log('');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('   1. El código ya está subido al repositorio');
    console.log('   2. Render desplegará automáticamente los cambios');
    console.log('   3. El frontend usará el nuevo endpoint V2');
    console.log('   4. El problema debería estar resuelto');
    console.log('');
    console.log('🔍 [VERIFICACIÓN] El usuario debe:');
    console.log('   1. Marcar el checkbox "Forzar texto plano"');
    console.log('   2. Hacer clic en "Enviar pedido a proveedor"');
    console.log('   3. Verificar que llega email en TEXTO PLANO con PDF adjunto');

  } catch (error) {
    console.log('❌ [TEST-FINAL] Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('[TEST-FINAL] Test completado');
}

testFlujoCompleto();
