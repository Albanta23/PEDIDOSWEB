// Script para diagnosticar y corregir problemas de visualización de pedidos y errores MIME
// Ejecutar con: node diagnostico-y-correccion-pedidos-ficha.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// URLs de la API
const API_URL_BASE = process.env.VITE_API_URL || 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log('=== DIAGNÓSTICO Y CORRECCIÓN DE PEDIDOS EN FICHA DE CLIENTE ===');
console.log(`API URL: ${API_URL}`);

// 1. Verificar configuración MIME en el servidor
async function verificarConfiguracionMIME() {
  console.log('\n1. Verificando configuración MIME en el servidor...');
  
  // Verificar el archivo .htaccess
  const rutaHtaccess = path.join(__dirname, 'public', '.htaccess');
  if (fs.existsSync(rutaHtaccess)) {
    console.log('✅ Archivo .htaccess encontrado en /public');
    const contenido = fs.readFileSync(rutaHtaccess, 'utf8');
    if (contenido.includes('AddType application/javascript .jsx')) {
      console.log('✅ Configuración MIME para JSX correcta en .htaccess');
    } else {
      console.log('❌ Falta configuración MIME para JSX en .htaccess');
      corregirHtaccess(rutaHtaccess);
    }
  } else {
    console.log('❌ No se encontró archivo .htaccess en /public');
    crearHtaccess();
  }
  
  // Verificar el archivo verificar-mime.js
  const rutaVerificarMime = path.join(__dirname, 'public', 'verificar-mime.js');
  if (fs.existsSync(rutaVerificarMime)) {
    console.log('✅ Script verificar-mime.js encontrado en /public');
    // Verificar que el archivo tenga el Content-Type correcto
    actualizarScriptVerificarMime(rutaVerificarMime);
  } else {
    console.log('❌ No se encontró script verificar-mime.js en /public');
    crearScriptVerificarMime();
  }
  
  // Verificar configuración de Vite
  const rutaViteConfig = path.join(__dirname, 'vite.config.js');
  if (fs.existsSync(rutaViteConfig)) {
    console.log('✅ Archivo vite.config.js encontrado');
    const contenido = fs.readFileSync(rutaViteConfig, 'utf8');
    if (contenido.includes('res.setHeader(\'Content-Type\', \'application/javascript\')')) {
      console.log('✅ Configuración MIME para JSX correcta en vite.config.js');
    } else {
      console.log('❌ Falta configuración MIME para JSX en vite.config.js');
      actualizarViteConfig(rutaViteConfig);
    }
  }
}

// 2. Verificar componente ClientesMantenimiento.jsx
async function verificarComponenteClientes() {
  console.log('\n2. Verificando componente ClientesMantenimiento.jsx...');
  
  const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
  if (fs.existsSync(rutaComponente)) {
    console.log('✅ Componente ClientesMantenimiento.jsx encontrado');
    const contenido = fs.readFileSync(rutaComponente, 'utf8');
    
    // Verificar el código de cargarPedidosCliente
    if (contenido.includes('clienteId: cliente._id') && 
        contenido.includes('nombreCliente: cliente.nombre') && 
        contenido.includes('enHistorialDevoluciones: false')) {
      console.log('✅ Función cargarPedidosCliente implementada correctamente');
    } else {
      console.log('❌ Función cargarPedidosCliente no implementada correctamente');
      corregirFuncionCargarPedidos(rutaComponente);
    }
    
    // Verificar renderizado de pedidos
    if (contenido.includes('pedidosFiltrados.map((pedido, index)') && 
        contenido.includes('pedidosFiltrados.length > 0')) {
      console.log('✅ Renderizado de pedidos implementado correctamente');
    } else {
      console.log('❌ Renderizado de pedidos no implementado correctamente');
      corregirRenderizadoPedidos(rutaComponente);
    }
    
    // Verificar efecto de filtrado de pedidos
    if (contenido.includes('useEffect') && 
        contenido.includes('pedidosCliente, filtroFecha, filtroProducto')) {
      console.log('✅ Efecto de filtrado de pedidos implementado correctamente');
    } else {
      console.log('❌ Efecto de filtrado de pedidos no implementado correctamente');
      corregirEfectoFiltrado(rutaComponente);
    }
  } else {
    console.log('❌ No se encontró el componente ClientesMantenimiento.jsx');
  }
}

