/**
 * Script de migración para añadir el campo exportadoSage a pedidos existentes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PedidoCliente = require('./models/PedidoCliente');

async function migrarCampoExportadoSage() {
  try {
    console.log('[MIGRACIÓN] Iniciando migración del campo exportadoSage...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MIGRACIÓN] Conectado a MongoDB Atlas');
    
    // Actualizar todos los pedidos que no tengan el campo exportadoSage
    const resultado = await PedidoCliente.updateMany(
      { exportadoSage: { $exists: false } },
      { $set: { exportadoSage: false } }
    );
    
    console.log(`[MIGRACIÓN] Campo exportadoSage añadido a ${resultado.modifiedCount} pedidos`);
    
    // Verificar el resultado
    const totalPedidos = await PedidoCliente.countDocuments();
    const pedidosConCampo = await PedidoCliente.countDocuments({ exportadoSage: { $exists: true } });
    
    console.log(`[MIGRACIÓN] Verificación:`);
    console.log(`  - Total pedidos: ${totalPedidos}`);
    console.log(`  - Pedidos con campo exportadoSage: ${pedidosConCampo}`);
    console.log(`  - Migración ${pedidosConCampo === totalPedidos ? 'EXITOSA' : 'INCOMPLETA'}`);
    
  } catch (error) {
    console.error('[MIGRACIÓN] Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[MIGRACIÓN] Desconectado de MongoDB');
  }
}

// Ejecutar la migración si el script se ejecuta directamente
if (require.main === module) {
  migrarCampoExportadoSage();
}

module.exports = { migrarCampoExportadoSage };
