// Script para probar la importación de clientes
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const SAMPLE_FILE = path.join(__dirname, 'test-clientes-sample.csv');

// Crear archivo de muestra si no existe
if (!fs.existsSync(SAMPLE_FILE)) {
  console.log('Creando archivo de muestra para pruebas...');
  const sampleData = 
`Nombre;Email;Telefono;Direccion;CIF;CodigoPostal;Poblacion;Provincia;Activo;TipoCliente;ExentoIVA;FormaPago;RecargoEquiv;Descuento1;Descuento2;Descuento3;NumCliente;EsCestaNavidad
Empresa Test 1;contacto1@test.com;912345678;Calle Test 1, 10;B12345678;28001;Madrid;Madrid;true;empresa;false;transferencia;false;5;0;0;CL001;false
Cliente Particular;cliente@gmail.com;666123456;Avenida Principal 23;12345678A;28002;Madrid;Madrid;true;particular;false;efectivo;false;0;0;0;CL002;false
Cestas Navidad SL;info@cestasnavidad.com;911234567;Polígono Industrial, Nave 7;B87654321;08001;Barcelona;Barcelona;true;empresa;false;transferencia;false;10;5;0;CL003;true
Distribuidora Test;distribuidora@test.com;934567890;Calle Comercio 45;A12345678;46001;Valencia;Valencia;true;distribuidor;false;transferencia;true;15;10;5;CL004;false
Cliente Inactivo;inactivo@test.com;666987654;Sin dirección;B55555555;41001;Sevilla;Sevilla;false;empresa;true;transferencia;false;0;0;0;CL005;false
`;
  fs.writeFileSync(SAMPLE_FILE, sampleData, 'utf8');
  console.log('Archivo de muestra creado en:', SAMPLE_FILE);
}

// Función para parsear el CSV y convertirlo a JSON
const parseCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';').map(h => h.trim());
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(';');
    
    if (values.length !== headers.length) {
      console.warn(`Línea ${i+1} tiene ${values.length} valores, esperados ${headers.length}`);
      continue;
    }
    
    const item = {};
    headers.forEach((header, index) => {
      let value = values[index].trim();
      
      // Convertir valores booleanos
      if (value.toLowerCase() === 'true') value = true;
      else if (value.toLowerCase() === 'false') value = false;
      
      // Convertir valores numéricos
      else if (!isNaN(value) && value !== '' && 
              ['Descuento1', 'Descuento2', 'Descuento3'].includes(header)) {
        value = parseFloat(value);
      }
      
      item[header] = value;
    });
    
    result.push(item);
  }
  
  return result;
};

// Función principal para probar la importación
const testImportarClientes = async () => {
  try {
    console.log('Iniciando prueba de importación de clientes...');
    
    // Parsear archivo de muestra
    const clientes = parseCSV(SAMPLE_FILE);
    console.log(`Se han parseado ${clientes.length} clientes del archivo de muestra.`);
    
    // Realizar solicitud al API
    console.log('Enviando datos al servidor...');
    const response = await axios.post(`${API_URL}/clientes/importar`, {
      clientes: clientes,
      actualizarExistentes: true
    });
    
    // Mostrar resultados
    console.log('Importación completada:');
    console.log('---------------------');
    console.log(`Total procesados: ${response.data.total || clientes.length}`);
    console.log(`Clientes creados: ${response.data.creados || 0}`);
    console.log(`Clientes actualizados: ${response.data.actualizados || 0}`);
    console.log(`Errores: ${response.data.errores || 0}`);
    
    if (response.data.clientesConError && response.data.clientesConError.length > 0) {
      console.log('\nDetalles de errores:');
      response.data.clientesConError.forEach((error, index) => {
        console.log(`${index + 1}. Cliente: ${error.nombre || 'Sin nombre'} - Error: ${error.error}`);
      });
    }
    
    console.log('\nPrueba completada con éxito.');
    
  } catch (error) {
    console.error('Error durante la prueba:');
    if (error.response) {
      console.error('Estado:', error.response.status);
      console.error('Datos:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

// Ejecutar la prueba
testImportarClientes();
