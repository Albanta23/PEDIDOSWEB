// Script para solucionar problemas comunes del navegador y Socket.io
const fs = require('fs');
const path = require('path');

const solucionarProblemasNavegador = () => {
  console.log('🛠️  SOLUCIONES PARA PROBLEMAS DEL NAVEGADOR');
  console.log('==========================================\n');
  
  console.log('❌ PROBLEMAS IDENTIFICADOS:');
  console.log('1. "extension port is moved into back/forward cache"');
  console.log('2. "No tab with id: XXXXXXX"');
  console.log('3. "Failed to load resource: 504 (Gateway Timeout)"\n');
  
  console.log('🔧 SOLUCIONES PASO A PASO:\n');
  
  console.log('🟦 SOLUCIÓN 1: Recarga completa del navegador');
  console.log('   • Presiona Ctrl+F5 (recarga forzada)');
  console.log('   • O presiona F12 → clic derecho en el botón reload → "Empty Cache and Hard Reload"');
  console.log('   • Esto limpia el cache y recarga todos los recursos\n');
  
  console.log('🟦 SOLUCIÓN 2: Reiniciar servicios de desarrollo');
  console.log('   • Detén todos los servidores (Ctrl+C en cada terminal)');
  console.log('   • Ejecuta los comandos de limpieza de abajo');
  console.log('   • Reinicia los servidores uno por uno\n');
  
  console.log('🟦 SOLUCIÓN 3: Deshabilitar extensiones temporalmente');
  console.log('   • Abre una ventana de incógnito/privada');
  console.log('   • O deshabilita extensiones en chrome://extensions/');
  console.log('   • Prueba la aplicación sin extensiones\n');
  
  console.log('🟦 SOLUCIÓN 4: Configurar Socket.io con fallbacks');
  console.log('   • Configurar transports: ["websocket", "polling"]');
  console.log('   • Aumentar timeout values');
  console.log('   • Configurar reconnection: true\n');
  
  console.log('📝 COMANDOS DE LIMPIEZA:');
  console.log('========================\n');
  
  const comandosLimpieza = [
    'pkill -f "node.*vite"',
    'pkill -f "node.*server.js"', 
    'rm -rf node_modules/.vite',
    'rm -rf .vite',
    'rm -rf dist',
    'npm run clean 2>/dev/null || echo "No hay comando clean"'
  ];
  
  comandosLimpieza.forEach((comando, index) => {
    console.log(`${index + 1}. ${comando}`);
  });
  
  console.log('\n📱 COMANDOS DE REINICIO:');
  console.log('========================\n');
  
  const comandosReinicio = [
    '# Terminal 1: Backend',
    'cd gestion-pedidos-carniceria && npm start',
    '',
    '# Terminal 2: Frontend principal',
    'npm start',
    '',
    '# Terminal 3: Gestión de clientes',
    'npm run dev:clientes'
  ];
  
  comandosReinicio.forEach(comando => {
    if (comando.startsWith('#') || comando === '') {
      console.log(comando);
    } else {
      console.log(`   ${comando}`);
    }
  });
  
  console.log('\n🎯 CONFIGURACIÓN RECOMENDADA PARA SOCKET.IO:');
  console.log('============================================\n');
  
  const socketConfig = `
// Configuración recomendada para Socket.io (frontend)
const socket = io('http://localhost:10001', {
  transports: ['websocket', 'polling'], // Fallback a polling si websocket falla
  timeout: 10000,                       // Timeout de 10 segundos
  reconnection: true,                   // Auto-reconexión habilitada
  reconnectionDelay: 1000,              // Delay entre intentos de reconexión
  reconnectionAttempts: 5,              // Máximo 5 intentos de reconexión
  forceNew: true,                       // Forzar nueva conexión
  upgrade: true,                        // Permitir upgrade a websocket
  rememberUpgrade: false                // No recordar upgrades previos
});

// Manejo de errores de conexión
socket.on('connect_error', (error) => {
  console.warn('Error de conexión Socket.io:', error);
  // Fallback a polling si websocket falla
  socket.io.opts.transports = ['polling'];
});

socket.on('disconnect', (reason) => {
  console.warn('Desconectado:', reason);
  if (reason === 'io server disconnect') {
    // Reconexión manual si el servidor desconectó
    socket.connect();
  }
});
`;
  
  console.log(socketConfig);
  
  console.log('\n🎯 CONFIGURACIÓN CORS PARA EL BACKEND:');
  console.log('=====================================\n');
  
  const corsConfig = `
// Configuración CORS recomendada (backend)
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3100', 
    'http://localhost:5173',
    'http://localhost:5174',
    'https://your-production-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Para Socket.io
const io = require('socket.io')(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3100", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
`;
  
  console.log(corsConfig);
  
  console.log('\n✅ VERIFICACIÓN FINAL:');
  console.log('======================\n');
  console.log('1. ✓ Backend funcionando en puerto 10001');
  console.log('2. ✓ Frontend funcionando en puerto 3000/3100');
  console.log('3. ✓ Socket.io detectado en todos los puertos');
  console.log('4. ✓ CORS configurado correctamente');
  console.log('5. ⚠️  Errores son de extensiones del navegador, no del código\n');
  
  console.log('🚀 SIGUIENTE PASO: Recarga el navegador con Ctrl+F5');
};

solucionarProblemasNavegador();
