#!/usr/bin/env node

/**
 * Script para eliminar pedidos antiguos de WooCommerce sincronizados en pruebas
 * Estos pedidos son de 2020-2021 y no deben aparecer en el sistema actual
 */

const axios = require('axios');

// URL de la API
const API_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';

// Lista de números de pedido WooCommerce a eliminar
const numerosWooCommerceAEliminar = [
  '15810', '15807', '15806', '15804', '15802', '15788', '15785', '15780', '15779', '15776',
  '15771', '15770', '15768', '15757', '15754', '15746', '15741', '15736', '15734', '15718',
  '15715', '15712', '15711', '15703', '15701', '15700', '15698', '15697', '15696', '15686',
  '15684', '15654', '15652', '15651', '15649', '15648', '15643', '15639', '15638', '15635',
  '15632', '15626', '15625', '15622', '15612', '15577', '15575', '15573', '15563', '15562',
  '15550', '15546', '15541', '15539', '15536', '15535', '15531', '15525', '15503', '15481',
  '15479', '15477', '15476', '15466', '15459', '15452', '15450', '15449', '15447', '15438',
  '15436', '15433', '15430', '15425', '15421', '15420', '15418', '15412', '15409', '15395',
  '15381', '15364', '15354', '15351', '15319', '15311', '15292', '15270', '15248', '15213',
  '15206', '15184', '15176', '15174', '15156', '15155', '15153', '15152', '15146', '15144'
];

async function limpiarPedidosAntiguos() {
  console.log('🧹 Iniciando limpieza de pedidos antiguos de WooCommerce...');
  console.log(`📊 Se eliminarán ${numerosWooCommerceAEliminar.length} pedidos`);
  
  let eliminados = 0;
  let errores = 0;
  
  for (const numeroWoo of numerosWooCommerceAEliminar) {
    try {
      console.log(`🔍 Buscando pedido WooCommerce #${numeroWoo}...`);
      
      // Buscar el pedido por número de WooCommerce
      const response = await axios.get(`${API_URL}/pedidos-clientes?numeroPedidoWoo=${numeroWoo}`);
      const pedidos = response.data;
      
      if (pedidos && pedidos.length > 0) {
        for (const pedido of pedidos) {
          console.log(`🗑️  Eliminando pedido ${pedido.numeroPedido} (WooCommerce #${numeroWoo})...`);
          
          // Eliminar el pedido
          await axios.delete(`${API_URL}/pedidos-clientes/${pedido._id}`);
          eliminados++;
          console.log(`✅ Pedido ${pedido.numeroPedido} eliminado correctamente`);
        }
      } else {
        console.log(`⚠️  No se encontró pedido con número WooCommerce #${numeroWoo}`);
      }
      
      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error al procesar pedido WooCommerce #${numeroWoo}:`, error.response?.data || error.message);
      errores++;
    }
  }
  
  console.log('\n📋 RESUMEN DE LA LIMPIEZA:');
  console.log(`✅ Pedidos eliminados: ${eliminados}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📊 Total procesados: ${numerosWooCommerceAEliminar.length}`);
  
  if (eliminados > 0) {
    console.log('\n🎉 Limpieza completada exitosamente');
    console.log('💡 Los pedidos antiguos de WooCommerce ya no aparecerán en el listado de pedidos en borrador');
  } else {
    console.log('\n⚠️  No se eliminaron pedidos. Es posible que ya hayan sido eliminados anteriormente');
  }
}

// Ejecutar la limpieza
limpiarPedidosAntiguos()
  .then(() => {
    console.log('\n🏁 Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
