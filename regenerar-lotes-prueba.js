// Script para regenerar lotes de prueba en la base de datos
// Ejecutar con: node regenerar-lotes-prueba.js

const mongoose = require('mongoose');
const Lote = require('./gestion-pedidos-carniceria/src/models/Lote');
const Producto = require('./gestion-pedidos-carniceria/src/models/Producto');
const MovimientoStock = require('./gestion-pedidos-carniceria/src/models/MovimientoStock');

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/gestion-pedidos';

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conexión establecida con éxito');

    // 1. Obtener todos los productos
    const productos = await Producto.find({});
    console.log(`Encontrados ${productos.length} productos`);

    // 2. Para cada producto, crear o regenerar lotes de prueba
    for (const producto of productos) {
      console.log(`Regenerando lotes para ${producto.nombre}...`);
      
      // Crear lotes de prueba
      const numeroLotes = Math.floor(Math.random() * 3) + 1; // 1 a 3 lotes por producto
      
      for (let i = 0; i < numeroLotes; i++) {
        const loteNumero = Math.floor(Math.random() * 900) + 100; // Número de lote aleatorio entre 100 y 999
        const cantidadInicial = Math.floor(Math.random() * 20) + 5; // 5 a 25 unidades
        const pesoInicial = Math.floor(Math.random() * 50) + 10; // 10 a 60 kg
        
        // Comprobar si ya existe este lote
        let lote = await Lote.findOne({ lote: loteNumero.toString(), producto: producto._id });
        
        if (lote) {
          // Actualizar lote existente
          lote.cantidadDisponible = cantidadInicial;
          lote.pesoDisponible = pesoInicial;
          await lote.save();
          console.log(`  - Lote ${loteNumero} actualizado con ${cantidadInicial} unidades / ${pesoInicial}kg`);
        } else {
          // Crear nuevo lote
          lote = await Lote.create({
            lote: loteNumero.toString(),
            producto: producto._id,
            proveedorId: 'proveedor_test',
            fechaEntrada: new Date(),
            cantidadInicial,
            pesoInicial,
            cantidadDisponible: cantidadInicial,
            pesoDisponible: pesoInicial,
            referenciaDocumento: `TEST-${Math.floor(Math.random() * 10000)}`,
            precioCoste: Math.floor(Math.random() * 50) + 5,
            notas: 'Lote de prueba generado automáticamente'
          });
          console.log(`  - Lote ${loteNumero} creado con ${cantidadInicial} unidades / ${pesoInicial}kg`);
          
          // Registrar movimiento de entrada
          await MovimientoStock.create({
            tiendaId: 'almacen_central',
            producto: producto.nombre,
            cantidad: cantidadInicial,
            unidad: 'kg',
            lote: loteNumero.toString(),
            motivo: 'Entrada lote prueba',
            tipo: 'entrada',
            fecha: new Date(),
            peso: pesoInicial,
            proveedorId: 'proveedor_test'
          });
        }
      }
    }

    console.log('Regeneración de lotes completada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
