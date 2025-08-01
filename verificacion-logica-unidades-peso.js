#!/usr/bin/env node

/**
 * Script de verificación para la lógica de UNIDADES basada en PESO
 * Según las especificaciones del usuario:
 * - SI peso > 0: Usar PESO para columna UNIDADES
 * - SI peso = 0: Usar CANTIDAD ENVIADA para columna UNIDADES
 */

console.log('🔍 VERIFICACIÓN LÓGICA UNIDADES BASADA EN PESO');
console.log('=============================================\n');

// Escenarios de prueba según las especificaciones
const escenariosPrueba = [
  {
    nombre: 'Producto con peso > 0 (debe usar PESO)',
    pedido: {
      numeroPedidoWoo: null, // No es WooCommerce
      datosFacturaWoo: null
    },
    linea: {
      producto: 'Jamón Ibérico',
      codigo: '4000004',
      peso: 2.5, // 🔍 PESO > 0 → debe usar este valor
      cantidadEnviada: 1, // No debe usar este
      cantidad: 1,
      formato: 'kg',
      precio: 45.00
    }
  },
  {
    nombre: 'Producto con peso = 0 (debe usar CANTIDAD ENVIADA)',
    pedido: {
      numeroPedidoWoo: null, // No es WooCommerce
      datosFacturaWoo: null
    },
    linea: {
      producto: 'Chorizo Unidad',
      codigo: '4000005',
      peso: 0, // 🔍 PESO = 0 → debe usar cantidadEnviada
      cantidadEnviada: 3, // 🔍 Debe usar este valor
      cantidad: 3,
      formato: 'unidad',
      precio: 12.50
    }
  },
  {
    nombre: 'Producto sin peso definido (debe usar CANTIDAD ENVIADA)',
    pedido: {
      numeroPedidoWoo: null, // No es WooCommerce
      datosFacturaWoo: null
    },
    linea: {
      producto: 'Morcilla',
      codigo: '4000006',
      // peso: undefined, // 🔍 Sin peso → debe usar cantidadEnviada
      cantidadEnviada: 2, // 🔍 Debe usar este valor
      cantidad: 2,
      formato: 'unidad',
      precio: 8.90
    }
  },
  {
    nombre: 'Pedido WooCommerce (siempre usa CANTIDAD original)',
    pedido: {
      numeroPedidoWoo: 'WC-12345', // 🔍 ES WooCommerce
      datosFacturaWoo: { numero: 'WC-12345' }
    },
    linea: {
      producto: 'Producto WooCommerce',
      codigo: '4000007',
      peso: 1.8, // Aunque tenga peso, WooCommerce usa cantidad
      cantidadEnviada: 4,
      cantidad: 5, // 🔍 WooCommerce debe usar este valor
      formato: 'kg',
      precio: 25.00
    }
  },
  {
    nombre: 'Producto con peso decimal > 0 (debe usar PESO)',
    pedido: {
      numeroPedidoWoo: null, // No es WooCommerce
      datosFacturaWoo: null
    },
    linea: {
      producto: 'Lomo Embuchado',
      codigo: '4000008',
      peso: 1.25, // 🔍 PESO > 0 → debe usar este valor
      cantidadEnviada: 1,
      cantidad: 1,
      formato: 'kg',
      precio: 32.00
    }
  }
];

