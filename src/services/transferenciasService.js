import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://pedidos-backend-0e1s.onrender.com';
// Si API_BASE ya incluye /api, no añadirlo aquí
const API = `${API_BASE}/transferencias`;

export const crearTransferencia = (data) => axios.post(API, data);
export const listarTransferencias = () => axios.get(API);
export const actualizarTransferencia = (id, data) => axios.put(`${API}/${id}`, data);
export const confirmarTransferencia = (id, data) => axios.patch(`${API}/${id}/confirmar`, data);
