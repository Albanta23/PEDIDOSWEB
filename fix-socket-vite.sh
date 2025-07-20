#!/bin/bash

echo "🔧 SOLUCIONANDO PROBLEMA DE SOCKET.IO EN VITE"
echo "=============================================="

# Paso 1: Matar todos los procesos de desarrollo
echo "📦 1. Deteniendo todos los servidores de desarrollo..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Paso 2: Limpiar cache completamente
echo "🧹 2. Limpiando cache de Vite y Node..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
rm -rf node_modules/.cache 2>/dev/null || true

# Paso 3: Limpiar cache de npm
echo "🧹 3. Limpiando cache de npm..."
npm cache clean --force 2>/dev/null || true

# Paso 4: Verificar dependencias de Socket.io
echo "📋 4. Verificando instalación de Socket.io..."
if npm list socket.io-client > /dev/null 2>&1; then
    echo "   ✅ socket.io-client está instalado"
else
    echo "   ❌ Instalando socket.io-client..."
    npm install socket.io-client@^4.8.1
fi

# Paso 5: Reinstalar dependencias críticas
echo "🔄 5. Reinstalando dependencias críticas..."
npm install --no-package-lock

# Paso 6: Configurar variables de entorno para GitHub Codespaces
echo "🌐 6. Configurando entorno para GitHub Codespaces..."
export VITE_HOST="0.0.0.0"
export VITE_PORT="3000"
export VITE_FORCE_DEPS_OPTIMIZATION="true"

# Paso 7: Información del entorno
echo "📊 7. Información del entorno:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Workspace: $(pwd)"
echo "   Socket.io client: $(npm list socket.io-client 2>/dev/null | grep socket.io-client || echo 'No instalado')"

echo ""
echo "✅ LIMPIEZA COMPLETADA"
echo "======================"
echo ""
echo "🚀 PASOS SIGUIENTES:"
echo "1. Ejecuta: npm start"
echo "2. En otra terminal: cd gestion-pedidos-carniceria && npm start"
echo "3. En otra terminal: npm run dev:clientes"
echo ""
echo "🔍 Si persisten los errores 504:"
echo "- Recarga el navegador con Ctrl+F5"
echo "- Verifica que el puerto 10001 esté funcionando"
echo "- Usa modo incógnito para descartar extensiones"
