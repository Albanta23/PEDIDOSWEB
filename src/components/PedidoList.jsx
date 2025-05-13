import React, { useState } from 'react';

const estados = {
  pendiente: 'Pendiente',
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
};

const PedidoList = ({ pedidos, onEstadoChange, onModificar, onBorrar, onEnviar, modo }) => {
  const [seleccionados, setSeleccionados] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editPedido, setEditPedido] = useState({});

  const toggleSeleccion = (idx) => {
    setSeleccionados(seleccionados =>
      seleccionados.includes(idx)
        ? seleccionados.filter(i => i !== idx)
        : [...seleccionados, idx]
    );
  };

  const enviarSeleccionados = () => {
    if (onEnviar) {
      onEnviar();
    } else {
      seleccionados.forEach(idx => onEstadoChange(idx, 'enviado'));
    }
    setSeleccionados([]);
  };

  const startEdit = (idx, pedido) => {
    setEditIdx(idx);
    setEditPedido(pedido);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditPedido({});
  };

  const saveEdit = (idx) => {
    if (onModificar) {
      onModificar(idx, editPedido);
    }
    setEditIdx(null);
    setEditPedido({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditPedido(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Pedidos realizados</h3>
      {modo === "tienda" && pedidos.filter(p => p.estado === 'borrador').length > 0 && (
        <button
          onClick={onEnviar}
          style={{ marginBottom: 12 }}
        >
          Enviar todos los pedidos a fábrica
        </button>
      )}
      {pedidos.filter(p => p.estado === 'borrador').length === 0 ? (
        <p>No hay pedidos en borrador para esta tienda.</p>
      ) : (
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
          <thead>
            <tr>
              <th></th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Formato</th>
              <th>Comentario</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.filter(p => p.estado === 'borrador').map((pedido, idx) => (
              <tr key={idx}>
                <td></td>
                <td>{pedido.lineas[0]?.producto}</td>
                <td>{pedido.lineas[0]?.cantidad}</td>
                <td>{pedido.lineas[0]?.formato}</td>
                <td>{pedido.lineas[0]?.comentario}</td>
                <td>
                  <button onClick={() => onModificar(idx, pedido)} style={{ marginRight: 4 }}>Editar</button>
                  <button onClick={() => onBorrar(idx)} style={{ color: 'red' }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PedidoList;