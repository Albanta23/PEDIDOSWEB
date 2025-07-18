/**
 * Script para eliminar clientes duplicados en la base de datos
 * 
 * Este script identifica y elimina clientes duplicados basándose en criterios como:
 * - Mismo NIF
 * - Mismo correo electrónico
 * - Mismo número de teléfono
 * - Mismo nombre exacto
 * 
 * Para cada grupo de duplicados, conserva el registro más antiguo (con ID más bajo)
 * y elimina los demás.
 */

const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');

// Conexión a MongoDB
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // Fallback solo para desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    MONGODB_URI = 'mongodb://localhost:27017/pedidos_db_local';
    console.warn('[AVISO] MONGODB_URI no definida. Usando base de datos local para desarrollo.');
  } else {
    console.error('[ERROR] La variable de entorno MONGODB_URI no está definida.');
    process.exit(1);
  }
}

async function eliminarClientesDuplicados() {
  try {
    console.log('[INICIO] Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[OK] Conexión exitosa a MongoDB.');
    
    console.log('[INICIO] Contando clientes antes de limpieza...');
    const conteoInicial = await Cliente.countDocuments();
    console.log(`[INFO] Hay ${conteoInicial} clientes en la base de datos.`);
    
    // Buscar duplicados por NIF (no vacío)
    console.log('[INICIO] Buscando duplicados por NIF...');
    const duplicadosNif = await Cliente.aggregate([
      { $match: { nif: { $ne: '' } } },
      { $group: { _id: { nif: '$nif' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`[INFO] Encontrados ${duplicadosNif.length} grupos de clientes con el mismo NIF.`);
    
    // Buscar duplicados por email (no vacío)
    console.log('[INICIO] Buscando duplicados por email...');
    const duplicadosEmail = await Cliente.aggregate([
      { $match: { email: { $ne: '' } } },
      { $group: { _id: { email: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`[INFO] Encontrados ${duplicadosEmail.length} grupos de clientes con el mismo email.`);
    
    // Buscar duplicados por teléfono (no vacío)
    console.log('[INICIO] Buscando duplicados por teléfono...');
    const duplicadosTelefono = await Cliente.aggregate([
      { $match: { telefono: { $ne: '' } } },
      { $group: { _id: { telefono: '$telefono' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`[INFO] Encontrados ${duplicadosTelefono.length} grupos de clientes con el mismo teléfono.`);
    
    // Buscar duplicados por nombre exacto
    console.log('[INICIO] Buscando duplicados por nombre exacto...');
    const duplicadosNombre = await Cliente.aggregate([
      { $group: { _id: { nombre: '$nombre' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`[INFO] Encontrados ${duplicadosNombre.length} grupos de clientes con el mismo nombre exacto.`);
    
    // Combinar todos los duplicados
    const todosLosDuplicados = [...duplicadosNif, ...duplicadosEmail, ...duplicadosTelefono, ...duplicadosNombre];
    
    // Crear un mapa para saber qué IDs eliminar
    const idsAEliminar = new Set();
    for (const grupo of todosLosDuplicados) {
      // Ordenar IDs para mantener el más antiguo (ID más bajo en MongoDB)
      const idsOrdenados = grupo.ids.sort();
      // Mantener el primer ID (el más antiguo) y marcar el resto para eliminar
      for (let i = 1; i < idsOrdenados.length; i++) {
        idsAEliminar.add(idsOrdenados[i].toString());
      }
    }
    
    console.log(`[INFO] Se eliminarán ${idsAEliminar.size} clientes duplicados.`);
    
    // Convertir Set a Array para eliminar
    const idsArray = Array.from(idsAEliminar);
    
    // Eliminar en lotes de 100 para no sobrecargar la BD
    const tamanoLote = 100;
    let eliminados = 0;
    
    for (let i = 0; i < idsArray.length; i += tamanoLote) {
      const lote = idsArray.slice(i, i + tamanoLote);
      const resultado = await Cliente.deleteMany({ _id: { $in: lote } });
      eliminados += resultado.deletedCount;
      console.log(`[PROGRESO] Eliminados ${eliminados} de ${idsAEliminar.size} clientes duplicados...`);
    }
    
    console.log('[FIN] Contando clientes después de limpieza...');
    const conteoFinal = await Cliente.countDocuments();
    console.log(`[RESUMEN] Clientes antes: ${conteoInicial}, Clientes después: ${conteoFinal}, Eliminados: ${conteoInicial - conteoFinal}`);
    
    console.log('[OK] Proceso completado exitosamente.');
  } catch (error) {
    console.error('[ERROR] Ocurrió un error durante el proceso:', error);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.connection.close();
    console.log('[INFO] Conexión a MongoDB cerrada.');
  }
}

// Ejecutar la función principal
eliminarClientesDuplicados().then(() => {
  console.log('[OK] Script finalizado.');
  process.exit(0);
}).catch(err => {
  console.error('[ERROR FATAL]', err);
  process.exit(1);
});
