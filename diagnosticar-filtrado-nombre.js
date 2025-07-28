const axios = require('axios');

// Script para diagnosticar el problema específico del filtrado por nombre
async function diagnosticarProblemaFiltradoNombre() {
  const API_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
  
  console.log('🔍 Diagnosticando problema de filtrado por nombre de cliente...\n');
  
  try {
    // 1. Buscar un cliente que tenga pedidos (por ID)
    console.log('1. Buscando clientes con pedidos...');
    const clientesRes = await axios.get(`${API_URL}/clientes`);
    const clientes = clientesRes.data;
    
    let clienteConPedidos = null;
    let pedidosDelCliente = [];
    
    // Buscar un cliente que tenga pedidos
    for (let i = 0; i < Math.min(50, clientes.length); i++) {
      const cliente = clientes[i];
      if (!cliente._id || !cliente.nombre) continue;
      
      try {
        const pedidosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
          params: { clienteId: cliente._id }
        });
        
        if (pedidosRes.data && pedidosRes.data.length > 0) {
          clienteConPedidos = cliente;
          pedidosDelCliente = pedidosRes.data;
          console.log(`✅ Cliente encontrado: "${cliente.nombre}" tiene ${pedidosRes.data.length} pedidos`);
          break;
        }
      } catch (error) {
        // Continuar con el siguiente cliente
      }
    }
    
    if (!clienteConPedidos) {
      console.log('❌ No se encontró ningún cliente con pedidos');
      return;
    }
    
    console.log('\n2. Analizando estructura de los pedidos...');
    console.log(`Cliente seleccionado: "${clienteConPedidos.nombre}" (ID: ${clienteConPedidos._id})`);
    
    // Examinar cómo está almacenado el nombre del cliente en los pedidos
    const primerPedido = pedidosDelCliente[0];
    console.log('Estructura del primer pedido:');
    console.log('- clienteId:', primerPedido.clienteId);
    console.log('- clienteNombre:', primerPedido.clienteNombre);
    console.log('- cliente (tipo):', typeof primerPedido.cliente);
    console.log('- cliente (valor):', primerPedido.cliente);
    
    if (typeof primerPedido.cliente === 'object' && primerPedido.cliente) {
      console.log('- cliente.nombre:', primerPedido.cliente.nombre);
      console.log('- cliente._id:', primerPedido.cliente._id);
    }
    
    console.log('\n3. Probando filtrado por diferentes variantes del nombre...');
    
    // Probar diferentes variantes del nombre
    const variantes = [
      clienteConPedidos.nombre,
      clienteConPedidos.nombre.toUpperCase(),
      clienteConPedidos.nombre.toLowerCase(),
      primerPedido.clienteNombre,
      typeof primerPedido.cliente === 'object' ? primerPedido.cliente?.nombre : primerPedido.cliente
    ].filter(Boolean);
    
    // Eliminar duplicados
    const variantesUnicas = [...new Set(variantes)];
    
    for (let i = 0; i < variantesUnicas.length; i++) {
      const variante = variantesUnicas[i];
      if (!variante || typeof variante !== 'string') continue;
      
      try {
        const pedidosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
          params: { nombreCliente: variante }
        });
        
        console.log(`Variante "${variante}": ${pedidosRes.data?.length || 0} pedidos encontrados`);
      } catch (error) {
        console.log(`Variante "${variante}": Error - ${error.message}`);
      }
    }
    
    console.log('\n4. Probando filtrado combinado con nombre correcto...');
    
    // Encontrar qué variante funciona
    let nombreCorrecto = null;
    for (let variante of variantesUnicas) {
      if (!variante || typeof variante !== 'string') continue;
      
      try {
        const pedidosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
          params: { nombreCliente: variante }
        });
        
        if (pedidosRes.data && pedidosRes.data.length > 0) {
          nombreCorrecto = variante;
          console.log(`✅ Nombre correcto encontrado: "${nombreCorrecto}"`);
          break;
        }
      } catch (error) {
        // Continuar
      }
    }
    
    if (nombreCorrecto) {
      // Probar filtrado combinado
      const pedidosCombinadosRes = await axios.get(`${API_URL}/pedidos-clientes`, {
        params: {
          clienteId: clienteConPedidos._id,
          nombreCliente: nombreCorrecto
        }
      });
      
      console.log(`Filtros combinados (ID + nombre correcto): ${pedidosCombinadosRes.data?.length || 0} pedidos`);
    } else {
      console.log('❌ No se encontró ninguna variante de nombre que funcione');
    }
    
    console.log('\n5. Recomendaciones:');
    console.log('===================');
    
    if (clienteConPedidos.nombre !== primerPedido.clienteNombre) {
      console.log('⚠️  INCONSISTENCIA DETECTADA:');
      console.log(`   Cliente.nombre: "${clienteConPedidos.nombre}"`);
      console.log(`   Pedido.clienteNombre: "${primerPedido.clienteNombre}"`);
      console.log('   Recomendación: Normalizar nombres en la base de datos');
    }
    
    if (!nombreCorrecto) {
      console.log('⚠️  El filtrado por nombre no funciona para este cliente');
      console.log('   Recomendación: Revisar la implementación del filtrado en el backend');
    }
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar el diagnóstico
if (require.main === module) {
  diagnosticarProblemaFiltradoNombre();
}

module.exports = diagnosticarProblemaFiltradoNombre;