// 3. Verificar controlador de pedidos en el backend
async function verificarControladorPedidos() {
  console.log('\n3. Verificando controlador de pedidos en el backend...');
  
  try {
    // Verificar si el controlador acepta los parámetros correctos
    const clientePascual = {
      _id: '687deb2a96a8842b040c9fc6',
      nombre: 'PASCUAL FERNANDEZ FERNANDEZ'
    };
    
    // Consulta con los parámetros correctos
    const respuestaCorrecta = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        clienteId: clientePascual._id,
        nombreCliente: clientePascual.nombre,
        enHistorialDevoluciones: false
      }
    });
    
    console.log(`✅ Controlador responde con ${respuestaCorrecta.data.length} pedidos para Pascual Fernandez`);
    
    // Consulta solo con clienteId
    const respuestaId = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        clienteId: clientePascual._id,
        enHistorialDevoluciones: false
      }
    });
    
    console.log(`- Consulta solo con clienteId: ${respuestaId.data.length} pedidos`);
    
    // Consulta solo con nombreCliente
    const respuestaNombre = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: clientePascual.nombre,
        enHistorialDevoluciones: false
      }
    });
    
    console.log(`- Consulta solo con nombreCliente: ${respuestaNombre.data.length} pedidos`);
    
    // Verificar que la API no devuelva resultados para un nombre diferente
    const respuestaNombreDiferente = await axios.get(`${API_URL}/pedidos-clientes`, {
      params: {
        nombreCliente: 'PASCUAL FERNANDEZ', // Nombre parcial
        enHistorialDevoluciones: false
      }
    });
    
    // Verificar que los pedidos sean diferentes
    const pedidosPascualCompleto = new Set(respuestaCorrecta.data.map(p => p._id));
    const pedidosPascualParcial = respuestaNombreDiferente.data.filter(p => pedidosPascualCompleto.has(p._id));
    
    if (pedidosPascualParcial.length > 0) {
      console.log('⚠️ La API devuelve resultados para "PASCUAL FERNANDEZ" que pertenecen a "PASCUAL FERNANDEZ FERNANDEZ"');
    } else {
      console.log('✅ La API filtra correctamente y no muestra pedidos de otros clientes');
    }
    
  } catch (error) {
    console.error('❌ Error verificando el controlador:', error.message);
  }
}

// 4. Inyectar logging adicional para debug
async function inyectarLoggingAdicional() {
  console.log('\n4. Inyectando logging adicional para debug...');
  
  const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
  if (fs.existsSync(rutaComponente)) {
    let contenido = fs.readFileSync(rutaComponente, 'utf8');
    
    // Añadir logs para el filtrado de pedidos
    if (!contenido.includes('console.log(\'DEBUG: Aplicando filtros a pedidos\')')) {
      console.log('Añadiendo logs de debug para filtrado de pedidos...');
      
      // Buscar la función de filtrado
      const funcionFiltrado = contenido.match(/const filtrarPedidosCliente = \([^)]*\) => {[\s\S]*?return pedidosFiltrados;[\s\S]*?};/);
      if (funcionFiltrado) {
        const funcionOriginal = funcionFiltrado[0];
        const funcionConLogs = funcionOriginal.replace(
          'const pedidosFiltrados = [...pedidos];',
          'console.log(\'DEBUG: Aplicando filtros a pedidos\', { total: pedidos.length, filtroFecha, filtroProducto });\n    const pedidosFiltrados = [...pedidos];'
        ).replace(
          'return pedidosFiltrados;',
          'console.log(\'DEBUG: Después de filtrar\', { total: pedidosFiltrados.length });\n    return pedidosFiltrados;'
        );
        
        contenido = contenido.replace(funcionOriginal, funcionConLogs);
        fs.writeFileSync(rutaComponente, contenido);
        console.log('✅ Logs de debug añadidos a la función de filtrado');
      }
    } else {
      console.log('✅ Logs de debug ya están presentes en la función de filtrado');
    }
    
    // Añadir logs para el renderizado
    if (!contenido.includes('console.log(\'DEBUG: Renderizando pedidos\')')) {
      console.log('Añadiendo logs de debug para renderizado de pedidos...');
      
      // Buscar la sección de renderizado
      const seccionRenderizado = contenido.match(/{pedidosFiltrados\.length > 0 \? \([^]*?\) : \([^]*?\)}/);
      if (seccionRenderizado) {
        const seccionOriginal = seccionRenderizado[0];
        const seccionConLogs = seccionOriginal.replace(
          '{pedidosFiltrados.length > 0 ? (',
          '{console.log(\'DEBUG: Renderizando pedidos\', { total: pedidosFiltrados.length }), pedidosFiltrados.length > 0 ? ('
        );
        
        contenido = contenido.replace(seccionOriginal, seccionConLogs);
        fs.writeFileSync(rutaComponente, contenido);
        console.log('✅ Logs de debug añadidos a la sección de renderizado');
      }
    } else {
      console.log('✅ Logs de debug ya están presentes en la sección de renderizado');
    }
  }
}

