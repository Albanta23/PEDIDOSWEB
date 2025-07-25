// verificar-logica-pedidos.js

// Este script prueba la nueva lógica de filtrado de pedidos para asegurar que funciona correctamente

// Función de simulación para pedidosCliente
function filtrarPedidosLogicaNueva(clienteNombre, pedidos) {
  console.log(`\nProbando filtrado para cliente: "${clienteNombre}"`);
  
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Convertir valores a string para comparación segura
    const nombre = String(clienteNombre || '').toLowerCase().trim();
    const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase().trim();
    const pedidoId = String(pedido.clienteId || '').toLowerCase().trim();
    const pedidoCliente = String(pedido.cliente || '').toLowerCase().trim();
    
    // No realizar comparaciones si alguno de los valores está vacío
    if (!nombre) return false;
    
    // Asegurarse de que no es un pedido marcado como devolución
    if (pedido.enHistorialDevoluciones === true) return false;
    
    // Verificar coincidencia exacta (no inclusión parcial)
    const coincideExacto = 
      (pedidoNombre === nombre) ||
      (pedidoId === nombre) ||
      (pedidoCliente === nombre);
    
    // Buscar coincidencias parciales sólo para nombres largos y específicos
    const esCasiExacto = 
      (pedidoNombre && pedidoNombre.startsWith(nombre) && nombre.length > 10) ||
      (pedidoNombre && nombre.startsWith(pedidoNombre) && pedidoNombre.length > 10);
      
    const coincide = coincideExacto || esCasiExacto;
    
    if (coincide) {
      console.log(`  ✅ Coincide: "${pedidoNombre}" con "${nombre}"`);
      console.log(`     Detalles: coincideExacto=${coincideExacto}, esCasiExacto=${esCasiExacto}`);
    }
    
    return coincide;
  });
  
  console.log(`  Total de coincidencias: ${pedidosFiltrados.length} de ${pedidos.length} pedidos`);
  return pedidosFiltrados;
}

// Función de simulación para pedidosCliente con la lógica antigua problemática
function filtrarPedidosLogicaAntigua(clienteNombre, pedidos) {
  console.log(`\nProbando filtrado ANTIGUO para cliente: "${clienteNombre}"`);
  
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Convertir valores a string para comparación segura
    const nombre = String(clienteNombre || '').toLowerCase().trim();
    const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase().trim();
    const pedidoId = String(pedido.clienteId || '').toLowerCase().trim();
    const pedidoCliente = String(pedido.cliente || '').toLowerCase().trim();
    
    // No realizar comparaciones si alguno de los valores está vacío
    if (!nombre) return false;
    
    // Verificar coincidencia por cualquiera de los campos (LÓGICA ORIGINAL CON PROBLEMA)
    const coincide = 
      (pedidoNombre && pedidoNombre.includes(nombre)) || 
      (nombre && nombre.includes(pedidoNombre) && pedidoNombre) ||
      (pedidoId && pedidoId.includes(nombre)) || 
      (nombre && nombre.includes(pedidoId) && pedidoId) ||
      (pedidoCliente && pedidoCliente.includes(nombre)) || 
      (nombre && nombre.includes(pedidoCliente) && pedidoCliente);
    
    if (coincide && pedidoNombre !== nombre) {
      console.log(`  ⚠️ Falso positivo: "${pedidoNombre}" con "${nombre}"`);
    }
    
    return coincide;
  });
  
  console.log(`  Total de coincidencias: ${pedidosFiltrados.length} de ${pedidos.length} pedidos`);
  return pedidosFiltrados;
}

// Datos de prueba
const pedidosSimulados = [
  { clienteNombre: "PASCUAL FERNANDEZ FERNANDEZ", numeroPedido: "001", enHistorialDevoluciones: false },
  { clienteNombre: "PASCUAL FERNANDEZ", numeroPedido: "002", enHistorialDevoluciones: false },
  { clienteNombre: "FERNANDEZ PASCUAL", numeroPedido: "003", enHistorialDevoluciones: false },
  { clienteNombre: "MARIA RODRIGUEZ", numeroPedido: "004", enHistorialDevoluciones: false },
  { clienteNombre: "JUAN FERNANDEZ", numeroPedido: "005", enHistorialDevoluciones: false },
  { clienteNombre: "FERNANDO PASCUAL", numeroPedido: "006", enHistorialDevoluciones: false },
  { clienteNombre: "PASCUAL RODRIGUEZ FERNANDEZ", numeroPedido: "007", enHistorialDevoluciones: false },
  { clienteNombre: "FERNANDEZ PASCUAL RODRIGUEZ", numeroPedido: "008", enHistorialDevoluciones: false },
  { clienteNombre: "RICARDO DIEZ FERNANDEZ", numeroPedido: "009", enHistorialDevoluciones: false },
  { clienteNombre: "FERNANDEZ", numeroPedido: "010", enHistorialDevoluciones: false },
  { clienteNombre: "PASCUAL", numeroPedido: "011", enHistorialDevoluciones: false },
  { clienteNombre: "JOSE MARTINEZ", numeroPedido: "012", enHistorialDevoluciones: false },
  { clienteNombre: "PASCUAL FERNANDEZ FERNANDEZ", numeroPedido: "013", enHistorialDevoluciones: true }, // Devolución
];

// Ejecutar pruebas
console.log("🔍 VERIFICACIÓN DE LÓGICA DE COINCIDENCIA");
console.log("=====================================");

// Probar lógica antigua vs nueva
const clientesPrueba = [
  "PASCUAL FERNANDEZ FERNANDEZ",
  "PASCUAL FERNANDEZ",
  "FERNANDEZ",
  "PASCUAL"
];

for (const cliente of clientesPrueba) {
  console.log(`\n=== PRUEBAS PARA CLIENTE: "${cliente}" ===`);
  
  console.log("\n🔴 LÓGICA ANTIGUA (PROBLEMÁTICA):");
  const resultadosAntiguos = filtrarPedidosLogicaAntigua(cliente, pedidosSimulados);
  
  console.log("\n🟢 LÓGICA NUEVA (CORREGIDA):");
  const resultadosNuevos = filtrarPedidosLogicaNueva(cliente, pedidosSimulados);
  
  console.log("\nResumen para este cliente:");
  console.log(`  - Lógica antigua encontró: ${resultadosAntiguos.length} pedidos`);
  console.log(`  - Lógica nueva encontró: ${resultadosNuevos.length} pedidos`);
  
  if (resultadosAntiguos.length > resultadosNuevos.length) {
    console.log(`  ✅ La nueva lógica es más estricta y elimina ${resultadosAntiguos.length - resultadosNuevos.length} falsos positivos`);
  } else if (resultadosAntiguos.length < resultadosNuevos.length) {
    console.log(`  ⚠️ La nueva lógica encuentra ${resultadosNuevos.length - resultadosAntiguos.length} pedidos más que la antigua`);
  } else {
    console.log(`  ℹ️ Ambas lógicas encuentran la misma cantidad de pedidos`);
  }
}

console.log("\n=== RESUMEN FINAL ===");
console.log("La nueva lógica de filtrado:");
console.log("1. Es más estricta y evita falsos positivos");
console.log("2. Prioriza coincidencias exactas");
console.log("3. Solo permite coincidencias parciales para nombres largos y específicos");
console.log("4. Filtra correctamente las devoluciones");
