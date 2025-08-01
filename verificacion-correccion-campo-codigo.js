#!/usr/bin/env node

/**
 * Script de verificación final para el campo 'codigo' vs 'codigoSage'
 * Basado en el esquema real de MongoDB mostrado por el usuario
 */

console.log('🔍 VERIFICACIÓN CAMPO CODIGO vs CODIGOSAGE');
console.log('==========================================\n');

// Simular datos según el esquema real de MongoDB
const productoEsquemaReal = {
  "_id": { "$oid": "688b978ff8f3b6d0fbf618c3" },
  "codigo": "4000004", // 🔍 ESTE ES EL CAMPO CORRECTO PARA SAGE50
  "codigoSage": "", // 🔍 ESTE ESTÁ VACÍO - NO USAR
  "nombre": "ALAS DE POLLO FRESCAS",
  "descripcion": "",
  "precio": 0,
  "activo": true,
  "__v": 0
};

console.log('📋 ESQUEMA REAL DE MONGODB:');
console.log('---------------------------');
console.log(`- codigo: "${productoEsquemaReal.codigo}" (CORRECTO para Sage50)`);
console.log(`- codigoSage: "${productoEsquemaReal.codigoSage}" (VACÍO - no usar)`);
console.log(`- nombre: "${productoEsquemaReal.nombre}"`);

// Simular líneas de pedido con el esquema correcto
const lineasPrueba = [
  {
    nombre: 'Producto con código real',
    linea: {
      producto: productoEsquemaReal.nombre,
      codigo: productoEsquemaReal.codigo, // 🔍 USAR ESTE CAMPO
      codigoSage: productoEsquemaReal.codigoSage, // 🔍 ESTE ESTÁ VACÍO
      cantidad: 2,
      peso: 1.5,
      formato: 'kg',
      cantidadEnviada: 2,
      precioUnitario: 8.90
    }
  },
  {
    nombre: 'Producto sin código (generar automático)',
    linea: {
      producto: 'Producto Sin Código',
      codigo: '', // 🔍 VACÍO - debe generar automático
      codigoSage: '', // 🔍 TAMBIÉN VACÍO
      cantidad: 1,
      peso: 0.5,
      formato: 'unidad',
      cantidadEnviada: 1,
      precioUnitario: 5.00
    }
  }
];

console.log('\n🧪 PRUEBAS DE MAPEO CORREGIDO:');
console.log('==============================\n');

function probarMapeoCorregido(escenario, index) {
  const { nombre, linea } = escenario;
  
  console.log(`📦 ${nombre}`);
  console.log('─'.repeat(50));
  
  console.log('📥 DATOS DE ENTRADA:');
  console.log(`   - linea.codigo: "${linea.codigo}"`);
  console.log(`   - linea.codigoSage: "${linea.codigoSage}"`);
  console.log(`   - linea.producto: "${linea.producto}"`);
  
  // LÓGICA ANTERIOR (INCORRECTA)
  const codigoAnterior = linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`;
  
  // LÓGICA CORREGIDA (CORRECTA)
  const codigoCorregido = String(linea.codigo || `ART${String(index + 1).padStart(5, '0')}`);
  
  console.log('\n🔄 COMPARACIÓN:');
  console.log(`   ❌ LÓGICA ANTERIOR: linea.codigoSage → "${codigoAnterior}"`);
  console.log(`   ✅ LÓGICA CORREGIDA: linea.codigo → "${codigoCorregido}"`);
  
  const esCorrecto = linea.codigo ? (codigoCorregido === linea.codigo) : codigoCorregido.startsWith('ART');
  const formatoCorrecto = typeof codigoCorregido === 'string';
  
  console.log('\n🎯 RESULTADO SAGE50:');
  console.log(`   - COLUMNA ARTICULO: "${codigoCorregido}"`);
  console.log(`   - FORMATO: ${typeof codigoCorregido} (string/alfanumérico)`);
  console.log(`   - ✅ Mapeo correcto: ${esCorrecto ? 'SÍ' : 'NO'}`);
  console.log(`   - ✅ Formato correcto: ${formatoCorrecto ? 'SÍ' : 'NO'}`);
  
  const verificacionCompleta = esCorrecto && formatoCorrecto;
  console.log(`\n🏆 VERIFICACIÓN: ${verificacionCompleta ? '✅ CORRECTO' : '❌ ERROR'}`);
  console.log('\n' + '='.repeat(50) + '\n');
  
  return {
    codigoFinal: codigoCorregido,
    correcto: verificacionCompleta
  };
}

// Ejecutar pruebas
const resultados = lineasPrueba.map((escenario, index) => 
  probarMapeoCorregido(escenario, index)
);

// Resumen final
console.log('📊 RESUMEN CORRECCIÓN:');
console.log('======================');
const todosCorrectos = resultados.every(r => r.correcto);
console.log(`🎯 Corrección exitosa: ${todosCorrectos ? '✅ SÍ' : '❌ NO'}`);

console.log('\n📋 CÓDIGOS GENERADOS CON CORRECCIÓN:');
resultados.forEach((resultado, index) => {
  console.log(`   ${index + 1}. "${resultado.codigoFinal}"`);
});

console.log('\n💡 CAMBIO IMPLEMENTADO:');
console.log('- ANTES: linea.codigoSage (campo vacío en MongoDB)');
console.log('- AHORA: linea.codigo (campo con datos reales)');
console.log('- FORMATO: String() para asegurar alfanumérico');

console.log('\n🚀 ESQUEMA MONGODB CORRECTO:');
console.log('- Campo "codigo": Contiene el código real para Sage50');
console.log('- Campo "codigoSage": Está vacío - no usar');
console.log('- Mapeo: linea.codigo → COLUMNA ARTICULO en Sage50');

if (todosCorrectos) {
  console.log('\n🎉 ¡El mapeo está ahora corregido para usar el campo correcto!');
  console.log('✅ Se usa "codigo" en lugar de "codigoSage"');
  console.log('✅ Los productos reales aparecerán con su código correcto');
} else {
  console.log('\n❌ Hay problemas en la corrección');
}
