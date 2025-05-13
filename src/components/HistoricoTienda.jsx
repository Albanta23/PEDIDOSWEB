import React from 'react';

const HistoricoTienda = ({ pedidos, tiendaId }) => {
  // Agrupa por numeroPedido
  const agrupados = pedidos
    .filter(p => p.tiendaId === tiendaId && p.estado !== 'borrador' && p.numeroPedido)
    .reduce((acc, p) => {
      acc[p.numeroPedido] = acc[p.numeroPedido] || [];
      acc[p.numeroPedido].push(p);
      return acc;
    }, {});

  return (
    <div>
      <h2>Histórico de Pedidos</h2>
      <table>
        <thead>
          <tr>
            <th>Nº Pedido</th>
            <th>Fecha pedido</th>
            <th>Líneas</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(agrupados).map(([numero, lineas]) => (
            <tr key={numero}>
              <td>{numero}</td>
              <td>{lineas[0].fechaPedido ? new Date(lineas[0].fechaPedido).toLocaleString() : '-'}</td>
              <td>{lineas.length}</td>
              <td>
                <button onClick={() => alert(
                  lineas.map((p, i) =>
                    `${i + 1}. ${p.producto} - ${p.cantidad} ${p.formato} (${p.comentario || '-'})`
                  ).join('\n')
                )}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricoTienda;