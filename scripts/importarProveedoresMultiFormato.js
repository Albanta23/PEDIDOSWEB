// Script para importar proveedores desde CSV, Excel o JSON y actualizar src/data/proveedores.js
// Uso: node scripts/importarProveedoresMultiFormato.js <archivo_entrada>

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csvParse = require('csv-parse/sync');

const entrada = process.argv[2];
if (!entrada) {
  console.error('Debes indicar el archivo de entrada (CSV, Excel o JSON)');
  process.exit(1);
}

const ext = path.extname(entrada).toLowerCase();
let proveedores = [];

if (ext === '.json') {
  // Importar desde JSON
  proveedores = JSON.parse(fs.readFileSync(entrada, 'utf8'));
} else if (ext === '.csv') {
  // Importar desde CSV
  const contenido = fs.readFileSync(entrada, 'utf8');
  const registros = csvParse.parse(contenido, { columns: true, skip_empty_lines: true });
  proveedores = registros.map(row => ({
    codigo: row.codigo || row.Codigo || row.ID || '',
    nombre: row.nombre || row.Nombre || '',
    razonComercial: row.razonComercial || row.RazonComercial || row['Razón Comercial'] || '',
    email: row.email || row.Email || '',
    telefono: row.telefono || row.Telefono || '',
    direccion: row.direccion || row.Direccion || '',
    activo: row.activo !== undefined ? Boolean(row.activo) : true
  }));
} else if (ext === '.xlsx' || ext === '.xls') {
  // Importar desde Excel
  const workbook = xlsx.readFile(entrada);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const registros = xlsx.utils.sheet_to_json(hoja);
  proveedores = registros.map(row => ({
    codigo: row.codigo || row.Codigo || row.ID || '',
    nombre: row.nombre || row.Nombre || '',
    razonComercial: row.razonComercial || row.RazonComercial || row['Razón Comercial'] || '',
    email: row.email || row.Email || '',
    telefono: row.telefono || row.Telefono || '',
    direccion: row.direccion || row.Direccion || '',
    activo: row.activo !== undefined ? Boolean(row.activo) : true
  }));
} else {
  console.error('Formato no soportado. Usa CSV, Excel (.xlsx/.xls) o JSON.');
  process.exit(1);
}

// Guardar en src/data/proveedores.js
const salida = path.join(__dirname, '../src/data/proveedores.js');
const contenidoSalida = `// Archivo generado automáticamente
module.exports = ${JSON.stringify(proveedores, null, 2)};
`;
fs.writeFileSync(salida, contenidoSalida);
console.log(`Proveedores importados correctamente (${proveedores.length}) en src/data/proveedores.js`);
