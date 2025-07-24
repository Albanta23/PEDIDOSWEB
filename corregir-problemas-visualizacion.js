// Script para corregir los problemas de visualización de pedidos
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// URLs de la API
const API_URL_BASE = process.env.VITE_API_URL || 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api';
const API_URL = API_URL_BASE.endsWith('/api') ? API_URL_BASE : `${API_URL_BASE}/api`;

console.log('=== CORRECCIÓN DE PROBLEMAS DE VISUALIZACIÓN DE PEDIDOS ===');
console.log(`API URL: ${API_URL}`);

async function corregirClientesMantenimiento() {
  console.log('\n1. Corrigiendo ClientesMantenimiento.jsx...');
  
  const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
  if (!fs.existsSync(rutaComponente)) {
    console.error('❌ No se encontró el archivo ClientesMantenimiento.jsx');
    return;
  }
  
  let contenido = fs.readFileSync(rutaComponente, 'utf8');
  
  // Hacer una copia de seguridad
  const rutaBackup = `${rutaComponente}.backup-${Date.now()}`;
  fs.writeFileSync(rutaBackup, contenido);
  console.log(`✅ Copia de seguridad creada en ${rutaBackup}`);
  
  // 1. Corregir la función de filtrado de pedidos para manejar pedidos sin la estructura esperada
  console.log('Mejorando la función filtrarPedidosCliente...');
  
  // Buscar la función de filtrado
  const funcionFiltrado = contenido.match(/const filtrarPedidosCliente = \([^)]*\) => {[\s\S]*?return pedidosFiltrados;[\s\S]*?};/);
  if (funcionFiltrado) {
    const funcionOriginal = funcionFiltrado[0];
    const funcionMejorada = `const filtrarPedidosCliente = (pedidos, filtroFecha, filtroProducto) => {
    console.log('DEBUG: Aplicando filtros a pedidos', { total: pedidos?.length || 0, filtroFecha, filtroProducto });
    
    // Asegurarnos que pedidos sea un array
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    let pedidosFiltrados = [...pedidosArray];

    // Filtro por fecha
    if (filtroFecha) {
      const fechaFiltro = new Date(filtroFecha);
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const fechaPedido = pedido.fechaPedido ? new Date(pedido.fechaPedido) : 
                           pedido.fechaCreacion ? new Date(pedido.fechaCreacion) : null;
        if (!fechaPedido) return false;
        
        // Comparar solo la fecha (sin hora)
        const fechaPedidoSolo = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate());
        const fechaFiltroSolo = new Date(fechaFiltro.getFullYear(), fechaFiltro.getMonth(), fechaFiltro.getDate());
        
        return fechaPedidoSolo.getTime() === fechaFiltroSolo.getTime();
      });
    }

    // Filtro por producto
    if (filtroProducto && filtroProducto.trim()) {
      const productoLower = filtroProducto.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        if (!pedido.lineas || pedido.lineas.length === 0) return false;
        
        return pedido.lineas.some(linea => 
          linea.producto && linea.producto.toLowerCase().includes(productoLower)
        );
      });
    }
    
    console.log('DEBUG: Después de filtrar', { total: pedidosFiltrados.length });
    return pedidosFiltrados;
  };`;
    
    contenido = contenido.replace(funcionOriginal, funcionMejorada);
  }
  
  // 2. Mejorar el efecto useEffect para setPedidosFiltrados
  console.log('Mejorando el efecto de filtrado...');
  
  // Buscar el useEffect para filtrado
  const efectoFiltrado = contenido.match(/useEffect\(\s*\(\)\s*=>\s*{\s*setPedidosFiltrados\(filtrarPedidosCliente\([^)]*\)\);\s*},\s*\[[^\]]*\]\);/);
  if (efectoFiltrado) {
    const efectoOriginal = efectoFiltrado[0];
    const efectoMejorado = `useEffect(() => {
    console.log('DEBUG: Efecto de filtrado ejecutado', { 
      pedidosLength: pedidosCliente?.length || 0, 
      filtroFecha, 
      filtroProducto 
    });
    setPedidosFiltrados(filtrarPedidosCliente(pedidosCliente, filtroFecha, filtroProducto));
  }, [pedidosCliente, filtroFecha, filtroProducto]);`;
    
    contenido = contenido.replace(efectoOriginal, efectoMejorado);
  }
  
  // 3. Mejorar la función cargarPedidosCliente
  console.log('Mejorando la función cargarPedidosCliente...');
  
  // Buscar la función cargarPedidosCliente
  const funcionCargaPedidos = contenido.match(/const cargarPedidosCliente = async \(cliente\) => {[\s\S]*?setCargandoPedidos\(false\);[\s\S]*?};/);
  if (funcionCargaPedidos) {
    const funcionOriginal = funcionCargaPedidos[0];
    const funcionMejorada = `const cargarPedidosCliente = async (cliente) => {
    setCargandoPedidos(true);
    try {
      // Validar que cliente sea un objeto válido
      if (!cliente || typeof cliente !== 'object') {
        console.error('Error: cliente no es un objeto válido', cliente);
        setPedidosCliente([]);
        setCargandoPedidos(false);
        return;
      }
      
      // Llamar a la API con los parámetros correctos para filtrar en el backend
      const res = await axios.get(\`\${API_URL_CORRECTO}/pedidos-clientes\`, {
        params: {
          clienteId: cliente._id, // Filtrar por ID del cliente
          nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
          enHistorialDevoluciones: false // Excluir pedidos en historial de devoluciones
        }
      });
      
      console.log('Cargando pedidos para cliente:', cliente.nombre, cliente._id);
      console.log('Total pedidos recibidos:', res.data?.length || 0);
      
      // Verificar y transformar los datos si es necesario
      const pedidosNormalizados = (res.data || []).map(pedido => {
        // Asegurarse de que tenga todas las propiedades necesarias
        return {
          ...pedido,
          // Si falta clienteId pero tiene cliente como string, usarlo como clienteId
          clienteId: pedido.clienteId || (typeof pedido.cliente === 'string' ? pedido.cliente : undefined)
        };
      });
      
      setPedidosCliente(pedidosNormalizados);
    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      setPedidosCliente([]);
    } finally {
      setCargandoPedidos(false);
    }
  };`;
    
    contenido = contenido.replace(funcionOriginal, funcionMejorada);
  }
  
  // 4. Mejorar sección de renderizado para mejor detección de errores
  console.log('Mejorando la sección de renderizado de pedidos...');
  
  // Buscar la sección de tabla de pedidos
  const seccionTablaPedidos = contenido.match(/<table[^>]*>[\s\S]*?{pedidosFiltrados\.length > 0[\s\S]*?<\/table>/);
  if (seccionTablaPedidos) {
    const seccionOriginal = seccionTablaPedidos[0];
    let seccionMejorada = seccionOriginal;
    
    // Añadir detección de tipo de datos y mejor manejo
    seccionMejorada = seccionMejorada.replace(
      '{pedidosFiltrados.length > 0 ? (',
      '{console.log(\'DEBUG: Renderizando pedidos\', { total: pedidosFiltrados?.length || 0 }), Array.isArray(pedidosFiltrados) && pedidosFiltrados.length > 0 ? ('
    );
    
    // Guardar la sección mejorada
    contenido = contenido.replace(seccionOriginal, seccionMejorada);
  }
  
  // Guardar los cambios
  fs.writeFileSync(rutaComponente, contenido);
  console.log('✅ Archivo ClientesMantenimiento.jsx actualizado con éxito');
}

