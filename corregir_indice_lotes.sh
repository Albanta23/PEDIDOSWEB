#!/bin/bash

# Script para corregir el error de índice duplicado en la colección de lotes
# Error: E11000 duplicate key error collection: test.lotes index: producto_1_codigo_1_ubicacion_1

echo "🔧 Corrigiendo índice problemático en colección de lotes..."
echo "=========================================="

# Conectar a MongoDB y eliminar el índice problemático
cat << 'EOF' > fix_lote_index.js
// Script para MongoDB - Eliminar índice problemático en lotes
const { MongoClient } = require('mongodb');

async function fixLoteIndex() {
  // Usar la misma conexión que el servidor
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pedidos-carniceria';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('[MONGO] Conectado a la base de datos');
    
    const db = client.db();
    const collection = db.collection('lotes');
    
    // Mostrar índices actuales
    console.log('[MONGO] Índices actuales en colección lotes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (nombre: ${index.name})`);
    });
    
    // Buscar y eliminar el índice problemático
    const problematicIndexName = 'producto_1_codigo_1_ubicacion_1';
    
    try {
      await collection.dropIndex(problematicIndexName);
      console.log(`[MONGO] ✅ Índice problemático "${problematicIndexName}" eliminado correctamente`);
    } catch (err) {
      if (err.code === 27) {
        console.log(`[MONGO] ℹ️  El índice "${problematicIndexName}" no existe (ya fue eliminado)`);
      } else {
        console.error(`[MONGO] ❌ Error al eliminar índice: ${err.message}`);
      }
    }
    
    // Verificar que el índice correcto existe
    const correctIndexExists = indexes.some(idx => 
      JSON.stringify(idx.key) === '{"producto":1,"lote":1}'
    );
    
    if (!correctIndexExists) {
      console.log('[MONGO] Creando índice correcto producto + lote...');
      await collection.createIndex(
        { producto: 1, lote: 1 }, 
        { unique: true, name: 'producto_1_lote_1' }
      );
      console.log('[MONGO] ✅ Índice correcto creado');
    } else {
      console.log('[MONGO] ✅ El índice correcto ya existe');
    }
    
    // Mostrar índices finales
    console.log('[MONGO] Índices finales en colección lotes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (nombre: ${index.name})`);
    });
    
    console.log('[MONGO] ✅ Corrección completada exitosamente');
    
  } catch (error) {
    console.error('[MONGO] ❌ Error durante la corrección:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('[MONGO] Conexión cerrada');
  }
}

if (require.main === module) {
  fixLoteIndex().then(() => {
    console.log('🎯 Script completado exitosamente');
    process.exit(0);
  }).catch(err => {
    console.error('💥 Error en el script:', err);
    process.exit(1);
  });
}

module.exports = { fixLoteIndex };
EOF

echo "📝 Script generado: fix_lote_index.js"
echo ""
echo "🚀 Para ejecutar la corrección:"
echo "   cd /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria"
echo "   node ../fix_lote_index.js"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Este script eliminará el índice problemático"
echo "   - Verificará que existe el índice correcto (producto + lote)"
echo "   - Es seguro ejecutarlo múltiples veces"
echo ""
echo "🔍 Detalles del problema:"
echo "   - Error: E11000 duplicate key error"
echo "   - Índice problemático: producto_1_codigo_1_ubicacion_1"
echo "   - Índice correcto: producto_1_lote_1"
echo ""
echo "✅ Después de ejecutar este script, las entradas de fábrica"
echo "   deberían funcionar sin errores de duplicación."
