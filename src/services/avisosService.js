import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://pedidos-backend-0e1s.onrender.com';
const API_AVISOS = API_URL.endsWith('/api') ? `${API_URL}/avisos` : `${API_URL}/api/avisos`;

export async function listarAvisos(tiendaId) {
  if (tiendaId === 'clientes') return [];
  const { data } = await axios.get(API_AVISOS, { params: tiendaId ? { tiendaId } : {} });
  return data;
}

export async function crearAviso(aviso) {
  const { data } = await axios.post(API_AVISOS, aviso);
  return data;
}

export async function marcarAvisoVisto(avisoId, usuario) {
  const { data } = await axios.patch(`${API_AVISOS}/${avisoId}/visto`, { usuario });
  return data;
}
