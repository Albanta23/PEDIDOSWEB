import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

import PedidosClientes from './PedidosClientes';

export default function PedidosBorrador() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarDialogoCliente, setMostrarDialogoCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [filtroTiendaOnline, setFiltroTiendaOnline] = useState(true); // Por defecto mostramos los de tienda online
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    nif: '',
    direccion: '',
    codigoPostal: '',
    poblacion: '',
    provincia: '',
    email: '',
    telefono: '',
    codigoCliente: ''
  });

  useEffect(() => {
    cargarPedidos();
    
    // Cargar lista de clientes para verificación
    axios.get(`${API_URL}/clientes`)
      .then(res => setClientes(res.data))
      .catch(err => console.error('Error al cargar clientes:', err));
  }, [filtroTiendaOnline]); // Recargar cuando cambie el filtro

  const cargarPedidos = () => {
    setCargando(true);
    // Si el filtro está activado, solo mostramos los pedidos de la tienda online (woocommerce)
    const url = filtroTiendaOnline 
      ? `${API_URL}/pedidos-clientes?estado=borrador_woocommerce&origen.tipo=woocommerce&fechaPedido[gte]=2025-07-21&estado[ne]=tramitado` 
      : `${API_URL}/pedidos-clientes?estado=borrador&fechaPedido[gte]=2025-07-21`;

    axios.get(url)
      .then(res => {
        // Filtrar pedidos por fecha en caso de que la API no lo haga correctamente
        const pedidosFiltrados = res.data.filter(pedido => new Date(pedido.fechaPedido) >= new Date('2025-07-21'));
        setPedidos(pedidosFiltrados);
      })
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  };

  const handlePedidoCreado = () => {
    setPedidoEditando(null);
    cargarPedidos();
  };
  
  // Nueva función para procesar un pedido de borrador a normal
  const handleProcesarPedido = (pedido) => {
    if (!window.confirm(`¿Está seguro de procesar el pedido #${pedido.numeroPedido} para enviar a expediciones? Este pedido aparecerá marcado como pedido de tienda online.`)) {
      return;
    }
    
    axios.post(`${API_URL}/pedidos-clientes/${pedido._id}/procesar-borrador`, {
      usuario: localStorage.getItem('usuario') || 'Sistema'
    })
      .then(res => {
        setMensajeExito(`Pedido #${pedido.numeroPedido} procesado correctamente. Ahora aparecerá en el listado de expediciones.`);
        cargarPedidos(); // Recargar la lista de pedidos
      })
      .catch(err => {
        console.error('Error al procesar pedido:', err);
        setMensajeError('Error al procesar el pedido: ' + (err.response?.data?.error || err.message));
      });
  };

  const handleEditarPedido = (pedido) => {
    // Primero verificar si el cliente existe
    setBuscandoCliente(true);
    setMensajeError('');
    setMensajeExito('');
    
    // Si el cliente ya está asociado, ir directamente a edición
    if (pedido.clienteId && pedido.clienteExistente) {
      // Buscar el cliente completo en la base de datos
      axios.get(`${API_URL}/clientes/${pedido.clienteId}`)
        .then(res => {
          setPedidoEditando({
            ...pedido,
            cliente: res.data
          });
          setBuscandoCliente(false);
        })
        .catch(() => {
          // Si no se encuentra, mostrar diálogo de verificación
          setMostrarDialogoCliente(true);
          setClienteSeleccionado(null);
          setBuscandoCliente(false);
          
          // Prepopular datos para posible creación de cliente
          setNuevoCliente({
            nombre: pedido.clienteNombre || '',
            nif: pedido.nif || '',
            direccion: pedido.direccion || '',
            codigoPostal: pedido.codigoPostal || '',
            poblacion: pedido.poblacion || '',
            provincia: pedido.provincia || '',
            email: pedido.email || '',
            telefono: pedido.telefono || ''
          });
        });
    } else {
      // Si no hay cliente asociado o es nuevo, mostrar diálogo
      setMostrarDialogoCliente(true);
      setPedidoEditando(pedido);
      setClienteSeleccionado(null);
      setBuscandoCliente(false);
      
      // Prepopular datos para posible creación de cliente
      setNuevoCliente({
        nombre: pedido.clienteNombre || '',
        nif: pedido.nif || '',
        direccion: pedido.direccion || '',
        codigoPostal: pedido.codigoPostal || '',
        poblacion: pedido.poblacion || '',
        provincia: pedido.provincia || '',
        email: pedido.email || '',
        telefono: pedido.telefono || ''
      });
      
      // Buscar coincidencias potenciales
      buscarClientesCoincidentes(pedido);
    }
  };
  
  const buscarClientesCoincidentes = (pedido) => {
    // Crear array de criterios de búsqueda
    const criterios = [];
    
    if (pedido.nif) {
      criterios.push({ nif: pedido.nif });
    }
    
    if (pedido.email) {
      criterios.push({ email: pedido.email });
    }
    
    if (pedido.telefono) {
      criterios.push({ telefono: pedido.telefono });
    }
    
    if (pedido.clienteNombre) {
      criterios.push({ nombre: { $regex: pedido.clienteNombre, $options: 'i' } });
    }
    
    if (criterios.length > 0) {
      axios.post(`${API_URL}/clientes/buscar-coincidencias`, { criterios })
        .then(res => {
          if (res.data && res.data.length > 0) {
            setClienteSeleccionado(res.data[0]); // Seleccionar el primer cliente coincidente
            setMensajeExito(`Se encontraron ${res.data.length} cliente(s) que podrían coincidir.`);
          } else {
            setMensajeError('No se encontraron clientes que coincidan. Puede crear uno nuevo.');
          }
        })
        .catch(err => {
          console.error('Error al buscar coincidencias:', err);
          setMensajeError('Error al buscar clientes. Intente nuevamente.');
        });
    }
  };

  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    
    // Actualizar el pedido con el cliente seleccionado
    axios.put(`${API_URL}/pedidos-clientes/${pedidoEditando._id}/asignar-cliente`, { 
      clienteId: cliente._id,
      verificadoManualmente: true
    })
    .then(() => {
      setMensajeExito('Cliente asignado correctamente al pedido.');
      setTimeout(() => {
        setMostrarDialogoCliente(false);
        setPedidoEditando({
          ...pedidoEditando,
          cliente
        });
      }, 1000);
    })
    .catch(err => {
      console.error('Error al asignar cliente:', err);
      setMensajeError('Error al asignar cliente al pedido.');
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente({
      ...nuevoCliente,
      [name]: value
    });
  };

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre) {
      setMensajeError('El nombre del cliente es obligatorio.');
      return;
    }
    
    try {
      // Crear nuevo cliente
      const respuestaCliente = await axios.post(`${API_URL}/clientes`, nuevoCliente);
      const clienteCreado = respuestaCliente.data;
      
      // Asignar el cliente al pedido
      await axios.put(`${API_URL}/pedidos-clientes/${pedidoEditando._id}/asignar-cliente`, { 
        clienteId: clienteCreado._id,
        verificadoManualmente: true
      });
      
      setMensajeExito('Cliente creado y asignado correctamente.');
      setTimeout(() => {
        setMostrarDialogoCliente(false);
        setPedidoEditando({
          ...pedidoEditando,
          cliente: clienteCreado
        });
      }, 1000);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setMensajeError('Error al crear cliente. Verifique los datos e intente nuevamente.');
    }
  };

  const handleContinuarSinCliente = () => {
    setMostrarDialogoCliente(false);
  };

  if (mostrarDialogoCliente) {
    return (
      <div className="dialogo-cliente">
        <h2>Verificación de Cliente</h2>
        
        {mensajeError && <div className="error-mensaje">{mensajeError}</div>}
        {mensajeExito && <div className="exito-mensaje">{mensajeExito}</div>}
        
        <div className="datos-cliente-woo">
          <h3>Datos del cliente recibidos de WooCommerce:</h3>
          <p><strong>Nombre:</strong> {pedidoEditando.clienteNombre}</p>
          <p><strong>NIF/CIF:</strong> {pedidoEditando.nif || 'No disponible'}</p>
          <p><strong>Email:</strong> {pedidoEditando.email || 'No disponible'}</p>
          <p><strong>Teléfono:</strong> {pedidoEditando.telefono || 'No disponible'}</p>
          <p><strong>Dirección:</strong> {pedidoEditando.direccion || 'No disponible'}</p>
          <p><strong>Código Postal:</strong> {pedidoEditando.codigoPostal || 'No disponible'}</p>
          <p><strong>Población:</strong> {pedidoEditando.poblacion || 'No disponible'}</p>
          <p><strong>Provincia:</strong> {pedidoEditando.provincia || 'No disponible'}</p>
        </div>
        
        {clienteSeleccionado && (
          <div className="cliente-coincidente">
            <h3>Cliente coincidente encontrado:</h3>
            <p><strong>Nombre:</strong> {clienteSeleccionado.nombre}</p>
            <p><strong>NIF/CIF:</strong> {clienteSeleccionado.nif || 'No disponible'}</p>
            <p><strong>Código:</strong> {clienteSeleccionado.codigoCliente || 'No disponible'}</p>
            <button onClick={() => handleSeleccionarCliente(clienteSeleccionado)}>
              Usar este cliente
            </button>
          </div>
        )}
        
        <div className="crear-cliente">
          <h3>Crear nuevo cliente</h3>
          <div className="formulario-cliente">
            <div className="campo">
              <label>Nombre*:</label>
              <input 
                type="text" 
                name="nombre" 
                value={nuevoCliente.nombre} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="campo">
              <label>NIF/CIF:</label>
              <input 
                type="text" 
                name="nif" 
                value={nuevoCliente.nif} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Dirección:</label>
              <input 
                type="text" 
                name="direccion" 
                value={nuevoCliente.direccion} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Código Postal:</label>
              <input 
                type="text" 
                name="codigoPostal" 
                value={nuevoCliente.codigoPostal} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Población:</label>
              <input 
                type="text" 
                name="poblacion" 
                value={nuevoCliente.poblacion} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Provincia:</label>
              <input 
                type="text" 
                name="provincia" 
                value={nuevoCliente.provincia} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={nuevoCliente.email} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Teléfono:</label>
              <input 
                type="text" 
                name="telefono" 
                value={nuevoCliente.telefono} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="campo">
              <label>Código Cliente (SAGE50):</label>
              <input 
                type="text" 
                name="codigoCliente" 
                value={nuevoCliente.codigoCliente} 
                onChange={handleInputChange} 
                placeholder="Se generará automáticamente si no se especifica"
              />
            </div>
          </div>
          
          <div className="acciones">
            <button className="boton-primario" onClick={handleCrearCliente}>
              Crear Cliente
            </button>
            <button className="boton-secundario" onClick={handleContinuarSinCliente}>
              Continuar sin verificar cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pedidoEditando) {
    return <PedidosClientes 
      onPedidoCreado={handlePedidoCreado} 
      pedidoInicial={pedidoEditando} 
      clienteInicial={pedidoEditando.cliente} 
      lineasIniciales={pedidoEditando.lineas} 
    />;
  }

  return (
    <div className="pedidos-borrador">
      <h2>Pedidos de WooCommerce en Borrador</h2>
      <div className="acciones-borrador">
        <button 
          onClick={() => {
            axios.get(`${API_URL}/pedidos-woo/sincronizar`)
              .then(() => {
                setMensajeExito('Sincronización completada.');
                cargarPedidos();
              })
              .catch(err => {
                console.error('Error al sincronizar:', err);
                setMensajeError('Error al sincronizar pedidos.');
              });
          }}
        >
          Sincronizar Pedidos WooCommerce
        </button>
        
        <div className="filtro-container">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={filtroTiendaOnline} 
              onChange={() => setFiltroTiendaOnline(!filtroTiendaOnline)} 
            />
            <span className="slider round"></span>
          </label>
          <span className="filtro-label">
            {filtroTiendaOnline ? 'Mostrando solo pedidos de tienda online' : 'Mostrando todos los borradores'}
          </span>
        </div>
      </div>
      
      {mensajeError && <div className="error-mensaje">{mensajeError}</div>}
      {mensajeExito && <div className="exito-mensaje">{mensajeExito}</div>}
      
      {cargando ? <p>Cargando...</p> : (
        pedidos.length === 0 ? (
          <p>No hay pedidos en borrador disponibles.</p>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Nº WooCommerce</th>
                <th>Cliente</th>
                <th>NIF/CIF</th>
                <th>Estado Cliente</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p._id} className={p.clienteExistente ? 'cliente-existente' : 'cliente-nuevo'}>
                  <td>{p.numeroPedido}</td>
                  <td>{p.numeroPedidoWoo}</td>
                  <td>{p.clienteNombre}</td>
                  <td>{p.nif || 'No disponible'}</td>
                  <td>
                    {p.clienteExistente ? (
                      <span className="estado-cliente existente">Cliente existente</span>
                    ) : p.clienteCreado ? (
                      <span className="estado-cliente creado">Cliente nuevo</span>
                    ) : (
                      <span className="estado-cliente pendiente">Sin verificar</span>
                    )}
                  </td>
                  <td>{new Date(p.fechaPedido).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="boton-editar" 
                      onClick={() => handleEditarPedido(p)}
                      disabled={buscandoCliente}
                    >
                      {buscandoCliente ? 'Verificando...' : 'Editar'}
                    </button>
                    {' '}
                    <button 
                      className="boton-procesar" 
                      onClick={() => handleProcesarPedido(p)}
                      disabled={buscandoCliente}
                    >
                      Procesar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
      
      <style>{`
        .pedidos-borrador {
          padding: 20px;
        }
        .acciones-borrador {
          margin-bottom: 20px;
        }
        .tabla-pedidos {
          width: 100%;
          border-collapse: collapse;
        }
        .tabla-pedidos th, .tabla-pedidos td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .tabla-pedidos th {
          background-color: #f2f2f2;
        }
        .cliente-existente {
          background-color: #e8f5e9;
        }
        .cliente-nuevo {
          background-color: #fff8e1;
        }
        .estado-cliente {
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .estado-cliente.existente {
          background-color: #4caf50;
          color: white;
        }
        .estado-cliente.creado {
          background-color: #ff9800;
          color: white;
        }
        .estado-cliente.pendiente {
          background-color: #f44336;
          color: white;
        }
        .boton-editar {
          background-color: #2196f3;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        }
        .boton-procesar {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .error-mensaje {
          background-color: #ffebee;
          color: #d32f2f;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .exito-mensaje {
          background-color: #e8f5e9;
          color: #2e7d32;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .dialogo-cliente {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .datos-cliente-woo {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .cliente-coincidente {
          background-color: #e3f2fd;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .formulario-cliente {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 15px;
          margin-bottom: 20px;
        }
        .campo {
          display: flex;
          flex-direction: column;
        }
        .campo label {
          margin-bottom: 5px;
          font-weight: bold;
        }
        .campo input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .acciones {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .boton-primario {
          background-color: #1976d2;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        .boton-secundario {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        /* Estilos para el switch del filtro */
        .filtro-container {
          display: flex;
          align-items: center;
          margin-top: 15px;
        }
        .filtro-label {
          margin-left: 10px;
          font-size: 14px;
        }
        /* The switch - the box around the slider */
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        /* Hide default HTML checkbox */
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        /* The slider */
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #ff9800;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #ff9800;
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(26px);
          -ms-transform: translateX(26px);
          transform: translateX(26px);
        }
        /* Rounded sliders */
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
