// Script de diagnóstico para verificar problemas con pedidos de clientes
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Intenta encontrar la URL de la API desde el archivo de entorno
let API_URL = process.env.API_URL || 'http://localhost:5000/api';
// Buscar en archivo .env
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiUrlMatch = envContent.match(/VITE_API_URL=(.+)/);
    if (apiUrlMatch && apiUrlMatch[1]) {
      API_URL = apiUrlMatch[1].trim();
      if (!API_URL.endsWith('/api')) {
        API_URL = `${API_URL}/api`;
      }
    }
  }
} catch (error) {
  console.log('No se pudo leer el archivo .env:', error.message);
}

const API_URL_CORRECTO = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

// Función principal
async function diagnosticarPedidosClientes() {
  console.log('Iniciando diagnóstico de pedidos de clientes...');
  console.log(`API URL: ${API_URL_CORRECTO}`);
  
  try {
    // 1. Verificar conexión a la API
    console.log('\n1. Verificando conexión a la API...');
    try {
      const pingRes = await axios.get(`${API_URL_CORRECTO}/`, { timeout: 5000 });
      console.log(`Estado de la API: ${pingRes.status || 'OK'}`);
    } catch (err) {
      console.log(`Error al conectar con la API: ${err.message}`);
      console.log('Continuando con el diagnóstico de código fuente...');
    }
    
    // 2. Diagnóstico del código fuente
    console.log('\n2. Analizando código del componente ClientesMantenimiento.jsx...');
    try {
      const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
      if (!fs.existsSync(rutaComponente)) {
        console.log(`El archivo ${rutaComponente} no existe.`);
      } else {
        const contenido = fs.readFileSync(rutaComponente, 'utf8');
        
        // Verificar función de carga de pedidos
        console.log('Analizando función cargarPedidosCliente...');
        const patronFuncion = /const cargarPedidosCliente = async \(clienteNombre\) => \{[\s\S]*?setCargandoPedidos\(false\);\s*\};/;
        const coincidencia = contenido.match(patronFuncion);
        
        if (!coincidencia) {
          console.log('No se encontró la función cargarPedidosCliente en el código.');
        } else {
          const funcionTexto = coincidencia[0];
          
          // Verificar si usa comparación estricta o includes
          if (funcionTexto.includes('===')) {
            console.log('⚠️ La función usa comparación estricta (===) que puede causar problemas de filtrado.');
          } else if (funcionTexto.includes('includes')) {
            console.log('✅ La función usa includes() para búsqueda flexible.');
          }
          
          // Verificar manejo de tipos
          if (funcionTexto.includes('toString') || funcionTexto.includes('String(')) {
            console.log('✅ La función convierte valores a string para evitar problemas de tipo.');
          } else {
            console.log('⚠️ La función no convierte explícitamente valores a string, lo que podría causar problemas.');
          }
          
          // Verificar logging
          if (funcionTexto.includes('console.log')) {
            console.log('✅ La función incluye logs para diagnóstico.');
          } else {
            console.log('⚠️ La función no incluye logs para diagnóstico.');
          }
        }
        
        // Verificar renderizado de pedidos
        console.log('\nAnalizando renderizado de pedidos...');
        if (contenido.includes('pedidosFiltrados.map')) {
          console.log('✅ El componente usa .map para renderizar pedidos filtrados.');
        } else {
          console.log('⚠️ No se encontró el patrón esperado para renderizar pedidos.');
        }
        
        // Verificar manejo de pedidos vacíos
        if (contenido.includes('pedidosCliente.length > 0 && pedidosFiltrados.length === 0')) {
          console.log('✅ El componente maneja el caso de pedidos filtrados vacíos.');
        } else {
          console.log('⚠️ El componente podría no manejar correctamente el caso de pedidos filtrados vacíos.');
        }
      }
    } catch (error) {
      console.log(`Error al analizar código fuente: ${error.message}`);
    }
    
    // 3. Intentar obtener datos de la API si está disponible
    console.log('\n3. Intentando obtener datos de la API...');
    let pedidos = [];
    let clientes = [];
    
    try {
      const pedidosRes = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes`, { timeout: 5000 });
      pedidos = pedidosRes.data || [];
      console.log(`Total de pedidos encontrados: ${pedidos.length}`);
      
      if (pedidos.length === 0) {
        console.log('ALERTA: No se encontraron pedidos en la base de datos.');
      } else {
        // Mostrar resumen de los primeros 3 pedidos
        console.log('\nResumen de los primeros 3 pedidos:');
        pedidos.slice(0, 3).forEach((pedido, i) => {
          console.log(`\nPedido #${i+1}:`);
          console.log(`  ID: ${pedido._id}`);
          console.log(`  Número: ${pedido.numeroPedido}`);
          console.log(`  Cliente ID: ${pedido.clienteId}`);
          console.log(`  Cliente Nombre: ${pedido.clienteNombre}`);
          console.log(`  Cliente (campo adicional): ${pedido.cliente}`);
          console.log(`  Estado: ${pedido.estado}`);
        });
      }
      
      // Obtener clientes
      const clientesRes = await axios.get(`${API_URL_CORRECTO}/clientes`, { timeout: 5000 });
      clientes = clientesRes.data || [];
      console.log(`\nTotal de clientes encontrados: ${clientes.length}`);
      
      // Probar filtrado si hay pedidos y clientes
      if (pedidos.length > 0 && clientes.length > 0) {
        console.log('\n4. Probando filtrado de pedidos por cliente...');
        const clientesPrueba = clientes.slice(0, 2);
        
        for (const cliente of clientesPrueba) {
          console.log(`\nProbando cliente: ${cliente.nombre} (ID: ${cliente._id})`);
          
          // Filtrar por criterios flexibles
          const nombreLower = String(cliente.nombre || '').toLowerCase();
          const pedidosFiltrados = pedidos.filter(pedido => {
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase();
            const pedidoId = String(pedido.clienteId || '').toLowerCase();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase();
            
            return pedidoNombre.includes(nombreLower) || 
                   nombreLower.includes(pedidoNombre) ||
                   pedidoId.includes(nombreLower) || 
                   pedidoCliente.includes(nombreLower);
          });
          
          console.log(`  Pedidos encontrados: ${pedidosFiltrados.length}`);
        }
      }
    } catch (error) {
      console.log(`Error al conectar con la API: ${error.message}`);
      console.log('El diagnóstico continuará con el análisis de código fuente solamente.');
    }
    
    console.log('\nDiagnóstico completo.');
  } catch (error) {
    console.error('\nError durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnosticarPedidosClientes();
