// Servicio para consultar y gestionar lotes de productos

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001/api';
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/?$/, '/api');
}

export async function getLotesDisponibles(productoId) {
  const res = await fetch(`${API_URL}/lotes/${productoId}`);
  if (!res.ok) throw new Error('Error al consultar lotes disponibles');
  return await res.json();
}
