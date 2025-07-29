// Script directo para corregir índices de lotes sin endpoint
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function corregirIndicesLotes() {
  try {
    console.log('🔧 Conectando a MongoDB...');
    
    // Usar la misma conexión que el servidor
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://root:pataca123@cluster0.oqhav.mongodb.net/test?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Conectado a MongoDB');
    
    // Acceder directamente a la colección MongoDB nativa
    const coleccionLotes = mongoose.connection.collection('lotes');
    
    // 1. Obtener información sobre índices existentes
    const indicesExistentes = await coleccionLotes.indexes();
    console.log('📋 Índices existentes:', indicesExistentes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));
    
    // 2. Buscar el índice problemático
    const indiceProblematicoNombre = 'producto_1_codigo_1_ubicacion_1';
    const indiceProblematicoExiste = indicesExistentes.find(idx => idx.name === indiceProblematicoNombre);
    
    if (indiceProblematicoExiste) {
      console.log('❌ Encontrado índice problemático:', indiceProblematicoNombre);
      
      // 3. Eliminar el índice problemático
      try {
        await coleccionLotes.dropIndex(indiceProblematicoNombre);
        console.log('✅ Índice problemático eliminado exitosamente');
      } catch (dropError) {
        if (dropError.code === 27) { // IndexNotFound
          console.log('ℹ️ El índice ya no existe');
        } else {
          throw dropError;
        }
      }
    } else {
      console.log('✅ El índice problemático no existe (ya fue eliminado)');
    }
    
    // 4. Verificar que los índices necesarios existen
    const indicesNecesarios = [
      { key: { producto: 1 }, name: 'producto_1' },
      { key: { codigo: 1 }, name: 'codigo_1' },
      { key: { ubicacion: 1 }, name: 'ubicacion_1' }
    ];
    
    for (const indiceRequerido of indicesNecesarios) {
      const existe = indicesExistentes.find(idx => idx.name === indiceRequerido.name);
      if (!existe) {
        try {
          await coleccionLotes.createIndex(indiceRequerido.key, { name: indiceRequerido.name });
          console.log(`✅ Creado índice requerido: ${indiceRequerido.name}`);
        } catch (createError) {
          console.log(`ℹ️ Índice ${indiceRequerido.name} ya existe o no es necesario crear`);
        }
      } else {
        console.log(`✅ Índice requerido ya existe: ${indiceRequerido.name}`);
      }
    }
    
    // 5. Obtener información actualizada de índices
    const indicesFinales = await coleccionLotes.indexes();
    console.log('🎯 Índices finales:', indicesFinales.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));
    
    console.log('✅ Corrección de índices completada');
    
  } catch (error) {
    console.error('❌ Error durante la corrección de índices:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Desconectado de MongoDB');
  }
}

// Ejecutar el script
corregirIndicesLotes().then(() => {
  console.log('🎉 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
