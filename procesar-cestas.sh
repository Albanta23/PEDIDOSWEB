#!/bin/bash

# Script para procesar cestas navideñas
# Uso: ./procesar-cestas.sh archivo.csv

# Verificar si se proporcionó un archivo
if [ $# -eq 0 ]; then
  echo "🚫 Error: Debes proporcionar un archivo CSV"
  echo "Uso: ./procesar-cestas.sh archivo.csv"
  exit 1
fi

# Verificar que el archivo existe
if [ ! -f "$1" ]; then
  echo "🚫 Error: El archivo '$1' no existe"
  exit 1
fi

# Verificar que el archivo es CSV
if [[ ! $1 =~ \.csv$ ]]; then
  echo "🚫 Error: El archivo debe ser un CSV"
  exit 1
fi

echo "🎄 Iniciando procesamiento de cestas navideñas..."
echo "📁 Archivo: $1"

# Ejecutar el script principal
node procesar-cestas-navidenas.js "$1"

# Verificar si el procesamiento fue exitoso
if [ $? -eq 0 ]; then
  echo "✅ Procesamiento completado con éxito"
  
  # Encontrar el último reporte generado
  LATEST_REPORT=$(ls -t reporte-cestas-navidad-*.json 2>/dev/null | head -n 1)
  
  if [ -n "$LATEST_REPORT" ]; then
    echo "📊 Reporte generado: $LATEST_REPORT"
    echo "🔍 Abriendo reporte en formato HTML..."
    
    # Generar HTML a partir del JSON
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$LATEST_REPORT', 'utf8'));
      
      const html = \`
      <!DOCTYPE html>
      <html lang='es'>
      <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Reporte de Cestas Navideñas</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #c62828; }
          .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .success { color: #2e7d32; }
          .error { color: #c62828; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .header { display: flex; align-items: center; }
          .header h1 { margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class='header'>
          <span style='font-size: 40px;'>🎄</span>
          <h1>Reporte de Procesamiento de Cestas Navideñas</h1>
        </div>
        
        <div class='stats'>
          <h2>📊 Estadísticas</h2>
          <p><strong>Total procesados:</strong> \${data.totalProcesados || 0}</p>
          <p><strong>Clientes encontrados:</strong> <span class='success'>\${data.clientesEncontrados || 0}</span></p>
          <p><strong>Clientes no encontrados:</strong> <span class='error'>\${data.clientesNoEncontrados || 0}</span></p>
          <p><strong>Cestas procesadas:</strong> \${data.cestasProcesadas || 0}</p>
          <p><strong>Fecha de procesamiento:</strong> \${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <h2>📋 Detalle del Procesamiento</h2>
        <table>
          <tr>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Detalles</th>
          </tr>
          \${(data.resultados || []).map(r => \`
            <tr>
              <td>\${r.encontrado ? '✅' : '❌'}</td>
              <td>\${r.nombre || 'N/A'}</td>
              <td>\${r.encontrado ? 'Cliente encontrado y marcado' : 'No se encontró coincidencia'}</td>
            </tr>
          \`).join('')}
        </table>
        
        <div>
          <h2>🔍 Errores y Advertencias</h2>
          \${(data.errores && data.errores.length > 0) ? 
            \`<ul>\${data.errores.map(e => \`<li class="error">\${e.mensaje || e}</li>\`).join('')}</ul>\` : 
            \`<p>No se encontraron errores durante el procesamiento.</p>\`
          }
        </div>
        
        <footer>
          <p>Generado automáticamente por el Sistema de Gestión de Cestas Navideñas</p>
        </footer>
      </body>
      </html>
      \`;
      
      fs.writeFileSync('reporte-cestas-navidenas.html', html);
      console.log('Reporte HTML generado con éxito: reporte-cestas-navidenas.html');
    "
    
    # Abrir el archivo HTML en el navegador predeterminado
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open reporte-cestas-navidenas.html
    elif command -v open >/dev/null 2>&1; then
      open reporte-cestas-navidenas.html
    fi
    
  else
    echo "⚠️ No se encontró un reporte generado"
  fi
  
else
  echo "❌ Error durante el procesamiento"
fi

echo "🏁 Proceso finalizado"
