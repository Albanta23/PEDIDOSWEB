/**
 * Script para probar las mejoras implementadas en WooCommerce:
 * 1. Filtrado de pedidos cancelados
 * 2. Extracción de forma de pago
 * 3. Uso del segundo apellido desde metadatos
 */

const mongoose = require('mongoose');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const Cliente = require('./models/Cliente');
const PedidoCliente = require('./models/PedidoCliente');

// Configuración de WooCommerce
const WooCommerce = new WooCommerceRestApi({
  url: 'https://www.embutidosballesteros.es/',
  consumerKey: 'ck_ca95b5e2d06cfae38f14f6ccaa93863c6b72b6c5',
  consumerSecret: 'cs_1e9c7ff2c2b0dbfee4065bb6b4ea9b1e7a76a069',
  version: 'wc/v3'
});

/**
 * Función para separar nombre y apellidos (copia de woocommerceController.js)
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
  
  // Dividir el lastName por espacios y filtrar elementos vacíos
  const apellidos = lastName.trim().split(/\s+/).filter(apellido => apellido.length > 0);
  
  let primerApellido = apellidos[0] || '';
  let segundoApellido = apellidos[1] || '';
  
  // Verificar si hay segundo apellido en metadatos (campo _billing_myfield3)
  if (metaData && Array.isArray(metaData)) {
    const segundoApellidoMeta = metaData.find(meta => meta.key === '_billing_myfield3');
    if (segundoApellidoMeta && segundoApellidoMeta.value && segundoApellidoMeta.value.trim()) {
      segundoApellido = segundoApellidoMeta.value.trim();
      console.log(`[PRUEBA] Segundo apellido desde metadatos: ${segundoApellido}`);
    }
  }
  
  return {
    nombre,
    primerApellido,
    segundoApellido
  };
}

async function conectarBaseDatos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gestion-pedidos');
    console.log('[PRUEBA] Conectado a MongoDB');
  } catch (error) {
    console.error('[PRUEBA] Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function probarFiltradoCancelados() {
  console.log('\n=== PRUEBA 1: FILTRADO DE PEDIDOS CANCELADOS ===');
  
  try {
    // Obtener todos los pedidos sin filtrar
    const todosPedidos = await WooCommerce.get('orders', { per_page: 20 });
    console.log(`[PRUEBA] Total pedidos sin filtrar: ${todosPedidos.data.length}`);
    
    // Mostrar estados de todos los pedidos
    const estadosTodos = {};
    todosPedidos.data.forEach(pedido => {
      estadosTodos[pedido.status] = (estadosTodos[pedido.status] || 0) + 1;
    });
    console.log('[PRUEBA] Estados encontrados:', estadosTodos);
    
    // Obtener pedidos filtrados (como en la nueva implementación)
    const pedidosFiltrados = await WooCommerce.get('orders', {
      status: 'processing,completed,on-hold,pending',
      per_page: 20
    });
    console.log(`[PRUEBA] Pedidos filtrados (sin cancelados): ${pedidosFiltrados.data.length}`);
    
    // Mostrar estados de pedidos filtrados
    const estadosFiltrados = {};
    pedidosFiltrados.data.forEach(pedido => {
      estadosFiltrados[pedido.status] = (estadosFiltrados[pedido.status] || 0) + 1;
    });
    console.log('[PRUEBA] Estados después del filtrado:', estadosFiltrados);
    
    return pedidosFiltrados.data;
    
  } catch (error) {
    console.error('[PRUEBA] Error en filtrado de cancelados:', error.message);
    return [];
  }
}

async function probarExtraccionFormaPago(pedidos) {
  console.log('\n=== PRUEBA 2: EXTRACCIÓN DE FORMA DE PAGO ===');
  
  pedidos.slice(0, 5).forEach(pedido => {
    console.log(`\n[PRUEBA] Pedido #${pedido.id}:`);
    console.log(`  - Estado: ${pedido.status}`);
    console.log(`  - Método de pago: ${pedido.payment_method_title || pedido.payment_method || 'No especificado'}`);
    console.log(`  - Código método: ${pedido.payment_method || 'N/A'}`);
    
    // Extraer información de forma de pago
    let detallesPago = {
      metodo: pedido.payment_method_title || pedido.payment_method || 'No especificado',
      metodoCodigo: pedido.payment_method || '',
      total: pedido.total || 0
    };
    
    // Buscar metadatos específicos
    if (pedido.meta_data && Array.isArray(pedido.meta_data)) {
      const paypalSource = pedido.meta_data.find(meta => meta.key === '_ppcp_paypal_payment_source');
      const paypalFees = pedido.meta_data.find(meta => meta.key === '_ppcp_paypal_fees');
      
      if (paypalSource) {
        detallesPago.proveedor = 'PayPal';
        detallesPago.fuente = paypalSource.value;
        console.log(`  - PayPal detectado: ${paypalSource.value}`);
      }
      if (paypalFees) {
        detallesPago.comision = paypalFees.value;
        console.log(`  - Comisión PayPal: ${paypalFees.value}`);
      }
      
      // Buscar otros metadatos de pago
      const metodosPago = pedido.meta_data.filter(meta => 
        meta.key.includes('payment') || 
        meta.key.includes('stripe') || 
        meta.key.includes('paypal')
      );
      
      if (metodosPago.length > 0) {
        console.log('  - Metadatos de pago encontrados:');
        metodosPago.forEach(meta => {
          console.log(`    * ${meta.key}: ${meta.value}`);
        });
      }
    }
    
    console.log('  - Detalles procesados:', JSON.stringify(detallesPago, null, 2));
  });
}

async function probarSegundoApellido(pedidos) {
  console.log('\n=== PRUEBA 3: EXTRACCIÓN DE SEGUNDO APELLIDO ===');
  
  pedidos.slice(0, 5).forEach(pedido => {
    console.log(`\n[PRUEBA] Pedido #${pedido.id}:`);
    console.log(`  - Nombre: ${pedido.billing.first_name}`);
    console.log(`  - Apellido(s): ${pedido.billing.last_name}`);
    
    // Buscar segundo apellido en metadatos
    let segundoApellidoMeta = null;
    if (pedido.meta_data && Array.isArray(pedido.meta_data)) {
      const segundoApellidoField = pedido.meta_data.find(meta => meta.key === '_billing_myfield3');
      if (segundoApellidoField && segundoApellidoField.value) {
        segundoApellidoMeta = segundoApellidoField.value.trim();
        console.log(`  - Segundo apellido (metadatos): ${segundoApellidoMeta}`);
      }
    }
    
    // Probar la función de separación
    const datosNombre = separarNombreApellidos(
      pedido.billing.first_name, 
      pedido.billing.last_name, 
      pedido.meta_data
    );
    
    console.log('  - Resultado separación:');
    console.log(`    * Nombre: ${datosNombre.nombre}`);
    console.log(`    * Primer apellido: ${datosNombre.primerApellido}`);
    console.log(`    * Segundo apellido: ${datosNombre.segundoApellido}`);
    
    if (segundoApellidoMeta && datosNombre.segundoApellido === segundoApellidoMeta) {
      console.log('  ✅ Segundo apellido extraído correctamente desde metadatos');
    } else if (datosNombre.segundoApellido) {
      console.log('  ℹ️ Segundo apellido extraído del campo apellidos');
    } else {
      console.log('  ❌ No se encontró segundo apellido');
    }
  });
}

async function probarBaseDatos() {
  console.log('\n=== PRUEBA 4: VERIFICACIÓN BASE DE DATOS ===');
  
  try {
    // Verificar modelo PedidoCliente con campo formaPago
    const pedidosConFormaPago = await PedidoCliente.find({ 
      formaPago: { $exists: true } 
    }).limit(3);
    
    console.log(`[PRUEBA] Pedidos con forma de pago: ${pedidosConFormaPago.length}`);
    
    if (pedidosConFormaPago.length > 0) {
      pedidosConFormaPago.forEach(pedido => {
        console.log(`  - Pedido #${pedido.numeroPedido}:`);
        console.log(`    * Forma de pago: ${JSON.stringify(pedido.formaPago, null, 2)}`);
      });
    }
    
    // Verificar pedidos con segundo apellido
    const pedidosSegundoApellido = await PedidoCliente.aggregate([
      {
        $lookup: {
          from: 'clientes',
          localField: 'clienteId',
          foreignField: '_id',
          as: 'cliente'
        }
      },
      {
        $match: {
          'cliente.segundoApellido': { $exists: true, $ne: '' }
        }
      },
      { $limit: 3 }
    ]);
    
    console.log(`[PRUEBA] Clientes con segundo apellido: ${pedidosSegundoApellido.length}`);
    
    if (pedidosSegundoApellido.length > 0) {
      pedidosSegundoApellido.forEach(pedido => {
        const cliente = pedido.cliente[0];
        console.log(`  - Cliente: ${cliente.nombre} ${cliente.primerApellido} ${cliente.segundoApellido}`);
      });
    }
    
  } catch (error) {
    console.error('[PRUEBA] Error verificando base de datos:', error.message);
  }
}

async function ejecutarPruebas() {
  console.log('🚀 INICIANDO PRUEBAS DE MEJORAS WOOCOMMERCE');
  console.log('=============================================');
  
  await conectarBaseDatos();
  
  try {
    // Ejecutar pruebas secuencialmente
    const pedidos = await probarFiltradoCancelados();
    
    if (pedidos.length > 0) {
      await probarExtraccionFormaPago(pedidos);
      await probarSegundoApellido(pedidos);
    } else {
      console.log('[PRUEBA] No hay pedidos para probar');
    }
    
    await probarBaseDatos();
    
    console.log('\n✅ PRUEBAS COMPLETADAS');
    console.log('======================');
    
  } catch (error) {
    console.error('[PRUEBA] Error en las pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[PRUEBA] Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = {
  ejecutarPruebas,
  separarNombreApellidos
};
