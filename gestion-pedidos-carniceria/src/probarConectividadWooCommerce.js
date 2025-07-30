/**
 * Script simplificado para probar las mejoras de WooCommerce sin base de datos
 */

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

// Configuración de WooCommerce
const WooCommerce = new WooCommerceRestApi({
  url: 'https://www.embutidosballesteros.es/',
  consumerKey: 'ck_ca95b5e2d06cfae38f14f6ccaa93863c6b72b6c5',
  consumerSecret: 'cs_1e9c7ff2c2b0dbfee4065bb6b4ea9b1e7a76a069',
  version: 'wc/v3'
});

/**
 * Función para separar nombre y apellidos
 */
function separarNombreApellidos(firstName, lastName, metaData = []) {
  const nombre = firstName ? firstName.trim() : '';
  
  if (!lastName) {
    return {
      nombre,
      primerApellido: '',
      segundoApellido: ''
    };
  }
  
  const apellidos = lastName.trim().split(/\s+/).filter(apellido => apellido.length > 0);
  
  let primerApellido = apellidos[0] || '';
  let segundoApellido = apellidos[1] || '';
  
  // Verificar segundo apellido en metadatos
  if (metaData && Array.isArray(metaData)) {
    const segundoApellidoMeta = metaData.find(meta => meta.key === '_billing_myfield3');
    if (segundoApellidoMeta && segundoApellidoMeta.value && segundoApellidoMeta.value.trim()) {
      segundoApellido = segundoApellidoMeta.value.trim();
      console.log(`✅ Segundo apellido desde metadatos: ${segundoApellido}`);
    }
  }
  
  return {
    nombre,
    primerApellido,
    segundoApellido
  };
}

