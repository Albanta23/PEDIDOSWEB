import React from 'react';
import { exportPedidoClientePDF } from './utils/exportPedidoPDF';
import { formatearDireccionCompletaPedido } from './utils/formatDireccion';

export default function PedidoClienteDetalle({ pedido, onClose }) {
  if (!pedido) return null;
  return (
    <div style={{
      position:'fixed',
      top:0,
      left:0,
      width:'100vw',
      height:'100vh',
      background:'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)',
      zIndex:1000,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding: '20px'
    }}>
      <div style={{
        background:'#fff',
        borderRadius:16,
        padding:32,
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 40px)',
        overflowY: 'auto',
        boxShadow:'0 25px 80px rgba(0,0,0,0.4)',
        position:'relative',
        border: '1px solid #e1e8ed',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: '-32px -32px 24px -32px',
          padding: '24px 32px',
          borderRadius: '16px 16px 0 0',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>📋</div>
          <div style={{ flex: 1 }}>
            <h1 style={{margin:'0 0 8px 0', fontSize: '28px', fontWeight: '700'}}>
              Detalle del Pedido
            </h1>
            <p style={{margin:0, fontSize: '16px', opacity: 0.9}}>
              Información completa y líneas del pedido
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background:'rgba(255,255,255,0.2)',
              color:'#fff',
              border:'none',
              borderRadius:12,
              padding:'12px 24px',
              fontWeight:700,
              cursor:'pointer',
              fontSize: '16px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Contenido principal en flex */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          gap: '32px',
          minHeight: 0
        }}>
          {/* Panel izquierdo - Información del pedido */}
          <div style={{ 
            flex: '0 0 400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Botón de exportar */}
            <div style={{textAlign: 'center'}}>
              <button 
                onClick={()=>exportPedidoClientePDF(pedido)} 
                style={{
                  background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color:'#fff',
                  border:'none',
                  borderRadius:12,
                  padding:'16px 32px',
                  fontWeight:700,
                  cursor:'pointer',
                  fontSize: '16px',
                  boxShadow: '0 6px 20px rgba(79, 172, 254, 0.3)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(79, 172, 254, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.3)';
                }}
              >
                📄 Exportar a PDF
              </button>
            </div>

            {/* Información del pedido */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                color: '#1e293b',
                fontSize: '20px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>ℹ️</span>
                Información del Pedido
              </h3>
              <div style={{display: 'grid', gap: '16px', fontSize: '16px'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Nº Pedido:</b> 
                  <span style={{color: '#1976d2', fontWeight: '700', fontSize: '18px'}}>#{pedido.numeroPedido || pedido._id}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Cliente:</b> 
                  <span style={{fontWeight: '700'}}>{pedido.clienteNombre}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Estado:</b> 
                  <span style={{
                    background: getEstadoColor(pedido.estado) + '20',
                    color: getEstadoColor(pedido.estado),
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    border: `2px solid ${getEstadoColor(pedido.estado)}30`
                  }}>
                    {pedido.estado?.replace('_',' ')}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Fecha pedido:</b> 
                  <span>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString('es-ES') : '-'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Dirección completa:</b> 
                  <span style={{ 
                    textAlign: 'right', 
                    maxWidth: '200px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {formatearDireccionCompletaPedido(pedido)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Usuario que tramitó:</b> 
                  <span style={{color: '#1976d2', fontWeight: '600'}}>{pedido.usuarioTramitando || '-'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{color: '#374151'}}>Bultos:</b> 
                  <span style={{color: '#28a745', fontWeight: '700'}}>{pedido.bultos !== undefined && pedido.bultos !== null ? pedido.bultos : 'Sin especificar'}</span>
                </div>
              </div>
            </div>

            {/* Historial de eventos */}
            {(pedido.historial || pedido.historialEstados) && (pedido.historial || pedido.historialEstados).length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #bae6fd',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>🕒</span>
                  Historial del Pedido
                </h3>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  {(pedido.historial || pedido.historialEstados).map((h,i)=>(
                    <div key={i} style={{
                      padding: '16px 20px',
                      borderBottom: i < (pedido.historial || pedido.historialEstados).length - 1 ? '1px solid #e2e8f0' : 'none',
                      background: i % 2 === 0 ? '#fff' : '#f8fafc'
                    }}>
                      <div style={{fontWeight: '700', color: '#1e293b', fontSize: '16px', marginBottom: '4px'}}>
                        {h.tipo === 'bultos' ? `Actualización de Bultos: ${h.bultos}` : h.estado?.replace('_',' ').toUpperCase()}
                      </div>
                      <div style={{fontSize: '14px', color: '#64748b'}}>
                        Por <span style={{color:'#1976d2', fontWeight: '600'}}>{h.usuario}</span> el {h.fecha ? new Date(h.fecha).toLocaleString('es-ES') : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho - Líneas del pedido */}
          <div style={{ 
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #fbbf24',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                color: '#1e293b',
                fontSize: '22px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '28px' }}>�</span>
                Líneas del Pedido ({pedido.lineas?.length || 0})
              </h3>
              <div style={{
                background: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {pedido.lineas?.map((l,i)=>(
                    <div key={i} style={{
                      padding: '20px 24px',
                      borderBottom: i < pedido.lineas.length - 1 ? '2px solid #e2e8f0' : 'none',
                      background: i % 2 === 0 ? '#fff' : '#f8fafc'
                    }}>
                      {l.esComentario ? (
                        <div style={{
                          color:'#b8860b', 
                          fontStyle: 'italic', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          fontSize: '16px',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                          borderRadius: '12px',
                          border: '2px solid #fbbf24'
                        }}>
                          <span style={{fontSize: '24px'}}>📝</span>
                          <span><b>Comentario:</b> {l.comentario}</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            fontWeight: '700', 
                            color: '#1e293b', 
                            fontSize: '18px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{fontSize: '20px'}}>🛒</span>
                            {l.producto}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: '1px solid #3b82f6'
                            }}>
                              <b style={{color: '#1e40af'}}>Cantidad:</b>
                              <div style={{fontSize: '16px', fontWeight: '700', color: '#1e40af'}}>
                                {l.cantidad} {l.formato}
                              </div>
                            </div>
                            {l.peso && (
                              <div style={{
                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #16a34a'
                              }}>
                                <b style={{color: '#15803d'}}>Peso:</b>
                                <div style={{fontSize: '16px', fontWeight: '700', color: '#15803d'}}>
                                  {l.peso} kg
                                </div>
                              </div>
                            )}
                            {l.lote && (
                              <div style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #f59e0b'
                              }}>
                                <b style={{color: '#d97706'}}>Lote:</b>
                                <div style={{fontSize: '16px', fontWeight: '700', color: '#d97706'}}>
                                  {l.lote}
                                </div>
                              </div>
                            )}
                          </div>
                          {l.comentario && (
                            <div style={{
                              padding: '12px 16px', 
                              fontSize: '15px', 
                              color: '#6b7280', 
                              fontStyle: 'italic',
                              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{fontSize: '16px'}}>💬</span>
                              {l.comentario}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function getEstadoColor(estado) {
    if (estado === 'en_espera') return '#d32f2f';
    if (estado === 'en_preparacion') return '#388e3c';
    if (estado === 'preparado') return '#1976d2';
    if (estado === 'cancelado') return '#888';
    return '#1976d2';
  }
}
