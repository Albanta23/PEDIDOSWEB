import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProductos } from '../components/ProductosContext';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { formatearDireccionCompleta } from './utils/formatDireccion';
import { FaUndo, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function PedidosClientes({ onPedidoCreado, clienteInicial, lineasIniciales, pedidoId }) {
  const [clientes, setClientes] = useState([]);
  const [pedidoInicial, setPedidoInicial] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clienteInicial || null);
  const [busquedaCliente, setBusquedaCliente] = useState(clienteInicial?.nombre || '');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [codigoSage, setCodigoSage] = useState(clienteInicial?.codigoCliente || '');
  const [nifCliente, setNifCliente] = useState(clienteInicial?.nif || '');
  const [lineas, setLineas] = useState(
    lineasIniciales && lineasIniciales.length > 0 ? 
    lineasIniciales.map(linea => ({
      producto: linea.producto || '',
      cantidad: linea.cantidad || 1,
      formato: linea.formato || FORMATOS_PEDIDO[0],
      comentario: linea.comentario || '',
      esComentario: linea.esComentario || false,
      precioUnitario: linea.precioUnitario || 0,
      iva: linea.iva || 0,
      descuento: linea.descuento || 0,
      subtotal: linea.subtotal || 0
    })) :
    [{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', precioUnitario: 0, iva: 0, descuento: 0, subtotal: 0 }]
  );
  const [mensaje, setMensaje] = useState('');
  const { productos, cargando } = useProductos();
  const [productoValido, setProductoValido] = useState([]);
  const [mensajeError, setMensajeError] = useState([]);
  const [testBackendMsg, setTestBackendMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/clientes`)
      .then(res => setClientes(res.data))
      .catch(()=>setClientes([]));
  }, []);

  // Efecto para cargar el pedido a editar
  useEffect(() => {
    if (pedidoId) {
      axios.get(`${API_URL}/pedidos-clientes/${pedidoId}`)
        .then(res => {
          const pedido = res.data;
          setPedidoInicial(pedido); // Guardar el pedido original
          // Buscar el cliente correspondiente
          const cliente = clientes.find(c => c._id === pedido.clienteId || c.id === pedido.clienteId);
          if (cliente) {
            setClienteSeleccionado(cliente);
            setBusquedaCliente(cliente.nombre);
            setCodigoSage(cliente.codigoCliente || '');
            setNifCliente(cliente.nif || '');
          }
          // Cargar las líneas del pedido
          if (pedido.lineas && pedido.lineas.length > 0) {
            setLineas(pedido.lineas.map(linea => ({
              producto: linea.producto || '',
              cantidad: linea.cantidad || 1,
              formato: linea.formato || FORMATOS_PEDIDO[0],
              comentario: linea.comentario || '',
              esComentario: linea.esComentario || false,
              precioUnitario: linea.precioUnitario || 0,
              iva: linea.iva || 0,
              descuento: linea.descuento || 0,
              subtotal: linea.subtotal || 0
            })));
          }
        })
        .catch(error => {
          console.error('Error al cargar el pedido para editar:', error);
          setMensaje('❌ Error al cargar el pedido para editar');
        });
    }
  }, [pedidoId, clientes]);

  // Efecto para manejar props de reutilización
  useEffect(() => {
    if (clienteInicial) {
      setClienteSeleccionado(clienteInicial);
      setBusquedaCliente(clienteInicial.nombre || '');
      setCodigoSage(clienteInicial.codigoCliente || '');
      setNifCliente(clienteInicial.nif || '');
    }
    if (lineasIniciales && lineasIniciales.length > 0) {
      const lineasFormateadas = lineasIniciales.map(linea => ({
        producto: linea.producto || '',
        cantidad: linea.cantidad || 1,
        formato: linea.formato || FORMATOS_PEDIDO[0],
        comentario: linea.comentario || '',
        esComentario: linea.esComentario || false
      }));
      setLineas(lineasFormateadas);
    }
  }, [clienteInicial, lineasIniciales]);

  useEffect(() => {
    setProductoValido(lineas.map(l => !!l.producto));
    setMensajeError(lineas.map(() => ''));
  }, [lineas, productos]);

  const handleLineaChange = (idx, campo, valor) => {
    const lineasActualizadas = lineas.map((l, i) => {
      if (i === idx) {
        const lineaActualizada = { ...l, [campo]: valor };

        // Si cambia el precio o la cantidad, recalcular el subtotal
        if (campo === 'precioUnitario' || campo === 'cantidad') {
          const precio = campo === 'precioUnitario' ? valor : lineaActualizada.precioUnitario;
          const cantidad = campo === 'cantidad' ? valor : lineaActualizada.cantidad;
          lineaActualizada.subtotal = precio * cantidad;
        }

        return lineaActualizada;
      }
      return l;
    });

    setLineas(lineasActualizadas);
  };
  const handleAgregarLinea = () => {
    setLineas([...lineas, { 
      producto: '', 
      cantidad: 1, 
      formato: FORMATOS_PEDIDO[0], 
      comentario: '',
      precioUnitario: 0,
      iva: 0,
      descuento: 0,
      subtotal: 0
    }]);
  };
  const handleAgregarComentario = () => {
    setLineas([...lineas, { 
      esComentario: true, 
      comentario: '',
      producto: '', 
      cantidad: 1, 
      formato: FORMATOS_PEDIDO[0],
      precioUnitario: 0,
      iva: 0,
      descuento: 0,
      subtotal: 0
    }]);
  };
  const handleEliminarLinea = (idx) => {
    setLineas(lineas.filter((_, i) => i !== idx));
  };
  // Validar líneas: al menos una línea de producto válida (ignorar comentarios)
  const lineasValidas = lineas.filter(l => !l.esComentario && l.producto && l.cantidad > 0);
  const puedeCrear = clienteSeleccionado && lineasValidas.length > 0;

  const handleCrearPedido = async (pedidoId) => {
    if (!puedeCrear) {
      setMensaje('Selecciona un cliente y añade al menos una línea de producto válida.');
      return;
    }

    const pedidoData = {
      clienteId: clienteSeleccionado._id || clienteSeleccionado.id || clienteSeleccionado.codigo,
      clienteNombre: clienteSeleccionado.nombre,
      direccion: clienteSeleccionado.direccion || '',
      codigoPostal: clienteSeleccionado.codigoPostal || '',
      poblacion: clienteSeleccionado.poblacion || '',
      provincia: clienteSeleccionado.provincia || '',
      lineas: lineas.filter(l => l.esComentario || (l.producto && l.cantidad > 0)).map(linea => ({
        producto: linea.producto || '',
        cantidad: linea.cantidad || 1,
        formato: linea.formato || FORMATOS_PEDIDO[0],
        comentario: linea.comentario || '',
        esComentario: linea.esComentario || false,
        precioUnitario: linea.precioUnitario || 0,
        iva: linea.iva || 0,
        descuento: linea.descuento || 0,
        subtotal: linea.subtotal || 0
      })),
      tipo: 'cliente',
      fechaPedido: new Date().toISOString(),
      estado: 'enviado',
      codigoSage: codigoSage || '',
      nifCliente: nifCliente || '',
      // Datos específicos para WooCommerce
      datosFacturacion: {
        nif: nifCliente || '',
        nombre: clienteSeleccionado.nombre || '',
        direccion: clienteSeleccionado.direccion || '',
        codigoPostal: clienteSeleccionado.codigoPostal || '',
        poblacion: clienteSeleccionado.poblacion || '',
        provincia: clienteSeleccionado.provincia || '',
        pais: clienteSeleccionado.pais || 'España'
      },
      // Si proviene de WooCommerce, mantener los datos originales
      origen: {
        tipo: pedidoId && pedidoId.startsWith('wc_') ? 'woocommerce' : 'manual',
        idOriginal: pedidoId && pedidoId.startsWith('wc_') ? pedidoId : null
      },
      esTiendaOnline: pedidoInicial?.esTiendaOnline || (pedidoId && pedidoId.startsWith('wc_')) || false,
      esBorrador: false, // Al guardar desde aquí, ya no es borrador
      totales: {
        subtotal: lineas.reduce((sum, linea) => !linea.esComentario ? sum + (linea.subtotal || (linea.precioUnitario * linea.cantidad)) : sum, 0),
        iva: lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.iva || 0) / 100) : sum, 0),
        descuento: lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.descuento || 0) / 100) : sum, 0),
        envio: 0, // Valor predeterminado, se puede actualizar
        total: 0 // Se calculará después
      }
    };

    // Calcular el total final
    pedidoData.totales.total = pedidoData.totales.subtotal + pedidoData.totales.iva - pedidoData.totales.descuento + pedidoData.totales.envio;

    try {
      let response;

      if (pedidoId) {
        // Actualizar pedido existente
        response = await axios.put(`${API_URL}/pedidos-clientes/${pedidoId}`, pedidoData);
        setMensaje('✅ Pedido actualizado correctamente.');
      } else {
        // Crear nuevo pedido
        response = await axios.post(`${API_URL}/pedidos-clientes`, pedidoData);
        setMensaje('✅ Pedido creado correctamente.');

        // Limpiar formulario solo para nuevos pedidos
        setLineas([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
        setClienteSeleccionado(null);
        setBusquedaCliente('');
        setMostrarSugerencias(false);
      }

      setTimeout(()=> {
        setMensaje('');
        if (onPedidoCreado) onPedidoCreado(response.data);
      }, 1200);
    } catch (e) {
      console.error('Error al gestionar pedido:', e.response?.data || e.message);
      setMensaje(`❌ Error al ${pedidoId ? 'actualizar' : 'crear'} pedido: ${e.response?.data?.mensaje || e.message}`);
    }
  };

  // Autocompletar producto por referencia
  const handleProductoBlur = (idx, valor) => {
    const valNorm = valor.trim().toLowerCase();
    const prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === valNorm);
    if (prod) {
      handleLineaChange(idx, 'producto', prod.nombre);
    }
  };

  const handleClienteChange = (e) => {
    const nombre = e.target.value;
    const cliente = clientes.find(c => c.nombre === nombre);
    setClienteSeleccionado(cliente || null);
  };

  // Nuevas funciones para manejo de sugerencias
  const handleBusquedaClienteChange = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    setMostrarSugerencias(valor.length > 0);

    // Si el texto coincide exactamente con un cliente, seleccionarlo
    const clienteExacto = clientes.find(c => c.nombre.toLowerCase() === valor.toLowerCase());
    if (clienteExacto) {
      setClienteSeleccionado(clienteExacto);
    } else {
      setClienteSeleccionado(null);
    }
  };

  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre);
    setCodigoSage(cliente.codigoCliente || '');
    setNifCliente(cliente.nif || '');
    setMostrarSugerencias(false);
  };

  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 8); // Máximo 8 sugerencias

  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes`)
      .then(res => setPedidos(res.data))
      .catch(()=>setPedidos([]));
  }, []);

  const [sincronizando, setSincronizando] = useState(false);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      await axios.get(`${API_URL}/pedidos-woo/sincronizar`);
      // Volver a cargar los pedidos después de sincronizar
      axios.get(`${API_URL}/pedidos-clientes`)
        .then(res => setPedidos(res.data))
        .catch(()=>setPedidos([]));
    } catch (error) {
      console.error('Error al sincronizar los pedidos de WooCommerce', error);
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px 20px 120px 20px', /* Añadimos espacio abajo para el área fija */
      overflowY: 'auto',
      zIndex: 900
    }}>
      {/* Header profesional con iconos */}
      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#fff',
        padding: '20px 32px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: '20px',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '48px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '70px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>🛒</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
            {pedidoId ? 'Editar Pedido Existente' : 'Crear Nuevo Pedido'}
            {(pedidoInicial?.esTiendaOnline || (pedidoInicial?.origen?.tipo === 'woocommerce')) && 
              <span style={{ 
                marginLeft: '10px', 
                background: '#ff9800', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '18px',
                verticalAlign: 'middle'
              }}>
                TIENDA ONLINE
              </span>
            }
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '18px' }}>
            {pedidoId ? `Modificando el pedido #${pedidoId}` : 'Gestión profesional de pedidos con vista expandida'}
          </p>
        </div>
        <button
          onClick={handleSincronizar}
          disabled={sincronizando}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {sincronizando ? 'Sincronizando...' : 'Sincronizar con WooCommerce'}
        </button>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          🖥️ Vista Completa
        </div>
        {onPedidoCreado && (
          <button 
            onClick={() => onPedidoCreado && onPedidoCreado()} 
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕ Cerrar Editor
          </button>
        )}
      </div>

      {/* Panel principal del editor */}
      <div style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e1e8ed',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Selección de cliente mejorada */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '20px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '24px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>👤</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>
              Seleccionar Cliente
            </h3>
            <input
              type="text"
              value={busquedaCliente}
              onChange={handleBusquedaClienteChange}
              onFocus={() => setMostrarSugerencias(busquedaCliente.length > 0)}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
              placeholder="🔍 Escribe el nombre del cliente..."
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                fontSize: '15px',
                background: 'rgba(255,255,255,0.95)',
                color: '#2c3e50',
                fontWeight: '600',
                width: '100%',
                maxWidth: '400px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocusCapture={e => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = 'rgba(255,255,255,0.8)';
              }}
              onBlurCapture={e => {
                e.target.style.background = 'rgba(255,255,255,0.95)';
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            />
            
            {/* Panel de sugerencias */}
            {mostrarSugerencias && clientesFiltrados.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                maxWidth: '400px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                borderTop: '2px solid #e1e8ed',
                borderLeft: '2px solid #e1e8ed',
                borderRight: '2px solid #e1e8ed',
                maxHeight: '250px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '4px'
              }}>
                {clientesFiltrados.map((cliente, index) => (
                  <div
                    key={cliente._id || cliente.id || cliente.codigo}
                    onClick={() => handleSeleccionarCliente(cliente)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: index < clientesFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#2c3e50'
                    }}
                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    <div style={{
                      fontSize: '14px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {cliente.nombre}
                      </div>
                      {cliente.direccion && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                          📍 {cliente.direccion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mensaje cuando no hay sugerencias */}
            {mostrarSugerencias && busquedaCliente && clientesFiltrados.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                maxWidth: '400px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '2px solid #e1e8ed',
                zIndex: 1000,
                marginTop: '4px',
                padding: '16px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🔍</div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>No se encontraron clientes</div>
                <div style={{ fontSize: '12px', marginTop: '3px' }}>
                  Intenta con otro término de búsqueda
                </div>
              </div>
            )}
          </div>
          {clienteSeleccionado && (
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid #10b981',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>✓</div>
                <div>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '16px', 
                    color: '#1e293b' 
                  }}>
                    {clienteSeleccionado.nombre}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#10b981', 
                    fontWeight: '600' 
                  }}>
                    Cliente seleccionado
                  </div>
                </div>
              </div>
              {formatearDireccionCompleta(clienteSeleccionado) !== '-' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <span style={{ fontSize: '14px', marginTop: '1px' }}>📍</span>
                  <span style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.4'
                  }}>
                    {formatearDireccionCompleta(clienteSeleccionado)}
                  </span>
                </div>
              )}
              
              {/* Información de código SAGE y NIF/CIF */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    CÓDIGO SAGE50:
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    fontWeight: '700',
                    background: codigoSage ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 113, 133, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {codigoSage || 'No asignado'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    NIF/CIF:
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    fontWeight: '700',
                    background: nifCliente ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 113, 133, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {nifCliente || 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de líneas de pedido */}
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #e2e8f0',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '20px',
              color: '#4facfe',
              fontWeight: '600'
            }}>📝</div>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
              Líneas del Pedido
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {lineas.filter(l => !l.esComentario && l.producto && l.cantidad > 0).length} línea{lineas.filter(l => !l.esComentario && l.producto && l.cantidad > 0).length !== 1 ? 's' : ''} válida{lineas.filter(l => !l.esComentario && l.producto && l.cantidad > 0).length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Headers de la tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 100px 120px 120px 80px 120px 60px',
            gap: '16px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '700',
            color: '#334155',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div>📦 Producto</div>
            <div>🔢 Cantidad</div>
            <div>📏 Formato</div>
            <div>� Precio</div>
            <div>�💬 Comentario</div>
            <div>💲 Subtotal</div>
            <div>🗑️</div>
          </div>

          {/* Líneas del pedido */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '60vh',
            paddingRight: '8px'
          }}>
            {lineas.map((linea, idx) => (
              linea.esComentario ? (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)', 
                  border: '2px solid #ffc107',
                  borderRadius: '12px', 
                  padding: '16px 20px',
                  boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
                }}>
                  <div style={{
                    fontSize: '24px',
                    background: 'rgba(255, 193, 7, 0.2)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>📝</div>
                  <input
                    type="text"
                    value={linea.comentario || ''}
                    onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                    placeholder="Escribe tu comentario aquí..."
                    style={{ 
                      flexGrow: 1, 
                      border: '2px solid rgba(255, 193, 7, 0.3)', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      background: 'rgba(255, 255, 255, 0.8)', 
                      fontStyle: 'italic', 
                      fontSize: '15px', 
                      color: '#856404',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#ffc107'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 193, 7, 0.3)'}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleEliminarLinea(idx)} 
                    style={{ 
                      color: '#dc3545', 
                      background: 'rgba(220, 53, 69, 0.1)', 
                      border: '2px solid rgba(220, 53, 69, 0.2)',
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px',
                      fontWeight: 'bold', 
                      fontSize: '18px', 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(220, 53, 69, 0.2)';
                      e.target.style.borderColor = '#dc3545';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(220, 53, 69, 0.1)';
                      e.target.style.borderColor = 'rgba(220, 53, 69, 0.2)';
                    }}
                  >×</button>
                </div>
              ) : (
                <div key={idx} style={{ 
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 120px 120px 80px 120px 60px',
                  gap: '16px',
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      list="productos-lista-global"
                      value={linea.producto}
                      onChange={e => handleLineaChange(idx, 'producto', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                          handleProductoBlur(idx, e.target.value);
                        }
                      }}
                      placeholder="🔍 Buscar producto..."
                      style={{ 
                        padding: '14px 18px', 
                        width: '100%', 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '10px', 
                        background: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#4facfe';
                        e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                        handleProductoBlur(idx, e.target.value);
                      }}
                    />
                    <datalist id="productos-lista-global">
                      {productos.map(prod => (
                        <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                          {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={linea.cantidad}
                    onChange={e => handleLineaChange(idx, 'cantidad', Number(e.target.value))}
                    style={{ 
                      padding: '14px 18px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4facfe';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  <select
                    value={linea.formato}
                    onChange={e => handleLineaChange(idx, 'formato', e.target.value)}
                    style={{ 
                      padding: '14px 18px',
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4facfe';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {FORMATOS_PEDIDO.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  
                  {/* Campo de precio unitario */}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio..."
                    value={linea.precioUnitario}
                    onChange={e => handleLineaChange(idx, 'precioUnitario', Number(e.target.value))}
                    style={{ 
                      padding: '14px 18px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4facfe';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  {/* Campo de IVA */}
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="IVA %"
                    value={linea.iva}
                    onChange={e => handleLineaChange(idx, 'iva', Number(e.target.value))}
                    style={{ 
                      padding: '14px 18px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4facfe';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  <input
                    type="text"
                    placeholder="Observaciones..."
                    value={linea.comentario}
                    onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                    style={{ 
                      padding: '14px 18px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4facfe';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  
                  {/* Campo de subtotal (calculado) */}
                  <div style={{
                    padding: '14px 18px',
                    background: '#f1f5f9',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: '#334155',
                    border: '2px solid #e2e8f0',
                    textAlign: 'right'
                  }}>
                    {(linea.subtotal || linea.precioUnitario * linea.cantidad).toFixed(2)} €
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleEliminarLinea(idx)} 
                    disabled={lineas.filter(l => !l.esComentario).length <= 1}
                    style={{ 
                      color: lineas.filter(l => !l.esComentario).length <= 1 ? '#94a3b8' : '#dc3545', 
                      background: lineas.filter(l => !l.esComentario).length <= 1 ? 'rgba(148, 163, 184, 0.1)' : 'rgba(220, 53, 69, 0.1)', 
                      border: lineas.filter(l => !l.esComentario).length <= 1 ? '2px solid rgba(148, 163, 184, 0.2)' : '2px solid rgba(220, 53, 69, 0.2)',
                      borderRadius: '10px',
                      width: '50px',
                      height: '50px',
                      fontWeight: 'bold', 
                      fontSize: '20px', 
                      cursor: lineas.filter(l => !l.esComentario).length <= 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: lineas.filter(l => !l.esComentario).length <= 1 ? 0.5 : 1
                    }}
                    onMouseEnter={e => {
                      if (lineas.filter(l => !l.esComentario).length > 1) {
                        e.target.style.background = 'rgba(220, 53, 69, 0.2)';
                        e.target.style.borderColor = '#dc3545';
                        e.target.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (lineas.filter(l => !l.esComentario).length > 1) {
                        e.target.style.background = 'rgba(220, 53, 69, 0.1)';
                        e.target.style.borderColor = 'rgba(220, 53, 69, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                    title={lineas.filter(l => !l.esComentario).length <= 1 ? 'Debe haber al menos una línea de producto' : 'Eliminar línea'}
                  >×</button>
                  
                  {mensajeError[idx] && (
                    <div style={{
                      gridColumn: '1 / -1',
                      color: '#dc3545',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: 'rgba(220, 53, 69, 0.1)',
                      borderRadius: '6px'
                    }}>
                      ⚠️ {mensajeError[idx]}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Botones de acción */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            justifyContent: 'center',
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(79, 172, 254, 0.05)',
            borderRadius: '16px',
            position: 'relative',
            zIndex: 1600,
            marginBottom: '160px', /* Espacio adicional para evitar que el panel fijo oculte los botones */
            bottom: '20px'
          }}>
            <button 
              type="button" 
              onClick={handleAgregarLinea} 
              style={{ 
                padding: '16px 32px', 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 6px 16px rgba(79, 172, 254, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 24px rgba(79, 172, 254, 0.5)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(79, 172, 254, 0.4)';
              }}
            >
              ➕ Añadir línea
            </button>
            
            <button 
              type="button" 
              onClick={handleAgregarComentario} 
              style={{ 
                padding: '16px 32px', 
                background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 24px rgba(255, 193, 7, 0.5)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(255, 193, 7, 0.4)';
              }}
            >
              📝 Añadir comentario
            </button>
          </div>
        </div>

        {/* Botón principal de confirmación - Panel fijo */}
        <div style={{
          background: puedeCrear ? 'linear-gradient(135deg, #ebf4ff 0%, #ffffff 100%)' : '#f8f9fa',
          padding: '15px 20px',
          borderRadius: '20px 20px 0 0',
          textAlign: 'center',
          border: puedeCrear ? '3px solid rgba(37, 99, 235, 0.4)' : '3px solid #dee2e6',
          borderBottom: 'none',
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          width: '100%',
          marginTop: '0',
          zIndex: 1500,
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.15)',
          maxHeight: mostrarResumen ? '400px' : '110px', /* Más alto incluso cuando está colapsado */
          overflow: mostrarResumen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Botón para mostrar/ocultar resumen */}
          <button 
            onClick={() => setMostrarResumen(!mostrarResumen)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '80px',
              background: '#e9f5ff',
              border: '2px solid #2563EB',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#2563EB',
              padding: '4px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.target.style.background = '#2563EB';
              e.target.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.target.style.background = '#e9f5ff';
              e.target.style.color = '#2563EB';
            }}
          >
            {mostrarResumen ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
          </button>
          
          {/* Resumen de totales */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginBottom: mostrarResumen ? '20px' : '5px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            padding: mostrarResumen ? '20px' : '10px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              width: '100%', 
              textAlign: 'left', 
              margin: '0 0 16px 0',
              color: '#334155',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '8px',
              fontSize: '18px',
              fontWeight: '700',
              display: mostrarResumen ? 'block' : 'none'
            }}>
              Resumen de Pedido
            </h3>
            
            {mostrarResumen && (
              <>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '15px' }}>Subtotal:</span>
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '15px' }}>
                    {lineas.reduce((sum, linea) => 
                      !linea.esComentario ? sum + (linea.subtotal || (linea.precioUnitario * linea.cantidad)) : sum, 0
                    ).toFixed(2)} €
                  </span>
                </div>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '15px' }}>IVA:</span>
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '15px' }}>
                    {lineas.reduce((sum, linea) => 
                      !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.iva || 0) / 100) : sum, 0
                    ).toFixed(2)} €
                  </span>
                </div>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#64748b', fontSize: '15px' }}>Descuento:</span>
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '15px' }}>
                    {lineas.reduce((sum, linea) => 
                      !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.descuento || 0) / 100) : sum, 0
                    ).toFixed(2)} €
                  </span>
                </div>
                
                <div style={{ width: '100%', height: '1px', background: '#cbd5e1', margin: '0 0 16px 0' }}></div>
              </>
            )}
            
            {!mostrarResumen ? (
              <div style={{ 
                width: '100%',
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                marginTop: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '15px',
                  maxWidth: '800px',
                  width: '100%'
                }}>
                  <span style={{ 
                    color: '#1e3a8a', 
                    fontSize: '20px', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#dbeafe',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    minWidth: '240px',
                    justifyContent: 'center'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#2563EB"/>
                    </svg>
                    TOTAL DEL PEDIDO
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    fontSize: '24px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    padding: '10px 25px',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.5)',
                    minWidth: '140px',
                    textAlign: 'center'
                  }}>
                    {(
                      lineas.reduce((sum, linea) => !linea.esComentario ? sum + (linea.subtotal || (linea.precioUnitario * linea.cantidad)) : sum, 0) +
                      lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.iva || 0) / 100) : sum, 0) -
                      lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.descuento || 0) / 100) : sum, 0)
                    ).toFixed(2)} €
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>
                  TOTAL:
                </span>
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '17px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  color: '#fff'
                }}>
                  {(
                    lineas.reduce((sum, linea) => !linea.esComentario ? sum + (linea.subtotal || (linea.precioUnitario * linea.cantidad)) : sum, 0) +
                    lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.iva || 0) / 100) : sum, 0) -
                    lineas.reduce((sum, linea) => !linea.esComentario ? sum + ((linea.subtotal || (linea.precioUnitario * linea.cantidad)) * (linea.descuento || 0) / 100) : sum, 0)
                  ).toFixed(2)} €
                </span>
              </div>
            )}
          </div>
        
          <button 
            onClick={() => handleCrearPedido(pedidoId)} 
            disabled={!puedeCrear}
            style={{ 
              padding: '16px 30px', 
              width: '100%',
              maxWidth: '600px',
              background: puedeCrear ? 'linear-gradient(135deg, #059669 0%, #34d399 100%)' : '#94a3b8',
              color: '#fff', 
              border: 'none', 
              borderRadius: '16px', 
              fontWeight: '700',
              fontSize: '22px',
              cursor: puedeCrear ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: puedeCrear ? '0 8px 20px rgba(5, 150, 105, 0.5)' : 'none',
              opacity: puedeCrear ? 1 : 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '0 auto',
              zIndex: 1001,
              marginTop: '10px',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={e => {
              if (puedeCrear) {
                e.target.style.transform = 'translateY(-3px) scale(1.03)';
                e.target.style.boxShadow = '0 12px 24px rgba(5, 150, 105, 0.6)';
                e.target.style.background = 'linear-gradient(135deg, #047857 0%, #10b981 100%)';
              }
            }}
            onMouseLeave={e => {
              if (puedeCrear) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.5)';
                e.target.style.background = 'linear-gradient(135deg, #059669 0%, #34d399 100%)';
              }
            }}
          >
            {puedeCrear ? (pedidoId ? '🔄 ACTUALIZAR PEDIDO' : '🚀 CONFIRMAR Y ENVIAR PEDIDO') : '⚠️ COMPLETA LOS CAMPOS REQUERIDOS'}
          </button>
          
          {!puedeCrear && (
            <div style={{
              marginTop: '16px',
              padding: '12px 20px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '8px',
              border: '2px solid rgba(255, 193, 7, 0.3)',
              color: '#856404',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              💡 Necesitas seleccionar un cliente y añadir al menos una línea de producto válida
            </div>
          )}
        </div>

        {/* Mensaje de confirmación */}
        {mensaje && (
          <div style={{
            marginTop: '20px',
            padding: '16px 24px',
            background: mensaje.includes('Error') ? 
              'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 
              'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            textAlign: 'center',
            boxShadow: mensaje.includes('Error') ? 
              '0 4px 16px rgba(220, 53, 69, 0.3)' : 
              '0 4px 16px rgba(40, 167, 69, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {mensaje.includes('Error') ? '❌' : '✅'}
            </span>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}
