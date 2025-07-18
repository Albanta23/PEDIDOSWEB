#!/bin/bash

# Script para diagnosticar problemas de CORS con la importación de clientes de cestas navideñas
# Ejecutar con: ./diagnostico-cestas-cors.sh

echo "🔍 DIAGNÓSTICO DE PROBLEMAS DE CORS EN GESTOR DE CESTAS NAVIDEÑAS"
echo "=================================================================="
echo ""

# Colores para la terminal
RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'

# 1. Verificar la existencia de los archivos de diagnóstico
echo -e "${BLUE}1. Verificando archivos de diagnóstico...${RESET}"
FILES_OK=true

if [ ! -f "debug-cestas-navidad.html" ]; then
  echo -e "${RED}❌ No se encontró debug-cestas-navidad.html${RESET}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ debug-cestas-navidad.html encontrado${RESET}"
fi

if [ ! -f "debug-cestas-import.js" ]; then
  echo -e "${RED}❌ No se encontró debug-cestas-import.js${RESET}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ debug-cestas-import.js encontrado${RESET}"
fi

if [ ! -f "actualizar-cors-cestas.js" ]; then
  echo -e "${RED}❌ No se encontró actualizar-cors-cestas.js${RESET}"
  FILES_OK=false
else
  echo -e "${GREEN}✅ actualizar-cors-cestas.js encontrado${RESET}"
fi

if [ "$FILES_OK" = false ]; then
  echo -e "${RED}⚠️ Faltan archivos de diagnóstico. Por favor, asegúrate de que todos existen.${RESET}"
  exit 1
fi

echo ""

# 2. Ejecutar la prueba de CORS desde la línea de comandos
echo -e "${BLUE}2. Ejecutando prueba de CORS desde Node.js...${RESET}"
echo "Esto simulará una petición del frontend al backend"
echo ""

node debug-cestas-import.js

echo ""

# 3. Comprobar si el servidor está en ejecución
echo -e "${BLUE}3. Comprobando si el servidor está en ejecución...${RESET}"

SERVER_URL="http://localhost:10001"
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $SERVER_URL 2>/dev/null || echo "ERROR")

if [ "$SERVER_RESPONSE" = "ERROR" ]; then
  echo -e "${RED}❌ No se pudo conectar al servidor en $SERVER_URL${RESET}"
  echo -e "${YELLOW}⚠️ El servidor debe estar en ejecución para las pruebas de CORS${RESET}"
  echo "   Para iniciar el servidor:"
  echo "   1. Navega a la carpeta gestion-pedidos-carniceria"
  echo "   2. Ejecuta: npm run dev"
elif [ "$SERVER_RESPONSE" = "200" ] || [ "$SERVER_RESPONSE" = "404" ]; then
  echo -e "${GREEN}✅ El servidor está en ejecución (respuesta: $SERVER_RESPONSE)${RESET}"
else
  echo -e "${YELLOW}⚠️ El servidor respondió con código $SERVER_RESPONSE${RESET}"
fi

echo ""

# 4. Instrucciones para aplicar correcciones
echo -e "${BLUE}4. Aplicando correcciones de CORS...${RESET}"
echo ""

echo -e "${YELLOW}Para aplicar la corrección de CORS, ejecuta:${RESET}"
echo "node actualizar-cors-cestas.js"
echo ""

# Preguntar si quiere ejecutar el script de corrección ahora
read -p "¿Quieres ejecutar la corrección de CORS ahora? (s/n): " ejecutar_correccion

if [ "$ejecutar_correccion" = "s" ] || [ "$ejecutar_correccion" = "S" ]; then
  echo ""
  echo "Ejecutando script de corrección..."
  node actualizar-cors-cestas.js
else
  echo ""
  echo -e "${YELLOW}No se aplicaron correcciones. Puedes ejecutar el script manualmente cuando estés listo.${RESET}"
fi

echo ""

# 5. Instrucciones para probar en el navegador
echo -e "${BLUE}5. Prueba en el navegador${RESET}"
echo ""
echo "Para probar la corrección en el navegador:"
echo "1. Abre el archivo debug-cestas-navidad.html en tu navegador"
echo "2. Usa el botón 'Probar CORS en /importar' para verificar la conexión"
echo ""

# Preguntar si quiere abrir el HTML ahora
read -p "¿Quieres abrir debug-cestas-navidad.html ahora? (s/n): " abrir_html

if [ "$abrir_html" = "s" ] || [ "$abrir_html" = "S" ]; then
  echo ""
  echo "Abriendo página de diagnóstico en el navegador..."
  
  # Intentar abrir con diferentes comandos según el sistema
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open debug-cestas-navidad.html
  elif command -v open >/dev/null 2>&1; then
    open debug-cestas-navidad.html
  else
    echo -e "${YELLOW}⚠️ No se pudo abrir automáticamente. Por favor, abre manualmente el archivo:${RESET}"
    echo "   debug-cestas-navidad.html"
  fi
else
  echo ""
  echo -e "${YELLOW}No se abrió la página. Puedes abrirla manualmente cuando estés listo.${RESET}"
fi

echo ""
echo -e "${MAGENTA}Diagnóstico completado. Si sigues experimentando problemas después de aplicar las correcciones,${RESET}"
echo -e "${MAGENTA}por favor revisa los logs del servidor para ver los mensajes de depuración CORS.${RESET}"
echo ""
