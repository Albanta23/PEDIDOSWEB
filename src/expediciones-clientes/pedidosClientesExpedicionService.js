// Servicio para obtener pedidos de clientes para expedición
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export async function obtenerPedidosClientesExpedicion() {
  const res = await axios.get(`${API_URL}/api/pedidos-clientes`);
  return res.data;
}

export async function actualizarEstadoPedidoCliente(id, nuevoEstado) {
  const res = await axios.put(`${API_URL}/api/pedidos-clientes/${id}`, { estado: nuevoEstado });
  return res.data;
}

export async function obtenerHistorialPedidoCliente(id) {
  const res = await axios.get(`${API_URL}/api/pedidos-clientes/${id}`);
  return res.data.historial || [];
}

export async function actualizarPedidoCliente(id, datos) {
  const camposPermitidos = ['lineas', 'estado', 'comentario', 'tipoPedido', 'fechaPedido', 'cliente', 'clienteId', 'tiendaId', 'numeroPedido'];
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
  const res = await axios.put(`${API_URL}/api/pedidos-clientes/${id}`, datosFiltrados);
  return res.data;
}

export async function borrarPedidoCliente(id) {
  const res = await axios.delete(`${API_URL}/api/pedidos-clientes/${id}`);
  return res.data;
}
