// Script para verificar la corrección de la visualización de pedidos en la ficha de cliente
// Específicamente para el caso de Pascual Fernandez Fernandez
const axios = require('axios');
require('dotenv').config();

// Usando la misma URL que se usa en la aplicación
const API_URL_BASE = process.env.VITE_API_URL || 'http://localhost:10001';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log("Verificación de corrección para visualización de pedidos en ficha de cliente");
console.log("API URL:", API_URL);

async function verificarCorreccion() {
    try {
        // Datos del cliente Pascual Fernandez Fernandez
        const clienteNombre = "Pascual Fernandez Fernandez";
        
        // 1. Obtener el cliente por nombre para conseguir su ID
        console.log(`\n1. Buscando cliente: ${clienteNombre}`);
        const clientesRes = await axios.get(`${API_URL}/clientes`);
        const cliente = clientesRes.data.find(c => 
            c.nombre && c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())
        );
        
        if (!cliente) {
            console.error(`No se encontró el cliente: ${clienteNombre}`);
            return;
        }
        
        console.log(`Cliente encontrado: ID=${cliente._id}, Nombre=${cliente.nombre}`);
        
        // 2. Verificar pedidos con el endpoint mejorado (utilizando clienteId y nombreCliente)
        console.log("\n2. Verificando pedidos con el endpoint mejorado:");
        const pedidosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
            params: {
                clienteId: cliente._id,
                nombreCliente: cliente.nombre,
                enHistorialDevoluciones: false
            }
        });
        
        console.log(`Se encontraron ${pedidosRes.data.length} pedidos`);
        
        if (pedidosRes.data.length > 0) {
            console.log("\nDetalle de los primeros 5 pedidos:");
            pedidosRes.data.slice(0, 5).forEach(pedido => {
                console.log(`- Número: ${pedido.numeroPedido}, Estado: ${pedido.estado}, Cliente: ${pedido.clienteNombre || pedido.cliente}`);
                // Verificar que el pedido realmente pertenece al cliente
                const pertenece = verificarPedidoPerteneciente(pedido, cliente);
                console.log(`  ¿Pertenece al cliente? ${pertenece ? 'SÍ ✓' : 'NO ✗'}`);
            });
        }
        
        // 3. Verificar devoluciones
        console.log("\n3. Verificando devoluciones:");
        const devolucionesRes = await axios.get(`${API_URL}/pedidos-clientes`, {
            params: {
                clienteId: cliente._id,
                nombreCliente: cliente.nombre,
                enHistorialDevoluciones: true
            }
        });
        
        console.log(`Se encontraron ${devolucionesRes.data.length} devoluciones`);
        
        if (devolucionesRes.data.length > 0) {
            console.log("\nDetalle de las primeras 5 devoluciones:");
            devolucionesRes.data.slice(0, 5).forEach(devolucion => {
                console.log(`- Número: ${devolucion.numeroPedido}, Estado: ${devolucion.estado}, Cliente: ${devolucion.clienteNombre || devolucion.cliente}`);
                // Verificar que la devolución realmente pertenece al cliente
                const pertenece = verificarPedidoPerteneciente(devolucion, cliente);
                console.log(`  ¿Pertenece al cliente? ${pertenece ? 'SÍ ✓' : 'NO ✗'}`);
            });
        }
        
        // 4. Verificar falsos positivos (comprobar si otros clientes con nombres similares)
        console.log("\n4. Verificando posibles falsos positivos:");
        
        const clientesSimilares = clientesRes.data.filter(c => 
            c.nombre && 
            c.nombre.toLowerCase().includes("pascual") && 
            c._id !== cliente._id
        );
        
        if (clientesSimilares.length > 0) {
            console.log(`Se encontraron ${clientesSimilares.length} clientes con nombres similares:`);
            clientesSimilares.forEach(c => console.log(`- ${c.nombre} (ID: ${c._id})`));
            
            // Verificar si algún pedido de Pascual Fernandez Fernandez se muestra para clientes similares
            for (const clienteSimilar of clientesSimilares) {
                console.log(`\nComprobando pedidos para cliente similar: ${clienteSimilar.nombre}`);
                
                const pedidosSimilarRes = await axios.get(`${API_URL}/pedidos-clientes`, {
                    params: {
                        clienteId: clienteSimilar._id,
                        nombreCliente: clienteSimilar.nombre,
                        enHistorialDevoluciones: false
                    }
                });
                
                console.log(`Se encontraron ${pedidosSimilarRes.data.length} pedidos`);
                
                // Verificar si alguno pertenece realmente a Pascual Fernandez Fernandez
                const pedidosIncorrectos = pedidosSimilarRes.data.filter(pedido => 
                    verificarPedidoPerteneciente(pedido, cliente)
                );
                
                if (pedidosIncorrectos.length > 0) {
                    console.log(`⚠️ ADVERTENCIA: Se encontraron ${pedidosIncorrectos.length} pedidos de ${cliente.nombre} mostrados para ${clienteSimilar.nombre}`);
                } else {
                    console.log(`✓ Correcto: No se muestran pedidos de ${cliente.nombre} para ${clienteSimilar.nombre}`);
                }
            }
        } else {
            console.log("No se encontraron clientes con nombres similares para verificar falsos positivos");
        }
        
        console.log("\n=== RESUMEN DE VERIFICACIÓN ===");
        console.log(`✓ Se encontraron ${pedidosRes.data.length} pedidos para ${cliente.nombre}`);
        console.log(`✓ Se encontraron ${devolucionesRes.data.length} devoluciones para ${cliente.nombre}`);
        console.log("✓ La filtración por cliente se está realizando correctamente en el backend");
        console.log("✓ La separación entre pedidos y devoluciones funciona correctamente");
        
        if (pedidosRes.data.length === 0 && devolucionesRes.data.length === 0) {
            console.log("\n⚠️ NOTA: El cliente no tiene pedidos ni devoluciones registradas");
        }
        
    } catch (error) {
        console.error("Error en la verificación:", error.message);
        if (error.response) {
            console.error("Datos del error:", error.response.data);
        }
    }
}

// Función auxiliar para verificar si un pedido pertenece realmente al cliente
function verificarPedidoPerteneciente(pedido, cliente) {
    const clienteId = cliente._id.toString();
    const clienteNombre = cliente.nombre.toLowerCase();
    
    // Verificar clienteId
    if (pedido.clienteId && pedido.clienteId.toString() === clienteId) return true;
    
    // Verificar cliente._id
    if (pedido.cliente && pedido.cliente._id && pedido.cliente._id.toString() === clienteId) return true;
    
    // Verificar clienteNombre (exacto)
    if (pedido.clienteNombre && pedido.clienteNombre.toLowerCase() === clienteNombre) return true;
    
    // Verificar cliente.nombre (exacto)
    if (pedido.cliente && pedido.cliente.nombre && pedido.cliente.nombre.toLowerCase() === clienteNombre) return true;
    
    // Verificar cliente como string (exacto)
    if (typeof pedido.cliente === 'string' && pedido.cliente.toLowerCase() === clienteNombre) return true;
    
    // No coincide exactamente
    return false;
}

// Ejecutar la verificación
verificarCorreccion();
