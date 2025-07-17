// Servicio para obtener pedidos de clientes para expedición
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
const API_BASE_URL = API_URL.endsWith('/api') ? API_URL : API_URL + '/api';

export async function obtenerPedidosClientesExpedicion() {
  const res = await axios.get(`${API_BASE_URL}/pedidos-clientes`);
  return res.data;
}

export async function actualizarEstadoPedidoCliente(id, nuevoEstado) {
  const res = await axios.put(`${API_BASE_URL}/pedidos-clientes/${id}`, { estado: nuevoEstado });
  return res.data;
}

export async function obtenerHistorialPedidoCliente(id) {
  const res = await axios.get(`${API_BASE_URL}/pedidos-clientes/${id}`);
  return res.data.historial || [];
}

export async function actualizarPedidoCliente(id, datos) {
  const camposPermitidos = ['lineas', 'estado', 'comentario', 'tipoPedido', 'fechaPedido', 'cliente', 'clienteId', 'tiendaId', 'numeroPedido', 'usuarioTramitando', 'bultos'];
  const camposLineaPermitidos = ['producto', 'cantidad', 'formato', 'comentario', 'peso', 'cantidadEnviada', 'lote', 'preparada', 'esComentario'];
  const datosFiltrados = {};
  for (const key of camposPermitidos) {
    if (datos[key] !== undefined) {
      if (key === 'lineas' && Array.isArray(datos.lineas)) {
        datosFiltrados.lineas = datos.lineas.map(l => {
          const lFiltrada = {};
          for (const k of camposLineaPermitidos) {
            if (l[k] !== undefined) lFiltrada[k] = l[k];
          }
          return lFiltrada;
        });
      } else {
        datosFiltrados[key] = datos[key];
      }
    }
  }
  const res = await axios.put(`${API_BASE_URL}/pedidos-clientes/${id}`, datosFiltrados);
  return res.data;
}

export async function borrarPedidoCliente(id) {
  const res = await axios.delete(`${API_BASE_URL}/pedidos-clientes/${id}`);
  return res.data;
}

export async function registrarDevolucionParcial(pedidoId, devolucion) {
  const response = await axios.post(`${API_BASE_URL}/pedidos-clientes/${pedidoId}/devolucion-parcial`, devolucion);
  return response.data;
}

export async function registrarDevolucionTotal(pedidoId, motivo, aptoParaVenta) {
  const response = await axios.post(`${API_BASE_URL}/pedidos-clientes/${pedidoId}/devolucion-total`, { motivo, aptoParaVenta });
  return response.data;
}
