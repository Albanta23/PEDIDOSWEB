import React from 'react';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado'
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Panel de Fábrica</h2>
        <button onClick={onVerHistorico} style={{padding:'8px 18px',background:'#007bff',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:500}}>
          Ver histórico de envíos
        </button>
      </div>
      {/* Sección de pedidos pendientes */}
      <h3 style={{marginBottom:12,marginTop:24}}>Pedidos pendientes de preparar o enviar</h3>
      {pedidosPendientes.length === 0 ? (
        <p>No hay pedidos pendientes de tiendas.</p>
      ) : (
        pedidosPendientes.map((pedido) => {
          const todasPreparadas = pedido.lineas.every(l => l.preparada);
          return (
            <div key={pedido.id} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
              <h3>
                {tiendas.find(t => t.id === pedido.tiendaId)?.nombre || pedido.tiendaId} - Nº Pedido: {pedido.numeroPedido}
              </h3>
              <div>Fecha: {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</div>
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
                  </tr>
                </thead>
                <tbody>
                  {pedido.lineas.map((linea, idx) => (
                    <tr key={idx}>
                      <td>{linea.producto}</td>
                      <td>{linea.cantidad}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={linea.cantidadEnviada ?? ''}
                          onChange={e => onLineaDetalleChange(pedido.id, idx, { cantidadEnviada: e.target.value })}
                          style={{ width: 70 }}
                          disabled={pedido.estado !== 'enviado'}
                        />
                      </td>
                      <td>{linea.formato}</td>
                      <td>{linea.comentario}</td>
                      <td>
                        <input
                          type="text"
                          value={linea.lote ?? ''}
                          onChange={e => onLineaDetalleChange(pedido.id, idx, { lote: e.target.value })}
                          style={{ width: 90 }}
                          disabled={pedido.estado !== 'enviado'}
                        />
                      </td>
                      <td>
                        {pedido.estado === 'enviado' ? (
                          <input
                            type="checkbox"
                            checked={!!linea.preparada}
                            onChange={e => onLineaChange(pedido.id, idx, e.target.checked)}
                          />
                        ) : (
                          linea.preparada ? '✔' : ''
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12 }}>
                Estado: <b>{estados[pedido.estado] || pedido.estado}</b>
              </div>
              <div style={{ marginTop: 12 }}>
                {pedido.estado === 'enviado' && (
                  <button
                    onClick={() => onEstadoChange(pedido.id, 'preparado')}
                    disabled={!todasPreparadas}
                    title={!todasPreparadas ? 'Debes preparar todas las líneas' : ''}
                  >
                    Marcar como preparado
                  </button>
                )}
                {pedido.estado === 'preparado' && (
                  <button onClick={() => onEstadoChange(pedido.id, 'enviadoTienda')}>
                    Enviar a tienda
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default FabricaPanel;