// Script para probar el marcado de clientes de cestas navideñas
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_URL = 'http://localhost:10001/api';
const CESTAS_FILE = path.join(__dirname, 'test-cestas-navidad.csv');

// Función para parsear el CSV de cestas
const parseCSVCestas = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',');
    
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ? values[index].trim() : '';
    });
    
    result.push(item);
  }
  
  return result;
};

// Función principal para probar el marcado de cestas
const testMarcarCestas = async () => {
  try {
    console.log('🎄 Iniciando prueba de marcado de clientes de cestas navideñas...');
    
    // Verificar estado inicial
    console.log('\n📊 Estado inicial de clientes:');
    const clientesIniciales = await axios.get(`${API_URL}/clientes`);
    console.log(`Total de clientes: ${clientesIniciales.data.length}`);
    
    const cestasIniciales = clientesIniciales.data.filter(c => c.esCestaNavidad === true);
    console.log(`Clientes de cestas: ${cestasIniciales.length}`);
    
    // Parsear archivo de cestas
    const clientesCestas = parseCSVCestas(CESTAS_FILE);
    console.log(`\n📁 Se han parseado ${clientesCestas.length} clientes de cestas del archivo.`);
    console.log('📋 Datos de cestas:', JSON.stringify(clientesCestas, null, 2));
    
    // Enviar datos al endpoint de marcado de cestas
    console.log('\n📤 Enviando datos al servidor para marcar cestas...');
    const response = await axios.post(`${API_URL}/clientes/marcar-cestas-navidad`, {
      clientesCestasNavidad: clientesCestas
    });
    
    // Mostrar resultados
    console.log('\n✅ Marcado de cestas completado:');
    console.log('================================');
    console.log(`👥 Clientes marcados: ${response.data.marcados || 0}`);
    console.log(`➕ Clientes nuevos creados: ${response.data.creados || 0}`);
    console.log(`❌ Errores: ${response.data.errores ? response.data.errores.length : 0}`);
    console.log(`📝 Resumen: ${response.data.resumen || 'N/A'}`);
    
    if (response.data.errores && response.data.errores.length > 0) {
      console.log('\n🔍 Detalles de errores:');
      response.data.errores.forEach((error, index) => {
        console.log(`${index + 1}. Cliente: ${error.cliente.nombre || 'Sin nombre'} - Error: ${error.error}`);
      });
    }
    
    // Verificar estado final
    console.log('\n📊 Estado final de clientes:');
    const clientesFinales = await axios.get(`${API_URL}/clientes`);
    console.log(`Total de clientes: ${clientesFinales.data.length}`);
    
    const cestasFinales = clientesFinales.data.filter(c => c.esCestaNavidad === true);
    console.log(`Clientes de cestas: ${cestasFinales.length}`);
    
    if (cestasFinales.length > 0) {
      console.log('\n🎄 Clientes marcados como cestas navideñas:');
      cestasFinales.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nombre} (${cliente.codigoSage || 'Sin código'}) - ${cliente.email || 'Sin email'}`);
      });
    }
    
    console.log('\n🎉 Prueba de marcado de cestas completada con éxito.');
    
  } catch (error) {
    console.error('💥 Error durante la prueba de cestas:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
    } else {
      console.error('🚨 Error:', error.message);
    }
  }
};

// Ejecutar la prueba
testMarcarCestas();
