// Script para verificar que la solución funciona correctamente
const axios = require('axios');
require('dotenv').config();

// Configuración de la API
const API_URL_BASE = process.env.VITE_API_URL || 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log('=== VERIFICACIÓN DE SOLUCIÓN PARA PEDIDOS DE CLIENTE ===');
console.log(`API URL: ${API_URL}`);

// Función para verificar pedidos de un cliente específico
async function verificarPedidosCliente(nombreCliente, clienteId) {
  console.log(`\nVerificando pedidos para cliente: "${nombreCliente}" (ID: ${clienteId || 'No proporcionado'})`);
  
  try {
    // Obtener pedidos usando nombre exacto
    console.log('1. Consultando pedidos con nombre exacto...');
    const resNombreExacto = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente,
        enHistorialDevoluciones: false
      }
    });
    console.log(`   ✅ Pedidos encontrados con nombre exacto: ${resNombreExacto.data.length}`);
    
    // Obtener pedidos usando ID de cliente
    let resId = null;
    if (clienteId) {
      console.log('2. Consultando pedidos con ID de cliente...');
      resId = await axios.get(`${API_URL}/pedidos-clientes`, {
        params: {
          clienteId,
          enHistorialDevoluciones: false
        }
      });
      console.log(`   ✅ Pedidos encontrados con ID de cliente: ${resId.data.length}`);
      
      // Comparar resultados
      if (resNombreExacto.data.length !== resId.data.length) {
        console.log(`   ⚠️ Discrepancia: ${resNombreExacto.data.length} pedidos por nombre vs ${resId.data.length} pedidos por ID`);
      } else {
        console.log(`   ✅ Consistencia: Mismo número de pedidos encontrados por nombre e ID`);
      }
    }
    
    // Obtener pedidos usando nombre parcial (simulando el bug anterior)
    console.log('3. Probando consulta con nombre parcial (debería devolver solo coincidencias exactas)...');
    // Tomar solo la primera palabra del nombre
    const nombreParcial = nombreCliente.split(' ')[0];
    const resNombreParcial = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: nombreParcial,
        enHistorialDevoluciones: false
      }
    });
    
    // Verificar si hay pedidos que no corresponden al cliente exacto
    const pedidosIncorrectos = resNombreParcial.data.filter(pedido => {
      const pedidoClienteNombre = pedido.clienteNombre || 
                                (pedido.cliente && typeof pedido.cliente === 'object' ? pedido.cliente.nombre : 
                                typeof pedido.cliente === 'string' ? pedido.cliente : '');
      return pedidoClienteNombre !== nombreCliente;
    });
    
    if (pedidosIncorrectos.length > 0) {
      console.log(`   ❌ Encontrados ${pedidosIncorrectos.length} pedidos que no corresponden exactamente al cliente`);
      console.log('   Primeros 3 nombres incorrectos:');
      pedidosIncorrectos.slice(0, 3).forEach(pedido => {
        const pedidoClienteNombre = pedido.clienteNombre || 
                                  (pedido.cliente && typeof pedido.cliente === 'object' ? pedido.cliente.nombre : 
                                  typeof pedido.cliente === 'string' ? pedido.cliente : '');
        console.log(`   - ${pedidoClienteNombre} (ID pedido: ${pedido._id})`);
      });
    } else {
      console.log(`   ✅ Correcto: La búsqueda por nombre parcial "${nombreParcial}" no devuelve pedidos incorrectos`);
    }
    
    return {
      clienteNombre: nombreCliente,
      clienteId,
      pedidosPorNombre: resNombreExacto.data.length,
      pedidosPorId: resId ? resId.data.length : null,
      pedidosPorNombreParcial: resNombreParcial.data.length,
      pedidosIncorrectos: pedidosIncorrectos.length
    };
  } catch (error) {
    console.error('❌ Error verificando pedidos:', error.message);
    return {
      clienteNombre: nombreCliente,
      clienteId,
      error: error.message
    };
  }
}

// Función principal
async function ejecutarVerificacion() {
  try {
    // Lista de clientes a verificar (añadir el cliente problemático y otros para comparar)
    const clientesAVerificar = [
      { nombre: 'PASCUAL FERNANDEZ FERNANDEZ', id: null },
      { nombre: 'RICARDO PEREZ PASCUAL', id: '687deb7496a8842b040ca378' },
      { nombre: 'ROSA MARIA PASCUAL SEISDEDOS', id: '687deb8496a8842b040ca444' },
      { nombre: 'PASCUAL', id: '687deb9d96a8842b040ca590' },
      { nombre: 'TOMAS ELVIRA PASCUAL', id: '687debcc96a8842b040ca7db' }
    ];
    
    console.log('\nIniciando verificación para múltiples clientes...');
    const resultados = [];
    
    for (const cliente of clientesAVerificar) {
      const resultado = await verificarPedidosCliente(cliente.nombre, cliente.id);
      resultados.push(resultado);
    }
    
    console.log('\n=== RESUMEN DE RESULTADOS ===');
    console.log('Cliente | Pedidos por Nombre | Pedidos por ID | Pedidos Incorrectos');
    console.log('--------|-------------------|---------------|-------------------');
    resultados.forEach(r => {
      if (r.error) {
        console.log(`${r.clienteNombre} | ERROR: ${r.error}`);
      } else {
        console.log(`${r.clienteNombre} | ${r.pedidosPorNombre} | ${r.pedidosPorId || 'N/A'} | ${r.pedidosIncorrectos}`);
      }
    });
    
    // Evaluar resultados
    const hayProblemas = resultados.some(r => r.error || (r.pedidosIncorrectos && r.pedidosIncorrectos > 0) || 
                                        (r.pedidosPorId !== null && r.pedidosPorNombre !== r.pedidosPorId));
    
    if (hayProblemas) {
      console.log('\n⚠️ Se detectaron problemas en la verificación. Revise los resultados detallados.');
    } else {
      console.log('\n✅ Verificación completada correctamente. El filtrado de pedidos por cliente funciona como se espera.');
    }
    
    // Sugerencias de mejora
    console.log('\nRecomendaciones futuras:');
    console.log('1. Considerar normalizar los nombres de cliente en la base de datos para evitar problemas de coincidencia');
    console.log('2. Utilizar siempre el ID del cliente como referencia principal, no el nombre');
    console.log('3. Implementar un sistema de alertas para detectar inconsistencias de datos');
  } catch (error) {
    console.error('Error general durante la verificación:', error);
  }
}

// Ejecutar la verificación
ejecutarVerificacion();
