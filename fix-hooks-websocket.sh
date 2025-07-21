#!/bin/bash

echo "🔧 SOLUCIONANDO ERRORES DE HOOKS Y WEBSOCKET"
echo "============================================"

# Paso 1: Matar todos los procesos de Vite
echo "📦 1. Deteniendo servidores..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# Paso 2: Limpiar cache
echo "🧹 2. Limpiando cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Paso 3: Verificar el estado actual
echo "📊 3. Estado actual:"
echo "   Backend en puerto 10001: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:10001/api/clientes || echo "No disponible")"

# Paso 4: Reiniciar con configuración corregida
echo "🚀 4. Reiniciando servidores..."
echo ""
echo "SERVIDORES A EJECUTAR:"
echo "====================="
echo ""
echo "📱 1. Frontend principal (puerto 3000):"
echo "   cd /workspaces/PEDIDOSWEB"
echo "   npm start -- --config vite.codespaces.config.js"
echo ""
echo "👥 2. Gestión de clientes (puerto 3100):"
echo "   npm run dev:clientes"
echo ""
echo "🏗️  3. Backend (puerto 10001) - si no está corriendo:"
echo "   cd gestion-pedidos-carniceria"
echo "   npm start"
echo ""
echo "✅ PROBLEMAS SOLUCIONADOS:"
echo "========================="
echo "🔧 Hook useLotesDisponiblesProducto eliminado del render loop"
echo "🔧 Configuración WebSocket corregida (ws en lugar de wss)"
echo "🔧 Cache de Vite limpiado"
echo "🔧 Puerto HMR específico configurado (3001)"
echo ""
echo "⚠️  RECORDATORIOS:"
echo "=================="
echo "- Recarga el navegador con Ctrl+F5 después de reiniciar"
echo "- Verifica que no hay errores de Hooks en la consola"
echo "- Si persisten errores 504, usa modo incógnito"
