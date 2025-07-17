// Servicio para gestionar proveedores

function getApiUrl() {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    let apiUrl = process.env.VITE_API_URL.replace(/\/$/, '');
    if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
    return apiUrl;
  }
  // Frontend Vite
  try {
    let apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
    if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
    return apiUrl;
  } catch (e) {}
  return 'http://localhost:10001/api';
}

const API_URL = getApiUrl();
const PROVEEDORES_ENDPOINT = `${API_URL}/proveedores`;

export async function getProveedores() {
  try {
    const res = await fetch(PROVEEDORES_ENDPOINT);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error al cargar proveedores' }));
      throw new Error(errorData.message || 'Error al cargar proveedores');
    }
    return await res.json();
  } catch (error) {
    console.error('Error en getProveedores:', error);
    throw error;
  }
}

export async function getProveedorById(id) {
  try {
    const res = await fetch(`${PROVEEDORES_ENDPOINT}/${id}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Proveedor no encontrado' }));
      throw new Error(errorData.message || 'Proveedor no encontrado');
    }
    return await res.json();
  } catch (error) {
    console.error(`Error en getProveedorById ${id}:`, error);
    throw error;
  }
}

export async function crearProveedor(proveedorData) {
  try {
    const res = await fetch(PROVEEDORES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorData),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error al crear proveedor' }));
      throw new Error(errorData.message || 'Error al crear proveedor');
    }
    return await res.json();
  } catch (error) {
    console.error('Error en crearProveedor:', error);
    throw error;
  }
}

export async function actualizarProveedor(id, proveedorData) {
  try {
    const res = await fetch(`${PROVEEDORES_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorData),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error al actualizar proveedor' }));
      throw new Error(errorData.message || 'Error al actualizar proveedor');
    }
    return await res.json();
  } catch (error) {
    console.error(`Error en actualizarProveedor ${id}:`, error);
    throw error;
  }
}

export async function eliminarProveedor(id) { // Realmente lo marca como inactivo
  try {
    const res = await fetch(`${PROVEEDORES_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error al eliminar proveedor' }));
      throw new Error(errorData.message || 'Error al eliminar proveedor');
    }
    return await res.json();
  } catch (error) {
    console.error(`Error en eliminarProveedor ${id}:`, error);
    throw error;
  }
}
