#!/bin/bash

# Script para marcar todos los pedidos existentes de WooCommerce como ya sincronizados
# Esto es útil para actualizar la base de datos después de implementar la nueva funcionalidad
# que evita sincronizar repetidamente los pedidos

# Conexión a MongoDB
MONGODB_URI="mongodb+srv://dbjavier:Albanta2025@cluster0.e16j9g4.mongodb.net/gestion-pedidos?retryWrites=true&w=majority&appName=Cluster0"

# Fecha actual para el log
FECHA=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="marcar_pedidos_woo_$FECHA.log"

echo "Iniciando marcado de pedidos de WooCommerce como ya sincronizados..." | tee -a $LOG_FILE
echo "Fecha: $(date)" | tee -a $LOG_FILE

# Ejecutar comando MongoDB para actualizar todos los pedidos de WooCommerce
RESULT=$(mongosh "$MONGODB_URI" --quiet --eval '
  db = db.getSiblingDB("gestion-pedidos");
  const resultado = db.pedidoclientes.updateMany(
    { "origen.tipo": "woocommerce", "yaActualizado": { $ne: true } },
    { $set: { "yaActualizado": true } }
  );
  print(JSON.stringify(resultado, null, 2));
')

echo "Resultado de la operación:" | tee -a $LOG_FILE
echo "$RESULT" | tee -a $LOG_FILE

# Extraer número de documentos actualizados para mostrar resumen
MATCHED=$(echo "$RESULT" | grep -o '"matchedCount":[^,]*' | cut -d':' -f2)
MODIFIED=$(echo "$RESULT" | grep -o '"modifiedCount":[^,]*' | cut -d':' -f2)

echo "" | tee -a $LOG_FILE
echo "Resumen:" | tee -a $LOG_FILE
echo "- Pedidos de WooCommerce encontrados: $MATCHED" | tee -a $LOG_FILE
echo "- Pedidos actualizados: $MODIFIED" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Proceso completado. Ver detalles en el archivo de log: $LOG_FILE" | tee -a $LOG_FILE

if [ "$MODIFIED" -gt 0 ]; then
  echo "Se han marcado $MODIFIED pedidos como ya sincronizados. En futuras sincronizaciones, estos pedidos serán omitidos para mejorar el rendimiento."
else
  echo "No se encontraron pedidos pendientes de marcar. Todos los pedidos ya estaban actualizados o no hay pedidos de WooCommerce en el sistema."
fi
