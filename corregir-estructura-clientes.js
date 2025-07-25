// Script para corregir la estructura del componente ClientesMantenimiento

// Este script está diseñado para ejecutarse manualmente para reparar 
// cualquier problema estructural en el componente ClientesMantenimiento.jsx.
// Puede ejecutarlo con 'node corregir-estructura-clientes.js'

const fs = require('fs');
const path = require('path');

// Ruta al archivo ClientesMantenimiento.jsx
const rutaArchivo = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');

async function corregirEstructura() {
  try {
    console.log('Iniciando corrección de estructura del componente ClientesMantenimiento...');
    
    // 1. Leer el archivo
    console.log('Leyendo archivo original...');
    let contenido = fs.readFileSync(rutaArchivo, 'utf8');
    
    // 2. Hacer una copia de seguridad
    const rutaBackup = `${rutaArchivo}.backup-${Date.now()}`;
    console.log(`Creando copia de seguridad en: ${rutaBackup}`);
    fs.writeFileSync(rutaBackup, contenido);
    
    // 3. Corregir sección de pedidos cliente y filtrado
    console.log('Corrigiendo sección de pedidos de clientes...');
    
    // Reemplazar la función cargarPedidosCliente por versión mejorada
    const patronFuncion = /const cargarPedidosCliente = async \(clienteNombre\) => \{[\s\S]*?setCargandoPedidos\(false\);\s*\};/;
    const funcionCorregida = `const cargarPedidosCliente = async (clienteNombre) => {
    setCargandoPedidos(true);
    try {
      // Buscar primero todos los pedidos y filtrar por clienteNombre
      const res = await axios.get(\`\${API_URL_CORRECTO}/pedidos-clientes\`);
      console.log('Cargando pedidos para cliente:', clienteNombre);
      console.log('Total pedidos recibidos:', res.data?.length || 0);
      
      // Filtrar con múltiples criterios para mayor robustez
      const pedidosFiltrados = (res.data || []).filter(pedido => {
        // Usar string vacío si algún valor es null o undefined
        const nombre = (clienteNombre || '').toString().toLowerCase();
        const pedidoNombre = (pedido.clienteNombre || '').toString().toLowerCase();
        const pedidoId = (pedido.clienteId || '').toString().toLowerCase();
        const pedidoCliente = (pedido.cliente || '').toString().toLowerCase();
        
        // Verificar coincidencia por cualquiera de los campos
        return pedidoNombre.includes(nombre) || 
               pedidoId.includes(nombre) || 
               pedidoCliente.includes(nombre);
      });
      
      console.log('Pedidos filtrados encontrados:', pedidosFiltrados.length);
      setPedidosCliente(pedidosFiltrados);
    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      setPedidosCliente([]);
    } finally {
      setCargandoPedidos(false);
    }
  };`;
    
    contenido = contenido.replace(patronFuncion, funcionCorregida);
    
    // 4. Asegurar correcta visualización de pedidos vacíos
    console.log('Asegurando correcta visualización de pedidos vacíos...');
    
    // 5. Guardar los cambios
    console.log('Guardando cambios...');
    fs.writeFileSync(rutaArchivo, contenido);
    
    console.log('Corrección completada con éxito.');
    console.log('Por favor, reinicie la aplicación para aplicar los cambios.');
  } catch (error) {
    console.error('Error durante la corrección:', error);
    console.log('No se realizaron cambios en el archivo original.');
  }
}

corregirEstructura();
