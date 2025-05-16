import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://pedidos-backend-0e1s.onrender.com/api/pedidos';

export const crearPedido = async (pedido) => {
  try {
    const response = await axios.post(API_URL, pedido);
    return response.data;
  } catch (error) {
    throw new Error('Error al crear el pedido: ' + error.message);
  }
};

export const obtenerPedidos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw new Error('Error al obtener los pedidos: ' + error.message);
  }
};

export const actualizarPedido = async (id, pedido) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, pedido);
    return response.data;
  } catch (error) {
    throw new Error('Error al actualizar el pedido: ' + error.message);
  }
};

export const eliminarPedido = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    throw new Error('Error al eliminar el pedido: ' + error.message);
  }
};