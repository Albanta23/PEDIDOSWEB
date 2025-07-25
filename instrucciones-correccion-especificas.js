// Script de corrección para ClientesMantenimiento.jsx
// Este script incluye las correcciones exactas necesarias para solucionar
// el problema de visualización de pedidos en la ficha de cliente

// 1. Corrección de las funciones de carga
const cargarPedidosClienteCorregido = `
  const cargarPedidosCliente = async (cliente) => {
    setCargandoPedidos(true);
    try {
      // Llamar a la API con los parámetros correctos para filtrar en el backend
      const res = await axios.get(\`\${API_URL_CORRECTO}/pedidos-clientes\`, {
        params: {
          clienteId: cliente._id, // Filtrar por ID del cliente
          nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
          enHistorialDevoluciones: false // Excluir pedidos en historial de devoluciones
        }
      });
      
      console.log('Cargando pedidos para cliente:', cliente.nombre, cliente._id);
      console.log('Total pedidos recibidos:', res.data?.length || 0);
      
      setPedidosCliente(res.data || []);
    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      setPedidosCliente([]);
    } finally {
      setCargandoPedidos(false);
    }
  };
`;

const cargarDevolucionesClienteCorregido = `
  const cargarDevolucionesCliente = async (cliente) => {
    setCargandoDevoluciones(true);
    try {
      // Llamar a la API con los parámetros correctos para filtrar en el backend
      const res = await axios.get(\`\${API_URL_CORRECTO}/pedidos-clientes\`, {
        params: {
          clienteId: cliente._id, // Filtrar por ID del cliente
          nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
          enHistorialDevoluciones: true // Solo incluir pedidos en historial de devoluciones
        }
      });
      
      console.log('Cargando devoluciones para cliente:', cliente.nombre, cliente._id);
      console.log('Total devoluciones recibidas:', res.data?.length || 0);
      
      setDevolucionesCliente(res.data || []);
    } catch (error) {
      console.error('Error cargando devoluciones del cliente:', error);
      setDevolucionesCliente([]);
    } finally {
      setCargandoDevoluciones(false);
    }
  };
`;

// 2. Corrección de las llamadas a estas funciones
const llamadaHandleEditarCorregida = `
  const handleEditar = (cliente) => {
    setClienteEdit(cliente);
    setForm({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setModo('editar');
    // Limpiar filtros al cambiar de cliente
    setFiltroFecha('');
    setFiltroProducto('');
    cargarPedidosCliente(cliente);
    cargarDevolucionesCliente(cliente);
  };
`;

const llamadaHandleVerCorregida = `
  const handleVer = (cliente) => {
    setClienteEdit(cliente);
    setModo('ver');
    // Limpiar filtros al cambiar de cliente
    setFiltroFecha('');
    setFiltroProducto('');
    cargarPedidosCliente(cliente);
    cargarDevolucionesCliente(cliente);
  };
`;

const llamadaCerrarEditorPedidosCorregida = `
  const cerrarEditorPedidos = () => {
    setMostrarEditorPedidos(false);
    setDatosReutilizacion(null);
    // Recargar pedidos para mostrar el nuevo pedido si se creó
    if (clienteEdit) {
      cargarPedidosCliente(clienteEdit);
    }
  };
`;

// 3. Corrección en el controlador de pedidos
const controladorPedidosCorregido = `
async listar(req, res) {
  try {
    // Filtros: clienteId, nombreCliente, fechaInicio, fechaFin, estado, origen.tipo, enHistorialDevoluciones
    const { clienteId, nombreCliente, fechaInicio, fechaFin, estado, origen, enHistorialDevoluciones } = req.query;
    let filtro = {};
    
    // Búsqueda por cliente - combinando ID y nombre
    if (clienteId || nombreCliente) {
      filtro.$or = [];
      
      // Si tenemos ID del cliente
      if (clienteId) {
        filtro.$or.push({ clienteId: clienteId });
        filtro.$or.push({ "cliente._id": clienteId });
      }
      
      // Si tenemos nombre del cliente
      if (nombreCliente) {
        const nombreRegex = new RegExp(nombreCliente, 'i');
        filtro.$or.push({ clienteNombre: nombreRegex });
        filtro.$or.push({ cliente: nombreRegex });
        filtro.$or.push({ "cliente.nombre": nombreRegex });
      }
    }
    
    // Otros filtros
    if (estado) filtro.estado = estado;
    if (origen && origen.tipo) filtro['origen.tipo'] = origen.tipo;
    
    // Filtro por fecha
    if (fechaInicio || fechaFin) {
      filtro.fechaPedido = {};
      if (fechaInicio) filtro.fechaPedido.$gte = new Date(fechaInicio);
      if (fechaFin) {
        // Incluir todo el día de fechaFin
        const fin = new Date(fechaFin);
        fin.setHours(23,59,59,999);
        filtro.fechaPedido.$lte = fin;
      }
    }
    
    // Filtro por estado de devolución
    if (typeof enHistorialDevoluciones === 'undefined') {
      filtro.enHistorialDevoluciones = { $ne: true };
    } else if (enHistorialDevoluciones === 'true') {
      filtro.enHistorialDevoluciones = true;
    } else if (enHistorialDevoluciones === 'false') {
      filtro.enHistorialDevoluciones = { $ne: true };
    }
    
    // Buscar pedidos
    let pedidos = await PedidoCliente.find(filtro);
    
    // Si no hay filtro de fecha y los pedidos no tienen fechaPedido, filtrar por fechaCreacion
    if ((fechaInicio || fechaFin) && pedidos.length === 0) {
      let filtroCreacion = { ...filtro };
      delete filtroCreacion.fechaPedido;
      filtroCreacion.fechaCreacion = {};
      if (fechaInicio) filtroCreacion.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23,59,59,999);
        filtroCreacion.fechaCreacion.$lte = fin;
      }
      pedidos = await PedidoCliente.find(filtroCreacion);
    }
    
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
`;

// Instrucciones de aplicación
console.log('=== INSTRUCCIONES DE CORRECCIÓN ===');
console.log('\n1. Actualizar la función cargarPedidosCliente en ClientesMantenimiento.jsx:');
console.log(cargarPedidosClienteCorregido);

console.log('\n2. Actualizar la función cargarDevolucionesCliente en ClientesMantenimiento.jsx:');
console.log(cargarDevolucionesClienteCorregido);

console.log('\n3. Actualizar la función handleEditar en ClientesMantenimiento.jsx:');
console.log(llamadaHandleEditarCorregida);

console.log('\n4. Actualizar la función handleVer en ClientesMantenimiento.jsx:');
console.log(llamadaHandleVerCorregida);

console.log('\n5. Actualizar la función cerrarEditorPedidos en ClientesMantenimiento.jsx:');
console.log(llamadaCerrarEditorPedidosCorregida);

console.log('\n6. Actualizar la función listar en pedidosClientesController.js:');
console.log(controladorPedidosCorregido);

console.log('\n7. Verificar que ahora se muestran correctamente los pedidos de los clientes');
console.log('  Para el cliente "Pascual Fernandez Fernandez" deberían aparecer sus pedidos específicos');
