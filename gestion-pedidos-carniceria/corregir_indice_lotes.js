// Script integrado para corregir índice de lotes desde el servidor
// Este script se ejecuta usando Mongoose ya conectado

const mongoose = require('mongoose');
const Lote = require('./src/models/Lote');

async function corregirIndiceLotes() {
  try {
    console.log('[INDICE-FIX] Iniciando corrección de índices en colección lotes...');
    
    // Obtener la colección nativa de MongoDB
    const collection = mongoose.connection.db.collection('lotes');
    
    // Mostrar índices actuales
    console.log('[INDICE-FIX] Índices actuales en colección lotes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (nombre: ${index.name || 'sin nombre'})`);
    });
    
    // Buscar y eliminar el índice problemático
    const problematicIndexName = 'producto_1_codigo_1_ubicacion_1';
    let indiceProblematicoEliminado = false;
    
    try {
      await collection.dropIndex(problematicIndexName);
      console.log(`[INDICE-FIX] ✅ Índice problemático "${problematicIndexName}" eliminado correctamente`);
      indiceProblematicoEliminado = true;
    } catch (err) {
      if (err.code === 27) {
        console.log(`[INDICE-FIX] ℹ️  El índice "${problematicIndexName}" no existe (ya fue eliminado)`);
      } else {
        console.error(`[INDICE-FIX] ⚠️  Error al eliminar índice: ${err.message}`);
      }
    }
    
    // También intentar eliminar por patrón de clave
    const indicesParaEliminar = indexes.filter(idx => 
      idx.key && 
      idx.key.producto === 1 && 
      idx.key.codigo === 1 && 
      idx.key.ubicacion === 1
    );
    
    for (const idx of indicesParaEliminar) {
      try {
        await collection.dropIndex(idx.name);
        console.log(`[INDICE-FIX] ✅ Índice problemático "${idx.name}" eliminado por patrón de clave`);
        indiceProblematicoEliminado = true;
      } catch (err) {
        console.error(`[INDICE-FIX] ⚠️  Error al eliminar índice por patrón: ${err.message}`);
      }
    }
    
    // Verificar que el índice correcto existe
    const indicesFinales = await collection.indexes();
    const correctIndexExists = indicesFinales.some(idx => 
      idx.key && idx.key.producto === 1 && idx.key.lote === 1 && Object.keys(idx.key).length === 2
    );
    
    if (!correctIndexExists) {
      console.log('[INDICE-FIX] Creando índice correcto producto + lote...');
      await collection.createIndex(
        { producto: 1, lote: 1 }, 
        { unique: true, name: 'producto_1_lote_1' }
      );
      console.log('[INDICE-FIX] ✅ Índice correcto creado');
    } else {
      console.log('[INDICE-FIX] ✅ El índice correcto ya existe');
    }
    
    // Mostrar índices finales
    console.log('[INDICE-FIX] Índices finales en colección lotes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (nombre: ${index.name || 'sin nombre'})`);
    });
    
    if (indiceProblematicoEliminado) {
      console.log('[INDICE-FIX] 🎯 ¡CORRECCIÓN COMPLETADA! El error de entradas de fábrica debería estar resuelto.');
    } else {
      console.log('[INDICE-FIX] ℹ️  No se encontró el índice problemático. El error podría persistir.');
    }
    
    return { success: true, indiceProblematicoEliminado };
    
  } catch (error) {
    console.error('[INDICE-FIX] ❌ Error durante la corrección:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { corregirIndiceLotes };