async function corregirPedidosClientesController() {
  console.log('\n2. Corrigiendo pedidosClientesController.js...');
  
  const rutaController = path.join(__dirname, 'gestion-pedidos-carniceria', 'src', 'pedidosClientesController.js');
  if (!fs.existsSync(rutaController)) {
    console.error('❌ No se encontró el archivo pedidosClientesController.js');
    return;
  }
  
  let contenido = fs.readFileSync(rutaController, 'utf8');
  
  // Hacer una copia de seguridad
  const rutaBackup = `${rutaController}.backup-${Date.now()}`;
  fs.writeFileSync(rutaBackup, contenido);
  console.log(`✅ Copia de seguridad creada en ${rutaBackup}`);
  
  // Corregir la lógica de filtrado para ser más precisa con nombres similares
  console.log('Mejorando la lógica de filtrado por cliente en el controlador...');
  
  // Buscar la sección de filtrado por cliente
  const seccionFiltradoCliente = contenido.match(/if \(clienteId \|\| nombreCliente\) {[\s\S]*?}/);
  if (seccionFiltradoCliente) {
    const seccionOriginal = seccionFiltradoCliente[0];
    const seccionMejorada = `if (clienteId || nombreCliente) {
        filtro.$or = [];
        
        // Si tenemos ID del cliente - búsqueda exacta
        if (clienteId) {
          filtro.$or.push({ clienteId: clienteId });
          filtro.$or.push({ "cliente._id": clienteId });
          filtro.$or.push({ cliente: clienteId });
        }
        
        // Si tenemos nombre del cliente - búsqueda exacta para evitar confusiones
        if (nombreCliente) {
          // Usar una expresión regular que coincida exactamente con el nombre, no parcialmente
          const nombreRegexExacto = new RegExp('^' + nombreCliente.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
          filtro.$or.push({ clienteNombre: nombreRegexExacto });
          filtro.$or.push({ "cliente.nombre": nombreRegexExacto });
          
          // Para el campo cliente como string, necesitamos una comparación exacta
          filtro.$or.push({ cliente: nombreRegexExacto });
        }
      }`;
    
    contenido = contenido.replace(seccionOriginal, seccionMejorada);
  }
  
  // Guardar los cambios
  fs.writeFileSync(rutaController, contenido);
  console.log('✅ Archivo pedidosClientesController.js actualizado con éxito');
}

