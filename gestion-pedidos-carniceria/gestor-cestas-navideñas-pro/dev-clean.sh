#!/bin/bash

# Script para reiniciar limpio el desarrollo

echo "🧹 Limpiando procesos Vite existentes..."
pkill -f "vite.*gestor-cestas"

echo "🗑️ Limpiando cache..."
rm -rf node_modules/.vite

echo "🚀 Iniciando servidor limpio..."
npm run dev

echo "✅ Servidor iniciado en puerto limpio"
