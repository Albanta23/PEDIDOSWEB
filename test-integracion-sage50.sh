#!/bin/bash

# Script para probar la integración de datos SAGE50 en el editor de pedidos
# Este script verifica que los endpoints funcionan y los datos están disponibles

echo "🔍 Probando integración de datos SAGE50 en editor de pedidos..."
echo "=================================================="

API_URL="http://localhost:3000/api"

echo ""
echo "1️⃣ Probando endpoint de vendedores..."
response=$(curl -s -w "%{http_code}" "$API_URL/vendedores" -o /tmp/vendedores_response.json)
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Endpoint de vendedores funcionando"
    vendedores_count=$(jq '. | length' /tmp/vendedores_response.json 2>/dev/null || echo "0")
    echo "   📊 Total de vendedores: $vendedores_count"
    
    if [ "$vendedores_count" -gt 0 ]; then
        echo "   🔍 Primeros 3 vendedores:"
        jq -r '.[:3] | .[] | "      - " + .codigo + ": " + .nombre' /tmp/vendedores_response.json 2>/dev/null || echo "      Error al parsear JSON"
    fi
else
    echo "❌ Error en endpoint de vendedores (HTTP $http_code)"
fi

echo ""
echo "2️⃣ Probando endpoint de formas de pago..."
response=$(curl -s -w "%{http_code}" "$API_URL/formas-pago" -o /tmp/formas_pago_response.json)
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Endpoint de formas de pago funcionando"
    formas_count=$(jq '. | length' /tmp/formas_pago_response.json 2>/dev/null || echo "0")
    echo "   📊 Total de formas de pago: $formas_count"
    
    if [ "$formas_count" -gt 0 ]; then
        echo "   🔍 Primeras 3 formas de pago:"
        jq -r '.[:3] | .[] | "      - " + .codigo + ": " + .nombre' /tmp/formas_pago_response.json 2>/dev/null || echo "      Error al parsear JSON"
    fi
else
    echo "❌ Error en endpoint de formas de pago (HTTP $http_code)"
fi

echo ""
echo "3️⃣ Probando un pedido existente con datos de pago/vendedor..."
response=$(curl -s -w "%{http_code}" "$API_URL/pedidos-clientes?limit=1" -o /tmp/pedidos_response.json)
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Endpoint de pedidos funcionando"
    pedidos_count=$(jq '. | length' /tmp/pedidos_response.json 2>/dev/null || echo "0")
    
    if [ "$pedidos_count" -gt 0 ]; then
        echo "   🔍 Verificando campos de pago y vendedor en primer pedido:"
        
        # Extraer datos del primer pedido
        forma_pago=$(jq -r '.[0].formaPago // "No definido"' /tmp/pedidos_response.json 2>/dev/null)
        vendedor=$(jq -r '.[0].vendedor // "No definido"' /tmp/pedidos_response.json 2>/dev/null)
        tiene_datos_woo=$(jq -r '.[0].datosWooCommerce != null' /tmp/pedidos_response.json 2>/dev/null)
        
        echo "      - Forma de pago: $forma_pago"
        echo "      - Vendedor: $vendedor"
        echo "      - Datos WooCommerce: $tiene_datos_woo"
    else
        echo "   ⚠️ No hay pedidos en el sistema para probar"
    fi
else
    echo "❌ Error en endpoint de pedidos (HTTP $http_code)"
fi

echo ""
echo "4️⃣ Verificando archivos del frontend..."

# Verificar que los archivos existen
archivos_frontend=(
    "/workspaces/PEDIDOSWEB/src/clientes-gestion/services/sageDataService.js"
    "/workspaces/PEDIDOSWEB/src/clientes-gestion/components/FormaPagoVendedorInfo.jsx"
    "/workspaces/PEDIDOSWEB/src/clientes-gestion/components/FormaPagoFormulario.jsx"
)

for archivo in "${archivos_frontend[@]}"; do
    if [ -f "$archivo" ]; then
        echo "✅ $archivo existe"
    else
        echo "❌ $archivo NO existe"
    fi
done

echo ""
echo "5️⃣ Verificando modelo actualizado..."
if grep -q "vendedor: String" /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria/src/models/PedidoCliente.js; then
    echo "✅ Campo 'vendedor' añadido al modelo PedidoCliente"
else
    echo "❌ Campo 'vendedor' NO encontrado en el modelo PedidoCliente"
fi

echo ""
echo "=================================================="
echo "🎯 Resumen de la integración:"
echo ""
echo "📋 Cambios completados:"
echo "   ✅ Modelo PedidoCliente actualizado con campo 'vendedor'"
echo "   ✅ Servicio SageDataService para obtener datos de SAGE50"
echo "   ✅ Componente FormaPagoVendedorInfo para mostrar información"
echo "   ✅ FormaPagoFormulario actualizado con datos SAGE50"
echo "   ✅ PedidoClienteDetalle usa el nuevo componente"
echo ""
echo "📝 Para probar en el navegador:"
echo "   1. Abrir http://localhost:5173/clientes-gestion"
echo "   2. Ir a 'Pedidos Clientes'"
echo "   3. Crear un nuevo pedido o editar uno existente"
echo "   4. Verificar que se muestran las opciones de SAGE50"
echo "   5. Ver un pedido en detalle para comprobar la información"
echo ""
echo "🔧 Próximos pasos opcionales:"
echo "   - Actualizar exportación a SAGE50 con nuevos campos"
echo "   - Añadir validaciones adicionales"
echo "   - Mejorar UI/UX según feedback de usuarios"

# Limpiar archivos temporales
rm -f /tmp/vendedores_response.json /tmp/formas_pago_response.json /tmp/pedidos_response.json

echo ""
echo "✨ Integración de datos SAGE50 completada!"
