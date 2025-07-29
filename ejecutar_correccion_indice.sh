#!/bin/bash

# Script para corregir el índice problemático de lotes vía API
echo "🔧 Corrigiendo índice problemático en lotes..."
echo "=========================================="

# URL del backend
BACKEND_URL="https://pedidos-backend-0e1s.onrender.com"

echo "📡 Llamando al endpoint de corrección..."
echo "URL: $BACKEND_URL/api/admin/corregir-indice-lotes"
echo ""

# Hacer la petición POST al endpoint
curl -X POST \
  "$BACKEND_URL/api/admin/corregir-indice-lotes" \
  -H "Content-Type: application/json" \
  -w "\n\n📊 Código de respuesta: %{http_code}\n" \
  -s \
  | jq '.' 2>/dev/null || echo "Respuesta recibida (formato no JSON)"

echo ""
echo "✅ Proceso completado."
echo ""
echo "🧪 Para verificar que funciona:"
echo "   1. Ve a Entradas de Fábrica"
echo "   2. Intenta registrar una nueva entrada"
echo "   3. El error E11000 duplicate key ya no debería aparecer"
echo ""
echo "⚠️  Si el problema persiste:"
echo "   - Revisa los logs del backend"
echo "   - Verifica que el script se ejecutó correctamente"
echo "   - Puede requerir reiniciar el servidor backend"
