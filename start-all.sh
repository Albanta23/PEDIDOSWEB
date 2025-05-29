#!/bin/bash

# Iniciar el backend en segundo plano
echo "Iniciando backend..."
(cd /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria && npm start) &
BACKEND_PID=$!

# Esperar un par de segundos para que el backend arranque
sleep 5

# Iniciar el frontend
echo "Iniciando frontend..."
cd /workspaces/PEDIDOSWEB
npm start

# Cuando el frontend se detenga (Ctrl+C), detener también el backend
kill $BACKEND_PID
echo "Procesos detenidos."
