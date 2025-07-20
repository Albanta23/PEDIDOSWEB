// Script para probar la importación del archivo real de SAGE 50
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_URL = 'http://localhost:10001/api';
const ARCHIVO_REAL = path.join(__dirname, '_TabClientes__202506221857.csv');

// Función para parsear el archivo CSV/TSV de SAGE 50
const parseTabClientesCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('El archivo está vacío o no tiene datos');
  }
  
  // Detectar separador (tabulador o punto y coma)
  const separador = lines[0].includes('\t') ? '\t' : ';';
  console.log(`📋 Separador detectado: ${separador === '\t' ? 'TAB' : 'PUNTO Y COMA'}`);
  
  // Procesar encabezados
  const headers = lines[0].split(separador).map(h => h.trim());
  console.log(`📋 Encabezados encontrados: ${headers.join(', ')}`);
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split(separador);
    
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ? values[index].trim() : '';
    });
    
    // Mapear campos específicos del formato SAGE 50 al modelo Cliente
    const clienteMapeado = {
      codigoSage: item['Código Sage'] || item['Codigo Sage'] || item['Codigo'] || '',
      nombre: item['Nombre'] || item['Razón comercial'] || '',
      razonSocial: item['Nombre'] || '',
      razonComercial: item['Razón comercial'] || item['Razon comercial'] || '',
      nif: item['NIF/cif'] || item['NIF'] || item['CIF'] || '',
      email: item['Email'] || '',
      telefono: item['Teléfono'] || item['Telefono'] || '',
      direccion: item['Dirección'] || item['Direccion'] || '',
      codigoPostal: item['C.postal'] || item['CP'] || item['Codigo postal'] || '',
      poblacion: item['Población'] || item['Poblacion'] || '',
      provincia: item['Provincia'] || '',
      contacto: item['Contacto'] || '',
      mensajeVentas: item['Mensaje ventas'] || '',
      bloqueadoVentas: (item['Bloqueado ventas'] || '').toLowerCase() === 'true',
      observaciones: item['Observaciones'] || ''
    };
    
    // Limpiar campos vacíos y normalizar
    Object.keys(clienteMapeado).forEach(key => {
      if (typeof clienteMapeado[key] === 'string') {
        clienteMapeado[key] = clienteMapeado[key].trim();
      }
    });
    
    // Solo añadir si tiene nombre o razón social
    if (clienteMapeado.nombre || clienteMapeado.razonSocial || clienteMapeado.razonComercial) {
      // Si no tiene nombre, usar razón social o comercial
      if (!clienteMapeado.nombre) {
        clienteMapeado.nombre = clienteMapeado.razonSocial || clienteMapeado.razonComercial;
      }
      
      result.push(clienteMapeado);
    }
  }
  
  return result;
};

// Función principal para probar la importación
const testImportarClientesReal = async () => {
  try {
    console.log('🚀 Iniciando prueba de importación de archivo SAGE 50 real...');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(ARCHIVO_REAL)) {
      console.error(`❌ El archivo ${ARCHIVO_REAL} no existe`);
      return;
    }
    
    console.log(`📁 Archivo encontrado: ${ARCHIVO_REAL}`);
    
    // Parsear archivo real
    console.log('📊 Parseando archivo...');
    const clientes = parseTabClientesCSV(ARCHIVO_REAL);
    console.log(`📁 Se han parseado ${clientes.length} clientes del archivo real.`);
    
    // Mostrar muestra de los primeros 3 clientes
    console.log('\n📋 Muestra de datos a importar (primeros 3):');
    clientes.slice(0, 3).forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nombre} (${cliente.codigoSage}) - NIF: ${cliente.nif} - Email: ${cliente.email}`);
    });
    
    // Confirmar antes de importar
    console.log(`\n⚠️  ¿Proceder con la importación de ${clientes.length} clientes? (continúa automáticamente en 3 segundos)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Realizar solicitud al API
    console.log('📤 Enviando datos al servidor...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/clientes/importar`, {
      clientes: clientes
    }, {
      timeout: 300000 // 5 minutos de timeout
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Mostrar resultados
    console.log('✅ Importación completada:');
    console.log('=========================');
    console.log(`⏱️  Tiempo transcurrido: ${duration.toFixed(2)} segundos`);
    console.log(`📊 Total procesados: ${response.data.total || clientes.length}`);
    console.log(`➕ Clientes creados: ${response.data.insertados || 0}`);
    console.log(`🔄 Clientes actualizados: ${response.data.actualizados || 0}`);
    console.log(`❌ Errores: ${response.data.errores || 0}`);
    
    if (response.data.resultado && response.data.resultado.clientesConError && response.data.resultado.clientesConError.length > 0) {
      console.log('\n🔍 Detalles de errores (primeros 5):');
      response.data.resultado.clientesConError.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. Cliente: ${error.datos.nombre || 'Sin nombre'} - Error: ${error.error}`);
      });
      
      if (response.data.resultado.clientesConError.length > 5) {
        console.log(`... y ${response.data.resultado.clientesConError.length - 5} errores más`);
      }
    }
    
    // Verificar que los clientes se guardaron
    console.log('\n🔍 Verificando clientes en la base de datos...');
    const clientesResponse = await axios.get(`${API_URL}/clientes`);
    console.log(`📈 Total de clientes en la base de datos: ${clientesResponse.data.length}`);
    
    if (clientesResponse.data.length > 0) {
      console.log('\n📝 Primeros 5 clientes en la base de datos:');
      clientesResponse.data.slice(0, 5).forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nombre} (${cliente.codigoSage || 'Sin código'}) - ${cliente.email || 'Sin email'}`);
      });
    }
    
    console.log('\n🎉 Prueba completada con éxito.');
    
  } catch (error) {
    console.error('💥 Error durante la prueba:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Timeout: La importación tardó demasiado tiempo');
    } else {
      console.error('🚨 Error:', error.message);
    }
  }
};

// Ejecutar la prueba
testImportarClientesReal();
