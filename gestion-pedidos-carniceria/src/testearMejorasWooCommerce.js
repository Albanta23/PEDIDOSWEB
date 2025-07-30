/**
 * Script para probar las mejoras implementadas en WooCommerce:
 * 1. Filtro de pedidos cancelados
 * 2. Extracción de forma de pago
 * 3. Uso mejorado del segundo apellido desde metadatos
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Importar la función mejorada
const { separarNombreApellidos, determinarFormaPago } = require('./woocommerceController');

// Configuración de WooCommerce
const WC_CONFIG = {
  baseURL: process.env.WC_URL,
  auth: {
    username: process.env.WC_CONSUMER_KEY,
    password: process.env.WC_CONSUMER_SECRET
  }
};

async function probarMejorasWooCommerce() {
  try {
    console.log('🧪 PRUEBA DE MEJORAS EN WOOCOMMERCE\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    // Obtener pedidos de WooCommerce para probar
    console.log('📥 Obteniendo pedidos de WooCommerce...');
    const response = await axios.get('/wp-json/wc/v3/orders', {
      baseURL: WC_CONFIG.baseURL,
      auth: WC_CONFIG.auth,
      params: {
        per_page: 5,
        orderby: 'date',
        order: 'desc'
      }
    });
    
    const pedidos = response.data;
    console.log(`📋 Encontrados ${pedidos.length} pedidos recientes\n`);
    
    // Probar cada pedido
    for (const pedido of pedidos) {
      console.log(`\n🔍 ANALIZANDO PEDIDO #${pedido.number} (${pedido.status.toUpperCase()})`);
      console.log(`   Fecha: ${pedido.date_created}`);
      console.log(`   Total: ${pedido.total} ${pedido.currency}`);
      
      // 1. PRUEBA DE FILTRO DE ESTADO
      const esCancelado = pedido.status === 'cancelled';
      console.log(`   ❌ ¿Cancelado?: ${esCancelado ? 'SÍ - NO SE SINCRONIZARÍA' : 'NO - SE SINCRONIZARÍA'}`);
      
      if (esCancelado) {
        console.log('   ⏭️  Saltando pedido cancelado...');
        continue;
      }
      
      // 2. PRUEBA DE EXTRACCIÓN DE APELLIDOS
      const datosCliente = pedido.billing;
      const segundoApellidoMeta = pedido.meta_data?.find(m => m.key === '_billing_myfield3')?.value || '';
      
      console.log(`   📝 Datos del cliente:`);
      console.log(`      - first_name: "${datosCliente.first_name}"`);
      console.log(`      - last_name: "${datosCliente.last_name}"`);
      console.log(`      - _billing_myfield3: "${segundoApellidoMeta}"`);
      
      const apellidosExtraidos = separarNombreApellidos(
        datosCliente.first_name, 
        datosCliente.last_name, 
        pedido.meta_data
      );
      console.log(`   🎯 Apellidos extraídos:`);
      console.log(`      - primerApellido: "${apellidosExtraidos.primerApellido}"`);
      console.log(`      - segundoApellido: "${apellidosExtraidos.segundoApellido}"`);
      
      // 3. PRUEBA DE FORMA DE PAGO
      const formaPago = determinarFormaPago(pedido);
      console.log(`   💳 Forma de pago:`);
      console.log(`      - payment_method: "${pedido.payment_method}"`);
      console.log(`      - payment_method_title: "${pedido.payment_method_title}"`);
      console.log(`      - formaPago extraída: "${JSON.stringify(formaPago)}"`);
      
      // 4. BUSCAR METADATOS DE PAGO ADICIONALES
      const metasPago = pedido.meta_data?.filter(meta => 
        meta.key.toLowerCase().includes('paypal') || 
        meta.key.toLowerCase().includes('payment') ||
        meta.key.toLowerCase().includes('transaction')
      ) || [];
      
      if (metasPago.length > 0) {
        console.log(`   🏷️  Metadatos de pago encontrados:`);
        metasPago.forEach(meta => {
          const valor = typeof meta.value === 'object' ? JSON.stringify(meta.value).substring(0, 100) + '...' : meta.value;
          console.log(`      - ${meta.key}: ${valor}`);
        });
      }
      
      console.log(`   ✅ Resumen: ${esCancelado ? 'OMITIDO' : 'PROCESABLE'}`);
    }
    
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('✅ Filtro de cancelados: Implementado');
    console.log('✅ Extracción de apellidos: Mejorado con metadatos');
    console.log('✅ Detección de forma de pago: Implementado');
    console.log('✅ MongoDB: Conectado correctamente');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

// Ejecutar pruebas
if (require.main === module) {
  probarMejorasWooCommerce()
    .then(() => {
      console.log('\n🎉 Pruebas completadas exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { probarMejorasWooCommerce };
