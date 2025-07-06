#!/usr/bin/env node
/**
 * Script para procesar CSV de clientes de cestas de navidad
 * y marcarlos en la base de datos
 * 
 * Uso: node procesarCestasNavidad.js archivo.csv
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:10001';

function parseCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('El archivo CSV debe tener al menos una línea de cabecera y una de datos');
  }
  
  // Detectar separador (coma, punto y coma, tabulación)
  const separadores = [';', ',', '\t'];
  const primeraLinea = lines[0];
  let separador = ',';
  let maxColumnas = 0;
  
  for (const sep of separadores) {
    const columnas = primeraLinea.split(sep).length;
    if (columnas > maxColumnas) {
      maxColumnas = columnas;
      separador = sep;
    }
  }
  
  console.log(`Detectado separador: "${separador}" con ${maxColumnas} columnas`);
  
  const headers = lines[0].split(separador).map(h => h.trim().replace(/"/g, ''));
  console.log('Cabeceras detectadas:', headers);
  
  const datos = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separador).map(col => col.trim().replace(/"/g, ''));
    if (cols.length === 1 && cols[0] === '') continue; // Línea vacía
    
    const fila = {};
    headers.forEach((header, index) => {
      fila[header] = cols[index] || '';
    });
    
    // Mapear campos comunes
    const cliente = {
      nombre: fila.nombre || fila.Nombre || fila.NOMBRE || fila.razonSocial || fila.RazonSocial || fila.RAZON_SOCIAL || '',
      email: fila.email || fila.Email || fila.EMAIL || fila.correo || fila.Correo || '',
      telefono: fila.telefono || fila.Telefono || fila.TELEFONO || fila.tel || fila.Tel || '',
      nif: fila.nif || fila.NIF || fila.cif || fila.CIF || fila.dni || fila.DNI || '',
      direccion: fila.direccion || fila.Direccion || fila.DIRECCION || '',
      original: fila // Guardar datos originales para referencia
    };
    
    // Solo agregar si tiene al menos nombre o email
    if (cliente.nombre || cliente.email) {
      datos.push(cliente);
    }
  }
  
  return datos;
}

async function procesarCestasNavidad(archivoCSV) {
  try {
    console.log('🎄 Iniciando procesamiento de cestas de navidad...');
    console.log(`📁 Archivo: ${archivoCSV}`);
    
    // Leer archivo CSV
    if (!fs.existsSync(archivoCSV)) {
      throw new Error(`El archivo ${archivoCSV} no existe`);
    }
    
    const csvContent = fs.readFileSync(archivoCSV, 'utf-8');
    console.log(`📄 Archivo leído: ${csvContent.length} caracteres`);
    
    // Parsear CSV
    const clientesCestas = parseCSV(csvContent);
    console.log(`👥 Clientes de cestas detectados: ${clientesCestas.length}`);
    
    if (clientesCestas.length === 0) {
      throw new Error('No se encontraron clientes válidos en el CSV');
    }
    
    // Mostrar muestra
    console.log('\n📋 Muestra de los primeros 3 clientes:');
    clientesCestas.slice(0, 3).forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nombre} | ${cliente.email} | ${cliente.telefono}`);
    });
    
    // Confirmar procesamiento
    console.log(`\n❓ ¿Procesar ${clientesCestas.length} clientes de cestas de navidad? (y/N)`);
    
    // Esperar confirmación (solo en modo interactivo)
    if (process.stdin.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const respuesta = await new Promise(resolve => {
        rl.question('', resolve);
      });
      rl.close();
      
      if (respuesta.toLowerCase() !== 'y' && respuesta.toLowerCase() !== 'yes') {
        console.log('❌ Procesamiento cancelado');
        return;
      }
    }
    
    // Enviar a la API
    console.log('\n🚀 Enviando datos a la API...');
    const response = await axios.post(`${API_URL}/api/clientes/marcar-cestas-navidad`, {
      clientesCestasNavidad: clientesCestas
    });
    
    if (response.data.ok) {
      console.log('\n✅ Procesamiento completado exitosamente!');
      console.log(`📊 Resultados:`);
      console.log(`   - Clientes marcados: ${response.data.marcados}`);
      console.log(`   - No encontrados: ${response.data.noEncontrados.length}`);
      console.log(`   - Errores: ${response.data.errores.length}`);
      
      if (response.data.noEncontrados.length > 0) {
        console.log('\n⚠️  Clientes no encontrados:');
        response.data.noEncontrados.slice(0, 10).forEach(item => {
          console.log(`   - ${item.cliente.nombre || 'Sin nombre'} (${item.motivo})`);
        });
        if (response.data.noEncontrados.length > 10) {
          console.log(`   ... y ${response.data.noEncontrados.length - 10} más`);
        }
      }
      
      if (response.data.errores.length > 0) {
        console.log('\n❌ Errores encontrados:');
        response.data.errores.forEach(item => {
          console.log(`   - ${item.cliente.nombre || 'Sin nombre'}: ${item.error}`);
        });
      }
      
      // Guardar reporte
      const reporte = {
        fecha: new Date().toISOString(),
        archivo: archivoCSV,
        resultados: response.data,
        clientesProcesados: clientesCestas.length
      };
      
      const archivoReporte = `reporte-cestas-navidad-${Date.now()}.json`;
      fs.writeFileSync(archivoReporte, JSON.stringify(reporte, null, 2));
      console.log(`\n📄 Reporte guardado en: ${archivoReporte}`);
      
    } else {
      throw new Error(response.data.error || 'Error desconocido en la API');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento:', error.message);
    process.exit(1);
  }
}

// Script principal
if (require.main === module) {
  const archivoCSV = process.argv[2];
  
  if (!archivoCSV) {
    console.log('❌ Uso: node procesarCestasNavidad.js archivo.csv');
    console.log('\nEjemplo: node procesarCestasNavidad.js clientes-cestas-navidad.csv');
    process.exit(1);
  }
  
  procesarCestasNavidad(archivoCSV);
}

module.exports = { procesarCestasNavidad, parseCSV };
