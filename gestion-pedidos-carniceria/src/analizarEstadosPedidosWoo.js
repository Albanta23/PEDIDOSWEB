/**
 * Script para analizar específicamente los estados de pedidos y metadatos de WooCommerce
 */

const WooCommerce = require('./services/woocommerceService');

async function analizarEstadosPedidosWooCommerce() {
  try {
    console.log('🔍 Analizando estados de pedidos de WooCommerce...\n');
    
    // Obtener pedidos con diferentes estados para análisis completo
    const estados = ['processing', 'completed', 'pending', 'on-hold', 'cancelled', 'refunded', 'failed'];
    
    for (const estado of estados) {
      try {
        console.log(`📋 Analizando pedidos con estado: "${estado}"`);
        const response = await WooCommerce.get('orders', { 
          status: estado, 
          per_page: 3 
        });
        
        if (response.data && response.data.length > 0) {
          console.log(`✅ Encontrados ${response.data.length} pedidos con estado "${estado}"`);
          
          response.data.forEach((pedido, index) => {
            console.log(`\n  --- PEDIDO ${index + 1} (ID: ${pedido.id}) ---`);
            console.log(`  📊 Estado WooCommerce: "${pedido.status}"`);
            console.log(`  📅 Fecha creación: ${pedido.date_created}`);
            console.log(`  📅 Fecha modificación: ${pedido.date_modified}`);
            console.log(`  💰 Total: ${pedido.total} ${pedido.currency}`);
            
            // Analizar campos relacionados con el estado
            console.log(`\n  🏷️  CAMPOS DE ESTADO DISPONIBLES:`);
            console.log(`    - status: "${pedido.status}"`);
            console.log(`    - date_created: "${pedido.date_created}"`);
            console.log(`    - date_modified: "${pedido.date_modified}"`);
            console.log(`    - date_completed: "${pedido.date_completed || 'N/A'}"`);
            console.log(`    - date_paid: "${pedido.date_paid || 'N/A'}"`);
            
            // Analizar metadatos específicos del estado
            if (pedido.meta_data && pedido.meta_data.length > 0) {
              console.log(`\n  🔍 METADATOS RELACIONADOS CON ESTADO:`);
              const metadatosEstado = pedido.meta_data.filter(meta => 
                meta.key && (
                  meta.key.toLowerCase().includes('status') ||
                  meta.key.toLowerCase().includes('estado') ||
                  meta.key.toLowerCase().includes('payment') ||
                  meta.key.toLowerCase().includes('pago') ||
                  meta.key.toLowerCase().includes('shipping') ||
                  meta.key.toLowerCase().includes('envio') ||
                  meta.key.toLowerCase().includes('completed') ||
                  meta.key.toLowerCase().includes('procesado')
                )
              );
              
              if (metadatosEstado.length > 0) {
                metadatosEstado.forEach(meta => {
                  console.log(`    - ${meta.key}: ${meta.value}`);
                });
              } else {
                console.log(`    (No se encontraron metadatos específicos de estado)`);
              }
            }
            
            // Analizar notas del pedido
            if (pedido.customer_note) {
              console.log(`\n  📝 Nota del cliente: "${pedido.customer_note}"`);
            }
            
            // Analizar método de pago
            if (pedido.payment_method || pedido.payment_method_title) {
              console.log(`\n  💳 INFORMACIÓN DE PAGO:`);
              console.log(`    - Método: ${pedido.payment_method || 'N/A'}`);
              console.log(`    - Título: ${pedido.payment_method_title || 'N/A'}`);
            }
            
            // Analizar método de envío
            if (pedido.shipping_lines && pedido.shipping_lines.length > 0) {
              console.log(`\n  🚚 INFORMACIÓN DE ENVÍO:`);
              pedido.shipping_lines.forEach(shipping => {
                console.log(`    - Método: ${shipping.method_title || 'N/A'}`);
                console.log(`    - Total: ${shipping.total || 'N/A'}`);
              });
            }
          });
        } else {
          console.log(`❌ No se encontraron pedidos con estado "${estado}"`);
        }
        
        console.log('\n' + '='.repeat(60));
        
      } catch (error) {
        console.log(`⚠️  Error al obtener pedidos con estado "${estado}": ${error.message}`);
      }
    }
    
    // Mostrar mapeo recomendado de estados
    mostrarMapeoEstados();
    
  } catch (error) {
    console.error('❌ Error general al analizar estados:', error.message);
  }
}

function mostrarMapeoEstados() {
  console.log('\n🎯 MAPEO RECOMENDADO DE ESTADOS WooCommerce → Sistema Interno:\n');
  
  const mapeoEstados = {
    'pending': 'pendiente_pago',
    'processing': 'en_preparacion', 
    'on-hold': 'en_espera',
    'completed': 'completado',
    'cancelled': 'cancelado',
    'refunded': 'devuelto',
    'failed': 'fallido'
  };
  
  Object.entries(mapeoEstados).forEach(([wooEstado, sistemaEstado]) => {
    console.log(`  📊 "${wooEstado}" → "${sistemaEstado}"`);
  });
  
  console.log('\n📋 CAMPOS ÚTILES PARA SEGUIMIENTO:');
  console.log('  ✅ status: Estado actual del pedido');
  console.log('  ✅ date_created: Fecha de creación');
  console.log('  ✅ date_modified: Última modificación');
  console.log('  ✅ date_completed: Fecha de completado');
  console.log('  ✅ date_paid: Fecha de pago');
  console.log('  ✅ payment_method: Método de pago usado');
  console.log('  ✅ customer_note: Notas del cliente');
}

// Función para mostrar estructura de datos completa
async function mostrarEstructuraCompleta() {
  try {
    console.log('\n🔬 ESTRUCTURA COMPLETA DE UN PEDIDO WOOCOMMERCE:\n');
    
    const response = await WooCommerce.get('orders', { per_page: 1 });
    if (response.data && response.data.length > 0) {
      const pedido = response.data[0];
      
      // Mostrar solo las claves principales para no saturar
      console.log('📋 CAMPOS PRINCIPALES DISPONIBLES:');
      Object.keys(pedido).forEach(key => {
        const value = pedido[key];
        const tipo = Array.isArray(value) ? `array[${value.length}]` : typeof value;
        console.log(`  - ${key}: ${tipo}`);
      });
      
      // Mostrar algunos metadatos de ejemplo
      if (pedido.meta_data && pedido.meta_data.length > 0) {
        console.log(`\n🔍 EJEMPLO DE METADATOS (primeros 10):)`);
        pedido.meta_data.slice(0, 10).forEach(meta => {
          console.log(`  - ${meta.key}: ${typeof meta.value === 'object' ? 'objeto' : meta.value}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error al obtener estructura:', error.message);
  }
}

module.exports = {
  analizarEstadosPedidosWooCommerce,
  mostrarEstructuraCompleta
};

// Si se ejecuta directamente
if (require.main === module) {
  analizarEstadosPedidosWooCommerce()
    .then(() => mostrarEstructuraCompleta())
    .then(() => {
      console.log('\n✅ Análisis completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
