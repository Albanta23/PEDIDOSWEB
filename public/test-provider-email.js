// Script de prueba para simular el envío desde el frontend
async function testProviderEmailFlow() {
  console.log('=== TESTING PROVIDER EMAIL FLOW ===');
  
  try {
    // Simular los datos que se envían desde el frontend
    const testData = {
      tienda: 'Tienda Test',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2 },
        { referencia: 'panceta', cantidad: 1 }
      ],
      // PDF base64 mínimo pero válido
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjEwMCA3NTAgVGQKKFRlc3QgUERGKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzI0IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE4CiUlRU9G'
    };
    
    // Usar la misma lógica que el frontend
    const apiUrl = import.meta?.env?.VITE_API_URL || 'http://localhost:10001';
    console.log('VITE_API_URL:', apiUrl);
    
    const url = `${apiUrl}/api/enviar-proveedor`;
    console.log('Request URL:', url);
    console.log('Request data:', testData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const responseData = await response.text();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Email sent successfully!');
      alert('✅ Test successful! Email flow is working.');
    } else {
      console.log('❌ ERROR: Server returned error');
      alert('❌ Server error: ' + responseData);
    }
    
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
    alert('❌ Network Error: ' + error.message);
  }
}

// Ejecutar la prueba
testProviderEmailFlow();
