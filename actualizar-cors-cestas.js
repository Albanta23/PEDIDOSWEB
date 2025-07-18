/**
 * SCRIPT PARA ACTUALIZAR CORS EN EL ENDPOINT DE IMPORTACIÓN DE CLIENTES DE CESTAS NAVIDEÑAS
 * 
 * Este script modifica la configuración CORS específicamente para el endpoint
 * /api/clientes/importar utilizado por el gestor de cestas navideñas
 * 
 * Ejecutar con: node actualizar-cors-cestas.js
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo server.js
const serverFilePath = path.join(__dirname, 'gestion-pedidos-carniceria', 'src', 'server.js');

// Log de inicio
console.log('🔧 Iniciando actualización de CORS para endpoint de importación de clientes...');
console.log('📂 Archivo a modificar:', serverFilePath);

// Verificar que el archivo existe
if (!fs.existsSync(serverFilePath)) {
  console.error('❌ Error: No se encontró el archivo server.js');
  console.error('Ruta buscada:', serverFilePath);
  console.error('Por favor, verifica la ruta al archivo server.js');
  process.exit(1);
}

// Leer el contenido actual del archivo
console.log('📖 Leyendo archivo server.js...');
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Buscar la sección de rutas para clientes
const clientesRoutesRegex = /\/\/ Rutas de clientes[\s\S]*?\/api\/clientes/;
if (!clientesRoutesRegex.test(serverContent)) {
  console.error('❌ Error: No se encontró la sección de rutas de clientes en el archivo.');
  process.exit(1);
}

// Buscar específicamente la ruta para importar clientes
const importarClientesRouteRegex = /app\.(?:post|use)\s*\(['"]\/api\/clientes\/importar['"]/;
let routeMatch = serverContent.match(importarClientesRouteRegex);

if (!routeMatch) {
  console.error('❌ Error: No se encontró la ruta específica para importar clientes.');
  console.log('🔍 Buscando rutas alternativas o patrones que puedan estar capturando la URL...');
  
  // Buscar rutas con parámetros que puedan estar capturando esta URL
  const paramRoutesRegex = /app\.(?:post|use)\s*\(['"]\/api\/clientes\/:[^'"]+['"]/g;
  const paramRoutes = serverContent.match(paramRoutesRegex);
  
  if (paramRoutes && paramRoutes.length > 0) {
    console.log('⚠️ Se encontraron rutas parametrizadas que podrían estar interfiriendo:');
    paramRoutes.forEach(route => console.log(`   - ${route}`));
    console.log('');
    console.log('💡 Solución: Vamos a agregar la ruta específica para importar clientes ANTES de las rutas parametrizadas');
    
    // Buscar el comienzo de la sección de rutas de clientes
    const clientesRoutesSectionMatch = serverContent.match(/\/\/ Rutas de clientes[\s\S]*?app\.(?:use|get|post|put|delete)\s*\(['"]\/api\/clientes/);
    
    if (clientesRoutesSectionMatch) {
      const endOfComment = clientesRoutesSectionMatch[0].indexOf('\n') + clientesRoutesSectionMatch.index;
      
      // Agregar la ruta específica después del comentario
      const specificRoute = `\n// Ruta específica para importar clientes (agregada por actualizar-cors-cestas.js)
app.post('/api/clientes/importar', cors(), clientesController.importarClientes);`;
      
      serverContent = serverContent.slice(0, endOfComment) + specificRoute + serverContent.slice(endOfComment);
      
      console.log('✅ Se ha agregado la ruta específica para importar clientes antes de las rutas parametrizadas');
    } else {
      console.error('❌ No se pudo encontrar la sección de rutas de clientes para modificar');
      process.exit(1);
    }
  } else {
    console.error('❌ No se encontraron rutas para clientes que puedan estar interfiriendo.');
    process.exit(1);
  }
} else {
  // Verificar si la ruta ya tiene cors() aplicado
  const routeStartIndex = routeMatch.index;
  const routeEndOfLine = serverContent.indexOf('\n', routeStartIndex);
  const routeLine = serverContent.substring(routeStartIndex, routeEndOfLine);
  
  if (routeLine.includes('cors()')) {
    console.log('✅ La ruta ya tiene cors() aplicado:', routeLine);
  } else {
    // Agregar cors() a la ruta existente
    const updatedRouteLine = routeLine.replace(
      /app\.(post|use)\s*\(['"]\/api\/clientes\/importar['"],\s*/,
      `app.$1('/api/clientes/importar', cors(), `
    );
    
    serverContent = serverContent.replace(routeLine, updatedRouteLine);
    console.log('✅ Se ha agregado cors() a la ruta existente:');
    console.log('   Antes:', routeLine);
    console.log('   Después:', updatedRouteLine);
  }
}

// Buscar la sección de definición de la función corsOrigin para mejorarla
const corsOriginRegex = /function corsOrigin\(origin, callback\) \{([\s\S]*?)\}/;
const corsOriginMatch = serverContent.match(corsOriginRegex);

