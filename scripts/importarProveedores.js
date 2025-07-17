import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearProveedor } from '../src/services/proveedoresService.js';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFilePath = path.resolve(__dirname, '../PROVEEDORES.csv');

async function importarProveedores() {
  const proveedores = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      // Mapeo de campos CSV a modelo
      proveedores.push({
        codigo: row['Código'] || row['Codigo'] || '',
        nombre: row['Nombre'] || '',
        razonComercial: row['Razón comercial'] || row['Razon comercial'] || '',
        nif: row['Nif'] || '',
        email: row['Email'] || '',
        telefono: row['Teléfono'] || row['Telefono'] || '',
        direccion: row['Dirección'] || row['Direccion'] || '',
        codigoPostal: row['C.postal'] || row['C.Postal'] || '',
        poblacion: row['Población'] || row['Poblacion'] || '',
        provincia: row['Provincia'] || '',
        contacto: row['Contacto'] || '',
        mensajeCompras: row['Mensaje compras'] || '',
        observaciones: row['Observaciones'] || '',
        activo: true
      });
    })
    .on('end', async () => {
      let insertados = 0;
      for (const proveedor of proveedores) {
        try {
          await crearProveedor(proveedor);
          insertados++;
        } catch (e) {
          console.error('Error al importar proveedor:', proveedor.codigo, e.message);
        }
      }
      console.log(`Importación completada: ${insertados} proveedores insertados.`);
    });
}

importarProveedores();
