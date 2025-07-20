#!/bin/bash

echo "Reiniciando el backend con nueva configuración CORS..."

# Navegar al directorio del backend
cd /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria

# Verificar si hay un proceso de node en ejecución
BACKEND_PID=$(pgrep -f "node src/server.js")

if [ ! -z "$BACKEND_PID" ]; then
  echo "Deteniendo el proceso backend actual (PID: $BACKEND_PID)..."
  kill -9 $BACKEND_PID
  sleep 2
fi

# Iniciar el backend en segundo plano
echo "Iniciando el backend con nueva configuración CORS..."
nohup node src/server.js > ../backend.log 2>&1 &

echo "Backend reiniciado con nueva configuración CORS"
echo "Puedes verificar los logs con: tail -f ../backend.log"

# Esperar un momento para que arranque el servidor
sleep 3
tail -n 20 ../backend.log