if (corsOriginMatch) {
  // Verificar si la función ya tiene logs de depuración específicos para cestas
  if (!corsOriginMatch[1].includes('[CORS-CESTAS]')) {
    console.log('🔄 Mejorando la función corsOrigin con logs específicos para cestas...');
    
    // Mejorar la función corsOrigin
    const mejoradaCorsOrigin = `function corsOrigin(origin, callback) {
  console.log(\`[CORS DEBUG] Verificando origen: \${origin}\`);
  
  // Log específico para depurar peticiones de gestor de cestas
  if (origin && (origin.includes('gestor-cestas') || origin.includes('debug-cestas'))) {
    console.log(\`[CORS-CESTAS] ⚠️ Petición de Gestor de Cestas detectada: \${origin}\`);
  }
  
  if (!origin) {
    console.log('[CORS DEBUG] Petición sin origen, permitida');
    return callback(null, true); // Permitir peticiones sin origen (curl, Postman)
  }
  
  const originLc = origin.toLowerCase();
  const allowedOriginsLc = allowedOrigins.map(o => o.toLowerCase());
  
  const githubDevRegex = /^https?:\\/\\/[a-z0-9-]+(-[a-z0-9]+)*(\\.[0-9]+)?\\.app\\.github\\.dev$/;
  const matchGithubDev = githubDevRegex.test(originLc);
  const matchVercel = /\\.vercel\\.app$/.test(originLc);
  const matchRender = /\\.onrender\\.com$/.test(originLc);
  const matchLocalhost = /^http:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(originLc);
  
  console.log(\`[CORS DEBUG] Evaluación: 
    - En lista: \${allowedOriginsLc.includes(originLc)}
    - Vercel: \${matchVercel}
    - Render: \${matchRender}
    - Localhost: \${matchLocalhost}
    - GitHub: \${matchGithubDev}\`);
  
  if (
    allowedOriginsLc.includes(originLc) ||
    matchVercel ||
    matchRender ||
    matchLocalhost ||
    matchGithubDev
  ) {
    console.log(\`[CORS DEBUG] Origen permitido: \${origin}\`);
    return callback(null, origin); // Refleja el origin válido
  }
  
  console.log(\`[CORS DEBUG] Origen rechazado: \${origin}\`);
  return callback(new Error('Not allowed by CORS: ' + origin));
}`;

    // Reemplazar la función corsOrigin
    serverContent = serverContent.replace(corsOriginRegex, mejoradaCorsOrigin);
    console.log('✅ Se ha mejorado la función corsOrigin con logs específicos para cestas');
  } else {
    console.log('✅ La función corsOrigin ya tiene logs específicos para cestas');
  }
} else {
  console.error('❌ No se pudo encontrar la función corsOrigin para mejorarla');
  // No salimos porque esto no es crítico, solo una mejora
}

// Verificar si hay rutas duplicadas para /api/clientes/importar
const importarClientesRouteRegexAll = /app\.(?:post|use)\s*\(['"]\/api\/clientes\/importar['"],.*\);/g;
const allMatches = serverContent.match(importarClientesRouteRegexAll);

if (allMatches && allMatches.length > 1) {
  console.log('⚠️ Se detectaron múltiples definiciones de la ruta /api/clientes/importar:');
  allMatches.forEach((match, index) => console.log(`   ${index+1}. ${match}`));
  
  // Mantener solo la primera definición que tenga cors()
  let foundCorsRoute = false;
  let routesToRemove = [];
  
  for (let i = 0; i < allMatches.length; i++) {
    if (allMatches[i].includes('cors()')) {
      if (foundCorsRoute) {
        routesToRemove.push(allMatches[i]);
      } else {
        foundCorsRoute = true;
        console.log('✅ Manteniendo ruta con cors():', allMatches[i]);
      }
    } else {
      routesToRemove.push(allMatches[i]);
    }
  }
  
  // Si no encontramos ninguna ruta con cors(), mantenemos solo la primera
  if (!foundCorsRoute && allMatches.length > 0) {
    console.log('⚠️ No se encontró ninguna ruta con cors(), manteniendo la primera definición');
    routesToRemove = allMatches.slice(1);
  }
  
  // Eliminar rutas duplicadas
  for (const route of routesToRemove) {
    serverContent = serverContent.replace(route, '// Ruta duplicada eliminada: ' + route);
    console.log('🗑️ Eliminada ruta duplicada:', route);
  }
}

// Escribir el contenido actualizado
fs.writeFileSync(serverFilePath, serverContent, 'utf8');
console.log('💾 Se ha guardado el archivo server.js actualizado');

console.log(`
✅ Proceso completado. Se han realizado las siguientes acciones:
1. Verificado/agregado el middleware cors() para la ruta /api/clientes/importar
2. Mejorado la función corsOrigin con logs específicos para cestas
3. Verificado y eliminado posibles rutas duplicadas

Para que los cambios tengan efecto:
1. git add gestion-pedidos-carniceria/src/server.js
2. git commit -m "Actualiza configuración CORS para endpoint de importación de clientes de cestas navideñas"
3. git push
4. Despliegue los cambios en Render
`);

// Instrucciones adicionales para probar
console.log(`
📋 Para probar los cambios:
1. Ejecuta el script debug-cestas-import.js:
   node debug-cestas-import.js
   
2. Abre la página debug-cestas-navidad.html en tu navegador y usa el botón "Probar CORS en /importar"

Si sigues experimentando problemas, verifica los logs del servidor en Render para ver los mensajes de depuración CORS.
`);
