const axios = require('axios');

// Intentamos usar la misma URL que se usa en la aplicación
// En la aplicación se usa import.meta.env.VITE_API_URL, pero en Node.js usamos process.env
const API_URL_BASE = process.env.VITE_API_URL || 'http://localhost:10001';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log("Usando URL de API:", API_URL);
console.log("NOTA: Si la URL es incorrecta, establecer la variable de entorno VITE_API_URL");

async function verificarPedidosCliente(nombreCliente) {
    try {
        console.log(`\n--- Verificando pedidos para cliente: ${nombreCliente} ---\n`);
        
        // 1. Obtener todos los pedidos sin filtro
        console.log("1. Obteniendo todos los pedidos sin filtro...");
        const todosRes = await axios.get(`${API_URL}/pedidos-clientes`);
        console.log(`Total de pedidos en el sistema: ${todosRes.data.length}`);
        
        // 2. Obtener pedidos con enHistorialDevoluciones=false
        console.log("\n2. Obteniendo pedidos NO marcados como devolución...");
        const normalesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=false`);
        console.log(`Total de pedidos normales: ${normalesRes.data.length}`);
        
        // 3. Obtener pedidos con enHistorialDevoluciones=true
        console.log("\n3. Obteniendo pedidos marcados como devolución...");
        const devolucionesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=true`);
        console.log(`Total de pedidos de devolución: ${devolucionesRes.data.length}`);
        
        // 4. Filtrar pedidos manualmente para el cliente específico
        console.log(`\n4. Filtrando manualmente pedidos para cliente: ${nombreCliente}...`);
        
        const nombreBusqueda = String(nombreCliente || '').toLowerCase().trim();
        
        const pedidosClienteNormales = normalesRes.data.filter(pedido => {
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase().trim();
            const pedidoId = String(pedido.clienteId || '').toLowerCase().trim();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase().trim();
            
            return (
                (pedidoNombre && pedidoNombre.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoNombre) && pedidoNombre) ||
                (pedidoId && pedidoId.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoId) && pedidoId) ||
                (pedidoCliente && pedidoCliente.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoCliente) && pedidoCliente)
            );
        });
        
        console.log(`Pedidos normales encontrados para ${nombreCliente}: ${pedidosClienteNormales.length}`);
        
        if (pedidosClienteNormales.length > 0) {
            console.log("\nDetalle de los pedidos normales encontrados:");
            pedidosClienteNormales.forEach(pedido => {
                console.log(`- Número de pedido: ${pedido.numeroPedido}, Estado: ${pedido.estado}, Cliente: ${pedido.clienteNombre}`);
            });
        } else {
            console.log(`No se encontraron pedidos normales para el cliente ${nombreCliente}`);
        }
        
        const pedidosClienteDevoluciones = devolucionesRes.data.filter(pedido => {
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase().trim();
            const pedidoId = String(pedido.clienteId || '').toLowerCase().trim();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase().trim();
            
            return (
                (pedidoNombre && pedidoNombre.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoNombre) && pedidoNombre) ||
                (pedidoId && pedidoId.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoId) && pedidoId) ||
                (pedidoCliente && pedidoCliente.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoCliente) && pedidoCliente)
            );
        });
        
        console.log(`\nPedidos de devolución encontrados para ${nombreCliente}: ${pedidosClienteDevoluciones.length}`);
        
        if (pedidosClienteDevoluciones.length > 0) {
            console.log("\nDetalle de los pedidos de devolución encontrados:");
            pedidosClienteDevoluciones.forEach(pedido => {
                console.log(`- Número de pedido: ${pedido.numeroPedido}, Estado: ${pedido.estado}, Cliente: ${pedido.clienteNombre}`);
            });
        } else {
            console.log(`No se encontraron pedidos de devolución para el cliente ${nombreCliente}`);
        }
        
        // 5. Comprobar si la API filtra correctamente
        console.log("\n5. Verificando si el filtrado de pedidos normales en cargarPedidosCliente es correcto");
        
        const resClientePedidos = await axios.get(`${API_URL}/pedidos-clientes`);
        
        const pedidosFiltradosManual = resClientePedidos.data.filter(pedido => {
            // Filtrar sólo pedidos NO marcados como devoluciones
            if (pedido.enHistorialDevoluciones === true) return false;
            
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase().trim();
            const pedidoId = String(pedido.clienteId || '').toLowerCase().trim();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase().trim();
            
            return (
                (pedidoNombre && pedidoNombre.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoNombre) && pedidoNombre) ||
                (pedidoId && pedidoId.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoId) && pedidoId) ||
                (pedidoCliente && pedidoCliente.includes(nombreBusqueda)) || 
                (nombreBusqueda && nombreBusqueda.includes(pedidoCliente) && pedidoCliente)
            );
        });
        
        console.log(`Pedidos encontrados con filtrado manual correcto: ${pedidosFiltradosManual.length}`);
        
        // Comparar resultados
        console.log("\n--- Resumen de resultados ---");
        console.log(`Pedidos normales que deberían mostrarse: ${pedidosClienteNormales.length}`);
        console.log(`Pedidos de devolución que deberían estar en historial: ${pedidosClienteDevoluciones.length}`);
        console.log(`Pedidos filtrados correctamente (normales sin devoluciones): ${pedidosFiltradosManual.length}`);
        
        // Verificar si hay una discrepancia
        if (pedidosClienteNormales.length !== pedidosFiltradosManual.length) {
            console.log("\n⚠️ PROBLEMA DETECTADO: Hay una discrepancia en el filtrado de pedidos.");
            console.log("Posibles causas:");
            console.log("1. El código no está filtrando correctamente por enHistorialDevoluciones=false");
            console.log("2. Hay pedidos marcados incorrectamente en la base de datos");
        } else {
            console.log("\n✓ El filtrado parece estar funcionando correctamente");
        }
        
    } catch (error) {
        console.error("Error en la verificación de pedidos:", error.message);
        if (error.response) {
            console.error("Datos del error:", error.response.data);
        }
    }
}

// Ejecutar la verificación para el cliente Pascual Fernandez Fernandez
verificarPedidosCliente("Pascual Fernandez Fernandez");
