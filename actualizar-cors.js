// Script para actualizar la configuración CORS
// Ejecutar con: node actualizar-cors.js

const fs = require('fs');
const path = require('path');

// Ruta al archivo server.js
const serverFilePath = path.join(__dirname, 'gestion-pedidos-carniceria', 'src', 'server.js');

// Leer el contenido actual del archivo
console.log('Leyendo archivo server.js...');
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Buscar la sección de allowedOrigins
const allowedOriginsRegex = /const allowedOrigins = \[([\s\S]*?)\];/;
const allowedOriginsMatch = serverContent.match(allowedOriginsRegex);

if (!allowedOriginsMatch) {
  console.error('No se pudo encontrar la sección de allowedOrigins en el archivo.');
  process.exit(1);
}

// Verificar si el dominio ya está en la lista
if (serverContent.includes('pedidosweb-x158.vercel.app')) {
  console.log('El dominio pedidosweb-x158.vercel.app ya está en la lista de orígenes permitidos.');
} else {
  // Añadir el nuevo dominio a la lista
  const currentAllowedOrigins = allowedOriginsMatch[1];
  const newAllowedOrigins = currentAllowedOrigins + ",\n  'https://pedidosweb-x158.vercel.app', // Nuevo dominio de Vercel (Julio 2025)";
  
  // Reemplazar la sección de allowedOrigins
  serverContent = serverContent.replace(allowedOriginsRegex, `const allowedOrigins = [${newAllowedOrigins}\n];`);
  
  // Escribir el contenido actualizado
  fs.writeFileSync(serverFilePath, serverContent, 'utf8');
  console.log('Se ha añadido el dominio pedidosweb-x158.vercel.app a la lista de orígenes permitidos.');
}

// Buscar la sección de corsOrigin para mejorarla
const corsOriginRegex = /function corsOrigin\(origin, callback\) \{([\s\S]*?)\}/;
const corsOriginMatch = serverContent.match(corsOriginRegex);

if (!corsOriginMatch) {
  console.log('No se pudo encontrar la función corsOrigin para mejorarla.');
} else {
  // Mejorar la función corsOrigin con logs de depuración
  console.log('Mejorando la función corsOrigin con logs de depuración...');
  
  const mejoradaCorsOrigin = `function corsOrigin(origin, callback) {
  console.log(\`[CORS DEBUG] Verificando origen: \${origin}\`);
  
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
  
  // Escribir el contenido actualizado
  fs.writeFileSync(serverFilePath, serverContent, 'utf8');
  console.log('Se ha mejorado la función corsOrigin con logs de depuración.');
}

// Buscar la configuración de Socket.IO para actualizarla
const socketIoRegex = /const io = new Server\(server, \{([\s\S]*?)\}\);/;
const socketIoMatch = serverContent.match(socketIoRegex);

if (!socketIoMatch) {
  console.log('No se pudo encontrar la configuración de Socket.IO para actualizarla.');
} else {
  // Verificar si ya está usando corsOrigin
  if (serverContent.includes('origin: corsOrigin,')) {
    console.log('La configuración de Socket.IO ya está usando corsOrigin.');
  } else {
    console.log('Actualizando la configuración CORS de Socket.IO...');
    
    const actualizadaSocketIo = `const io = new Server(server, {
  cors: {
    origin: corsOrigin, // Usar la misma función para mantener consistencia
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});`;
    
    // Reemplazar la configuración de Socket.IO
    serverContent = serverContent.replace(socketIoRegex, actualizadaSocketIo);
    
    // Escribir el contenido actualizado
    fs.writeFileSync(serverFilePath, serverContent, 'utf8');
    console.log('Se ha actualizado la configuración CORS de Socket.IO para usar corsOrigin.');
  }
}

console.log('✅ Proceso completado. Se han realizado las actualizaciones necesarias para solucionar el problema de CORS.');
console.log('Por favor, ejecute los siguientes comandos para aplicar los cambios:');
console.log('1. git add gestion-pedidos-carniceria/src/server.js');
console.log('2. git commit -m "Actualiza configuración CORS para permitir el dominio pedidosweb-x158.vercel.app"');
console.log('3. git push');
console.log('4. Despliegue los cambios en Render');
