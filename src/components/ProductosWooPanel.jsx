import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function ProductosWooPanel() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const fetchProductos = () => {
    setCargando(true);
    axios.get(`${API_URL}/api/productos-woo`)
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      await axios.get(`${API_URL}/api/productos-woo/sincronizar`);
      fetchProductos();
    } catch (error) {
      alert('Error al sincronizar los productos');
    } finally {
      setSincronizando(false);
    }
  };

  const [editMode, setEditMode] = useState(false);
  const [productosEditados, setProductosEditados] = useState({});

  const handleUpdateProducto = (productoId, campo, valor) => {
    setProductosEditados(prev => ({
      ...prev,
      [productoId]: { ...prev[productoId], [campo]: valor }
    }));
  };

  const handleGuardarCambios = async () => {
    try {
      await axios.put(`${API_URL}/api/productos-woo`, { productos: Object.values(productosEditados) });
      setEditMode(false);
      setProductosEditados({});
      fetchProductos();
    } catch (error) {
      alert('Error al guardar los cambios');
    }
  };

  return (
    <div>
      <h2>Productos de WooCommerce</h2>
      <button onClick={handleSincronizar} disabled={sincronizando}>
        {sincronizando ? 'Sincronizando...' : 'Sincronizar Productos de WooCommerce'}
      </button>
      <button onClick={() => setEditMode(!editMode)} style={{ marginLeft: '10px' }}>
        {editMode ? 'Cancelar Edición' : 'Editar Productos'}
      </button>
      {editMode && <button onClick={handleGuardarCambios} style={{ marginLeft: '10px' }}>Guardar Cambios</button>}
      {cargando ? <p>Cargando...</p> : (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Peso (kg)</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p._id}>
                <td>{editMode ? <input type="text" value={productosEditados[p._id]?.nombre ?? p.nombre} onChange={e => handleUpdateProducto(p._id, 'nombre', e.target.value)} /> : p.nombre}</td>
                <td>{editMode ? <input type="text" value={productosEditados[p._id]?.tipo ?? p.tipo} onChange={e => handleUpdateProducto(p._id, 'tipo', e.target.value)} /> : p.tipo}</td>
                <td>{editMode ? <input type="number" value={productosEditados[p._id]?.precio ?? p.precio} onChange={e => handleUpdateProducto(p._id, 'precio', e.target.value)} /> : p.precio}</td>
                <td>{editMode ? <input type="number" value={productosEditados[p._id]?.peso ?? p.peso} onChange={e => handleUpdateProducto(p._id, 'peso', e.target.value)} /> : p.peso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
