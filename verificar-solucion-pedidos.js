// verificar-solucion-pedidos.js

const axios = require('axios');

// Intentamos usar la misma URL que se usa en la aplicación
// En la aplicación se usa import.meta.env.VITE_API_URL, pero en Node.js usamos process.env
const API_URL_BASE = process.env.VITE_API_URL || 'http://localhost:10001';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log("Usando URL de API:", API_URL);
console.log("NOTA: Si la URL es incorrecta, establecer la variable de entorno VITE_API_URL");

/**
 * Función para verificar pedidos de un cliente específico
 */
async function verificarSolucion(nombreCliente) {
    try {
        console.log(`\n===== VERIFICACIÓN DE SOLUCIÓN: CLIENTE ${nombreCliente} =====\n`);
        
        // 1. Verificar pedidos normales (no devoluciones)
        console.log("1. Verificando pedidos normales (enHistorialDevoluciones=false)...");
        const normalesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=false`);
        
        const nombreBusqueda = String(nombreCliente || '').toLowerCase().trim();
        
        const pedidosNormales = normalesRes.data.filter(pedido => {
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
        
        console.log(`Pedidos normales encontrados: ${pedidosNormales.length}`);
        
        if (pedidosNormales.length > 0) {
            console.log("\nDetalle de pedidos normales:");
            pedidosNormales.forEach(pedido => {
                console.log(`- Número: ${pedido.numeroPedido}, Estado: ${pedido.estado}, Cliente: ${pedido.clienteNombre}`);
            });
        }
        
        // 2. Verificar devoluciones
        console.log("\n2. Verificando pedidos de devolución (enHistorialDevoluciones=true)...");
        const devolucionesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=true`);
        
        const pedidosDevoluciones = devolucionesRes.data.filter(pedido => {
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
        
        console.log(`Pedidos de devolución encontrados: ${pedidosDevoluciones.length}`);
        
        if (pedidosDevoluciones.length > 0) {
            console.log("\nDetalle de pedidos de devolución:");
            pedidosDevoluciones.forEach(pedido => {
                console.log(`- Número: ${pedido.numeroPedido}, Estado: ${pedido.estado}, Cliente: ${pedido.clienteNombre}`);
            });
        }
        
        // 3. Simular la lógica del componente después de la corrección
        console.log("\n3. Simulando la lógica del componente corregido...");
        
        console.log("\n3.1. Solicitud con filtro enHistorialDevoluciones=false");
        const simulacionRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=false`);
        console.log(`Total de pedidos obtenidos con filtro: ${simulacionRes.data.length}`);
        
        // Aplicar filtro adicional por cliente y enHistorialDevoluciones
        const pedidosFiltradosSimulados = simulacionRes.data.filter(pedido => {
            // Double-check que no sea una devolución
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
        
        console.log(`Pedidos filtrados por cliente en simulación: ${pedidosFiltradosSimulados.length}`);
        
        // Verificar consistencia
        console.log("\n===== RESULTADO DE LA VERIFICACIÓN =====");
        
        if (pedidosFiltradosSimulados.length === pedidosNormales.length) {
            console.log("✅ ÉXITO: La solución parece correcta. El componente mostrará los pedidos normales y excluirá las devoluciones.");
        } else {
            console.log("❌ ERROR: Hay discrepancias en los resultados. La solución puede no ser completa.");
            console.log(`Diferencia: ${Math.abs(pedidosFiltradosSimulados.length - pedidosNormales.length)} pedidos`);
        }
        
        // Resumen
        console.log("\n===== RESUMEN =====");
        console.log(`- Pedidos normales (deben mostrarse): ${pedidosNormales.length}`);
        console.log(`- Pedidos de devolución (no deben mostrarse): ${pedidosDevoluciones.length}`);
        console.log(`- Total de pedidos para el cliente: ${pedidosNormales.length + pedidosDevoluciones.length}`);
        
    } catch (error) {
        console.error("Error en la verificación:", error.message);
        if (error.response) {
            console.error("Datos del error:", error.response.data);
        }
    }
}

// Ejecutar verificación
verificarSolucion("Pascual Fernandez Fernandez");
