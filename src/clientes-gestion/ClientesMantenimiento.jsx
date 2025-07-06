import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PedidosClientes from './PedidosClientes';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
console.log('[DEBUG ClientesMantenimiento] API_URL:', API_URL);
console.log('[DEBUG ClientesMantenimiento] VITE_API_URL:', import.meta.env.VITE_API_URL);

// Componente que extiende PedidosClientes para manejar reutilización
function PedidosClientesConReutilizacion({ onPedidoCreado, datosReutilizacion }) {
  const [componenteKey, setComponenteKey] = useState(0);

  useEffect(() => {
    // Forzar re-render del componente cuando cambien los datos de reutilización
    setComponenteKey(prev => prev + 1);
  }, [datosReutilizacion]);

  return (
    <PedidosClientes 
      key={componenteKey}
      onPedidoCreado={onPedidoCreado}
      clienteInicial={datosReutilizacion?.cliente}
      lineasIniciales={datosReutilizacion?.lineasOriginales}
    />
  );
}

export default function ClientesMantenimiento() {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [modo, setModo] = useState('lista'); // 'lista', 'crear', 'editar', 'ver'
  const [clienteEdit, setClienteEdit] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [mensaje, setMensaje] = useState('');
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [mostrarEditorPedidos, setMostrarEditorPedidos] = useState(false);
  const [datosReutilizacion, setDatosReutilizacion] = useState(null);
  // Filtros para pedidos del cliente
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  
  // Estados para gestión de cestas de navidad
  const [estadisticasCestas, setEstadisticasCestas] = useState(null);
  const [mostrarGestionCestas, setMostrarGestionCestas] = useState(false);
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('ninguno'); // 'ninguno', 'todos', 'cestas', 'normales'
  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false); // Checkbox para mostrar todos independiente del filtro

  const cargarClientes = () => {
    axios.get(`${API_URL}/clientes`)
      .then(res => {
        setClientes(res.data);
        setClientesFiltrados(res.data);
        aplicarFiltros(res.data, filtroBusqueda, filtroTipoCliente, mostrarTodosClientes);
      })
      .catch(() => {
        setClientes([]);
        setClientesFiltrados([]);
      });
  };

  // Cargar estadísticas de cestas de navidad
  const cargarEstadisticasCestas = async () => {
    try {
      const res = await axios.get(`${API_URL}/clientes/estadisticas-cestas`);
      setEstadisticasCestas(res.data);
    } catch (error) {
      console.error('Error cargando estadísticas de cestas:', error);
    }
  };

  // Función para aplicar filtros (búsqueda + tipo de cliente)
  const aplicarFiltros = (listaClientes, busqueda, tipoCliente, mostrarTodos = false) => {
    let filtrados = [];
    
    // Si hay texto de búsqueda, siempre mostrar sugerencias independientemente del checkbox
    if (busqueda.trim()) {
      // Filtrar por búsqueda en todos los clientes
      filtrados = listaClientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (cliente.email && cliente.email.toLowerCase().includes(busqueda.toLowerCase())) ||
        (cliente.telefono && cliente.telefono.includes(busqueda)) ||
        (cliente.cif && cliente.cif.toLowerCase().includes(busqueda.toLowerCase())) ||
        (cliente.numCliente && cliente.numCliente.toString().includes(busqueda))
      );
      
      // Si no está marcado "mostrar todos", aplicar también filtro de tipo
      if (!mostrarTodos) {
        if (tipoCliente === 'cestas') {
          filtrados = filtrados.filter(cliente => cliente.esCestaNavidad === true);
        } else if (tipoCliente === 'normales') {
          filtrados = filtrados.filter(cliente => cliente.esCestaNavidad !== true);
        }
        // Si es 'todos' o 'ninguno', mantener todas las sugerencias de búsqueda
      }
    } else {
      // Sin texto de búsqueda
      if (mostrarTodos) {
        // Si el checkbox está marcado, mostrar todos
        filtrados = [...listaClientes];
      } else {
        // Solo mostrar clientes si se ha seleccionado un filtro específico
        if (tipoCliente === 'cestas') {
          filtrados = listaClientes.filter(cliente => cliente.esCestaNavidad === true);
        } else if (tipoCliente === 'normales') {
          filtrados = listaClientes.filter(cliente => cliente.esCestaNavidad !== true);
        } else if (tipoCliente === 'todos') {
          filtrados = [...listaClientes];
        } else {
          // Si está en 'ninguno' y el checkbox no está marcado, no mostrar nada
          filtrados = [];
        }
      }
    }
    
    setClientesFiltrados(filtrados);
  };

  // Función para filtrar clientes
  const filtrarClientes = (busqueda) => {
    setFiltroBusqueda(busqueda);
    aplicarFiltros(clientes, busqueda, filtroTipoCliente, mostrarTodosClientes);
  };

  // Cambiar filtro de tipo de cliente
  const cambiarFiltroTipoCliente = (tipo) => {
    setFiltroTipoCliente(tipo);
    aplicarFiltros(clientes, filtroBusqueda, tipo, mostrarTodosClientes);
  };

  // Función para manejar el checkbox de mostrar todos
  const toggleMostrarTodos = (checked) => {
    setMostrarTodosClientes(checked);
    aplicarFiltros(clientes, filtroBusqueda, filtroTipoCliente, checked);
  };

  const cargarPedidosCliente = async (clienteNombre) => {
    setCargandoPedidos(true);
    try {
      // Buscar primero todos los pedidos y filtrar por clienteNombre
      const res = await axios.get(`${API_URL}/pedidos-clientes`);
      const pedidosFiltrados = (res.data || []).filter(pedido => 
        pedido.clienteNombre === clienteNombre || 
        pedido.clienteId === clienteNombre ||
        (pedido.cliente && pedido.cliente === clienteNombre)
      );
      setPedidosCliente(pedidosFiltrados);
    } catch (error) {
      console.error('Error cargando pedidos del cliente:', error);
      setPedidosCliente([]);
    } finally {
      setCargandoPedidos(false);
    }
  };

  const reutilizarPedido = (pedido, cliente) => {
    // Preparar los datos para reutilizar el pedido
    const datosParaReutilizar = {
      cliente: cliente,
      lineasOriginales: pedido.lineas || []
    };
    
    setDatosReutilizacion(datosParaReutilizar);
    setMostrarEditorPedidos(true);
  };

  const cerrarEditorPedidos = () => {
    setMostrarEditorPedidos(false);
    setDatosReutilizacion(null);
    // Recargar pedidos para mostrar el nuevo pedido si se creó
    if (clienteEdit) {
      cargarPedidosCliente(clienteEdit.nombre);
    }
  };

  // Función para filtrar pedidos del cliente
  const filtrarPedidosCliente = (pedidos, filtroFecha, filtroProducto) => {
    let pedidosFiltrados = [...pedidos];

    // Filtro por fecha
    if (filtroFecha) {
      const fechaFiltro = new Date(filtroFecha);
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const fechaPedido = pedido.fechaPedido ? new Date(pedido.fechaPedido) : 
                           pedido.fechaCreacion ? new Date(pedido.fechaCreacion) : null;
        if (!fechaPedido) return false;
        
        // Comparar solo la fecha (sin hora)
        const fechaPedidoSolo = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate());
        const fechaFiltroSolo = new Date(fechaFiltro.getFullYear(), fechaFiltro.getMonth(), fechaFiltro.getDate());
        
        return fechaPedidoSolo.getTime() === fechaFiltroSolo.getTime();
      });
    }

    // Filtro por producto
    if (filtroProducto && filtroProducto.trim()) {
      const productoLower = filtroProducto.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        if (!pedido.lineas || pedido.lineas.length === 0) return false;
        
        return pedido.lineas.some(linea => 
          linea.producto && linea.producto.toLowerCase().includes(productoLower)
        );
      });
    }

    return pedidosFiltrados;
  };

  // Efecto para aplicar filtros cuando cambian
  React.useEffect(() => {
    const pedidosFiltrados = filtrarPedidosCliente(pedidosCliente, filtroFecha, filtroProducto);
    setPedidosFiltrados(pedidosFiltrados);
  }, [pedidosCliente, filtroFecha, filtroProducto]);

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFecha('');
    setFiltroProducto('');
  };

  useEffect(() => { 
    cargarClientes(); 
    cargarEstadisticasCestas();
  }, []);

  const handleGuardar = async () => {
    if (!form.nombre) { setMensaje('El nombre es obligatorio'); return; }
    try {
      if (modo === 'crear') {
        await axios.post(`${API_URL}/clientes`, form);
        setMensaje('Cliente creado');
      } else if (modo === 'editar' && clienteEdit) {
        await axios.put(`${API_URL}/clientes/${clienteEdit._id||clienteEdit.id}`, form);
        setMensaje('Cliente actualizado');
      }
      setForm({ nombre: '', email: '', telefono: '', direccion: '' });
      setModo('lista');
      cargarClientes();
    } catch {
      setMensaje('Error al guardar');
    }
  };

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
    cargarPedidosCliente(cliente.nombre);
  };

  const handleVer = (cliente) => {
    setClienteEdit(cliente);
    setModo('ver');
    // Limpiar filtros al cambiar de cliente
    setFiltroFecha('');
    setFiltroProducto('');
    cargarPedidosCliente(cliente.nombre);
  };

  const handleEliminar = async (cliente) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await axios.delete(`${API_URL}/clientes/${cliente._id||cliente.id}`);
      cargarClientes();
    } catch {}
  };

  // Importar clientes desde CSV
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if (lines.length < 2) return setMensaje('CSV vacío o sin datos');
    const headers = lines[0].split(/\t/).map(h=>h.trim());
    const clientes = lines.slice(1).map(line => {
      const cols = line.split(/\t/);
      const obj = {};
      headers.forEach((h,i)=>{ obj[h]=cols[i]!==undefined?cols[i].trim():''; });
      return {
        nombre: obj.RazonSocial || obj.NomComercial || obj.Nombre || '',
        email: obj.Email || '',
        telefono: obj.Telefono || '',
        direccion: [obj.Direccion, obj.CodPostal, obj.Poblacion, obj.Provincia].filter(Boolean).join(', '),
        cif: obj.CIF || '',
        activo: obj.Activo === 'true' || obj.Activo === '1',
        tipoCliente: obj.TipoCliente || '',
        exentoIVA: obj.ExentoIVA === 'true' || obj.ExentoIVA === '1',
        formaPago: obj.FormaPago || '',
        recargoEquiv: obj.RecargoEquiv === 'true' || obj.RecargoEquiv === '1',
        descuento1: parseFloat(obj.Descuento1)||0,
        descuento2: parseFloat(obj.Descuento2)||0,
        descuento3: parseFloat(obj.Descuento3)||0
      };
    });
    // DEBUG: Mostrar los clientes parseados en consola
    console.log('CLIENTES IMPORTADOS', clientes);
    if (clientes.length === 0) return setMensaje('No se han detectado clientes en el archivo. Revisa el formato.');
    try {
      for (const cli of clientes) {
        await axios.post(`${API_URL}/clientes`, cli);
      }
      setMensaje('Clientes importados correctamente');
      cargarClientes();
    } catch {
      setMensaje('Error al importar clientes');
    }
  };

  // Importar clientes de cestas de navidad desde CSV
  const handleImportCestasNavidad = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMensaje('🔄 Procesando archivo de cestas de navidad...');
    
    try {
      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        setMensaje('❌ El archivo está vacío');
        return;
      }
      
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 2) {
        setMensaje('❌ CSV vacío o sin datos (menos de 2 líneas)');
        return;
      }
      
      // Detectar separador y parsing mejorado
      const separadores = [',', ';', '\t'];
      const primeraLinea = lines[0];
      let separador = ',';
      let maxColumnas = 0;
      
      // Función para parsear línea CSV con comillas
      const parsearLineaCSV = (linea, sep) => {
        const resultado = [];
        let enComillas = false;
        let valorActual = '';
        
        for (let i = 0; i < linea.length; i++) {
          const char = linea[i];
          
          if (char === '"') {
            enComillas = !enComillas;
          } else if (char === sep && !enComillas) {
            resultado.push(valorActual.trim());
            valorActual = '';
          } else {
            valorActual += char;
          }
        }
        resultado.push(valorActual.trim());
        return resultado;
      };
      
      for (const sep of separadores) {
        const columnas = parsearLineaCSV(primeraLinea, sep).length;
        if (columnas > maxColumnas) {
          maxColumnas = columnas;
          separador = sep;
        }
      }
      
      const headers = parsearLineaCSV(lines[0], separador).map(h => h.replace(/"/g, ''));
      const clientesCestas = lines.slice(1).map(line => {
        const cols = parsearLineaCSV(line, separador).map(col => col.replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
        
        return {
          nombre: obj.RazonSocial || obj.NomComercial || obj.nombre || obj.Nombre || obj.NOMBRE || '',
          email: obj.Email || obj.email || obj.EMAIL || obj.correo || obj.Correo || '',
          telefono: obj.Telefono || obj.telefono || obj.TELEFONO || obj.tel || obj.Tel || '',
          nif: obj.CIF || obj.nif || obj.NIF || obj.cif || obj.dni || obj.DNI || '',
          direccion: obj.Direccion || obj.direccion || obj.DIRECCION || '',
          codigoPostal: obj.CodPostal || obj.codigoPostal || obj.CODIGO_POSTAL || '',
          poblacion: obj.Poblacion || obj.poblacion || obj.POBLACION || '',
          provincia: obj.Provincia || obj.provincia || obj.PROVINCIA || ''
        };
      }).filter(cliente => cliente.nombre.trim());
      
      if (clientesCestas.length === 0) {
        return setMensaje('No se detectaron clientes válidos en el archivo');
      }
      
      // Enviar a la API para marcar
      const response = await axios.post(`${API_URL}/clientes/marcar-cestas-navidad`, {
        clientesCestasNavidad: clientesCestas
      });
      
      console.log('[INFO] Procesamiento completado:', response.data);
      
      if (response.data.ok) {
        const { marcados, creados, errores } = response.data;
        let mensaje = `✅ Procesamiento completado:\n`;
        mensaje += `• ${marcados} clientes existentes marcados como Normal + Cestas\n`;
        mensaje += `• ${creados} clientes nuevos creados como Solo Cestas\n`;
        if (errores.length > 0) {
          mensaje += `• ${errores.length} errores encontrados`;
        }
        setMensaje(mensaje);
        cargarClientes();
        cargarEstadisticasCestas();
      } else {
        setMensaje('Error procesando cestas de navidad: ' + response.data.error);
      }
      
    } catch (error) {
      console.error('Error procesando cestas de navidad:', error);
      setMensaje('Error procesando archivo de cestas de navidad');
    }
    
    // Limpiar input si existe
    if (e.target && e.target.value !== undefined) {
      e.target.value = '';
    }
  };

  // Alternar estado de cesta de navidad de un cliente
  const toggleCestaNavidad = async (cliente) => {
    try {
      const nuevoEstado = !cliente.esCestaNavidad;
      await axios.put(`${API_URL}/clientes/${cliente._id || cliente.id}`, {
        ...cliente,
        esCestaNavidad: nuevoEstado
      });
      
      setMensaje(`Cliente ${nuevoEstado ? 'marcado como' : 'desmarcado de'} cesta de navidad`);
      cargarClientes();
      cargarEstadisticasCestas();
    } catch (error) {
      setMensaje('Error actualizando cliente');
    }
  };

  // Limpiar todas las marcas de cestas de navidad
  const limpiarTodasCestas = async () => {
    if (!window.confirm('¿Estás seguro de que quieres desmarcar TODOS los clientes de cestas de navidad?')) {
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/clientes/limpiar-cestas-navidad`);
      if (response.data.ok) {
        setMensaje(`✅ ${response.data.desmarcados} clientes desmarcados como cestas de navidad`);
        cargarClientes();
        cargarEstadisticasCestas();
      }
    } catch (error) {
      setMensaje('Error limpiando marcas de cestas de navidad');
    }
  };

  // --- Scroll horizontal con click derecho ---
  const tablaRef = React.useRef();
  React.useEffect(() => {
    const tabla = tablaRef.current;
    if (!tabla) return;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    const onMouseDown = (e) => {
      if (e.button !== 2) return; // solo click derecho
      isDragging = true;
      startX = e.pageX - tabla.offsetLeft;
      scrollLeft = tabla.scrollLeft;
      tabla.style.cursor = 'grab';
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const x = e.pageX - tabla.offsetLeft;
      const walk = (x - startX);
      tabla.scrollLeft = scrollLeft - walk;
    };
    const onMouseUp = () => {
      isDragging = false;
      tabla.style.cursor = '';
    };
    tabla.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      tabla.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header profesional */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px 20px 0 0',
        padding: '30px',
        marginBottom: '2px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '15px',
              padding: '15px',
              color: 'white',
              fontSize: '24px'
            }}>
              👥
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: '#2c3e50',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Gestión de Clientes
              </h1>
              <p style={{
                margin: '5px 0 0 0',
                color: '#7f8c8d',
                fontSize: '16px'
              }}>
                Administrar información de clientes y historial de pedidos
              </p>
            </div>
          </div>
          {modo !== 'lista' && (
            <button
              onClick={() => {
                setModo('lista');
                setForm({ nombre: '', email: '', telefono: '', direccion: '' });
                setClienteEdit(null);
                setPedidosCliente([]);
                setFiltroBusqueda('');
                setClientesFiltrados(clientes);
                // Limpiar filtros de pedidos
                setFiltroFecha('');
                setFiltroProducto('');
              }}
              style={{
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
              }}
            >
              ← Volver a la lista
            </button>
          )}
        </div>
      </div>

      {/* Panel principal */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '0 0 20px 20px',
        padding: '30px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        minHeight: '600px'
      }}>
        {modo === 'lista' && (
          <>
            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setModo('crear');
                  setForm({ nombre: '', email: '', telefono: '', direccion: '' });
                }}
                style={{
                  background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(46, 204, 113, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.3)';
                }}
              >
                ➕ Nuevo Cliente
              </button>
              
              <label style={{
                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(243, 156, 18, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📂 Importar CSV
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Botón para importar cestas de navidad */}
              <label style={{
                background: 'linear-gradient(135deg, #e67e22, #d35400)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🎄 Importar Clientes de Cestas de Navidad
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleImportCestasNavidad}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Filtro de búsqueda */}
            <div style={{
              marginBottom: '25px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                position: 'relative',
                maxWidth: '500px',
                width: '100%'
              }}>
                <input
                  type="text"
                  placeholder="Buscar cliente por código, nombre, email, teléfono o CIF..."
                  value={filtroBusqueda}
                  onChange={(e) => filtrarClientes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '15px 20px 15px 50px',
                    borderRadius: '25px',
                    border: '2px solid #e1e8ed',
                    fontSize: '16px',
                    background: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e8ed';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  color: '#7f8c8d'
                }}>
                  🔍
                </div>
                {filtroBusqueda && (
                  <button
                    onClick={() => filtrarClientes('')}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      color: '#7f8c8d',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                    title="Limpiar búsqueda"
                  >
                    ❌
                  </button>
                )}
              </div>
              
              {/* Checkbox para mostrar todos los clientes */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#6c757d'
              }}>
                <input
                  type="checkbox"
                  id="mostrarTodos"
                  checked={mostrarTodosClientes}
                  onChange={(e) => toggleMostrarTodos(e.target.checked)}
                  style={{
                    transform: 'scale(1.2)',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="mostrarTodos"
                  style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: mostrarTodosClientes ? '600' : 'normal',
                    color: mostrarTodosClientes ? '#667eea' : '#6c757d'
                  }}
                >
                  📋 Mostrar todos los clientes
                </label>
              </div>
            </div>

            {/* Información de resultados */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              {mostrarTodosClientes ? (
                filtroBusqueda ? (
                  `Mostrando ${clientesFiltrados.length} de ${clientes.length} clientes (filtrado por búsqueda)`
                ) : (
                  `Mostrando todos los ${clientes.length} clientes`
                )
              ) : (
                filtroBusqueda ? (
                  `Sugerencias: ${clientesFiltrados.length} clientes encontrados` +
                  (filtroTipoCliente !== 'ninguno' && filtroTipoCliente !== 'todos' ? ` (tipo: ${filtroTipoCliente})` : '')
                ) : (
                  filtroTipoCliente === 'ninguno' ? (
                    '💡 Escribe para buscar clientes o selecciona un filtro de tipo'
                  ) : (
                    `Mostrando ${clientesFiltrados.length} clientes (filtro: ${filtroTipoCliente})`
                  )
                )
              )}
            </div>

            {/* Panel de gestión de cestas de navidad */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '2px solid #e1e8ed'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#2c3e50'
                }}>
                  🎄 Gestión de Cestas de Navidad
                </h4>
                <button
                  onClick={() => setMostrarGestionCestas(!mostrarGestionCestas)}
                  style={{
                    background: 'linear-gradient(135deg, #3498db, #2980b9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {mostrarGestionCestas ? '🔼 Ocultar' : '🔽 Mostrar'}
                </button>
              </div>

              {mostrarGestionCestas && (
                <>
                  {/* Estadísticas */}
                  {estadisticasCestas && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{estadisticasCestas.clientesCestasNavidad}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Cestas de Navidad</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #3498db, #2980b9)',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{estadisticasCestas.clientesNormales}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Clientes Normales</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #27ae60, #229954)',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{estadisticasCestas.porcentajeCestas}%</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>% Cestas</div>
                      </div>
                    </div>
                  )}

                  {/* Filtros por tipo de cliente */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => cambiarFiltroTipoCliente('todos')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: filtroTipoCliente === 'todos' ? 
                          'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa',
                        color: filtroTipoCliente === 'todos' ? 'white' : '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      👥 Todos ({clientes.length})
                    </button>
                    <button
                      onClick={() => cambiarFiltroTipoCliente('cestas')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: filtroTipoCliente === 'cestas' ? 
                          'linear-gradient(135deg, #e74c3c, #c0392b)' : '#f8f9fa',
                        color: filtroTipoCliente === 'cestas' ? 'white' : '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🎄 Cestas ({estadisticasCestas?.clientesCestasNavidad || 0})
                    </button>
                    <button
                      onClick={() => cambiarFiltroTipoCliente('normales')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: filtroTipoCliente === 'normales' ? 
                          'linear-gradient(135deg, #3498db, #2980b9)' : '#f8f9fa',
                        color: filtroTipoCliente === 'normales' ? 'white' : '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      👤 Normales ({estadisticasCestas?.clientesNormales || 0})
                    </button>
                  </div>

                  {/* Acciones rápidas */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => cargarEstadisticasCestas()}
                      style={{
                        background: 'linear-gradient(135deg, #27ae60, #229954)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔄 Actualizar Estadísticas
                    </button>
                    <button
                      onClick={limpiarTodasCestas}
                      style={{
                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🗑️ Limpiar Todas las Marcas
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tabla de clientes simplificada */}
            <div style={{
              overflowX: 'auto',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #e1e8ed'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '20px',
                      fontWeight: '700',
                      color: '#495057',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      👤 Cliente
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '20px',
                      fontWeight: '700',
                      color: '#495057',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '150px'
                    }}>
                      🎄 Cesta Navidad
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '20px',
                      fontWeight: '700',
                      color: '#495057',
                      fontSize: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '200px'
                    }}>
                      ⚙️ Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#7f8c8d',
                        fontSize: '16px',
                        fontStyle: 'italic'
                      }}>
                        {filtroBusqueda ? 
                          `🔍 No se encontraron clientes que coincidan con "${filtroBusqueda}"` :
                          '📋 No hay clientes registrados'
                        }
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((c, index) => (
                      <tr 
                        key={c._id || c.id} 
                        style={{
                          borderBottom: '1px solid #e9ecef',
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.transform = 'scale(1.01)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <td style={{ 
                          padding: '20px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          fontSize: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '16px',
                              fontWeight: '700'
                            }}>
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#2c3e50' }}>
                                {c.nombre}
                              </div>
                              {c.email && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                                  📧 {c.email}
                                </div>
                              )}
                              {c.telefono && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                                  📞 {c.telefono}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Columna de cesta de navidad */}
                        <td style={{ padding: '20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              fontSize: '24px',
                              marginBottom: '4px'
                            }}>
                              {c.esCestaNavidad ? '🎄' : '👤'}
                            </div>
                            <button
                              onClick={() => toggleCestaNavidad(c)}
                              style={{
                                background: c.esCestaNavidad ? 
                                  'linear-gradient(135deg, #e74c3c, #c0392b)' : 
                                  'linear-gradient(135deg, #95a5a6, #7f8c8d)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '15px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap'
                              }}
                              title={c.esCestaNavidad ? 
                                'Click para desmarcar como cesta de navidad' : 
                                'Click para marcar como cesta de navidad'}
                            >
                              {c.esCestaNavidad ? 'Cesta 🎄' : 'Normal 👤'}
                            </button>
                          </div>
                        </td>
                        
                        <td style={{ padding: '20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleVer(c)}
                              style={{
                                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
                              }}
                              title="Ver detalles completos y historial de pedidos"
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
                              }}
                            >
                              👁️ Ver
                            </button>
                            <button
                              onClick={() => handleEditar(c)}
                              style={{
                                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)'
                              }}
                              title="Editar información del cliente"
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 15px rgba(243, 156, 18, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(243, 156, 18, 0.3)';
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(c)}
                              style={{
                                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)'
                              }}
                              title="Eliminar cliente permanentemente"
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Formulario de creación/edición */}
        {(modo === 'crear' || modo === 'editar') && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e1e8ed'
          }}>
            <h3 style={{
              margin: '0 0 25px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: '#2c3e50'
            }}>
              {modo === 'crear' ? '➕ Crear Nuevo Cliente' : '✏️ Editar Cliente'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Nombre *
                </label>
                <input
                  placeholder="Nombre del cliente"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e1e8ed',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e8ed';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Email
                </label>
                <input
                  placeholder="Email del cliente"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e1e8ed',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e8ed';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Teléfono
                </label>
                <input
                  placeholder="Teléfono del cliente"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e1e8ed',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e8ed';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Dirección
                </label>
                <input
                  placeholder="Dirección completa del cliente"
                  value={form.direccion}
                  onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e1e8ed',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e8ed';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleGuardar}
                style={{
                  background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(46, 204, 113, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.3)';
                }}
              >
                {modo === 'crear' ? '✅ Crear Cliente' : '💾 Guardar Cambios'}
              </button>
              
              <button
                onClick={() => {
                  setModo('lista');
                  setForm({ nombre: '', email: '', telefono: '', direccion: '' });
                  setClienteEdit(null);
                  setFiltroBusqueda('');
                  setClientesFiltrados(clientes);
                  // Limpiar filtros de pedidos
                  setFiltroFecha('');
                  setFiltroProducto('');
                }}
                style={{
                  background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(149, 165, 166, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(149, 165, 166, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(149, 165, 166, 0.3)';
                }}
              >
                ❌ Cancelar
              </button>
            </div>
            
            {mensaje && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '10px',
                background: mensaje.includes('Error') ? '#f8d7da' : '#d4edda',
                color: mensaje.includes('Error') ? '#721c24' : '#155724',
                border: `1px solid ${mensaje.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`,
                fontWeight: '600'
              }}>
                {mensaje}
              </div>
            )}

            {/* Mostrar pedidos del cliente durante la edición */}
            {modo === 'editar' && (
              <div style={{ marginTop: '30px' }}>
                <h4 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '20px',
                  borderBottom: '2px solid #ecf0f1',
                  paddingBottom: '10px'
                }}>
                  📋 Historial de Pedidos del Cliente
                </h4>
                
                {/* Filtros para pedidos */}
                <div style={{
                  background: 'linear-gradient(135deg, #e8f4fd, #f8f9fa)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #e1e8ed'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>
                      🔍 Filtrar pedidos:
                    </span>
                    {(filtroFecha || filtroProducto) && (
                      <button
                        onClick={limpiarFiltros}
                        style={{
                          background: 'linear-gradient(135deg, #dc3545, #c82333)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        ❌ Limpiar filtros
                      </button>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: '15px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '600',
                        color: '#495057',
                        fontSize: '14px'
                      }}>
                        📅 Por fecha:
                      </label>
                      <input
                        type="date"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e8ed',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e1e8ed';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '600',
                        color: '#495057',
                        fontSize: '14px'
                      }}>
                        🛒 Por producto:
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por nombre de producto..."
                        value={filtroProducto}
                        onChange={(e) => setFiltroProducto(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e8ed',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e1e8ed';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Información de filtros activos */}
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#495057'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        📊 Mostrando <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidosCliente.length}</strong> pedidos
                      </span>
                      {(filtroFecha || filtroProducto) && (
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {filtroFecha && <span>📅 Fecha: {new Date(filtroFecha).toLocaleDateString()} </span>}
                          {filtroProducto && <span>🛒 Producto: "{filtroProducto}"</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {cargandoPedidos ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#7f8c8d',
                    fontSize: '16px'
                  }}>
                    🔄 Cargando historial de pedidos...
                  </div>
                ) : pedidosCliente.length > 0 ? (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    padding: '20px',
                    maxHeight: '400px',
                    overflowY: 'auto'                  }}>
                    {pedidosFiltrados.map((pedido, index) => (
                      <div
                        key={pedido._id || index}
                        style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '15px',
                          marginBottom: '10px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: '1px solid #e1e8ed'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ color: '#2c3e50', fontSize: '16px' }}>
                              Pedido #{pedido.numeroPedido || pedido._id}
                            </strong>
                            <span style={{
                              marginLeft: '15px',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: pedido.estado === 'entregado' ? '#d4edda' : 
                                         pedido.estado === 'enviado' ? '#fff3cd' : '#f8d7da',
                              color: pedido.estado === 'entregado' ? '#155724' : 
                                     pedido.estado === 'enviado' ? '#856404' : '#721c24'
                            }}>
                              {pedido.estado || 'Sin estado'}
                            </span>
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                            {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString() : 
                             pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleDateString() : 'Sin fecha'}
                          </div>
                        </div>
                        
                        {pedido.lineas && pedido.lineas.length > 0 && (
                          <div style={{ fontSize: '14px', color: '#495057' }}>
                            <strong>Productos:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                              {pedido.lineas.slice(0, 3).map((linea, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>
                                  {linea.cantidad} {linea.formato || 'und'} de {linea.producto}
                                  {linea.comentario && <span style={{ color: '#7f8c8d', fontStyle: 'italic' }}> - {linea.comentario}</span>}
                                </li>
                              ))}
                              {pedido.lineas.length > 3 && (
                                <li style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                                  ... y {pedido.lineas.length - 3} productos más
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {/* Botón para reutilizar pedido */}
                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                          <button
                            onClick={() => reutilizarPedido(pedido, clienteEdit)}
                            style={{
                              background: 'linear-gradient(135deg, #28a745, #20c997)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginLeft: 'auto'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 6px rgba(40, 167, 69, 0.3)';
                            }}
                          >
                            🔄 Reutilizar Pedido
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Mensaje cuando no hay pedidos filtrados */}
                    {pedidosCliente.length > 0 && pedidosFiltrados.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#7f8c8d',
                        fontSize: '16px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '2px dashed #e1e8ed'
                      }}>
                        🔍 No se encontraron pedidos que coincidan con los filtros aplicados
                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                          Prueba con otros criterios de búsqueda o limpia los filtros
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#7f8c8d',
                    fontSize: '16px',
                    background: '#f8f9fa',
                    borderRadius: '10px'
                  }}>
                    📋 Este cliente no tiene pedidos registrados
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vista detallada del cliente */}
        {modo === 'ver' && clienteEdit && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e1e8ed'
          }}>
            <h3 style={{
              margin: '0 0 25px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: '#2c3e50'
            }}>
              👁️ Detalles del Cliente
            </h3>
            
            {/* Información del cliente en cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px', fontWeight: '700' }}>📧 Información de Contacto</h4>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Nombre:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.nombre}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Email:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.email || 'No especificado'}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Teléfono:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.telefono || 'No especificado'}</span>
                </div>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Dirección:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.direccion || 'No especificada'}</span>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px', fontWeight: '700' }}>🏢 Información Fiscal</h4>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>CIF:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.cif || 'No especificado'}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Tipo de Cliente:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.tipoCliente || 'No especificado'}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Exento de IVA:</strong>
                  <span style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: clienteEdit.exentoIVA ? '#d4edda' : '#f8d7da',
                    color: clienteEdit.exentoIVA ? '#155724' : '#721c24'
                  }}>
                    {clienteEdit.exentoIVA ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Recargo de Equivalencia:</strong>
                  <span style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: clienteEdit.recargoEquiv ? '#d4edda' : '#f8d7da',
                    color: clienteEdit.recargoEquiv ? '#155724' : '#721c24'
                  }}>
                    {clienteEdit.recargoEquiv ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px', fontWeight: '700' }}>💰 Condiciones Comerciales</h4>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Forma de Pago:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.formaPago || 'No especificada'}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Descuento 1:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.descuento1 || 0}%</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Descuento 2:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.descuento2 || 0}%</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#2c3e50' }}>Descuento 3:</strong>
                  <span style={{ marginLeft: '10px', color: '#495057' }}>{clienteEdit.descuento3 || 0}%</span>
                </div>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Estado:</strong>
                  <span style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: clienteEdit.activo ? '#d4edda' : '#f8d7da',
                    color: clienteEdit.activo ? '#155724' : '#721c24'
                  }}>
                    {clienteEdit.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de pedidos en modo vista */}
            <div style={{ marginTop: '30px' }}>
              <h4 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '20px',
                borderBottom: '2px solid #ecf0f1',
                paddingBottom: '10px'
              }}>
                📋 Historial Completo de Pedidos
              </h4>
              
              {/* Filtros para pedidos en vista detallada */}
              <div style={{
                background: 'linear-gradient(135deg, #e8f4fd, #f8f9fa)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '2px solid #e1e8ed'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#2c3e50'
                  }}>
                    🔍 Filtrar pedidos:
                  </span>
                  {(filtroFecha || filtroProducto) && (
                    <button
                      onClick={limpiarFiltros}
                      style={{
                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ❌ Limpiar filtros
                    </button>
                  )}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '600',
                      color: '#495057',
                      fontSize: '14px'
                    }}>
                      📅 Por fecha:
                    </label>
                    <input
                      type="date"
                      value={filtroFecha}
                      onChange={(e) => setFiltroFecha(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e8ed',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e1e8ed';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '600',
                      color: '#495057',
                      fontSize: '14px'
                    }}>
                      🛒 Por producto:
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre de producto..."
                      value={filtroProducto}
                      onChange={(e) => setFiltroProducto(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e8ed',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e1e8ed';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
                
                {/* Información de filtros activos */}
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#495057'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      📊 Mostrando <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidosCliente.length}</strong> pedidos
                    </span>
                    {(filtroFecha || filtroProducto) && (
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {filtroFecha && <span>📅 Fecha: {new Date(filtroFecha).toLocaleDateString()} </span>}
                        {filtroProducto && <span>🛒 Producto: "{filtroProducto}"</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {cargandoPedidos ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#7f8c8d',
                  fontSize: '16px'
                }}>
                  🔄 Cargando historial de pedidos...
                </div>
              ) : pedidosCliente.length > 0 ? (
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '20px',
                  maxHeight: '500px',
                  overflowY: 'auto'                }}>
                  {pedidosFiltrados.map((pedido, index) => (
                    <div
                      key={pedido._id || index}
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e1e8ed'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div>
                          <strong style={{ color: '#2c3e50', fontSize: '18px' }}>
                            📦 Pedido #{pedido.numeroPedido || pedido._id}
                          </strong>
                          <span style={{
                            marginLeft: '15px',
                            padding: '6px 12px',
                            borderRadius: '15px',
                            fontSize: '14px',
                            fontWeight: '600',
                            background: pedido.estado === 'entregado' ? '#d4edda' : 
                                       pedido.estado === 'enviado' ? '#fff3cd' : '#f8d7da',
                            color: pedido.estado === 'entregado' ? '#155724' : 
                                   pedido.estado === 'enviado' ? '#856404' : '#721c24'
                          }}>
                            {pedido.estado || 'Sin estado'}
                          </span>
                        </div>
                        <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                          📅 {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString() : 
                              pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleDateString() : 'Sin fecha'}
                        </div>
                      </div>
                      
                      {pedido.lineas && pedido.lineas.length > 0 && (
                        <div style={{ fontSize: '14px', color: '#495057' }}>
                          <strong style={{ marginBottom: '10px', display: 'block' }}>🛒 Productos del pedido:</strong>
                          <div style={{
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '15px'
                          }}>
                            {pedido.lineas.map((linea, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                                padding: '8px',
                                background: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div>
                                  <strong style={{ color: '#2c3e50' }}>{linea.producto}</strong>
                                  {linea.comentario && (
                                    <div style={{ color: '#7f8c8d', fontStyle: 'italic', fontSize: '12px' }}>
                                      💬 {linea.comentario}
                                    </div>
                                  )}
                                </div>
                                <div style={{ color: '#495057', fontWeight: '600' }}>
                                  {linea.cantidad} {linea.formato || 'und'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pedido.usuarioTramitando && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d' }}>
                          👤 Tramitado por: {pedido.usuarioTramitando}
                        </div>
                      )}

                      {/* Botón para reutilizar pedido en vista detallada */}
                      <div style={{ marginTop: '15px', textAlign: 'right' }}>
                        <button
                          onClick={() => reutilizarPedido(pedido, clienteEdit)}
                          style={{
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 3px 10px rgba(40, 167, 69, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: 'auto'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 5px 15px rgba(40, 167, 69, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 3px 10px rgba(40, 167, 69, 0.3)';
                          }}
                        >
                          🔄 Crear Nuevo Pedido con estos Productos
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mensaje cuando no hay pedidos filtrados en vista detallada */}
                  {pedidosCliente.length > 0 && pedidosFiltrados.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#7f8c8d',
                      fontSize: '16px',
                      background: 'white',
                      borderRadius: '10px',
                      border: '2px dashed #e1e8ed'
                    }}>
                      🔍 No se encontraron pedidos que coincidan con los filtros aplicados
                      <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        Prueba con otros criterios de búsqueda o limpia los filtros
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#7f8c8d',
                  fontSize: '16px',
                  background: '#f8f9fa',
                  borderRadius: '10px'
                }}>
                  📋 Este cliente no tiene pedidos registrados
                </div>
              )}
            </div>

            {/* Botón para editar desde la vista */}
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setForm({
                    nombre: clienteEdit.nombre || '',
                    email: clienteEdit.email || '',
                    telefono: clienteEdit.telefono || '',
                    direccion: clienteEdit.direccion || ''
                  });
                  setModo('editar');
                }}
                style={{
                  background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(243, 156, 18, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(243, 156, 18, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(243, 156, 18, 0.3)';
                }}
              >
                ✏️ Editar Cliente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor de pedidos para reutilizar */}
      {mostrarEditorPedidos && (
        <PedidosClientesConReutilizacion 
          onPedidoCreado={cerrarEditorPedidos}
          datosReutilizacion={datosReutilizacion}
        />
      )}
    </div>
  );
}
