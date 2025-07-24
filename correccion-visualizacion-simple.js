// Script simplificado para corregir los problemas de visualización de pedidos
const fs = require('fs');
const path = require('path');

console.log('=== CORRECCIÓN DE PROBLEMAS DE VISUALIZACIÓN DE PEDIDOS ===');

// Corregir el controlador de pedidos
const rutaController = path.join(__dirname, 'gestion-pedidos-carniceria', 'src', 'pedidosClientesController.js');
if (fs.existsSync(rutaController)) {
  console.log(`Encontrado archivo controlador en ${rutaController}`);
  
  // Leer el contenido actual
  let contenido = fs.readFileSync(rutaController, 'utf8');
  
  // Hacer una copia de seguridad
  const rutaBackup = `${rutaController}.backup-${Date.now()}`;
  fs.writeFileSync(rutaBackup, contenido);
  console.log(`Copia de seguridad creada en ${rutaBackup}`);
  
  // Buscar la sección de filtrado por cliente
  const seccionFiltradoCliente = /if\s*\(\s*clienteId\s*\|\|\s*nombreCliente\s*\)\s*{[\s\S]*?}/;
  const match = contenido.match(seccionFiltradoCliente);
  
  if (match) {
    const seccionOriginal = match[0];
    console.log("Sección original encontrada:", seccionOriginal);
    
    const seccionMejorada = `if (clienteId || nombreCliente) {
        filtro.$or = [];
        
        // Si tenemos ID del cliente - búsqueda exacta
        if (clienteId) {
          filtro.$or.push({ clienteId: clienteId });
          filtro.$or.push({ "cliente._id": clienteId });
          filtro.$or.push({ cliente: clienteId });
        }
        
        // Si tenemos nombre del cliente - búsqueda exacta para evitar confusiones
        if (nombreCliente) {
          // Usar una expresión regular que coincida exactamente con el nombre, no parcialmente
          const nombreRegexExacto = new RegExp('^' + nombreCliente.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
          filtro.$or.push({ clienteNombre: nombreRegexExacto });
          filtro.$or.push({ "cliente.nombre": nombreRegexExacto });
          
          // Para el campo cliente como string, necesitamos una comparación exacta
          filtro.$or.push({ cliente: nombreRegexExacto });
        }
      }`;
    
    // Reemplazar la sección original con la mejorada
    const contenidoNuevo = contenido.replace(seccionOriginal, seccionMejorada);
    
    // Guardar los cambios
    fs.writeFileSync(rutaController, contenidoNuevo);
    console.log('✅ Archivo pedidosClientesController.js actualizado con éxito');
  } else {
    console.log('⚠️ No se encontró la sección de filtrado por cliente en el controlador');
  }
} else {
  console.log(`⚠️ No se encontró el archivo controlador en ${rutaController}`);
}

// Corregir el componente de mantenimiento de clientes
const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
if (fs.existsSync(rutaComponente)) {
  console.log(`Encontrado archivo componente en ${rutaComponente}`);
  
  // Leer el contenido actual
  let contenido = fs.readFileSync(rutaComponente, 'utf8');
  
  // Hacer una copia de seguridad
  const rutaBackup = `${rutaComponente}.backup-${Date.now()}`;
  fs.writeFileSync(rutaBackup, contenido);
  console.log(`Copia de seguridad creada en ${rutaBackup}`);
  
  // Buscar la función cargarPedidosCliente
  const funcionCargaPedidos = /const\s+cargarPedidosCliente\s*=\s*async\s*\(\s*cliente\s*\)\s*=>[\s\S]*?setCargandoPedidos\s*\(\s*false\s*\)\s*;[\s\S]*?};/;
  const match = contenido.match(funcionCargaPedidos);
  
  if (match) {
    const funcionOriginal = match[0];
    console.log("Función original encontrada:", funcionOriginal.substring(0, 100) + "...");
    
    const funcionMejorada = `const cargarPedidosCliente = async (cliente) => {
    setCargandoPedidos(true);
    try {
      // Validar que cliente sea un objeto válido
      if (!cliente || typeof cliente !== 'object') {
        console.error('Error: cliente no es un objeto válido', cliente);
        setPedidosCliente([]);
        setCargandoPedidos(false);
        return;
      }
      
      console.log('Cargando pedidos para cliente:', cliente.nombre, cliente._id);
      
      // Llamar a la API con los parámetros correctos para filtrar en el backend
      const res = await axios.get(\`\${API_URL_CORRECTO}/pedidos-clientes\`, {
        params: {
          clienteId: cliente._id, // Filtrar por ID del cliente
          nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
          enHistorialDevoluciones: false // Excluir pedidos en historial de devoluciones
        }
      });
      
      console.log('Total pedidos recibidos:', res.data?.length || 0);
      
      // Verificar y transformar los datos si es necesario
      const pedidosNormalizados = (res.data || []).map(pedido => {
        // Asegurarse de que tenga todas las propiedades necesarias
        return {
          ...pedido,
          // Si falta clienteId pero tiene cliente como string, usarlo como clienteId
          clienteId: pedido.clienteId || (typeof pedido.cliente === 'string' ? pedido.cliente : undefined)
        };
      });
      
      setPedidosCliente(pedidosNormalizados);
    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      setPedidosCliente([]);
    } finally {
      setCargandoPedidos(false);
    }
  };`;
    
    // Reemplazar la función original con la mejorada
    const contenidoNuevo = contenido.replace(funcionOriginal, funcionMejorada);
    
    // Guardar los cambios
    fs.writeFileSync(rutaComponente, contenidoNuevo);
    console.log('✅ Archivo ClientesMantenimiento.jsx actualizado con éxito');
  } else {
    console.log('⚠️ No se encontró la función cargarPedidosCliente en el componente');
  }
} else {
  console.log(`⚠️ No se encontró el archivo componente en ${rutaComponente}`);
}

console.log('=== PROCESO COMPLETADO ===');
