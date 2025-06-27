// Servicio para obtener pedidos de clientes para expedición
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export async function obtenerPedidosClientesExpedicion() {
  // Se asume que los pedidos de clientes tienen un campo especial o tiendaId === 'clientes'
  const res = await axios.get(`${API_URL}/api/pedidos?clientesExpedicion=1`);
  return res.data;
}
