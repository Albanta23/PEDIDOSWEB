import React from 'react';

const estados = {
  pendiente: 'Pendiente',
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange }) => {
  // Agrupa pedidos por tienda
  const pedidosPorTienda = pedidos.reduce((acc, pedido) => {
    acc[pedido.tiendaId] = acc[pedido.tiendaId] || [];
    acc[pedido.tiendaId].push(pedido);
    return acc;
  }, {});

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Panel de Fábrica</h2>
      {Object.keys(pedidosPorTienda).length === 0 ? (
        <p>No hay pedidos de tiendas.</p>
      ) : (
        Object.entries(pedidosPorTienda).map(([tiendaId, pedidosTienda]) => (
          <div key={tiendaId} style={{ marginBottom: 32 }}>
            <h3>
              {tiendas.find(t => t.id === tiendaId)?.nombre || tiendaId}
            </h3>
            <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Formato</th>
                  <th>Comentario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pedidosTienda.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{pedido.producto}</td>
                    <td>{pedido.cantidad}</td>
                    <td>{pedido.formato}</td>
                    <td>{pedido.comentario}</td>
                    <td>{pedido.fecha}</td>
                    <td>{estados[pedido.estado] || pedido.estado}</td>
                    <td>
                      {pedido.estado === 'enviado' && (
                        <button onClick={() => onEstadoChange(pedido.id, 'preparado')}>
                          Marcar como preparado
                        </button>
                      )}
                      {pedido.estado === 'preparado' && (
                        <button onClick={() => onEstadoChange(pedido.id, 'enviadoTienda')}>
                          Enviar a tienda
                        </button>
                      )}
                      {pedido.estado === 'enviadoTienda' && (
                        <span style={{ color: 'green' }}>✔ Enviado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default FabricaPanel;