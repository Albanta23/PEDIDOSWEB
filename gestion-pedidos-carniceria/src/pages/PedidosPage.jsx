import React, { useState, useEffect } from 'react';
import PedidoForm from '../../../src/components/PedidoForm';
import PedidoList from '../../../src/components/PedidoList';
import { obtenerPedidos, crearPedido } from '../services/pedidosService';

const PedidosPage = () => {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      const data = await obtenerPedidos();
      setPedidos(data);
    };

    fetchPedidos();
  }, []);

  const agregarPedido = async (nuevoPedido) => {
    try {
      await crearPedido(nuevoPedido);
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (error) {
      alert('Error al guardar el pedido');
    }
  };

  return (
    <div>
      <h1>Gestión de Pedidos</h1>
      <PedidoForm agregarPedido={agregarPedido} />
      <PedidoList pedidos={pedidos} />
    </div>
  );
};

export default PedidosPage;