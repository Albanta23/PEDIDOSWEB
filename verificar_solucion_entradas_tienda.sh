#!/bin/bash

# Script para verificar la solución del problema de entradas en tiendas

echo "===========================================" 
echo "VERIFICADOR DE SOLUCIÓN - ENTRADAS EN TIENDAS"
echo "===========================================" 
echo

echo "1. Reiniciando el servidor para aplicar cambios..."
echo "   (Ejecutar manualmente en la terminal del servidor)"
echo

echo "2. Pasos para verificar la solución:"
echo "   a. Crear un pedido de tienda a fábrica"
echo "   b. Procesar el pedido en el panel de fábrica"
echo "   c. Cambiar el estado a 'enviadoTienda'"
echo "   d. Verificar que aparezca el movimiento de salida en almacén central"
echo "   e. Verificar que aparezca el movimiento de entrada en la tienda"
echo

echo "3. Comprobar en la consola del servidor los logs:"
echo "   Buscar mensajes como:"
echo "   [INFO] Registrando movimiento stock. Tipo: entrada, Producto: [ID_PRODUCTO]"
echo

echo "4. Comprobar en MongoDB:"
echo "   db.movimientosstock.find({tipo: 'entrada', tiendaId: '[ID_TIENDA]'}).sort({fecha: -1})"
echo

echo "===========================================" 
echo "Si todo funciona correctamente, las tiendas podrán ver"
echo "sus movimientos de entrada en su panel de stock."
echo "===========================================" 
