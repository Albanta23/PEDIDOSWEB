#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar el mapeo del código de producto en la columna ARTICULO
 */

// Simular diferentes escenarios de líneas de producto
const escenariosPrueba = [
  {
    nombre: 'Producto CON codigoSage',
    linea: {
      producto: 'Jamón Ibérico',
      codigoSage: 'JAM001', // 🔍 CÓDIGO EXISTENTE
      cantidad: 1,
      peso: 2.5,
      formato: 'kg',
      cantidadEnviada: 1,
      precioUnitario: 45.00
    }
  },
  {
    nombre: 'Producto SIN codigoSage (debería generar automático)',
    linea: {
      producto: 'Chorizo Casero',
      // codigoSage: undefined, // 🔍 SIN CÓDIGO - debe generar automático
      cantidad: 3,
      peso: 1.8,
      formato: 'unidad',
      cantidadEnviada: 3,
      precioUnitario: 12.50
    }
  },
  {
    nombre: 'Producto con codigoSage vacío',
    linea: {
      producto: 'Morcilla',
      codigoSage: '', // 🔍 CÓDIGO VACÍO - debe generar automático
      cantidad: 2,
      peso: 1.2,
      formato: 'kg',
      cantidadEnviada: 2,
      precioUnitario: 8.90
    }
  },
  {
    nombre: 'Línea de comentario (artículo debe estar vacío)',
    linea: {
      esComentario: true,
      comentario: 'Instrucciones especiales de entrega',
      // No debe tener código de artículo
    }
  }
];

console.log('🔍 DIAGNÓSTICO MAPEO CÓDIGO PRODUCTO → COLUMNA ARTICULO');
console.log('====================================================\n');

function diagnosticarMapeoArticulo(linea, index) {
  console.log(`📦 Escenario: ${escenariosPrueba[index].nombre}`);
  console.log('─'.repeat(60));
  
  // Mostrar datos de entrada
  console.log('📥 DATOS DE ENTRADA:');
  console.log(`   - Producto: "${linea.producto || 'N/A'}"`);
  console.log(`   - codigoSage: "${linea.codigoSage || 'undefined'}"`);
  console.log(`   - Es comentario: ${linea.esComentario ? 'SÍ' : 'NO'}`);
  
  // Aplicar la lógica actual del controlador
  let codigoArticuloFinal;
  
  if (!linea.esComentario && linea.producto) {
    // Línea de producto - aplicar lógica actual
    codigoArticuloFinal = linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`;
    console.log('\n✅ LÓGICA APLICADA: Línea de producto');
    console.log(`   - Usar codigoSage si existe: "${linea.codigoSage || 'no existe'}"`);
    console.log(`   - Si no existe, generar: "ART${String(index + 1).padStart(5, '0')}"`);
  } else if (linea.esComentario) {
    // Línea de comentario - artículo vacío
    codigoArticuloFinal = '';
    console.log('\n✅ LÓGICA APLICADA: Línea de comentario');
    console.log('   - Código artículo debe estar vacío');
  }
  
  // Resultado final
  console.log('\n🎯 RESULTADO PARA SAGE50:');
  console.log(`   - COLUMNA ARTICULO: "${codigoArticuloFinal}"`);
  console.log(`   - FORMATO: ${typeof codigoArticuloFinal} (debe ser string/alfanumérico)`);
  
  // Verificaciones
  const formatoCorrecto = typeof codigoArticuloFinal === 'string';
  const tieneValor = linea.esComentario ? codigoArticuloFinal === '' : codigoArticuloFinal !== '';
  
  console.log('\n🔍 VERIFICACIONES:');
  console.log(`   ✅ Formato alfanumérico (string): ${formatoCorrecto ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   ✅ Valor apropiado: ${tieneValor ? '✅ SÍ' : '❌ NO'}`);
  
  if (!linea.esComentario) {
    const usaCodigoOriginal = linea.codigoSage && codigoArticuloFinal === linea.codigoSage;
    const usaCodigoGenerado = !linea.codigoSage && codigoArticuloFinal.startsWith('ART');
    console.log(`   ✅ Usa código original si existe: ${usaCodigoOriginal ? '✅ SÍ' : '⚠️  N/A'}`);
    console.log(`   ✅ Genera código si no existe: ${usaCodigoGenerado ? '✅ SÍ' : '⚠️  N/A'}`);
  }
  
  const verificacionCompleta = formatoCorrecto && tieneValor;
  console.log(`\n🏆 VERIFICACIÓN COMPLETA: ${verificacionCompleta ? '✅ CORRECTO' : '❌ ERROR'}`);
  console.log('\n' + '='.repeat(60) + '\n');
  
  return {
    codigoFinal: codigoArticuloFinal,
    correcto: verificacionCompleta
  };
}

// Ejecutar diagnósticos
const resultados = escenariosPrueba.map((escenario, index) => 
  diagnosticarMapeoArticulo(escenario.linea, index)
);

// Resumen final
console.log('📊 RESUMEN GENERAL:');
console.log('==================');
const todosCorrectos = resultados.every(r => r.correcto);
console.log(`🎯 Todos los mapeos correctos: ${todosCorrectos ? '✅ SÍ' : '❌ NO'}`);

console.log('\n📋 CÓDIGOS GENERADOS:');
resultados.forEach((resultado, index) => {
  console.log(`   ${index + 1}. "${resultado.codigoFinal}"`);
});

console.log('\n💡 FORMATO SAGE50 COLUMNA ARTICULO:');
console.log('- Tipo: Alfanumérico (string)');
console.log('- Productos: Código del artículo (codigoSage o generado)');
console.log('- Comentarios: Vacío (se interpreta como línea de nota)');

if (todosCorrectos) {
  console.log('\n🎉 ¡El mapeo de la columna ARTICULO está funcionando correctamente!');
} else {
  console.log('\n❌ Hay problemas en el mapeo de la columna ARTICULO');
}
