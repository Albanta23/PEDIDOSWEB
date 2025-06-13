// Servicio para consultar y registrar movimientos de stock de almacén de tienda

// Asegurarse de que la URL base termina en /api
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001/api';
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/?$/, '/api');
}

export async function getMovimientosStock({ tiendaId, producto, lote, desde, hasta }) {
  const params = new URLSearchParams();
  if (tiendaId) params.append('tiendaId', tiendaId);
  if (producto) params.append('producto', producto);
  if (lote) params.append('lote', lote);
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);
  const res = await fetch(`${API_URL}/movimientos-stock?${params.toString()}`);
  if (!res.ok) throw new Error('Error al consultar movimientos de stock');
  return await res.json();
}

export async function registrarBajaStock({ tiendaId, producto, cantidad, unidad, lote, motivo, peso }) {
  const res = await fetch(`${API_URL}/movimientos-stock/baja`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiendaId, producto, cantidad, unidad, lote, motivo, peso })
  });
  if (!res.ok) throw new Error('Error al registrar baja de stock');
  return await res.json();
}

export async function registrarEntradaStock({ tiendaId, producto, cantidad, unidad, lote, motivo, pedidoId, peso }) {
  const res = await fetch(`${API_URL}/movimientos-stock/entrada`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiendaId, producto, cantidad, unidad, lote, motivo, pedidoId, peso })
  });
  if (!res.ok) throw new Error('Error al registrar entrada de stock');
  return await res.json();
}