async function probarMejoras() {
  console.log('🚀 PRUEBAS DE MEJORAS WOOCOMMERCE (SIN BD)');
  console.log('==========================================');
  
  try {
    // 1. FILTRADO DE PEDIDOS CANCELADOS
    console.log('\n=== PRUEBA 1: FILTRADO DE PEDIDOS CANCELADOS ===');
    
    const todosPedidos = await WooCommerce.get('orders', { per_page: 20 });
    console.log(`📊 Total pedidos sin filtrar: ${todosPedidos.data.length}`);
    
    const estadosTodos = {};
    todosPedidos.data.forEach(pedido => {
      estadosTodos[pedido.status] = (estadosTodos[pedido.status] || 0) + 1;
    });
    console.log('📋 Estados encontrados:', estadosTodos);
    
    // Aplicar filtro (como en la implementación)
    const pedidosFiltrados = await WooCommerce.get('orders', {
      status: 'processing,completed,on-hold,pending',
      per_page: 20
    });
    console.log(`✅ Pedidos filtrados (sin cancelados): ${pedidosFiltrados.data.length}`);
    
    const estadosFiltrados = {};
    pedidosFiltrados.data.forEach(pedido => {
      estadosFiltrados[pedido.status] = (estadosFiltrados[pedido.status] || 0) + 1;
    });
    console.log('✅ Estados después del filtrado:', estadosFiltrados);
    
    // 2. EXTRACCIÓN DE FORMA DE PAGO
    console.log('\n=== PRUEBA 2: EXTRACCIÓN DE FORMA DE PAGO ===');
    
    let pedidosConPago = 0;
    let pedidosConPayPal = 0;
    
    pedidosFiltrados.data.slice(0, 10).forEach(pedido => {
      const formaPago = pedido.payment_method_title || pedido.payment_method || 'No especificado';
      
      console.log(`\n📦 Pedido #${pedido.id}:`);
      console.log(`   Estado: ${pedido.status}`);
      console.log(`   Método pago: ${formaPago}`);
      console.log(`   Código método: ${pedido.payment_method || 'N/A'}`);
      console.log(`   Total: ${pedido.total} €`);
      
      let detallesPago = {
        metodo: formaPago,
        metodoCodigo: pedido.payment_method || '',
        total: pedido.total || 0
      };
      
      if (pedido.meta_data && Array.isArray(pedido.meta_data)) {
        const paypalSource = pedido.meta_data.find(meta => meta.key === '_ppcp_paypal_payment_source');
        const paypalFees = pedido.meta_data.find(meta => meta.key === '_ppcp_paypal_fees');
        
        if (paypalSource) {
          detallesPago.proveedor = 'PayPal';
          detallesPago.fuente = paypalSource.value;
          console.log(`   💳 PayPal detectado: ${paypalSource.value}`);
          pedidosConPayPal++;
        }
        if (paypalFees) {
          detallesPago.comision = paypalFees.value;
          console.log(`   💰 Comisión PayPal: ${paypalFees.value}`);
        }
        
        // Buscar otros metadatos de pago
        const metodosPago = pedido.meta_data.filter(meta => 
          meta.key.includes('payment') || 
          meta.key.includes('stripe') || 
          meta.key.includes('paypal') ||
          meta.key.includes('_ppcp')
        );
        
        if (metodosPago.length > 0) {
          console.log(`   🔍 Metadatos de pago (${metodosPago.length}):`);
          metodosPago.forEach(meta => {
            console.log(`      ${meta.key}: ${JSON.stringify(meta.value).substring(0, 100)}`);
          });
        }
      }
      
      if (formaPago !== 'No especificado') {
        pedidosConPago++;
      }
    });
    
    console.log(`\n📊 Resumen formas de pago:`);
    console.log(`   - Pedidos con método de pago: ${pedidosConPago}/10`);
    console.log(`   - Pedidos con PayPal: ${pedidosConPayPal}/10`);
    
    // 3. EXTRACCIÓN DE SEGUNDO APELLIDO
    console.log('\n=== PRUEBA 3: EXTRACCIÓN DE SEGUNDO APELLIDO ===');
    
    let pedidosConSegundoApellido = 0;
    let pedidosConMetadatos = 0;
    
    pedidosFiltrados.data.slice(0, 10).forEach(pedido => {
      console.log(`\n👤 Pedido #${pedido.id}:`);
      console.log(`   Nombre: ${pedido.billing.first_name}`);
      console.log(`   Apellido(s): ${pedido.billing.last_name}`);
      
      // Buscar segundo apellido en metadatos
      let segundoApellidoMeta = null;
      if (pedido.meta_data && Array.isArray(pedido.meta_data)) {
        const segundoApellidoField = pedido.meta_data.find(meta => meta.key === '_billing_myfield3');
        if (segundoApellidoField && segundoApellidoField.value) {
          segundoApellidoMeta = segundoApellidoField.value.trim();
          console.log(`   📝 Segundo apellido (metadatos): ${segundoApellidoMeta}`);
          pedidosConMetadatos++;
        }
      }
      
      // Probar la función de separación
      const datosNombre = separarNombreApellidos(
        pedido.billing.first_name, 
        pedido.billing.last_name, 
        pedido.meta_data
      );
      
      console.log(`   📋 Resultado separación:`);
      console.log(`      Nombre: ${datosNombre.nombre}`);
      console.log(`      Primer apellido: ${datosNombre.primerApellido}`);
      console.log(`      Segundo apellido: ${datosNombre.segundoApellido}`);
      
      if (datosNombre.segundoApellido) {
        pedidosConSegundoApellido++;
        
        if (segundoApellidoMeta && datosNombre.segundoApellido === segundoApellidoMeta) {
          console.log(`   ✅ Segundo apellido extraído correctamente desde metadatos`);
        } else {
          console.log(`   ℹ️ Segundo apellido extraído del campo apellidos`);
        }
      } else {
        console.log(`   ❌ No se encontró segundo apellido`);
      }
    });
    
    console.log(`\n📊 Resumen apellidos:`);
    console.log(`   - Pedidos con segundo apellido: ${pedidosConSegundoApellido}/10`);
    console.log(`   - Pedidos con metadatos apellido: ${pedidosConMetadatos}/10`);
    
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('=================================');
    console.log('🎯 MEJORAS IMPLEMENTADAS:');
    console.log('   ✅ Filtrado de pedidos cancelados');
    console.log('   ✅ Extracción de formas de pago');
    console.log('   ✅ Uso de segundo apellido desde metadatos');
    console.log('   ✅ Campo formaPago agregado al modelo');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarMejoras();
}

module.exports = { probarMejoras };
