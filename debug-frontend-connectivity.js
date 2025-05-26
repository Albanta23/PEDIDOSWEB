#!/usr/bin/env node

// Script para debuggear conectividad del frontend
console.log('=== DEBUG FRONTEND CONNECTIVITY ===');

// Simular las variables de entorno que usa el frontend
const VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:10001';
console.log('VITE_API_URL from env:', process.env.VITE_API_URL);
console.log('VITE_API_URL used:', VITE_API_URL);

// Simular la lógica del frontend
const apiUrl = VITE_API_URL || '';
console.log('apiUrl variable:', apiUrl);
console.log('Final URL would be:', `${apiUrl}/api/enviar-proveedor`);

// Probar la conectividad usando fetch (como en el frontend)
async function testFetch() {
  try {
    console.log('\n=== TESTING FETCH ===');
    const url = `${apiUrl}/api/enviar-proveedor`;
    console.log('Testing URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const text = await response.text();
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('FETCH ERROR:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
  }
}

// Probar con axios también
async function testAxios() {
  try {
    console.log('\n=== TESTING AXIOS ===');
    const axios = require('axios');
    
    const url = `${apiUrl}/api/enviar-proveedor`;
    console.log('Testing URL:', url);
    
    const response = await axios.post(url, { test: true }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('AXIOS ERROR:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function main() {
  await testFetch();
  await testAxios();
}

// Solo ejecutar si este archivo es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}
