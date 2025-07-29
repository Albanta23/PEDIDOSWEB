/**
 * Script para analizar los campos de datos de clientes que se reciben de WooCommerce
 * y evaluar si podemos obtener el segundo apellido para SAGE50
 */

const WooCommerce = require('./services/woocommerceService');

async function analizarCamposWooCommerce() {
  try {
    console.log('🔍 Analizando campos de cliente de WooCommerce...\n');
    
    // Obtener algunos pedidos de WooCommerce para análisis
    const response = await WooCommerce.get('orders', { per_page: 5, status: 'completed' });
    const pedidos = response.data;
    
    if (pedidos.length === 0) {
      console.log('❌ No se encontraron pedidos para analizar');
      return;
    }
    
    console.log(`📋 Analizando ${pedidos.length} pedidos de WooCommerce:\n`);
    
    pedidos.forEach((pedido, index) => {
      console.log(`--- PEDIDO ${index + 1} (ID: ${pedido.id}) ---`);
      console.log('💳 DATOS DE FACTURACIÓN (billing):');
      
      // Mostrar todos los campos del objeto billing
      const billing = pedido.billing;
      Object.keys(billing).forEach(key => {
        console.log(`  ${key}: ${billing[key]}`);
      });
      
      console.log('\n🚚 DATOS DE ENVÍO (shipping):');
      
      // Mostrar todos los campos del objeto shipping
      const shipping = pedido.shipping;
      Object.keys(shipping).forEach(key => {
        console.log(`  ${key}: ${shipping[key]}`);
      });
      
      console.log('\n📝 ANÁLISIS DE NOMBRES:');
      console.log(`  Nombre completo actual: "${billing.first_name} ${billing.last_name}"`);
      
      // Analizar si last_name podría contener segundo apellido
      const apellidos = billing.last_name ? billing.last_name.split(' ') : [];
      if (apellidos.length > 1) {
        console.log(`  ✅ Posible separación de apellidos:`);
        console.log(`    - Primer apellido: "${apellidos[0]}"`);
        console.log(`    - Segundo apellido: "${apellidos.slice(1).join(' ')}"`);
      } else {
        console.log(`  ⚠️  Solo un apellido detectado: "${billing.last_name}"`);
      }
      
      // Buscar en meta_data campos adicionales de nombre
      if (pedido.meta_data && pedido.meta_data.length > 0) {
        console.log('\n🔍 META DATA ADICIONAL:');
        pedido.meta_data.forEach(meta => {
          if (meta.key && (
            meta.key.toLowerCase().includes('name') ||
            meta.key.toLowerCase().includes('apellido') ||
            meta.key.toLowerCase().includes('surname')
          )) {
            console.log(`  ${meta.key}: ${meta.value}`);
          }
        });
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
    // Resumen y recomendaciones
    console.log('📊 RESUMEN Y RECOMENDACIONES:\n');
    
    console.log('🔹 Campos estándar de WooCommerce disponibles:');
    console.log('  - billing.first_name: Nombre');
    console.log('  - billing.last_name: Apellido(s)');
    console.log('  - billing.company: Empresa (si aplica)');
    
    console.log('\n🔹 Posibles estrategias para el segundo apellido:');
    console.log('  1. Dividir billing.last_name por espacios');
    console.log('  2. Buscar campos personalizados en meta_data');
    console.log('  3. Solicitar al cliente que configure campos adicionales');
    
    console.log('\n🔹 Para SAGE50 necesitamos:');
    console.log('  - Nombre');
    console.log('  - Primer apellido');
    console.log('  - Segundo apellido (opcional pero recomendado)');
    
  } catch (error) {
    console.error('❌ Error al analizar campos de WooCommerce:', error.message);
  }
}

// Función para mostrar la estructura ideal para SAGE50
function mostrarEstructuraSAGE50() {
  console.log('\n🎯 ESTRUCTURA RECOMENDADA PARA SAGE50:\n');
  
  console.log('📝 Campos de cliente necesarios:');
  console.log('  - Código cliente: 430XXXXX (generado automáticamente)');
  console.log('  - Nombre: [first_name]');
  console.log('  - Primer apellido: [parte 1 de last_name]');
  console.log('  - Segundo apellido: [parte 2 de last_name o vacío]');
  console.log('  - Razón social: [company o nombre completo]');
  console.log('  - NIF: [vat]');
  console.log('  - Dirección: [address_1 + address_2]');
  console.log('  - Código postal: [postcode]');
  console.log('  - Población: [city]');
  console.log('  - Provincia: [state]');
  console.log('  - Teléfono: [phone]');
  console.log('  - Email: [email]');
}

module.exports = {
  analizarCamposWooCommerce,
  mostrarEstructuraSAGE50
};

// Si se ejecuta directamente
if (require.main === module) {
  analizarCamposWooCommerce()
    .then(() => mostrarEstructuraSAGE50())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
