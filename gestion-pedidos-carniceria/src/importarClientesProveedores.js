// Script para importar clientes y proveedores desde un archivo Excel
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const ClienteProveedor = require('./models/ClienteProveedor');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.mongdb;

if (!MONGODB_URI) {
  console.error('No se encontró la URI de MongoDB en .env');
  process.exit(1);
}

async function importarDesdeExcel(rutaExcel) {
  await mongoose.connect(MONGODB_URI);
  const workbook = xlsx.readFile(rutaExcel);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const datos = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  for (const fila of datos) {
    // Normalizar campos según cabecera
    let tipo = (fila['Tipo'] || fila['tipo'] || '').toLowerCase();
    if (tipo !== 'proveedor') tipo = 'cliente'; // Por defecto cliente
    const doc = {
      codigo: String(fila['Código'] || fila['Codigo'] || fila['codigo'] || '').trim(),
      nombre: String(fila['Nombre'] || '').trim(),
      razonComercial: String(fila['Razón comercial'] || fila['Razon comercial'] || '').trim(),
      nif: String(fila['Nif'] || '').trim(),
      email: String(fila['Email'] || '').trim(),
      telefono: String(fila['Teléfono'] || fila['Telefono'] || '').trim(),
      direccion: String(fila['Dirección'] || fila['Direccion'] || '').trim(),
      cpostal: String(fila['C.postal'] || '').trim(),
      poblacion: String(fila['Población'] || fila['Poblacion'] || '').trim(),
      provincia: String(fila['Provincia'] || '').trim(),
      contacto: String(fila['Contacto'] || '').trim(),
      mensajeVentas: String(fila['Mensaje ventas'] || '').trim(),
      bloqueadoVentas: String(fila['Bloqueado ventas'] || '').toLowerCase() === 'true',
      observaciones: String(fila['Observaciones'] || '').trim(),
      tipo
    };
    if (!doc.codigo) continue;
    await ClienteProveedor.findOneAndUpdate(
      { codigo: doc.codigo },
      doc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Importado:', doc.codigo, doc.nombre, doc.tipo);
  }
  await mongoose.disconnect();
  console.log('Importación finalizada.');
}

if (require.main === module) {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error('Uso: node importarClientesProveedores.js <archivo.xlsx>');
    process.exit(1);
  }
  importarDesdeExcel(archivo);
}
