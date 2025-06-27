// Servicio para obtener pedidos de clientes para expedición
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export async function obtenerPedidosClientesExpedicion() {
  // Se asume que los pedidos de clientes tienen un campo especial o tiendaId === 'clientes'
  const res = await axios.get(`${API_URL}/api/pedidos?clientesExpedicion=1`);
  return res.data;
}

export async function actualizarEstadoPedidoCliente(id, nuevoEstado) {
  const res = await axios.put(`${API_URL}/api/pedidos/${id}`, { estado: nuevoEstado });
  return res.data;
}

export async function obtenerHistorialPedidoCliente(id) {
  // Suponiendo que el historial se guarda en el propio pedido o en una colección aparte
  // Aquí solo mock, se puede adaptar a la estructura real
  const res = await axios.get(`${API_URL}/api/pedidos/${id}`);
  return res.data.historial || [];
}

export async function actualizarPedidoCliente(id, datos) {
  // Permite actualizar líneas, estado y otros campos del pedido de cliente
  const res = await axios.put(`${API_URL}/api/pedidos/${id}`, datos);
  return res.data;
}
