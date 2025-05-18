import axios from 'axios';
const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/transferencias` : '/api/transferencias';

export const crearTransferencia = (data) => axios.post(API, data);
export const listarTransferencias = () => axios.get(API);
export const actualizarTransferencia = (id, data) => axios.put(`${API}/${id}`, data);
export const confirmarTransferencia = (id, data) => axios.patch(`${API}/${id}/confirmar`, data);
