const axios = require('axios');

// Script para probar el filtrado correcto de pedidos por cliente
async function probarFiltradoPedidosCliente() {
  const API_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
  
  console.log('🔍 Probando el filtrado de pedidos por cliente...\n');
  
  try {
    // 1. Obtener todos los clientes
    console.log('1. Obteniendo lista de clientes...');
    const clientesRes = await axios.get(`${API_URL}/clientes`);
    const clientes = clientesRes.data;
    
    // Verificar la estructura de los datos
    console.log('Tipo de respuesta:', typeof clientes);
    console.log('Es array:', Array.isArray(clientes));
    if (Array.isArray(clientes)) {
      console.log(`✅ ${clientes.length} clientes encontrados`);
    } else {
      console.log('❌ La respuesta no es un array. Estructura:', clientes);
      return;
    }
    
    if (clientes.length === 0) {
      console.log('❌ No hay clientes en la base de datos para probar');
      return;
    }
    
    // 2. Tomar el primer cliente válido y buscar sus pedidos
    const clientePrueba = clientes.find(c => c.nombre && c._id) || clientes[0];
    console.log(`2. Probando con cliente: "${clientePrueba.nombre}" (ID: ${clientePrueba._id})`);
    
    if (!clientePrueba.nombre || !clientePrueba._id) {
      console.log('❌ El cliente de prueba no tiene nombre o ID válidos');
      console.log('Cliente:', JSON.stringify(clientePrueba, null, 2));
      return;
    }
    
    // 3. Buscar pedidos usando el filtro por nombre exacto
    console.log('3. Buscando pedidos por nombre exacto...');
    const pedidosNombreRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: clientePrueba.nombre
      }
    });
    const pedidosNombre = pedidosNombreRes.data;
    console.log(`✅ ${pedidosNombre.length} pedidos encontrados por nombre exacto`);
    
    // 4. Buscar pedidos usando el filtro por ID
    console.log('4. Buscando pedidos por clienteId...');
    const pedidosIdRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        clienteId: clientePrueba._id
      }
    });
    const pedidosId = pedidosIdRes.data;
    console.log(`✅ ${pedidosId.length} pedidos encontrados por clienteId`);
    
    // 5. Buscar pedidos usando ambos filtros (como hace el frontend)
    console.log('5. Buscando pedidos con filtros combinados (como en el frontend)...');
    const pedidosCombinadosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        clienteId: clientePrueba._id,
        nombreCliente: clientePrueba.nombre
      }
    });
    const pedidosCombinados = pedidosCombinadosRes.data;
    console.log(`✅ ${pedidosCombinados.length} pedidos encontrados con filtros combinados`);
    
    // Asegurar que pedidosCombinados es un array
    if (!Array.isArray(pedidosCombinados)) {
      console.log('❌ Error: La respuesta no es un array');
      console.log('Respuesta recibida:', typeof pedidosCombinados, pedidosCombinados);
      return;
    }
    
    // 6. Verificar que todos los pedidos pertenecen realmente al cliente
    console.log('\n6. Verificando integridad de los datos...');
    let pedidosCorrectos = 0;
    let pedidosIncorrectos = 0;
    
    pedidosCombinados.forEach(pedido => {
      const perteneceAlCliente = 
        pedido.clienteId === clientePrueba._id ||
        (typeof pedido.cliente === 'string' && pedido.cliente === clientePrueba._id) ||
        (typeof pedido.cliente === 'object' && pedido.cliente && pedido.cliente._id === clientePrueba._id) ||
        pedido.clienteNombre === clientePrueba.nombre;
      
      if (perteneceAlCliente) {
        pedidosCorrectos++;
      } else {
        pedidosIncorrectos++;
        console.log(`❌ Pedido incorrecto encontrado: ${pedido._id} - Cliente: ${pedido.clienteNombre || 'N/A'}`);
      }
    });
    
    console.log(`✅ ${pedidosCorrectos} pedidos correctos`);
    console.log(`❌ ${pedidosIncorrectos} pedidos incorrectos`);
    
    // 7. Probar filtrado con nombre parcial (debería devolver 0 resultados)
    console.log('\n7. Probando filtro con nombre parcial (debería devolver 0 resultados)...');
    const nombreParcial = clientePrueba.nombre.split(' ')[0]; // Tomar solo la primera palabra
    const pedidosParcialRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: nombreParcial
      }
    });
    const pedidosParcial = pedidosParcialRes.data;
    console.log(`📊 ${pedidosParcial.length} pedidos encontrados con nombre parcial "${nombreParcial}"`);
    
    if (pedidosParcial.length === 0) {
      console.log('✅ Correcto: El filtro por nombre parcial no devuelve resultados');
    } else {
      console.log('❌ Error: El filtro por nombre parcial devolvió resultados incorrectos');
    }
    
    // 8. Resumen
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log('==============================');
    console.log(`Cliente probado: ${clientePrueba.nombre}`);
    console.log(`Pedidos por nombre: ${pedidosNombre.length}`);
    console.log(`Pedidos por ID: ${pedidosId.length}`);
    console.log(`Pedidos combinados: ${pedidosCombinados.length}`);
    console.log(`Pedidos correctos: ${pedidosCorrectos}`);
    console.log(`Pedidos incorrectos: ${pedidosIncorrectos}`);
    console.log(`Filtro parcial (debe ser 0): ${pedidosParcial.length}`);
    
    if (pedidosIncorrectos === 0 && pedidosParcial.length === 0) {
      console.log('\n🎉 ¡PRUEBA EXITOSA! El filtrado funciona correctamente');
    } else {
      console.log('\n⚠️  PRUEBA FALLIDA. Revisar la implementación del filtrado');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar la prueba
if (require.main === module) {
  probarFiltradoPedidosCliente();
}

module.exports = probarFiltradoPedidosCliente;
