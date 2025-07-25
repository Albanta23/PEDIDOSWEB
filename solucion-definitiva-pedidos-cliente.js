// Script para corregir el filtrado de pedidos por cliente
// Muestra la solución definitiva para el problema

console.log('=== SOLUCIÓN PARA CORREGIR VISUALIZACIÓN DE PEDIDOS DE CLIENTES ===');
console.log('\nProblema detectado:');
console.log('- En la gestión de clientes, dentro de la ficha del cliente, los pedidos no se muestran');
console.log('- Esto ocurrió después de implementar el historial de devoluciones');
console.log('- La causa raíz es una inconsistencia en la forma de relacionar pedidos con clientes');

console.log('\nLo que hemos descubierto:');
console.log('1. Los pedidos en la colección "pedidoclientes" usan campos diferentes para el cliente:');
console.log('   - clienteId: ID del cliente');
console.log('   - clienteNombre: Nombre del cliente');
console.log('   - Raramente usan el campo "cliente" que se estaba filtrando');

console.log('\n2. El filtro actual en ClientesMantenimiento.jsx está incompleto:');
console.log('   function cargarPedidosCliente() {');
console.log('     axios.get("/api/pedidos-clientes", {');
console.log('       params: {');
console.log('         cliente: clienteActual.nombre, // ❌ Problema aquí: solo filtra por campo "cliente"');
console.log('         enHistorialDevoluciones: false');
console.log('       }');
console.log('     })');
console.log('   }');

console.log('\n3. El backend también debe adaptarse para manejar las diferentes referencias:');
console.log('   // En el controlador de pedidos (pedidosClientesController.js)');
console.log('   const filtro = {};');
console.log('   ');
console.log('   if (req.query.cliente) {');
console.log('     filtro.cliente = { $regex: new RegExp(req.query.cliente, "i") }; // ❌ Problema: solo busca en el campo cliente');
console.log('   }');
console.log('   ');
console.log('   if (req.query.enHistorialDevoluciones === "false") {');
console.log('     filtro.enHistorialDevoluciones = { $ne: true };');
console.log('   }');

console.log('\n=== SOLUCIÓN PROPUESTA ===');

console.log('\n1. Modificar función cargarPedidosCliente en ClientesMantenimiento.jsx:');
console.log('   function cargarPedidosCliente() {');
console.log('     setLoading(true);');
console.log('     axios.get("/api/pedidos-clientes", {');
console.log('       params: {');
console.log('         clienteId: clienteActual._id, // ✅ Añadir filtro por ID');
console.log('         nombreCliente: clienteActual.nombre, // ✅ Renombrar para claridad');
console.log('         enHistorialDevoluciones: false');
console.log('       }');
console.log('     })');
console.log('     .then(response => {');
console.log('       setPedidosCliente(response.data);');
console.log('       setLoading(false);');
console.log('     })');
console.log('     .catch(error => {');
console.log('       console.error("Error al cargar pedidos del cliente:", error);');
console.log('       setLoading(false);');
console.log('     });');
console.log('   }');

console.log('\n2. Modificar función cargarDevolucionesCliente en ClientesMantenimiento.jsx:');
console.log('   function cargarDevolucionesCliente() {');
console.log('     setLoadingDevoluciones(true);');
console.log('     axios.get("/api/devoluciones", {');
console.log('       params: {');
console.log('         clienteId: clienteActual._id, // ✅ Añadir filtro por ID');
console.log('         nombreCliente: clienteActual.nombre, // ✅ Renombrar para claridad');
console.log('       }');
console.log('     })');
console.log('     .then(response => {');
console.log('       setDevolucionesCliente(response.data);');
console.log('       setLoadingDevoluciones(false);');
console.log('     })');
console.log('     .catch(error => {');
console.log('       console.error("Error al cargar devoluciones del cliente:", error);');
console.log('       setLoadingDevoluciones(false);');
console.log('     });');
console.log('   }');

console.log('\n3. Modificar el controlador de pedidos en backend (pedidosClientesController.js):');
console.log('   // En la función para obtener pedidos de clientes');
console.log('   const filtro = {};');
console.log('   ');
console.log('   // Filtro por cliente');
console.log('   if (req.query.clienteId || req.query.nombreCliente) {');
console.log('     filtro.$or = [];');
console.log('     ');
console.log('     if (req.query.clienteId) {');
console.log('       filtro.$or.push({ clienteId: req.query.clienteId });');
console.log('       filtro.$or.push({ "cliente._id": req.query.clienteId });');
console.log('     }');
console.log('     ');
console.log('     if (req.query.nombreCliente) {');
console.log('       const nombreRegex = new RegExp(req.query.nombreCliente, "i");');
console.log('       filtro.$or.push({ clienteNombre: nombreRegex });');
console.log('       filtro.$or.push({ cliente: nombreRegex });');
console.log('       filtro.$or.push({ "cliente.nombre": nombreRegex });');
console.log('     }');
console.log('   }');
console.log('   ');
console.log('   // Filtro por estado de devolución');
console.log('   if (req.query.enHistorialDevoluciones === "false") {');
console.log('     filtro.enHistorialDevoluciones = { $ne: true };');
console.log('   }');

console.log('\n4. Modificar el controlador de devoluciones de manera similar (devolucionesController.js)');

console.log('\n=== DOCUMENTACIÓN DE LA SOLUCIÓN ===');
console.log('Con estos cambios:');
console.log('1. Se solucionará el problema de visualización de pedidos en la ficha de cliente');
console.log('2. Se adaptará el sistema a la estructura real de datos que utiliza clienteId y clienteNombre');
console.log('3. Se mantendrá la compatibilidad con posibles pedidos que usen el campo cliente');
console.log('4. Se seguirá filtrando correctamente las devoluciones');

console.log('\nPara implementar esta solución:');
console.log('1. Modificar ClientesMantenimiento.jsx con los cambios en las funciones de carga');
console.log('2. Modificar los controladores en el backend para soportar los nuevos parámetros');
console.log('3. Verificar que los pedidos se muestran correctamente para el cliente Pascual Fernandez Fernandez');
