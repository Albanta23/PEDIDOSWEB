// Script para diagnosticar lotes disponibles
// Ejecutar con: node diagnostico-lotes-disponibles.js

const mongoose = require('mongoose');
const Lote = require('./gestion-pedidos-carniceria/src/models/Lote');
const Producto = require('./gestion-pedidos-carniceria/src/models/Producto');

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/gestion-pedidos';

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conexión establecida con éxito');

    // 1. Obtener todos los productos
    const productos = await Producto.find({}).lean();
    console.log(`Encontrados ${productos.length} productos`);

    // 2. Analizar lotes disponibles para cada producto
    for (const producto of productos) {
      console.log(`\n=== Producto: ${producto.nombre} (${producto._id}) ===`);
      
      // Buscar lotes para este producto
      const lotes = await Lote.find({ 
        producto: producto._id,
        $or: [
          { cantidadDisponible: { $gt: 0 } },
          { pesoDisponible: { $gt: 0 } }
        ]
      }).lean();
      
      if (lotes.length === 0) {
        console.log('  ⚠️ No hay lotes disponibles para este producto');
      } else {
        console.log(`  ✅ Encontrados ${lotes.length} lotes disponibles:`);
        lotes.forEach(lote => {
          console.log(`  - Lote: ${lote.lote}`);
          console.log(`    • ID: ${lote._id}`);
          console.log(`    • Cantidad disponible: ${lote.cantidadDisponible || 0}`);
          console.log(`    • Peso disponible: ${lote.pesoDisponible || 0}kg`);
          console.log(`    • Fecha entrada: ${lote.fechaEntrada}`);
          console.log(`    • Proveedor: ${lote.proveedorId || 'No especificado'}`);
        });
      }
    }

    console.log('\nDiagnóstico de lotes completado');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
