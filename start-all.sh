#!/bin/bash

# Liberar puertos antes de iniciar
for PORT in 10001 3000 3100; do
  PID=$(lsof -ti tcp:$PORT)
  if [ -n "$PID" ]; then
    echo "Liberando puerto $PORT (matando proceso $PID)..."
    kill -9 $PID
  fi
done

# Función para limpiar todos los procesos hijos
cleanup() {
  echo "\nDeteniendo todos los procesos..."
  kill $BACKEND_PID 2>/dev/null
  [ -n "$GESTOR_PID" ] && kill $GESTOR_PID 2>/dev/null
  [ -n "$CLIENTES_PID" ] && kill $CLIENTES_PID 2>/dev/null
  # Intentar matar los grupos de procesos por si hay hijos huérfanos
  kill -TERM -$BACKEND_PID 2>/dev/null
  [ -n "$GESTOR_PID" ] && kill -TERM -$GESTOR_PID 2>/dev/null
  [ -n "$CLIENTES_PID" ] && kill -TERM -$CLIENTES_PID 2>/dev/null
  echo "Procesos detenidos."
}

trap cleanup EXIT INT TERM

# Iniciar el backend en segundo plano
echo "Iniciando backend..."
(cd /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria && npm start) &
BACKEND_PID=$!


# Esperar 15 segundos para que el backend arranque
echo "Esperando 15 segundos para que el backend arranque..."
sleep 15
echo "Arrancando frontend principal."

# Iniciar el frontend principal
echo "Iniciando frontend principal..."
cd /workspaces/PEDIDOSWEB
echo "(npm start)"
npm start &
FRONTEND_PID=$!

# Iniciar el frontend gestor-cestas-navideñas-pro
if [ -d /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria/gestor-cestas-navideñas-pro ]; then
  echo "Iniciando frontend gestor-cestas-navideñas-pro..."
  (cd /workspaces/PEDIDOSWEB/gestion-pedidos-carniceria/gestor-cestas-navideñas-pro && npm install && npm run dev -- --host) &
  GESTOR_PID=$!
else
  echo "No se encontró el directorio gestor-cestas-navideñas-pro."
fi

# Iniciar el frontend clientes-gestion
if npm run | grep -q "dev:clientes"; then
  echo "Iniciando frontend clientes-gestion (npm run dev:clientes)..."
  npm run dev:clientes &
  CLIENTES_PID=$!
else
  echo "No se encontró el script dev:clientes en package.json."
fi

# Esperar a que el frontend principal termine
wait $FRONTEND_PID

# La limpieza se realiza automáticamente por el trap
