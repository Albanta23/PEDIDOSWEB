#!/usr/bin/env node

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3100/api';

async function testFiltradoCliente() {
  console.log('\n🔍 PROBANDO FILTRADO DE PEDIDOS POR CLIENTE\n');
  
  try {
    // 1. Obtener todos los pedidos para ver la estructura
    console.log('📋 1. Obteniendo todos los pedidos...');
    const todosRes = await axios.get(`${API_URL}/pedidos-clientes`);
    const todosPedidos = todosRes.data;
    
    console.log(`   ✅ Total pedidos encontrados: ${todosPedidos.length}`);
    
    // Mostrar algunos ejemplos de estructura de cliente
    if (todosPedidos.length > 0) {
      console.log('\n📊 Ejemplos de estructura de cliente en pedidos:');
      todosPedidos.slice(0, 3).forEach((pedido, i) => {
        console.log(`   Pedido ${i + 1}:`);
        console.log(`     - clienteId: ${pedido.clienteId}`);
        console.log(`     - clienteNombre: ${pedido.clienteNombre}`);
        console.log(`     - cliente (objeto): ${JSON.stringify(pedido.cliente)}`);
        console.log(`     - Estado: ${pedido.estado}`);
        console.log(`     - En historial devoluciones: ${pedido.enHistorialDevoluciones}`);
        console.log('');
      });
    }
    
    // 2. Buscar un cliente específico para probar
    const clientesUnicos = new Set();
    todosPedidos.forEach(pedido => {
      if (pedido.clienteNombre) clientesUnicos.add(pedido.clienteNombre);
      if (pedido.cliente && typeof pedido.cliente === 'string') clientesUnicos.add(pedido.cliente);
      if (pedido.cliente && pedido.cliente.nombre) clientesUnicos.add(pedido.cliente.nombre);
    });
    
    const clientesArray = Array.from(clientesUnicos);
    console.log(`\n👥 Clientes únicos encontrados: ${clientesArray.length}`);
    
    if (clientesArray.length > 0) {
      const clientePrueba = clientesArray[0];
      console.log(`\n🎯 Probando filtrado para cliente: "${clientePrueba}"`);
      
      // 3. Filtrar por nombre de cliente
      const filtradoRes = await axios.get(`${API_URL}/pedidos-clientes`, {
        params: {
          nombreCliente: clientePrueba
        }
      });
      
      console.log(`   ✅ Pedidos filtrados por nombre: ${filtradoRes.data.length}`);
      
      // Verificar que todos los pedidos son del cliente correcto
      let todosCorrectos = true;
      filtradoRes.data.forEach((pedido, i) => {
        const esDelCliente = 
          pedido.clienteNombre === clientePrueba || 
          pedido.cliente === clientePrueba ||
          (pedido.cliente && pedido.cliente.nombre === clientePrueba);
        
        if (!esDelCliente) {
          console.log(`   ❌ ERROR: Pedido ${i + 1} no pertenece al cliente "${clientePrueba}"`);
          console.log(`      clienteNombre: ${pedido.clienteNombre}`);
          console.log(`      cliente: ${JSON.stringify(pedido.cliente)}`);
          todosCorrectos = false;
        }
      });
      
      if (todosCorrectos) {
        console.log(`   ✅ Todos los pedidos filtrados pertenecen al cliente correcto`);
      }
      
      // 4. Probar filtrado por cliente + historial devoluciones
      console.log(`\n📦 Probando filtrado por cliente + pedidos normales...`);
      const normalesRes = await axios.get(`${API_URL}/pedidos-clientes`, {
        params: {
          nombreCliente: clientePrueba,
          enHistorialDevoluciones: false
        }
      });
      
      console.log(`   ✅ Pedidos normales del cliente: ${normalesRes.data.length}`);
      
      console.log(`\n🔄 Probando filtrado por cliente + devoluciones...`);
      const devolucionesRes = await axios.get(`${API_URL}/pedidos-clientes`, {
        params: {
          nombreCliente: clientePrueba,
          enHistorialDevoluciones: true
        }
      });
      
      console.log(`   ✅ Devoluciones del cliente: ${devolucionesRes.data.length}`);
      
      // 5. Verificar que la suma de normales + devoluciones = total
      const totalEsperado = normalesRes.data.length + devolucionesRes.data.length;
      const totalObtenido = filtradoRes.data.length;
      
      console.log(`\n🧮 Verificación de totales:`);
      console.log(`   Pedidos normales: ${normalesRes.data.length}`);
      console.log(`   Devoluciones: ${devolucionesRes.data.length}`);
      console.log(`   Suma esperada: ${totalEsperado}`);
      console.log(`   Total obtenido: ${totalObtenido}`);
      
      if (totalEsperado === totalObtenido) {
        console.log(`   ✅ Los totales coinciden correctamente`);
      } else {
        console.log(`   ⚠️  Los totales no coinciden - puede haber inconsistencias`);
      }
    }
    
    console.log('\n✅ PRUEBA COMPLETADA');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testFiltradoCliente();