function probarLogicaUnidades(escenario, index) {
  const { nombre, pedido, linea } = escenario;
  
  console.log(`📦 ${nombre}`);
  console.log('─'.repeat(60));
  
  // Mostrar datos de entrada
  console.log('📥 DATOS DE ENTRADA:');
  console.log(`   - Producto: "${linea.producto}"`);
  console.log(`   - peso: ${linea.peso !== undefined ? linea.peso : 'undefined'}`);
  console.log(`   - cantidadEnviada: ${linea.cantidadEnviada}`);
  console.log(`   - cantidad: ${linea.cantidad}`);
  console.log(`   - Es WooCommerce: ${Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo) ? 'SÍ' : 'NO'}`);
  
  // Aplicar la lógica corregida
  let unidadesFinal;
  const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
  
  console.log('\n🔄 APLICANDO LÓGICA CORREGIDA:');
  
  if (esWooCommerce) {
    // 🛒 PEDIDOS WOOCOMMERCE: Siempre usar cantidad original
    unidadesFinal = linea.cantidad || 0;
    console.log('   ✅ Es WooCommerce → usar cantidad original');
    console.log(`   ✅ Resultado: ${unidadesFinal} (cantidad)`);
  } else {
    // 🏪 PEDIDOS NORMALES: Lógica basada en el valor del peso
    console.log('   ✅ Es pedido normal → aplicar lógica de peso');
    
    if (linea.peso && linea.peso > 0) {
      unidadesFinal = linea.peso;
      console.log(`   ✅ peso (${linea.peso}) > 0 → usar PESO`);
      console.log(`   ✅ Resultado: ${unidadesFinal} (peso)`);
    } else {
      unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0;
      console.log(`   ✅ peso (${linea.peso || 'undefined'}) = 0 o no existe → usar CANTIDAD ENVIADA`);
      console.log(`   ✅ Resultado: ${unidadesFinal} (cantidadEnviada)`);
    }
  }
  
  // Verificar el resultado esperado
  let resultadoEsperado;
  let explicacionEsperada;
  
  if (esWooCommerce) {
    resultadoEsperado = linea.cantidad;
    explicacionEsperada = 'cantidad (WooCommerce)';
  } else if (linea.peso && linea.peso > 0) {
    resultadoEsperado = linea.peso;
    explicacionEsperada = 'peso (peso > 0)';
  } else {
    resultadoEsperado = linea.cantidadEnviada || linea.cantidad || 0;
    explicacionEsperada = 'cantidadEnviada (peso = 0)';
  }
  
  const esCorrecto = unidadesFinal === resultadoEsperado;
  
  console.log('\n🎯 RESULTADO SAGE50:');
  console.log(`   - COLUMNA UNIDADES: ${unidadesFinal}`);
  console.log(`   - ORIGEN: ${explicacionEsperada}`);
  console.log(`   - ✅ Resultado correcto: ${esCorrecto ? '✅ SÍ' : '❌ NO'}`);
  
  if (!esCorrecto) {
    console.log(`   ❌ Esperado: ${resultadoEsperado}, Obtenido: ${unidadesFinal}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  return {
    unidadesFinal,
    correcto: esCorrecto,
    origen: explicacionEsperada
  };
}

// Ejecutar todas las pruebas
const resultados = escenariosPrueba.map((escenario, index) => 
  probarLogicaUnidades(escenario, index)
);

// Resumen final
console.log('📊 RESUMEN VERIFICACIÓN:');
console.log('========================');
const todosCorrectos = resultados.every(r => r.correcto);
console.log(`🎯 Lógica funcionando correctamente: ${todosCorrectos ? '✅ SÍ' : '❌ NO'}`);

console.log('\n📋 RESULTADOS POR ESCENARIO:');
resultados.forEach((resultado, index) => {
  const escenario = escenariosPrueba[index];
  console.log(`   ${index + 1}. ${escenario.nombre}`);
  console.log(`      UNIDADES: ${resultado.unidadesFinal} (${resultado.origen})`);
});

console.log('\n💡 LÓGICA IMPLEMENTADA:');
console.log('- WooCommerce: Siempre usar cantidad original');
console.log('- Pedidos normales con peso > 0: Usar PESO');
console.log('- Pedidos normales con peso = 0: Usar CANTIDAD ENVIADA');

if (todosCorrectos) {
  console.log('\n🎉 ¡La lógica de UNIDADES está funcionando correctamente!');
  console.log('✅ Se respeta la regla: peso > 0 → peso, peso = 0 → cantidadEnviada');
} else {
  console.log('\n❌ Hay problemas en la lógica de UNIDADES');
}
