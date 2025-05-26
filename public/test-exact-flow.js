// Prueba exacta del flujo de PedidoList.jsx
async function testExactFrontendFlow() {
  console.log('=== PRUEBA EXACTA DEL FLUJO FRONTEND ===');
  
  // 1. Simular la generación de PDF (como en el frontend)
  // En lugar de jsPDF, usamos un PDF base64 válido
  const pdfBase64String = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjEwMCA3NTAgVGQKKFRlc3QgUERGKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzI0IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE4CiUlRU9G';
  
  console.log('PDF base64 generado. Longitud:', pdfBase64String.length);
  
  // 2. Validar que el base64 se generó correctamente (como en el frontend)
  if (!pdfBase64String) {
    console.error("Error: No se pudo generar el PDF (base64 vacío).");
    return;
  }
  
  const lineasProveedor = [
    { referencia: 'lomo', cantidad: 2 },
    { referencia: 'panceta', cantidad: 1 },
    { referencia: 'costilla', cantidad: 3 }
  ];
  
  const tiendaActual = { nombre: 'Tienda Test' };
  
  // 3. Enviar al backend (EXACTAMENTE como en PedidoList.jsx)
  try {
    // Esta es la línea exacta del frontend:
    const apiUrl = 'http://localhost:10001'; // Simular import.meta.env.VITE_API_URL
    console.log('API URL:', apiUrl);
    
    const url = `${apiUrl}/api/enviar-proveedor`;
    console.log('Request URL:', url);
    
    const requestData = {
      tienda: tiendaActual?.nombre || '',
      fecha: new Date().toLocaleDateString(),
      lineas: lineasProveedor,
      pdfBase64: pdfBase64String // solo base64 puro
    };
    
    console.log('Request data:', {
      tienda: requestData.tienda,
      fecha: requestData.fecha,
      lineasCount: requestData.lineas.length,
      pdfBase64Length: requestData.pdfBase64.length
    });
    
    console.log('Haciendo fetch...');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    console.log('Response recibida:', {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries())
    });
    
    const responseText = await res.text();
    console.log('Response body:', responseText);
    
    if (res.ok) {
      console.log("✅ ¡Lista enviada al proveedor!");
      return { success: true, message: "Email enviado exitosamente" };
    } else {
      console.log("❌ Error al enviar el email al proveedor.");
      return { success: false, message: "Error del servidor", details: responseText };
    }
    
  } catch (e) {
    console.error("❌ Error al generar o enviar el PDF:", e);
    console.error("Error type:", e.constructor.name);
    console.error("Error message:", e.message);
    console.error("Error stack:", e.stack);
    return { success: false, message: "Error de conectividad", error: e.message };
  }
}

// Ejecutar la prueba
testExactFrontendFlow().then(result => {
  console.log('\n=== RESULTADO FINAL ===');
  console.log(result);
}).catch(error => {
  console.error('\n=== ERROR FATAL ===');
  console.error(error);
});
