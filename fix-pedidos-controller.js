const fs = require('fs');
const path = require('path');

const CONTROLLER_PATH = path.join(__dirname, 'gestion-pedidos-carniceria', 'src', 'pedidosTiendaController.js');

if (!fs.existsSync(CONTROLLER_PATH)) {
  console.error('❌ No se encontró el archivo pedidosTiendaController.js');
  process.exit(1);
}

let content = fs.readFileSync(CONTROLLER_PATH, 'utf8');

// 1. Mejorar la validación de las líneas para ser más tolerante
if (content.includes("if (!linea.producto || typeof linea.producto !== 'string' || !linea.producto.trim())")) {
  content = content.replace(
    "if (!linea.producto || typeof linea.producto !== 'string' || !linea.producto.trim())",
    "if (linea.producto === null || linea.producto === undefined || (typeof linea.producto === 'string' && !linea.producto.trim()))"
  );
  console.log('✅ Mejorada la validación de líneas de pedido');
}

// 2. Mejorar el manejo de errores con información detallada
if (content.includes("console.error('[ERROR] Error al actualizar pedido:', err);")) {
  content = content.replace(
    "console.error('[ERROR] Error al actualizar pedido:', err);",
    `console.error('[ERROR] Error al actualizar pedido:', {
      error: err.message, 
      stack: err.stack,
      datos: JSON.stringify(datos, null, 2)
    });`
  );
  console.log('✅ Mejorado el registro de errores para diagnóstico');
}

// 3. Mejorar la normalización de campos para prevenir errores 400
if (content.includes("if (linea.cantidad !== undefined) linea.cantidad = Number(linea.cantidad);")) {
  // Mejorar la normalización para ser más tolerante con valores nulos o indefinidos
  const normalizacionOriginal = `if (linea.cantidad !== undefined) linea.cantidad = Number(linea.cantidad);
          if (linea.peso !== undefined) linea.peso = Number(linea.peso);
          if (linea.cantidadEnviada !== undefined) linea.cantidadEnviada = Number(linea.cantidadEnviada);`;
          
  const normalizacionMejorada = `// Normalizar campos numéricos con validación robusta
          if (linea.cantidad !== undefined && linea.cantidad !== null && linea.cantidad !== '') {
            const numCantidad = Number(linea.cantidad);
            linea.cantidad = isNaN(numCantidad) ? 0 : numCantidad;
          } else if (linea.cantidad === '') {
            linea.cantidad = 0;
          }
          
          if (linea.peso !== undefined && linea.peso !== null && linea.peso !== '') {
            const numPeso = Number(linea.peso);
            linea.peso = isNaN(numPeso) ? null : numPeso;
          } else if (linea.peso === '') {
            linea.peso = null;
          }
          
          if (linea.cantidadEnviada !== undefined && linea.cantidadEnviada !== null && linea.cantidadEnviada !== '') {
            const numCantidadEnviada = Number(linea.cantidadEnviada);
            linea.cantidadEnviada = isNaN(numCantidadEnviada) ? 0 : numCantidadEnviada;
          } else if (linea.cantidadEnviada === '') {
            linea.cantidadEnviada = 0;
          }`;
  
  content = content.replace(normalizacionOriginal, normalizacionMejorada);
  console.log('✅ Mejorada la normalización de campos numéricos');
}

// Guardar los cambios
fs.writeFileSync(CONTROLLER_PATH, content);
console.log('✅ Controlador pedidosTiendaController.js actualizado');
