/**
 * Script para analizar estados y metadatos de pedidos de WooCommerce
 * Incluye análisis específico del estado del pedido y metadatos adicionales
 */

require('dotenv').config();
const axios = require('axios');

// Configuración de WooCommerce desde variables de entorno
const WOOCOMMERCE_CONFIG = {
  baseURL: process.env.WC_URL || 'https://www.embutidosballesteros.es',
  auth: {
    username: process.env.WC_CONSUMER_KEY || '',
    password: process.env.WC_CONSUMER_SECRET || ''
  }
};

async function analizarEstadosPedidosWooCommerce() {
  try {
    console.log('🔍 ANÁLISIS DE ESTADOS Y METADATOS DE WOOCOMMERCE\n');
    console.log(`🌐 Conectando a: ${WOOCOMMERCE_CONFIG.baseURL}\n`);
    
    // Verificar configuración
    if (!WOOCOMMERCE_CONFIG.auth.username || !WOOCOMMERCE_CONFIG.auth.password) {
      console.log('⚠️  CONFIGURACIÓN REQUERIDA:');
      console.log('   Necesitas configurar las variables de entorno:');
      console.log('   - WC_CONSUMER_KEY');
      console.log('   - WC_CONSUMER_SECRET');
      console.log('   - WC_URL\n');
      return;
    }
    
    // Obtener pedidos con diferentes estados
    const estados = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];
    
    console.log('📊 ANÁLISIS POR ESTADOS:\n');
    
    for (const estado of estados) {
      try {
        const response = await axios.get('/wp-json/wc/v3/orders', {
          baseURL: WOOCOMMERCE_CONFIG.baseURL,
          auth: WOOCOMMERCE_CONFIG.auth,
          params: {
            status: estado,
            per_page: 3,
            orderby: 'date',
            order: 'desc'
          }
        });
        
        const pedidos = response.data;
        console.log(`🔹 Estado "${estado.toUpperCase()}": ${pedidos.length} pedidos encontrados`);
        
        if (pedidos.length > 0) {
          const primerPedido = pedidos[0];
          console.log(`   📋 Ejemplo (Pedido #${primerPedido.number}):`);
          console.log(`      - ID: ${primerPedido.id}`);
          console.log(`      - Estado: ${primerPedido.status}`);
          console.log(`      - Fecha: ${primerPedido.date_created}`);
          console.log(`      - Total: ${primerPedido.total} ${primerPedido.currency}`);
          
          // Analizar metadatos del pedido
          if (primerPedido.meta_data && primerPedido.meta_data.length > 0) {
            console.log(`      - Metadatos (${primerPedido.meta_data.length} campos):`);
            primerPedido.meta_data.slice(0, 5).forEach(meta => {
              console.log(`        * ${meta.key}: ${typeof meta.value === 'object' ? JSON.stringify(meta.value).substring(0, 50) + '...' : meta.value}`);
            });
            if (primerPedido.meta_data.length > 5) {
              console.log(`        ... y ${primerPedido.meta_data.length - 5} metadatos más`);
            }
          }
          
          // Analizar datos del cliente
          console.log(`      - Cliente:`);
          console.log(`        * Nombre: ${primerPedido.billing.first_name} ${primerPedido.billing.last_name}`);
          console.log(`        * Email: ${primerPedido.billing.email}`);
          console.log(`        * Teléfono: ${primerPedido.billing.phone || 'No disponible'}`);
          
          console.log('');
        }
        
      } catch (error) {
        console.log(`❌ Error al obtener pedidos con estado "${estado}": ${error.message}`);
      }
    }
    
    // Análisis detallado de un pedido específico
    console.log('\n🔍 ANÁLISIS DETALLADO DE METADATOS:\n');
    
    try {
      const response = await axios.get('/wp-json/wc/v3/orders', {
        baseURL: WOOCOMMERCE_CONFIG.baseURL,
        auth: WOOCOMMERCE_CONFIG.auth,
        params: {
          per_page: 1,
          orderby: 'date',
          order: 'desc'
        }
      });
      
      if (response.data.length > 0) {
        const pedido = response.data[0];
        console.log(`📋 Análisis completo del Pedido #${pedido.number}:\n`);
        
        // Estados y fechas
        console.log('📅 INFORMACIÓN DE ESTADO:');
        console.log(`   - Estado actual: ${pedido.status}`);
        console.log(`   - Fecha creación: ${pedido.date_created}`);
        console.log(`   - Fecha modificación: ${pedido.date_modified}`);
        console.log(`   - Fecha completado: ${pedido.date_completed || 'No completado'}`);
        console.log(`   - Fecha pagado: ${pedido.date_paid || 'No pagado'}\n`);
        
        // Metadatos completos
        console.log('🏷️  TODOS LOS METADATOS:');
        if (pedido.meta_data && pedido.meta_data.length > 0) {
          pedido.meta_data.forEach((meta, index) => {
            console.log(`   ${index + 1}. ${meta.key}:`);
            if (typeof meta.value === 'object') {
              console.log(`      ${JSON.stringify(meta.value, null, 2).substring(0, 200)}${JSON.stringify(meta.value).length > 200 ? '...' : ''}`);
            } else {
              console.log(`      ${meta.value}`);
            }
          });
        } else {
          console.log('   No hay metadatos disponibles');
        }
        
        // Datos de líneas de pedido
        console.log('\n📦 LÍNEAS DE PEDIDO:');
        pedido.line_items.forEach((linea, index) => {
          console.log(`   ${index + 1}. ${linea.name}`);
          console.log(`      - Cantidad: ${linea.quantity}`);
          console.log(`      - Precio: ${linea.price}`);
          console.log(`      - Total: ${linea.total}`);
          if (linea.meta_data && linea.meta_data.length > 0) {
            console.log(`      - Metadatos del producto:`);
            linea.meta_data.forEach(meta => {
              console.log(`        * ${meta.key}: ${meta.display_value || meta.value}`);
            });
          }
        });
        
        console.log('\n📈 RESUMEN DE CAMPOS ÚTILES PARA ESTADO:\n');
        console.log('✅ Campos disponibles para tracking de estado:');
        console.log(`   - status: "${pedido.status}" (estado principal del pedido)`);
        console.log(`   - date_created: "${pedido.date_created}" (cuándo se creó)`);
        console.log(`   - date_modified: "${pedido.date_modified}" (última modificación)`);
        console.log(`   - date_completed: "${pedido.date_completed || 'null'}" (cuándo se completó)`);
        console.log(`   - date_paid: "${pedido.date_paid || 'null'}" (cuándo se pagó)`);
        
        console.log('\n🎯 RECOMENDACIONES:');
        console.log('   1. Usar "status" como campo principal de estado');
        console.log('   2. "date_completed" indica si el pedido está finalizado');
        console.log('   3. "date_paid" indica si el pago está confirmado');
        console.log('   4. Los metadatos pueden contener información adicional del estado');
        
      } else {
        console.log('No se encontraron pedidos para analizar');
      }
      
    } catch (error) {
      console.log(`❌ Error en análisis detallado: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Estados posibles en WooCommerce
function mostrarEstadosPosibles() {
  console.log('\n📋 ESTADOS ESTÁNDAR DE WOOCOMMERCE:\n');
  
  const estados = [
    { estado: 'pending', descripcion: 'Pendiente de pago' },
    { estado: 'processing', descripcion: 'Procesando (pago recibido)' },
    { estado: 'on-hold', descripcion: 'En espera' },
    { estado: 'completed', descripcion: 'Completado' },
    { estado: 'cancelled', descripcion: 'Cancelado' },
    { estado: 'refunded', descripcion: 'Reembolsado' },
    { estado: 'failed', descripcion: 'Fallido' }
  ];
  
  estados.forEach(({ estado, descripcion }) => {
    console.log(`   🔹 ${estado}: ${descripcion}`);
  });
  
  console.log('\n💡 NOTA: Los estados pueden ser personalizados por plugins o temas');
}

module.exports = {
  analizarEstadosPedidosWooCommerce,
  mostrarEstadosPosibles
};

// Si se ejecuta directamente
if (require.main === module) {
  analizarEstadosPedidosWooCommerce()
    .then(() => mostrarEstadosPosibles())
    .then(() => {
      console.log('\n✅ Análisis completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}
