// Servicio para registrar transferencias entre tiendas y reflejar en movimientos de stock
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001/api';

export async function registrarTransferenciaStock({ origenId, destinoId, productos, observaciones, usuario }) {
  const res = await fetch(`${API_URL}/transferencias/registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origenId, destinoId, productos, observaciones, usuario })
  });
  if (!res.ok) throw new Error('Error al registrar transferencia de stock');
  return await res.json();
}
