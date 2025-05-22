import React, { useState, useEffect } from 'react';
import PedidoList from '../../../src/components/PedidoList';
import { obtenerPedidos, crearPedido } from '../services/pedidosService';
import Watermark from '../components/Watermark';

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
      <Watermark />
      <h1>Gestión de Pedidos</h1>
      <PedidoList pedidos={pedidos} />
    </div>
  );
};

export default PedidosPage;