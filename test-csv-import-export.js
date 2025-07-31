/**
 * Script para comprobar la funcionalidad de importación/exportación CSV de productos y vendedores
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/api';

/**
 * Función para generar un archivo CSV de prueba para productos SAGE50
 */
async function generarCSVProductosPrueba() {
  try {
    const productos = [
      { codigo: 'S001', codigoSage: 'S001', nombre: 'Producto SAGE 1', descripcion: 'Descripción de prueba 1', precio: 19.99, activo: true },
      { codigo: 'S002', codigoSage: 'S002', nombre: 'Producto SAGE 2', descripcion: 'Descripción de prueba 2', precio: 29.99, activo: true },
      { codigo: 'S003', codigoSage: 'S003', nombre: 'Producto SAGE 3', descripcion: 'Descripción de prueba 3', precio: 39.99, activo: false },
      { codigo: 'S004', codigoSage: 'S004', nombre: 'Producto SAGE 4', descripcion: 'Descripción de prueba 4', precio: 49.99, activo: true },
      { codigo: 'S005', codigoSage: 'S005', nombre: 'Producto SAGE 5', descripcion: 'Descripción de prueba 5', precio: 59.99, activo: true }
    ];
    
    // Crear cabeceras del CSV
    const cabeceras = 'Código;Código SAGE;Nombre;Descripción;Precio;Activo\n';
    
    // Crear filas de datos
    const filas = productos.map(p => 
      `${p.codigo};${p.codigoSage};${p.nombre};${p.descripcion};${p.precio};${p.activo ? 'Sí' : 'No'}`
    ).join('\n');
    
    // Combinar cabeceras y filas
    const contenidoCSV = cabeceras + filas;
    
    // Guardar en archivo
    const rutaArchivo = path.join(process.cwd(), 'productos_sage_prueba.csv');
    fs.writeFileSync(rutaArchivo, contenidoCSV, 'utf8');
    
    console.log(`Archivo CSV de productos de prueba generado: ${rutaArchivo}`);
    return rutaArchivo;
  } catch (error) {
    console.error('Error al generar CSV de productos:', error);
    throw error;
  }
}

/**
 * Función para generar un archivo CSV de prueba para vendedores SAGE50
 */
async function generarCSVVendedoresPrueba() {
  try {
    const vendedores = [
      { codigo: 'V001', nombre: 'Vendedor SAGE 1', email: 'vendedor1@empresa.com', telefono: '600111222', activo: true },
      { codigo: 'V002', nombre: 'Vendedor SAGE 2', email: 'vendedor2@empresa.com', telefono: '600222333', activo: true },
      { codigo: 'V003', nombre: 'Vendedor SAGE 3', email: 'vendedor3@empresa.com', telefono: '600333444', activo: false },
      { codigo: 'V004', nombre: 'Vendedor SAGE 4', email: 'vendedor4@empresa.com', telefono: '600444555', activo: true },
      { codigo: 'V005', nombre: 'Vendedor SAGE 5', email: 'vendedor5@empresa.com', telefono: '600555666', activo: true }
    ];
    
    // Crear cabeceras del CSV
    const cabeceras = 'Código;Nombre;Email;Teléfono;Activo\n';
    
    // Crear filas de datos
    const filas = vendedores.map(v => 
      `${v.codigo};${v.nombre};${v.email};${v.telefono};${v.activo ? 'Sí' : 'No'}`
    ).join('\n');
    
    // Combinar cabeceras y filas
    const contenidoCSV = cabeceras + filas;
    
    // Guardar en archivo
    const rutaArchivo = path.join(process.cwd(), 'vendedores_sage_prueba.csv');
    fs.writeFileSync(rutaArchivo, contenidoCSV, 'utf8');
    
    console.log(`Archivo CSV de vendedores de prueba generado: ${rutaArchivo}`);
    return rutaArchivo;
  } catch (error) {
    console.error('Error al generar CSV de vendedores:', error);
    throw error;
  }
}

/**
 * Función para probar la importación de productos
 */
async function probarImportacionProductos() {
  try {
    // Generar archivo CSV de prueba
    const rutaArchivo = await generarCSVProductosPrueba();
    
    // Crear FormData y añadir el archivo
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(rutaArchivo));
    
    // Intentar importar a través de la API
    console.log('Intentando importar productos a través de la API...');
    try {
      const respuesta = await axios.post(`${API_URL}/productos-sage/importar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Respuesta de la API:', respuesta.data);
      console.log('Importación de productos completada con éxito.');
    } catch (error) {
      console.error('Error al importar productos a través de la API:', error.message);
      console.log('Puede probar la importación manual desde la interfaz de usuario.');
    }
  } catch (error) {
    console.error('Error en la prueba de importación de productos:', error);
  }
}

/**
 * Función para probar la importación de vendedores
 */
async function probarImportacionVendedores() {
  try {
    // Generar archivo CSV de prueba
    const rutaArchivo = await generarCSVVendedoresPrueba();
    
    // Crear FormData y añadir el archivo
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(rutaArchivo));
    
    // Intentar importar a través de la API
    console.log('Intentando importar vendedores a través de la API...');
    try {
      const respuesta = await axios.post(`${API_URL}/vendedores/importar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Respuesta de la API:', respuesta.data);
      console.log('Importación de vendedores completada con éxito.');
    } catch (error) {
      console.error('Error al importar vendedores a través de la API:', error.message);
      console.log('Puede probar la importación manual desde la interfaz de usuario.');
    }
  } catch (error) {
    console.error('Error en la prueba de importación de vendedores:', error);
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  console.log('Iniciando pruebas de importación/exportación CSV...');
  
  // Ejecutar pruebas en secuencia
  (async () => {
    try {
      console.log('\n--- Prueba de importación de productos ---');
      await probarImportacionProductos();
      
      console.log('\n--- Prueba de importación de vendedores ---');
      await probarImportacionVendedores();
      
      console.log('\nTodas las pruebas completadas.');
    } catch (error) {
      console.error('Error durante las pruebas:', error);
    }
  })();
}

// Exportar funciones para uso en otros scripts
export {
  generarCSVProductosPrueba,
  generarCSVVendedoresPrueba,
  probarImportacionProductos,
  probarImportacionVendedores
};
