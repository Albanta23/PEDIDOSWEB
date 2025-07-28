const axios = require('axios');

// Script para probar directamente la lógica del controlador
async function probarLogicaControlador() {
  const API_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
  
  console.log('🔧 Probando la lógica del controlador...\n');
  
  try {
    // 1. Probar solo con nombreCliente (sin clienteId)
    console.log('1. Probando SOLO filtro por nombreCliente...');
    const soloNombreRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: 'CLIENTE PARTICULAR SA'
      }
    });
    console.log(`Resultado: ${soloNombreRes.data?.length || 0} pedidos`);
    
    // 2. Probar con parámetros de debug
    console.log('\n2. Probando con parámetros adicionales...');
    const debugRes = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: 'CLIENTE PARTICULAR SA',
        debug: 'true'
      }
    });
    console.log(`Resultado: ${debugRes.data?.length || 0} pedidos`);
    
    // 3. Obtener todos los pedidos y filtrar manualmente
    console.log('\n3. Verificando todos los pedidos manualmente...');
    const todosRes = await axios.get(`${API_URL}/pedidos-clientes`);
    const todosPedidos = todosRes.data;
    
    if (Array.isArray(todosPedidos)) {
      const pedidosConNombre = todosPedidos.filter(p => 
        p.clienteNombre === 'CLIENTE PARTICULAR SA' ||
        (p.cliente && p.cliente.nombre === 'CLIENTE PARTICULAR SA') ||
        p.cliente === 'CLIENTE PARTICULAR SA'
      );
      
      console.log(`Total pedidos en BD: ${todosPedidos.length}`);
      console.log(`Pedidos con nombre "CLIENTE PARTICULAR SA": ${pedidosConNombre.length}`);
      
      if (pedidosConNombre.length > 0) {
        console.log('Primer pedido encontrado:');
        const primer = pedidosConNombre[0];
        console.log('- _id:', primer._id);
        console.log('- clienteId:', primer.clienteId);
        console.log('- clienteNombre:', primer.clienteNombre);
        console.log('- cliente:', primer.cliente);
      }
    }
    
    // 4. Probar con regex manual para ver si el problema está en el escape
    console.log('\n4. Probando diferentes aproximaciones...');
    
    const aproximaciones = [
      'CLIENTE PARTICULAR SA',
      '^CLIENTE PARTICULAR SA$',
      'CLIENTE',
      'PARTICULAR'
    ];
    
    for (let approx of aproximaciones) {
      try {
        const res = await axios.get(`${API_URL}/pedidos-clientes`, {
          params: { nombreCliente: approx }
        });
        console.log(`"${approx}": ${res.data?.length || 0} pedidos`);
      } catch (error) {
        console.log(`"${approx}": Error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

// Ejecutar la prueba
if (require.main === module) {
  probarLogicaControlador();
}

module.exports = probarLogicaControlador;
