import React, { useState } from 'react';
import Watermark from './Watermark';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  const [editandoPedidoId, setEditandoPedidoId] = useState(null);
  const [lineasEdit, setLineasEdit] = useState([]);

  // Función para guardar cambios de líneas y limpiar pedidos vacíos
  const guardarLineasEditadas = async (pedido) => {
    // Filtra líneas vacías (por si el usuario borra todas)
    const nuevasLineas = lineasEdit.filter(l => l.producto && l.cantidad);
    if (nuevasLineas.length === 0) {
      // Si no quedan líneas, borra el pedido completo
      await onEstadoChange(pedido.id, 'eliminar');
    } else {
      // Si quedan líneas, guarda normalmente
      const lineasNormalizadas = nuevasLineas.map(l => ({ ...l, preparada: !!l.preparada }));
      await onLineaDetalleChange(pedido.id, null, lineasNormalizadas);
    }
    setEditandoPedidoId(null);
    setLineasEdit([]);
  };

  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado'
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  return (
    <div style={{ marginTop: 32 }}>
      <Watermark />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Panel de Fábrica</h2>
        <button onClick={onVerHistorico} style={{padding:'8px 18px',background:'#007bff',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:500}}>
          Ver histórico de envíos
        </button>
      </div>
      <h3 style={{marginBottom:12,marginTop:24}}>Pedidos pendientes de preparar o enviar</h3>
      {pedidosPendientes.length === 0 ? (
        <p>No hay pedidos pendientes de tiendas.</p>
      ) : (
        pedidosPendientes.map((pedido) => {
          const enEdicion = editandoPedidoId === pedido.id;
          return (
            <div key={pedido.id} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
              <h3>
                {tiendas.find(t => t.id === pedido.tiendaId)?.nombre || pedido.tiendaId} - Nº Pedido: {pedido.numeroPedido}
              </h3>
              <div>Fecha: {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</div>
              <div style={{ marginTop: 12 }}>
                Estado: <b>{estados[pedido.estado] || pedido.estado}</b>
              </div>
              <div style={{ marginTop: 12, display:'flex', gap:12, flexWrap:'wrap' }}>
                {pedido.estado === 'enviado' && !enEdicion && (
                  <button
                    onClick={() => { setEditandoPedidoId(pedido.id); setLineasEdit(pedido.lineas.map(l => ({ ...l })))} }
                    style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}
                  >
                    Preparar pedido
                  </button>
                )}
                {enEdicion && (
                  <>
                    <button onClick={() => guardarLineasEditadas(pedido)} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Guardar</button>
                    <button onClick={() => { setEditandoPedidoId(null); setLineasEdit([]); }} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Cancelar</button>
                  </>
                )}
                {pedido.estado === 'enviado' && !enEdicion && (
                  <button
                    onClick={() => onEstadoChange(pedido.id, 'preparado')}
                    disabled={!pedido.lineas.every(l => l.preparada)}
                    style={{background: pedido.lineas.every(l => l.preparada) ? '#ffc107' : '#ccc', color:'#222',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600, cursor: pedido.lineas.every(l => l.preparada) ? 'pointer' : 'not-allowed'}}
                    title={!pedido.lineas.every(l => l.preparada) ? 'Debes preparar todas las líneas' : ''}
                  >
                    Marcar como preparado
                  </button>
                )}
                {pedido.estado === 'preparado' && (
                  <button onClick={() => onEstadoChange(pedido.id, 'enviadoTienda')} style={{background:'#17a2b8',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
                    Enviar a tienda
                  </button>
                )}
              </div>
              <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant. pedida</th>
                    <th>Cant. enviada</th>
                    <th>Formato pedido</th>
                    <th>Comentario</th>
                    <th>Lote</th>
                    <th>Preparada</th>
                    {enEdicion && <th>Eliminar</th>}
                  </tr>
                </thead>
                <tbody>
                  {(enEdicion ? lineasEdit : pedido.lineas).map((linea, idx) => (
                    <tr key={idx}>
                      <td>{linea.producto}</td>
                      <td>{linea.cantidad}</td>
                      <td>
                        {enEdicion ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={linea.cantidadEnviada ?? ''}
                            onChange={e => setLineasEdit(lineasEdit.map((l, i) => i === idx ? { ...l, cantidadEnviada: e.target.value } : l))}
                            style={{ width: 70 }}
                          />
                        ) : (
                          linea.cantidadEnviada ?? ''
                        )}
                      </td>
                      <td>{linea.formato}</td>
                      <td>{linea.comentario}</td>
                      <td>
                        {enEdicion ? (
                          <input
                            type="text"
                            value={linea.lote ?? ''}
                            onChange={e => setLineasEdit(lineasEdit.map((l, i) => i === idx ? { ...l, lote: e.target.value } : l))}
                            style={{ width: 90 }}
                          />
                        ) : (
                          linea.lote ?? ''
                        )}
                      </td>
                      <td>
                        {enEdicion ? (
                          <input
                            type="checkbox"
                            checked={!!linea.preparada}
                            onChange={e => setLineasEdit(lineasEdit.map((l, i) => i === idx ? { ...l, preparada: e.target.checked } : l))}
                          />
                        ) : (
                          linea.preparada ? '✔' : ''
                        )}
                      </td>
                      {enEdicion && (
                        <td>
                          <button
                            style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                            onClick={() => setLineasEdit(lineasEdit.filter((_, i) => i !== idx))}
                            title="Eliminar línea"
                          >
                            🗑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
};

export default FabricaPanel;