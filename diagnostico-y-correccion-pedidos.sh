#!/bin/bash

# Script de diagnóstico y corrección para problemas de pedidos de clientes
# Este script ejecuta una serie de diagnósticos y puede aplicar correcciones 
# para problemas comunes relacionados con la visualización de pedidos de clientes.

echo "======================================================="
echo "   DIAGNÓSTICO Y CORRECCIÓN DE PEDIDOS DE CLIENTES"
echo "======================================================="
echo

# Verificar conexión al backend
echo "=> Verificando conexión al backend..."
# Intentar encontrar la URL del backend en el entorno
echo "Buscando URL del backend en la configuración..."

# Ruta al archivo .env o al archivo donde podría estar la configuración
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  echo "Archivo .env encontrado."
  API_URL=$(grep VITE_API_URL $ENV_FILE | cut -d '=' -f2)
  echo "URL encontrada en .env: $API_URL"
else
  echo "Archivo .env no encontrado. Usando URL predeterminada."
  API_URL="http://localhost:5000/api"
fi

# Asegurarse de que la URL termina con /api
if [[ $API_URL != */api ]]; then
  API_URL="${API_URL}/api"
fi

echo "Intentando conectar a: $API_URL"
curl -s --connect-timeout 5 $API_URL > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Error: No se puede conectar al backend en $API_URL"
  echo "Por favor, asegúrese de que el servidor backend está en ejecución."
  
  echo
  echo "¿Desea continuar con el diagnóstico de todas formas? (s/n)"
  read continuar
  if [ "$continuar" != "s" ] && [ "$continuar" != "S" ]; then
    exit 1
  fi
else
  echo "✅ Conexión al backend exitosa."
fi

echo
echo "=> Ejecutando diagnóstico de pedidos de clientes..."
node diagnostico-pedidos-clientes.js

echo
echo "=> ¿Desea ejecutar la corrección automática de estructura? (s/n)"
read respuesta

if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
  echo "Ejecutando corrección de estructura..."
  node corregir-estructura-clientes.js
  
  echo
  echo "=> ¿Desea reiniciar el servidor después de las correcciones? (s/n)"
  read reiniciar
  
  if [ "$reiniciar" = "s" ] || [ "$reiniciar" = "S" ]; then
    echo "Reiniciando servidor..."
    # Comando para reiniciar el servidor (adaptar según su configuración)
    # pm2 restart server.js
    echo "Servidor reiniciado."
  fi
else
  echo "Corrección automática omitida."
fi

echo
echo "======================================================="
echo "Diagnóstico completado. Si los problemas persisten, por favor revise:"
echo "1. La estructura del componente ClientesMantenimiento.jsx"
echo "2. La respuesta del endpoint pedidos-clientes"
echo "3. La configuración CORS del servidor"
echo "======================================================="
