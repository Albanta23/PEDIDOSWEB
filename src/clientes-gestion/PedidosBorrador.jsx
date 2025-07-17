import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

import PedidosClientes from './PedidosClientes';

export default function PedidosBorrador() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pedidoEditando, setPedidoEditando] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes?estado=borrador_woocommerce&origen.tipo=woocommerce`)
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  const handlePedidoCreado = () => {
    setPedidoEditando(null);
    // Recargar pedidos
    axios.get(`${API_URL}/pedidos-clientes?estado=borrador_woocommerce&origen.tipo=woocommerce`)
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos([]));
  };

  if (pedidoEditando) {
    return <PedidosClientes onPedidoCreado={handlePedidoCreado} clienteInicial={pedidoEditando.cliente} lineasIniciales={pedidoEditando.lineas} />;
  }

  return (
    <div>
      <h2>Pedidos de WooCommerce en Borrador</h2>
      {cargando ? <p>Cargando...</p> : (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Cliente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p._id}>
                <td>{p.numeroPedido}</td>
                <td>{p.clienteNombre}</td>
                <td>
                  <button onClick={() => setPedidoEditando(p)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
