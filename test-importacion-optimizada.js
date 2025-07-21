// Script para probar la importación optimizada de clientes
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_URL = 'http://localhost:10001/api';
const TEST_FILE = path.join(__dirname, 'test-clientes-importacion.csv');

// Función para parsear el CSV de prueba
const parseCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';').map(h => h.trim());
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(';');
    
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ? values[index].trim() : '';
    });
    
    // Mapear campos para coincidir con el modelo Cliente
    const clienteMapeado = {
      codigoSage: item.Codigo,
      nombre: item.NomFiscal || item.NomComercial,
      razonSocial: item.NomFiscal,
      razonComercial: item.NomComercial,
      nif: item.CIF,
      direccion: item.DireccionComercial,
      codigoPostal: item.CPComercial,
      poblacion: item.PoblacionComercial,
      provincia: item.ProvinciaComercial,
      telefono: item.TelefonoComercial,
      email: item.EmailComercial
    };
    
    result.push(clienteMapeado);
  }
  
  return result;
};

// Función principal para probar la importación
const testImportarClientes = async () => {
  try {
    console.log('🚀 Iniciando prueba de importación optimizada de clientes...');
    
    // Parsear archivo de prueba
    const clientes = parseCSV(TEST_FILE);
    console.log(`📁 Se han parseado ${clientes.length} clientes del archivo de prueba.`);
    console.log('📋 Datos a importar:', JSON.stringify(clientes, null, 2));
    
    // Realizar solicitud al API
    console.log('📤 Enviando datos al servidor...');
    const response = await axios.post(`${API_URL}/clientes/importar`, {
      clientes: clientes
    });
    
    // Mostrar resultados
    console.log('✅ Importación completada:');
    console.log('=====================');
    console.log(`📊 Total procesados: ${response.data.total || clientes.length}`);
    console.log(`➕ Clientes creados: ${response.data.insertados || 0}`);
    console.log(`🔄 Clientes actualizados: ${response.data.actualizados || 0}`);
    console.log(`❌ Errores: ${response.data.errores || 0}`);
    
    if (response.data.resultado && response.data.resultado.clientesConError && response.data.resultado.clientesConError.length > 0) {
      console.log('\n🔍 Detalles de errores:');
      response.data.resultado.clientesConError.forEach((error, index) => {
        console.log(`${index + 1}. Cliente: ${error.datos.nombre || 'Sin nombre'} - Error: ${error.error}`);
      });
    }
    
    // Verificar que los clientes se guardaron
    console.log('\n🔍 Verificando clientes en la base de datos...');
    const clientesResponse = await axios.get(`${API_URL}/clientes`);
    console.log(`📈 Total de clientes en la base de datos: ${clientesResponse.data.length}`);
    
    if (clientesResponse.data.length > 0) {
      console.log('\n📝 Primeros 3 clientes:');
      clientesResponse.data.slice(0, 3).forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nombre} (${cliente.codigoSage || 'Sin código'}) - ${cliente.email || 'Sin email'}`);
      });
    }
    
    console.log('\n🎉 Prueba completada con éxito.');
    
  } catch (error) {
    console.error('💥 Error durante la prueba:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
    } else {
      console.error('🚨 Error:', error.message);
    }
  }
};

// Ejecutar la prueba
testImportarClientes();
