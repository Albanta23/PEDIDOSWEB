const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const WooCommerce = new WooCommerceRestApi({
  url: 'https://www.embutidosballesteros.es/',
  consumerKey: 'ck_9a25ffba72a149157ad7272fb2f63338525f5fcb',
  consumerSecret: 'cs_ef7aba5e01912fd36a9e41aa7d2e63c96d7d1bd7',
  version: 'wc/v3'
});

async function buscarDireccionesDiferentes() {
  try {
    console.log('🔍 BUSCANDO PEDIDOS CON DIRECCIONES DIFERENTES...\n');
    
    let paginaActual = 1;
    let pedidosConDireccionesDiferentes = [];
    let totalPedidosRevisados = 0;
    
    while (paginaActual <= 10) { // Revisar hasta 10 páginas (1000 pedidos max)
      console.log(`📄 Revisando página ${paginaActual}...`);
      
      const response = await WooCommerce.get('orders', {
        per_page: 100,
        page: paginaActual,
        status: 'any',
        orderby: 'date',
        order: 'desc'
      });
      
      const pedidos = response.data;
      totalPedidosRevisados += pedidos.length;
      
      if (pedidos.length === 0) {
        console.log('No hay más pedidos');
        break;
      }
      
      for (const order of pedidos) {
        if (!sonDireccionesIguales(order.billing, order.shipping)) {
          pedidosConDireccionesDiferentes.push(order);
          console.log(`🎯 ENCONTRADO: Pedido #${order.number} (${order.status}) - Direcciones diferentes`);
        }
      }
      
      paginaActual++;
      
      // Si ya encontramos algunos, detenemos la búsqueda
      if (pedidosConDireccionesDiferentes.length >= 5) {
        console.log('\n✅ Encontrados suficientes ejemplos, deteniendo búsqueda...');
        break;
      }
    }
    
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   - Total pedidos revisados: ${totalPedidosRevisados}`);
    console.log(`   - Pedidos con direcciones diferentes: ${pedidosConDireccionesDiferentes.length}`);
    console.log(`   - Porcentaje: ${((pedidosConDireccionesDiferentes.length / totalPedidosRevisados) * 100).toFixed(2)}%\n`);
    
    if (pedidosConDireccionesDiferentes.length > 0) {
      console.log('🎯 ANÁLISIS DETALLADO DE DIRECCIONES DIFERENTES:\n');
      
      for (const order of pedidosConDireccionesDiferentes.slice(0, 3)) {
        mostrarComparacionDirecciones(order);
      }
    } else {
      console.log('❌ No se encontraron pedidos con direcciones de envío diferentes a las de facturación');
      console.log('ℹ️  Esto significa que todos los clientes usan la misma dirección para facturación y envío');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function sonDireccionesIguales(billing, shipping) {
  // Comparar campos clave
  const camposImportantes = ['address_1', 'city', 'postcode'];
  
  for (const campo of camposImportantes) {
    const valorBilling = (billing[campo] || '').trim().toLowerCase();
    const valorShipping = (shipping[campo] || '').trim().toLowerCase();
    
    if (valorBilling !== valorShipping) {
      return false;
    }
  }
  
  return true;
}

function mostrarComparacionDirecciones(order) {
  console.log(`🔍 PEDIDO #${order.number} (${order.status.toUpperCase()})`);
  console.log(`   📅 Fecha: ${order.date_created}`);
  console.log(`   💰 Total: ${order.total} EUR`);
  
  console.log('\n   🏢 DIRECCIÓN DE FACTURACIÓN:');
  mostrarDireccion(order.billing, '      ');
  
  console.log('\n   📦 DIRECCIÓN DE ENVÍO:');
  mostrarDireccion(order.shipping, '      ');
  
  console.log('\n   📋 DIFERENCIAS DETECTADAS:');
  compararCampos(order.billing, order.shipping);
  
  console.log('\n   🏷️ PARA ETIQUETA DE ENVÍO SE USARÍA:');
  const etiqueta = formatearParaEtiqueta(order.shipping);
  console.log(`      ${etiqueta}`);
  
  console.log('\n   ═══════════════════════════════════════════════════════════\n');
}

function mostrarDireccion(direccion, prefijo) {
  console.log(`${prefijo}Nombre: ${direccion.first_name} ${direccion.last_name}`);
  if (direccion.company) console.log(`${prefijo}Empresa: ${direccion.company}`);
  console.log(`${prefijo}Dirección 1: ${direccion.address_1}`);
  if (direccion.address_2) console.log(`${prefijo}Dirección 2: ${direccion.address_2}`);
  console.log(`${prefijo}Ciudad: ${direccion.city}`);
  console.log(`${prefijo}CP: ${direccion.postcode}`);
  console.log(`${prefijo}Provincia: ${direccion.state}`);
  console.log(`${prefijo}País: ${direccion.country}`);
}

function compararCampos(billing, shipping) {
  const campos = ['first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'postcode', 'state', 'country'];
  
  for (const campo of campos) {
    const valorBilling = billing[campo] || '';
    const valorShipping = shipping[campo] || '';
    
    if (valorBilling !== valorShipping) {
      console.log(`      ⚠️  ${campo}: "${valorBilling}" → "${valorShipping}"`);
    }
  }
}

function formatearParaEtiqueta(shipping) {
  const lineas = [];
  
  // Nombre
  lineas.push(`${shipping.first_name} ${shipping.last_name}`);
  
  // Empresa
  if (shipping.company) lineas.push(shipping.company);
  
  // Dirección
  lineas.push(shipping.address_1);
  if (shipping.address_2) lineas.push(shipping.address_2);
  
  // CP y ciudad
  lineas.push(`${shipping.postcode} ${shipping.city}`);
  
  // Provincia
  if (shipping.state) lineas.push(shipping.state);
  
  // País
  lineas.push(shipping.country);
  
  return lineas.join(' | ');
}

buscarDireccionesDiferentes();