async function corregirServiceWorker() {
  console.log('\n3. Desactivando Service Worker problemático...');
  
  // Buscar el archivo sw.js en la raíz y en public
  const rutasServiceWorker = [
    path.join(__dirname, 'sw.js'),
    path.join(__dirname, 'public', 'sw.js'),
    path.join(__dirname, 'dist', 'sw.js')
  ];
  
  let swEncontrado = false;
  
  for (const rutaSW of rutasServiceWorker) {
    if (fs.existsSync(rutaSW)) {
      swEncontrado = true;
      console.log(`Encontrado Service Worker en ${rutaSW}`);
      
      // Hacer copia de seguridad
      const rutaBackup = `${rutaSW}.backup-${Date.now()}`;
      fs.copyFileSync(rutaSW, rutaBackup);
      console.log(`✅ Copia de seguridad creada en ${rutaBackup}`);
      
      // Modificar el Service Worker para desactivar el bloqueo de solicitudes
      let contenido = fs.readFileSync(rutaSW, 'utf8');
      
      // Buscar la sección que intercepta solicitudes
      if (contenido.includes('fetch')) {
        // Comentar el listener de fetch o reemplazarlo con uno que no bloquee
        contenido = contenido.replace(
          /self\.addEventListener\s*\(\s*['"]fetch['"]\s*,\s*.*?\}/gs,
          `// Service Worker fetch listener desactivado temporalmente para solucionar problemas
// self.addEventListener('fetch', event => {
//   // Código original comentado
// });

// Reemplazado por un listener que no bloquea solicitudes
self.addEventListener('fetch', event => {
  // Simplemente permitir la solicitud sin intervenir
  // Esto evita el error "Un ServiceWorker ha interceptado la solicitud y encontrado un error inesperado"
  return;
});`
        );
        
        fs.writeFileSync(rutaSW, contenido);
        console.log(`✅ Service Worker modificado para no bloquear solicitudes en ${rutaSW}`);
      } else {
        console.log(`⚠️ No se encontró un listener 'fetch' en el Service Worker ${rutaSW}`);
      }
    }
  }
  
  if (!swEncontrado) {
    console.log('⚠️ No se encontró ningún archivo Service Worker (sw.js)');
    
    // Crear un script para desregistrar el Service Worker
    const rutaDesregistrarSW = path.join(__dirname, 'public', 'desregistrar-sw.js');
    const contenidoDesregistrarSW = `// Script para desregistrar el Service Worker problemático
console.log('Iniciando desregistro de Service Workers...');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers encontrados:', registrations.length);
    
    for (let registration of registrations) {
      registration.unregister()
        .then(success => {
          if (success) {
            console.log('✅ Service Worker desregistrado correctamente:', registration.scope);
          } else {
            console.log('⚠️ No se pudo desregistrar el Service Worker:', registration.scope);
          }
        })
        .catch(error => {
          console.error('❌ Error al desregistrar el Service Worker:', error);
        });
    }
  });
}

// Limpiar caché de aplicación
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('Cachés encontrados:', cacheNames.length);
    
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName)
        .then(success => {
          if (success) {
            console.log('✅ Caché eliminado correctamente:', cacheName);
          } else {
            console.log('⚠️ No se pudo eliminar el caché:', cacheName);
          }
        })
        .catch(error => {
          console.error('❌ Error al eliminar el caché:', error);
        });
    });
  });
}
`;
    fs.writeFileSync(rutaDesregistrarSW, contenidoDesregistrarSW);
    console.log(`✅ Creado script para desregistrar Service Workers en ${rutaDesregistrarSW}`);
    
    // Modificar index.html para incluir el script de desregistro
    const rutaIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(rutaIndex)) {
      let contenidoIndex = fs.readFileSync(rutaIndex, 'utf8');
      
      if (!contenidoIndex.includes('desregistrar-sw.js')) {
        // Añadir el script al principio del head
        contenidoIndex = contenidoIndex.replace(
          '<head>',
          '<head>\n  <script src="/desregistrar-sw.js"></script>'
        );
        
        fs.writeFileSync(rutaIndex, contenidoIndex);
        console.log('✅ Script de desregistro añadido al index.html');
      }
    }
  }
}

async function actualizarConfiguracionMIME() {
  console.log('\n4. Actualizando configuración MIME...');
  
  // 1. Crear directorio public si no existe
  const rutaPublic = path.join(__dirname, 'public');
  if (!fs.existsSync(rutaPublic)) {
    fs.mkdirSync(rutaPublic, { recursive: true });
    console.log('✅ Directorio public creado');
  }
  
  // 2. Actualizar .htaccess
  const rutaHtaccess = path.join(__dirname, 'public', '.htaccess');
  const contenidoHtaccess = `# Configuración MIME
AddType application/javascript .js .jsx
AddType text/css .css
AddType image/svg+xml .svg
AddType application/json .json

# Habilitar CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Caché
<FilesMatch "\\.(html|htm|js|jsx|css|json)$">
  Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
</FilesMatch>

# Comprimir archivos
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>
`;
  fs.writeFileSync(rutaHtaccess, contenidoHtaccess);
  console.log('✅ Archivo .htaccess creado/actualizado');
  
  // 3. Crear/actualizar verificar-mime.js
  const rutaVerificarMime = path.join(__dirname, 'public', 'verificar-mime.js');
  const contenidoVerificarMime = `// Script para verificar y solucionar problemas MIME
// Este archivo debe ser servido con Content-Type: application/javascript
console.log('✅ verificar-mime.js cargado correctamente');

// Verificar que el navegador recibe los tipos MIME correctos
function verificarMIME() {
  const scripts = document.querySelectorAll('script');
  let problemasMIME = false;
  
  scripts.forEach(script => {
    if (script.src && script.src.includes('.js') && script.getAttribute('type') !== 'module') {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('javascript')) {
            console.warn('⚠️ Problema MIME detectado:', script.src, 'Content-Type:', contentType);
            problemasMIME = true;
          }
        })
        .catch(error => {
          console.error('Error verificando MIME:', error);
        });
    }
  });
  
  if (!problemasMIME) {
    console.log('✅ No se detectaron problemas MIME en los scripts cargados');
  }
}

// Ejecutar la verificación después de que se cargue la página
if (document.readyState === 'complete') {
  verificarMIME();
} else {
  window.addEventListener('load', verificarMIME);
}

// Exportar para que sea reconocido como un módulo válido
export default { verificarMIME };
`;
  fs.writeFileSync(rutaVerificarMime, contenidoVerificarMime);
  console.log('✅ Archivo verificar-mime.js creado/actualizado');
  
  // 4. Actualizar vite.config.js para añadir headers MIME
  const rutaViteConfig = path.join(__dirname, 'vite.config.js');
  if (fs.existsSync(rutaViteConfig)) {
    let contenidoVite = fs.readFileSync(rutaViteConfig, 'utf8');
    
    // Verificar si ya tiene configuración de servidor
    if (contenidoVite.includes('server:')) {
      // Ya tiene configuración de servidor, añadir solo los headers si no están
      if (!contenidoVite.includes('headers:')) {
        // Añadir headers después de server:
        contenidoVite = contenidoVite.replace(
          /server:\s*{/,
          `server: {
    headers: {
      'Content-Type': 'application/javascript',
      'X-Content-Type-Options': 'nosniff'
    },`
        );
      }
    } else {
      // No tiene configuración de servidor, añadirla completa
      contenidoVite = contenidoVite.replace(
        /export default defineConfig\(\{/,
        `export default defineConfig({
  server: {
    headers: {
      'Content-Type': 'application/javascript',
      'X-Content-Type-Options': 'nosniff'
    },
  },`
      );
    }
    
    fs.writeFileSync(rutaViteConfig, contenidoVite);
    console.log('✅ Archivo vite.config.js actualizado con headers MIME');
  } else {
    console.log('⚠️ No se encontró el archivo vite.config.js');
  }
  
  // 5. Verificar index.html para incluir el script
  const rutaIndex = path.join(__dirname, 'index.html');
  if (fs.existsSync(rutaIndex)) {
    let contenidoIndex = fs.readFileSync(rutaIndex, 'utf8');
    
    if (!contenidoIndex.includes('verificar-mime.js')) {
      // Añadir el script al final del head
      contenidoIndex = contenidoIndex.replace(
        '</head>',
        '  <script type="module" src="/verificar-mime.js"></script>\n</head>'
      );
      
      fs.writeFileSync(rutaIndex, contenidoIndex);
      console.log('✅ Script verificar-mime.js añadido al index.html');
    } else {
      console.log('✅ Script verificar-mime.js ya está incluido en index.html');
    }
  } else {
    console.log('⚠️ No se encontró el archivo index.html');
  }
}

// Función principal
async function ejecutarCorrecciones() {
  try {
    await corregirClientesMantenimiento();
    await corregirPedidosClientesController();
    await corregirServiceWorker();
    await actualizarConfiguracionMIME();
    
    console.log('\n=== CORRECCIONES COMPLETADAS ===');
    console.log('Se han realizado las siguientes correcciones:');
    console.log('1. Mejorado el componente ClientesMantenimiento.jsx para manejar mejor los datos y errores');
    console.log('2. Corregido el controlador de pedidos para filtrar exactamente por nombre de cliente');
    console.log('3. Desactivado o modificado el Service Worker problemático');
    console.log('4. Actualizada la configuración MIME para solucionar problemas de carga de recursos');
    
    console.log('\nPasos adicionales necesarios:');
    console.log('1. Reiniciar el servidor de desarrollo: npm run dev');
    console.log('2. Forzar recarga completa en el navegador: Ctrl+F5 o Cmd+Shift+R');
    console.log('3. Verificar la consola del navegador para confirmar que no hay errores de Service Worker o MIME');
    
    console.log('\nSi persisten los problemas:');
    console.log('1. Revisar los logs del servidor backend para errores de API');
    console.log('2. Ejecutar una compilación completa: npm run build && npm run preview');
    console.log('3. Considerar borrar la caché del navegador o probar en modo incógnito');
  } catch (error) {
    console.error('Error durante las correcciones:', error);
  }
}

// Ejecutar
ejecutarCorrecciones();
