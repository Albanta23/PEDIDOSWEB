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
      {modo !== "tienda" && pedidos.filter(p => p.estado === 'pendiente').length > 0 && (
        <button
          onClick={enviarSeleccionados}
          disabled={seleccionados.length === 0}
          style={{ marginBottom: 12 }}
        >
          Enviar seleccionados a fábrica
        </button>
      )}
      {pedidos.length === 0 ? (
        <p>No hay pedidos para esta tienda.</p>
      ) : (
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
          <thead>
            <tr>
              <th></th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Formato</th>
              <th>Comentario</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido, idx) => (
              <tr key={idx}>
                <td>
                  {pedido.estado === 'pendiente' && (
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(idx)}
                      onChange={() => toggleSeleccion(idx)}
                    />
                  )}
                </td>
                {editIdx === idx ? (
                  <>
                    <td>
                      <input
                        type="text"
                        name="producto"
                        value={editPedido.producto}
                        onChange={handleEditChange}
                        style={{ width: 100 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="cantidad"
                        min="1"
                        value={editPedido.cantidad}
                        onChange={handleEditChange}
                        style={{ width: 60 }}
                      />
                    </td>
                    <td>
                      <select
                        name="formato"
                        value={editPedido.formato}
                        onChange={handleEditChange}
                        style={{ width: 90 }}
                      >
                        <option value="Cajas">Cajas</option>
                        <option value="Bolsas">Bolsas</option>
                        <option value="Kilos">Kilos</option>
                        <option value="Unidades">Unidades</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="comentario"
                        value={editPedido.comentario}
                        onChange={handleEditChange}
                        style={{ width: 120 }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>{pedido.producto}</td>
                    <td>{pedido.cantidad}</td>
                    <td>{pedido.formato}</td>
                    <td>{pedido.comentario}</td>
                  </>
                )}
                <td>{estados[pedido.estado] || 'Pendiente'}</td>
                <td>
                  {pedido.estado === 'borrador' && (
                    editIdx === idx ? (
                      <>
                        <button onClick={() => saveEdit(idx)} style={{ marginRight: 4 }}>Guardar</button>
                        <button onClick={cancelEdit}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(idx, pedido)} style={{ marginRight: 4 }}>Editar</button>
                        <button onClick={() => onBorrar(idx)} style={{ marginRight: 4, color: 'red' }}>Borrar</button>
                      </>
                    )
                  )}
                  {pedido.estado === 'pendiente' && (
                    <span>Enviado</span>
                  )}
                  {pedido.estado === 'enviado' && (
                    <button onClick={() => onEstadoChange(idx, 'preparado')}>Marcar como preparado</button>
                  )}
                  {pedido.estado === 'preparado' && (
                    <span style={{ color: 'green' }}>✔</span>
                  )}
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