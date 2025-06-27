// Servicio para obtener pedidos de clientes para expedición
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export async function obtenerPedidosClientesExpedicion() {
  // Ahora solo pedidos con tipoPedido === 'clientedirecto'
  const res = await axios.get(`${API_URL}/api/pedidos?tipoPedido=clientedirecto`);
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
  // Solo enviar campos permitidos por el backend
  const camposPermitidos = ['lineas', 'estado', 'comentario', 'tipoPedido', 'fechaPedido', 'cliente', 'clienteId'];
  const datosFiltrados = {};
  for (const key of camposPermitidos) {
    if (datos[key] !== undefined) datosFiltrados[key] = datos[key];
  }
  const res = await axios.put(`${API_URL}/api/pedidos/${id}`, datosFiltrados);
  return res.data;
}

export async function borrarPedidoCliente(id) {
  const res = await axios.delete(`${API_URL}/api/pedidos/${id}`);
  return res.data;
}
