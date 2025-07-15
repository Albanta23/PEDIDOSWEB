import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function PedidosBorrador() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes?estado=borrador_woocommerce&origen.tipo=woocommerce`)
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  const handleUpdatePedido = (pedidoId, campo, valor) => {
    setPedidos(pedidos.map(p => p._id === pedidoId ? { ...p, [campo]: valor } : p));
  };

  const handleValidarPedido = async (pedido) => {
    try {
      await axios.put(`${API_URL}/pedidos-clientes/${pedido._id}`, { ...pedido, estado: 'en_espera' });
      setPedidos(pedidos.filter(p => p._id !== pedido._id));
    } catch (error) {
      alert('Error al validar el pedido');
    }
  };

  return (
    <div>
      <h2>Pedidos de WooCommerce en Borrador</h2>
      {cargando ? <p>Cargando...</p> : (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Cliente</th>
              <th>Código Cliente</th>
              <th>NIF/CIF</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p._id}>
                <td>{p.numeroPedido}</td>
                <td>{p.clienteNombre}</td>
                <td>
                  <input
                    type="text"
                    value={p.clienteId || ''}
                    onChange={e => handleUpdatePedido(p._id, 'clienteId', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={p.nif || ''}
                    onChange={e => handleUpdatePedido(p._id, 'nif', e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={() => handleValidarPedido(p)}>Validar y Enviar a Expediciones</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
