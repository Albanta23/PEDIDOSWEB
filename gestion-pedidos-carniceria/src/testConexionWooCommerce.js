const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

console.log('Iniciando test de WooCommerce...');

const WooCommerce = new WooCommerceRestApi({
  url: 'https://www.embutidosballesteros.es/',
  consumerKey: 'ck_9a25ffba72a149157ad7272fb2f63338525f5fcb',
  consumerSecret: 'cs_ef7aba5e01912fd36a9e41aa7d2e63c96d7d1bd7',
  version: 'wc/v3'
});

async function testConexion() {
  try {
    console.log('Probando conexión...');
    const response = await WooCommerce.get('orders', { per_page: 3 });
    console.log('✅ Conexión exitosa');
    console.log(`Pedidos encontrados: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const order = response.data[0];
      console.log('\n📦 Primer pedido:');
      console.log(`- Número: ${order.number}`);
      console.log(`- Estado: ${order.status}`);
      console.log(`- Fecha: ${order.date_created}`);
      
      console.log('\n🏢 Facturación:');
      console.log(`- Nombre: ${order.billing.first_name} ${order.billing.last_name}`);
      console.log(`- Dirección: ${order.billing.address_1}`);
      console.log(`- Ciudad: ${order.billing.city}`);
      
      console.log('\n📦 Envío:');
      console.log(`- Nombre: ${order.shipping.first_name} ${order.shipping.last_name}`);
      console.log(`- Dirección: ${order.shipping.address_1}`);
      console.log(`- Ciudad: ${order.shipping.city}`);
      
      const misma = (order.billing.address_1 === order.shipping.address_1 && 
                     order.billing.city === order.shipping.city);
      console.log(`\n🔄 ¿Misma dirección?: ${misma ? 'SÍ' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  }
}

testConexion();
