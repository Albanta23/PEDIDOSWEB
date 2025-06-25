// Servicio para obtener un pedido por id
import axios from 'axios';
import { PEDIDOS_API_ENDPOINT } from './pedidosService';

export async function getPedidoById(id) {
  const res = await axios.get(`${PEDIDOS_API_ENDPOINT}/${id}`);
  return res.data;
}
