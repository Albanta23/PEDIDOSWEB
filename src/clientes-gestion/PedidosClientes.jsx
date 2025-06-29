import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProductos } from '../components/ProductosContext';
import { FORMATOS_PEDIDO } from '../configFormatos';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function PedidosClientes({ onPedidoCreado }) {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [lineas, setLineas] = useState([
    { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }
  ]);
  const [mensaje, setMensaje] = useState('');
  const { productos, cargando } = useProductos();
  const [productoValido, setProductoValido] = useState([]);
  const [mensajeError, setMensajeError] = useState([]);
  const [testBackendMsg, setTestBackendMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/clientes`)
      .then(res => setClientes(res.data))
      .catch(()=>setClientes([]));
  }, []);

  useEffect(() => {
    setProductoValido(lineas.map(l => !!l.producto));
    setMensajeError(lineas.map(() => ''));
  }, [lineas, productos]);

  const handleLineaChange = (idx, campo, valor) => {
    setLineas(lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };
  const handleAgregarLinea = () => {
    setLineas([...lineas, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };
  const handleAgregarComentario = () => {
    setLineas([...lineas, { esComentario: true, comentario: '' }]);
  };
  const handleEliminarLinea = (idx) => {
    setLineas(lineas.filter((_, i) => i !== idx));
  };
  // Validar líneas: al menos una línea de producto válida (ignorar comentarios)
  const lineasValidas = lineas.filter(l => !l.esComentario && l.producto && l.cantidad > 0);
  const puedeCrear = clienteSeleccionado && lineasValidas.length > 0;

  const handleCrearPedido = async () => {
    if (!puedeCrear) {
      setMensaje('Selecciona un cliente y añade al menos una línea de producto válida.');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/pedidos-clientes`, {
        clienteId: clienteSeleccionado._id || clienteSeleccionado.id || clienteSeleccionado.codigo,
        clienteNombre: clienteSeleccionado.nombre,
        direccion: clienteSeleccionado.direccion,
        lineas,
        tipo: 'cliente',
        fechaPedido: new Date().toISOString(),
        estado: 'enviado'
      });
      setMensaje('Pedido creado correctamente.');
      setLineas([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
      setClienteSeleccionado(null);
      setTimeout(()=> {
        setMensaje('');
        if (onPedidoCreado) onPedidoCreado();
      }, 1200);
    } catch (e) {
      setMensaje('Error al crear pedido.');
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

  return (
    <div style={{ 
      marginTop: 32, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      {/* Header profesional con iconos */}
      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#fff',
        padding: '24px 32px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '48px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>🛒</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            Crear Nuevo Pedido de Cliente
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
            Editor profesional para gestión de pedidos de clientes
          </p>
        </div>
      </div>

      {/* Panel principal del editor */}
      <div style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e1e8ed'
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
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>
              Seleccionar Cliente
            </h3>
            <select 
              value={clienteSeleccionado?.nombre || ''} 
              onChange={handleClienteChange} 
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                fontSize: '16px',
                background: 'rgba(255,255,255,0.95)',
                color: '#2c3e50',
                fontWeight: '600',
                minWidth: '300px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={e => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = 'rgba(255,255,255,0.8)';
              }}
              onBlur={e => {
                e.target.style.background = 'rgba(255,255,255,0.95)';
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              <option value="">🔍 Selecciona un cliente...</option>
              {clientes.map(c=>(<option key={c._id||c.id||c.codigo} value={c.nombre}>{c.nombre}</option>))}
            </select>
          </div>
          {clienteSeleccionado && (
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ✅ Cliente seleccionado
            </div>
          )}
        </div>

        {/* Panel de líneas de pedido */}
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #e2e8f0'
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
            gridTemplateColumns: '1fr 80px 120px 150px 50px',
            gap: '12px',
            padding: '12px 16px',
            background: '#e2e8f0',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569'
          }}>
            <div>Producto</div>
            <div>Cantidad</div>
            <div>Formato</div>
            <div>Comentario</div>
            <div></div>
          </div>

          {/* Líneas del pedido */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  gridTemplateColumns: '1fr 80px 120px 150px 50px',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                        padding: '12px 16px', 
                        width: '100%', 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '8px', 
                        background: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={e => e.target.style.borderColor = '#4facfe'}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0';
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
                      padding: '12px 16px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4facfe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  
                  <select
                    value={linea.formato}
                    onChange={e => handleLineaChange(idx, 'formato', e.target.value)}
                    style={{ 
                      padding: '12px 16px',
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4facfe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    {FORMATOS_PEDIDO.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Observaciones..."
                    value={linea.comentario}
                    onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                    style={{ 
                      padding: '12px 16px', 
                      width: '100%',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4facfe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  
                  {lineas.length > 1 && (
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
                  )}
                  
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
            gap: '12px',
            justifyContent: 'center',
            marginTop: '24px',
            padding: '20px',
            background: 'rgba(79, 172, 254, 0.05)',
            borderRadius: '12px'
          }}>
            <button 
              type="button" 
              onClick={handleAgregarLinea} 
              style={{ 
                padding: '12px 24px', 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
              }}
            >
              ➕ Añadir línea
            </button>
            
            <button 
              type="button" 
              onClick={handleAgregarComentario} 
              style={{ 
                padding: '12px 24px', 
                background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
              }}
            >
              📝 Añadir comentario
            </button>
          </div>
        </div>

        {/* Botón principal de confirmación */}
        <div style={{
          background: puedeCrear ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#e9ecef',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          border: puedeCrear ? '2px solid rgba(40, 167, 69, 0.3)' : '2px solid #dee2e6'
        }}>
          <button 
            onClick={handleCrearPedido} 
            disabled={!puedeCrear}
            style={{ 
              padding: '16px 48px', 
              background: puedeCrear ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#6c757d',
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '700',
              fontSize: '18px',
              cursor: puedeCrear ? 'pointer' : 'not-allowed',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: puedeCrear ? '0 6px 20px rgba(40, 167, 69, 0.4)' : 'none',
              opacity: puedeCrear ? 1 : 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto'
            }}
            onMouseEnter={e => {
              if (puedeCrear) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.5)';
              }
            }}
            onMouseLeave={e => {
              if (puedeCrear) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
              }
            }}
          >
            {puedeCrear ? '🚀 Confirmar y Enviar Pedido' : '⚠️ Completa los campos requeridos'}
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
