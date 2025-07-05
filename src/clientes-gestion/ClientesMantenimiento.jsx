import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PedidosClientes from './PedidosClientes';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

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

  const cargarClientes = () => {
    axios.get(`${API_URL}/api/clientes`)
      .then(res => {
        setClientes(res.data);
        setClientesFiltrados(res.data);
      })
      .catch(() => {
        setClientes([]);
        setClientesFiltrados([]);
      });
  };

  // Función para filtrar clientes
  const filtrarClientes = (busqueda) => {
    setFiltroBusqueda(busqueda);
    if (!busqueda.trim()) {
      setClientesFiltrados(clientes);
    } else {
      const filtrados = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (cliente.email && cliente.email.toLowerCase().includes(busqueda.toLowerCase())) ||
        (cliente.telefono && cliente.telefono.includes(busqueda)) ||
        (cliente.cif && cliente.cif.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setClientesFiltrados(filtrados);
    }
  };

  const cargarPedidosCliente = async (clienteNombre) => {
    setCargandoPedidos(true);
    try {
      // Buscar primero todos los pedidos y filtrar por clienteNombre
      const res = await axios.get(`${API_URL}/api/pedidos-clientes`);
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

  useEffect(() => { cargarClientes(); }, []);

  const handleGuardar = async () => {
    if (!form.nombre) { setMensaje('El nombre es obligatorio'); return; }
    try {
      if (modo === 'crear') {
        await axios.post(`${API_URL}/api/clientes`, form);
        setMensaje('Cliente creado');
      } else if (modo === 'editar' && clienteEdit) {
        await axios.put(`${API_URL}/api/clientes/${clienteEdit._id||clienteEdit.id}`, form);
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
    cargarPedidosCliente(cliente.nombre);
  };

  const handleVer = (cliente) => {
    setClienteEdit(cliente);
    setModo('ver');
    cargarPedidosCliente(cliente.nombre);
  };

  const handleEliminar = async (cliente) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await axios.delete(`${API_URL}/api/clientes/${cliente._id||cliente.id}`);
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
        await axios.post(`${API_URL}/api/clientes`, cli);
      }
      setMensaje('Clientes importados correctamente');
      cargarClientes();
    } catch {
      setMensaje('Error al importar clientes');
    }
  };

  // Efecto para actualizar filtro cuando cambian los clientes
  React.useEffect(() => {
    filtrarClientes(filtroBusqueda);
  }, [clientes]);

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
            </div>

            {/* Filtro de búsqueda */}
            <div style={{
              marginBottom: '25px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'relative',
                maxWidth: '500px',
                width: '100%'
              }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente por nombre, email, teléfono o CIF..."
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
            </div>

            {/* Información de resultados */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              {filtroBusqueda ? (
                `Mostrando ${clientesFiltrados.length} de ${clientes.length} clientes`
              ) : (
                `Total: ${clientes.length} clientes`
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
                      width: '200px'
                    }}>
                      ⚙️ Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{
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
                    overflowY: 'auto'
                  }}>
                    {pedidosCliente.map((pedido, index) => (
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
                  overflowY: 'auto'
                }}>
                  {pedidosCliente.map((pedido, index) => (
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
