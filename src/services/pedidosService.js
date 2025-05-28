import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, ''); // Elimina la barra final si existe
console.log('[DEBUG pedidosService] API_BASE_URL:', API_BASE_URL); // DEBUG
const PEDIDOS_API_ENDPOINT = `${API_BASE_URL}/api/pedidos`;
console.log('[DEBUG pedidosService] PEDIDOS_API_ENDPOINT:', PEDIDOS_API_ENDPOINT); // DEBUG

export const obtenerPedidos = async () => {
  try {
    console.log('[DEBUG] PEDIDOS_API_ENDPOINT:', PEDIDOS_API_ENDPOINT);
    const response = await axios.get(PEDIDOS_API_ENDPOINT);
    console.log('[DEBUG] Respuesta de /api/pedidos:', response.status, response.data);
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