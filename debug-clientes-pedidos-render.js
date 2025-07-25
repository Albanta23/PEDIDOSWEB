// debug-clientes-pedidos-render.js

const axios = require('axios');

// Configuración
const API_URL_BASE = process.env.VITE_API_URL || 'http://localhost:10001';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;
const CLIENTE_NOMBRE = "Pascual Fernandez Fernandez";

async function debugClientePedidos() {
    console.log("\n🔍 DIAGNÓSTICO DE RENDERIZADO DE PEDIDOS EN FICHA DE CLIENTE");
    console.log("==========================================================");
    console.log("Cliente de prueba:", CLIENTE_NOMBRE);
    console.log("API URL:", API_URL);
    
    try {
        // 1. Verificar que el cliente existe
        console.log("\n1️⃣ Verificando datos del cliente...");
        const clientesRes = await axios.get(`${API_URL}/clientes`);
        const cliente = clientesRes.data.find(c => 
            c.nombre && c.nombre.toLowerCase().includes(CLIENTE_NOMBRE.toLowerCase())
        );
        
        if (!cliente) {
            console.error("❌ Cliente no encontrado en la base de datos");
            return;
        }
        
        console.log("✅ Cliente encontrado:", cliente.nombre);
        console.log("   ID:", cliente._id || cliente.id);
        
        // 2. Verificar pedidos del cliente (no devoluciones)
        console.log("\n2️⃣ Verificando pedidos normales del cliente...");
        
        // Solicitar pedidos sin filtro de devoluciones
        const pedidosSinFiltroRes = await axios.get(`${API_URL}/pedidos-clientes`);
        console.log("   Total de pedidos en el sistema:", pedidosSinFiltroRes.data.length);
        
        // Solicitar pedidos con filtro de no devoluciones
        const pedidosNormalesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=false`);
        console.log("   Total de pedidos normales en el sistema:", pedidosNormalesRes.data.length);
        
        // Filtrar manualmente por cliente
        const pedidosCliente = pedidosNormalesRes.data.filter(pedido => {
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase();
            const pedidoId = String(pedido.clienteId || '').toLowerCase();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase();
            const nombreBusqueda = CLIENTE_NOMBRE.toLowerCase();
            
            return (
                pedidoNombre.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoNombre) ||
                pedidoId.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoId) ||
                pedidoCliente.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoCliente)
            );
        });
        
        console.log("   Pedidos normales del cliente:", pedidosCliente.length);
        
        if (pedidosCliente.length === 0) {
            console.log("⚠️ El cliente no tiene pedidos normales");
        } else {
            console.log("\n   Detalle de pedidos encontrados:");
            pedidosCliente.forEach((pedido, i) => {
                console.log(`   ${i+1}. Número: ${pedido.numeroPedido}, Estado: ${pedido.estado}`);
                console.log(`      Fecha: ${new Date(pedido.fecha).toLocaleDateString()}`);
                console.log(`      Cliente en pedido: ${pedido.clienteNombre}`);
            });
        }
        
        // 3. Verificar si hay devoluciones
        console.log("\n3️⃣ Verificando devoluciones del cliente...");
        const devolucionesRes = await axios.get(`${API_URL}/pedidos-clientes?enHistorialDevoluciones=true`);
        console.log("   Total de devoluciones en el sistema:", devolucionesRes.data.length);
        
        // Filtrar manualmente por cliente
        const devolucionesCliente = devolucionesRes.data.filter(pedido => {
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase();
            const pedidoId = String(pedido.clienteId || '').toLowerCase();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase();
            const nombreBusqueda = CLIENTE_NOMBRE.toLowerCase();
            
            return (
                pedidoNombre.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoNombre) ||
                pedidoId.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoId) ||
                pedidoCliente.includes(nombreBusqueda) || 
                nombreBusqueda.includes(pedidoCliente)
            );
        });
        
        console.log("   Devoluciones del cliente:", devolucionesCliente.length);
        
        if (devolucionesCliente.length > 0) {
            console.log("\n   Detalle de devoluciones encontradas:");
            devolucionesCliente.forEach((devolucion, i) => {
                console.log(`   ${i+1}. Número: ${devolucion.numeroPedido}, Estado: ${devolucion.estado}`);
                console.log(`      Fecha: ${new Date(devolucion.fecha).toLocaleDateString()}`);
            });
        }
        
        // 4. Simular el componente React para verificar renderizado
        console.log("\n4️⃣ Simulando renderizado del componente React...");
        console.log("   Estado de pedidosCliente:", pedidosCliente.length > 0 ? "✅ Con datos" : "❌ Vacío");
        console.log("   Estado de devolucionesCliente:", devolucionesCliente.length > 0 ? "✅ Con datos" : "❌ Vacío");
        
        console.log("\n   Simulando condiciones de renderizado:");
        
        const condicionRenderizadoPedidos = pedidosCliente.length > 0;
        console.log(`   Condición: pedidosCliente.length > 0 = ${condicionRenderizadoPedidos}`);
        
        const condicionRenderizadoDevoluciones = devolucionesCliente.length > 0;
        console.log(`   Condición: devolucionesCliente.length > 0 = ${condicionRenderizadoDevoluciones}`);
        
        // 5. Diagnóstico final
        console.log("\n5️⃣ DIAGNÓSTICO FINAL:");
        
        if (pedidosCliente.length > 0) {
            console.log("✅ Los pedidos del cliente se están cargando correctamente en la API");
            console.log("   - El componente debería mostrar una tabla con pedidos");
            console.log("   - Comprueba la consola del navegador para verificar que los datos llegan al frontend");
            console.log("   - Verifica si hay errores de JavaScript en la consola del navegador");
        } else {
            console.log("⚠️ El cliente no tiene pedidos normales en la base de datos");
            console.log("   - Esto es normal si el cliente realmente no tiene pedidos");
            console.log("   - Si debería tener pedidos, verifica los datos en la base de datos");
        }
        
        console.log("\nRecomendaciones para solucionar problemas de renderizado:");
        console.log("1. Añade console.log en el componente para verificar valores en tiempo real");
        console.log("2. Verifica que la función cargarPedidosCliente se ejecuta correctamente");
        console.log("3. Comprueba que el estado pedidosCliente se actualiza con los datos");
        console.log("4. Asegúrate de que no hay errores en el código JSX que renderiza los pedidos");
        
    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        if (error.response) {
            console.error("Datos de respuesta:", error.response.data);
            console.error("Estado de respuesta:", error.response.status);
        } else if (error.request) {
            console.error("Sin respuesta del servidor");
        }
    }
}

debugClientePedidos();
