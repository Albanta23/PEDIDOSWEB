import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://pedidos-backend-0e1s.onrender.com';

export async function listarAvisos(tiendaId) {
  if (tiendaId === 'clientes') return [];
  const { data } = await axios.get(`${API_URL}/avisos`, { params: tiendaId ? { tiendaId } : {} });
  return data;
}

export async function crearAviso(aviso) {
  const { data } = await axios.post(`${API_URL}/avisos`, aviso);
  return data;
}

export async function marcarAvisoVisto(avisoId, usuario) {
  const { data } = await axios.patch(`${API_URL}/avisos/${avisoId}/visto`, { usuario });
  return data;
}