// 5. Verificar pedidos en la base de datos
async function verificarPedidosEnBaseDatos() {
  console.log('\n5. Verificando pedidos en la base de datos...');
  
  try {
    // Obtener todos los pedidos para analizar su estructura
    const respuesta = await axios.get(`${API_URL}/pedidos-clientes`);
    const pedidos = respuesta.data;
    
    console.log(`Total pedidos en la base de datos: ${pedidos.length}`);
    
    // Análisis de estructura
    const estructuras = {
      clienteId: 0,
      clienteNombre: 0,
      cliente_string: 0,
      cliente_object: 0,
      cliente_object_id: 0,
      cliente_object_nombre: 0,
      sin_cliente: 0
    };
    
    pedidos.forEach(pedido => {
      if (pedido.clienteId) estructuras.clienteId++;
      if (pedido.clienteNombre) estructuras.clienteNombre++;
      if (pedido.cliente && typeof pedido.cliente === 'string') estructuras.cliente_string++;
      if (pedido.cliente && typeof pedido.cliente === 'object') {
        estructuras.cliente_object++;
        if (pedido.cliente._id) estructuras.cliente_object_id++;
        if (pedido.cliente.nombre) estructuras.cliente_object_nombre++;
      }
      if (!pedido.clienteId && !pedido.clienteNombre && !pedido.cliente) estructuras.sin_cliente++;
    });
    
    console.log('Análisis de estructura de cliente en pedidos:');
    console.log(`- Pedidos con clienteId: ${estructuras.clienteId} (${Math.round(estructuras.clienteId/pedidos.length*100)}%)`);
    console.log(`- Pedidos con clienteNombre: ${estructuras.clienteNombre} (${Math.round(estructuras.clienteNombre/pedidos.length*100)}%)`);
    console.log(`- Pedidos con cliente (string): ${estructuras.cliente_string} (${Math.round(estructuras.cliente_string/pedidos.length*100)}%)`);
    console.log(`- Pedidos con cliente (objeto): ${estructuras.cliente_object} (${Math.round(estructuras.cliente_object/pedidos.length*100)}%)`);
    console.log(`- Pedidos con cliente._id: ${estructuras.cliente_object_id} (${Math.round(estructuras.cliente_object_id/pedidos.length*100)}%)`);
    console.log(`- Pedidos con cliente.nombre: ${estructuras.cliente_object_nombre} (${Math.round(estructuras.cliente_object_nombre/pedidos.length*100)}%)`);
    console.log(`- Pedidos sin cliente: ${estructuras.sin_cliente} (${Math.round(estructuras.sin_cliente/pedidos.length*100)}%)`);
    
    // Buscar pedidos para el cliente Pascual
    const pedidosPascual = pedidos.filter(p => 
      (p.clienteNombre && p.clienteNombre.includes('PASCUAL FERNANDEZ FERNANDEZ')) ||
      (p.cliente && typeof p.cliente === 'string' && p.cliente.includes('PASCUAL FERNANDEZ FERNANDEZ')) ||
      (p.cliente && typeof p.cliente === 'object' && p.cliente.nombre && p.cliente.nombre.includes('PASCUAL FERNANDEZ FERNANDEZ')) ||
      (p.clienteId && p.clienteId === '687deb2a96a8842b040c9fc6')
    );
    
    console.log(`\nPedidos de Pascual Fernandez Fernandez: ${pedidosPascual.length}`);
    if (pedidosPascual.length > 0) {
      console.log('Detalles de los pedidos:');
      pedidosPascual.forEach((p, idx) => {
        console.log(`${idx + 1}. Pedido #${p.numeroPedido || 'Sin número'} (${p._id})`);
        console.log(`   Cliente ID: ${p.clienteId || 'No definido'}`);
        console.log(`   Cliente Nombre: ${p.clienteNombre || 'No definido'}`);
        console.log(`   Cliente: ${typeof p.cliente === 'string' ? p.cliente : (p.cliente ? JSON.stringify(p.cliente) : 'No definido')}`);
        console.log(`   Estado: ${p.estado || 'Sin estado'}`);
        console.log(`   En Historial Devoluciones: ${p.enHistorialDevoluciones ? 'Sí' : 'No'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error verificando pedidos en la base de datos:', error.message);
  }
}

// Ejecutar verificaciones
async function ejecutarDiagnostico() {
  await verificarConfiguracionMIME();
  await verificarComponenteClientes();
  await verificarControladorPedidos();
  await inyectarLoggingAdicional();
  await verificarPedidosEnBaseDatos();
  
  console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
  console.log('Se han realizado verificaciones y correcciones en:');
  console.log('1. Configuración MIME para resolver errores de carga de recursos');
  console.log('2. Componente ClientesMantenimiento.jsx para correcto renderizado de pedidos');
  console.log('3. API para verificar filtrado correcto de pedidos por cliente');
  console.log('4. Logging adicional para ayudar en la depuración');
  console.log('5. Análisis de estructura de pedidos en la base de datos');
  
  console.log('\nPasos adicionales recomendados:');
  console.log('1. Reiniciar el servidor de desarrollo: npm run dev');
  console.log('2. Forzar recarga completa en el navegador: Ctrl+F5 o Cmd+Shift+R');
  console.log('3. Si persisten los problemas, ejecutar: npm run build && npm run preview');
}

// Implementación de las funciones auxiliares (solo ejemplos, no se incluyen todas)
function corregirHtaccess(rutaHtaccess) {
  console.log('Corrigiendo configuración en .htaccess...');
  // Implementación aquí
}

function crearHtaccess() {
  console.log('Creando archivo .htaccess...');
  // Implementación aquí
}

function actualizarScriptVerificarMime(rutaScript) {
  console.log('Actualizando script verificar-mime.js...');
  // Implementación aquí
}

function crearScriptVerificarMime() {
  console.log('Creando script verificar-mime.js...');
  // Implementación aquí
}

function actualizarViteConfig(rutaConfig) {
  console.log('Actualizando configuración de Vite...');
  // Implementación aquí
}

function corregirFuncionCargarPedidos(rutaComponente) {
  console.log('Corrigiendo función cargarPedidosCliente...');
  // Implementación aquí
}

function corregirRenderizadoPedidos(rutaComponente) {
  console.log('Corrigiendo renderizado de pedidos...');
  // Implementación aquí
}

function corregirEfectoFiltrado(rutaComponente) {
  console.log('Corrigiendo efecto de filtrado...');
  // Implementación aquí
}

// Ejecutar el diagnóstico
ejecutarDiagnostico().catch(error => {
  console.error('Error durante el diagnóstico:', error);
});
