#!/usr/bin/env node

// Simulación exacta del flujo del frontend
console.log('=== SIMULACIÓN FRONTEND COMPLETA ===');

async function simulateFullFrontendFlow() {
  try {
    // 1. Simular la lectura de variables de entorno como lo hace Vite
    console.log('VITE_API_URL from process.env:', process.env.VITE_API_URL);
    
    // 2. Simular la lógica exacta del PedidoList.jsx
    const apiUrl = process.env.VITE_API_URL || '';
    console.log('apiUrl variable:', `"${apiUrl}"`);
    console.log('Final URL will be:', `"${apiUrl}/api/enviar-proveedor"`);
    
    // 3. Datos de prueba similares a los reales
    const testData = {
      tienda: 'Tienda Test',
      fecha: new Date().toLocaleDateString(),
      lineas: [
        { referencia: 'lomo', cantidad: 2 },
        { referencia: 'panceta', cantidad: 1 }
      ],
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjEwMCA3NTAgVGQKKFRlc3QgUERGKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzI0IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE4CiUlRU9G' // PDF base64 válido mínimo
    };
    
    console.log('\n=== TESTING EXACT FRONTEND LOGIC ===');
    
    // 4. Usar axios como en el proyecto
    const axios = require('axios');
    
    const url = `${apiUrl}/api/enviar-proveedor`;
    console.log('Making request to:', url);
    
    const response = await axios.post(url, testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    console.log('✅ SUCCESS: Frontend can connect to backend!');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('Error type:', error.constructor.name);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('-> Backend is not responding');
    } else if (error.message.includes('Network Error')) {
      console.error('-> Network connectivity issue');
    } else {
      console.error('-> Other error');
    }
  }
}

async function main() {
  // Primero sin variables de entorno
  console.log('\n--- Test 1: Without VITE_API_URL ---');
  await simulateFullFrontendFlow();
  
  // Luego con variables de entorno
  console.log('\n--- Test 2: With VITE_API_URL ---');
  process.env.VITE_API_URL = 'http://localhost:10001';
  await simulateFullFrontendFlow();
}

main().catch(console.error);
