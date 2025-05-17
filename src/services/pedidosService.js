import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL; // ej: https://pedidos-backend-0e1s.onrender.com
const PEDIDOS_API_ENDPOINT = `${API_BASE_URL}/api/pedidos`; // ej: https://pedidos-backend-0e1s.onrender.com/api/pedidos

export const obtenerPedidos = async () => {
  try {
    const response = await axios.get(PEDIDOS_API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
};

export const crearPedido = async (pedido) => {
  try {
    const response = await axios.post(PEDIDOS_API_ENDPOINT, pedido);
    return response.data;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

export const actualizarPedido = async (id, pedidoActualizado) => {
  try {
    const response = await axios.put(`${PEDIDOS_API_ENDPOINT}/${id}`, pedidoActualizado);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    throw error;
  }
};

export const eliminarPedido = async (id) => {
  try {
    const response = await axios.delete(`${PEDIDOS_API_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    throw error;
  }
};