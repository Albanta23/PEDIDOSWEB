import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getLotesDisponibles } from './services/lotesService';

// Componente para probar la disponibilidad de lotes
function TestLotesDisponibilidad() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar lista de productos
  useEffect(() => {
    async function fetchProductos() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProductos(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      }
    }
    fetchProductos();
  }, []);

  // Cargar lotes al seleccionar un producto
  const handleProductoChange = async (productoId) => {
    setProductoSeleccionado(productoId);
    if (!productoId) {
      setLotes([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Consultando lotes para producto:', productoId);
      const data = await getLotesDisponibles(productoId);
      console.log('Lotes recibidos:', data);
      setLotes(data);
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Prueba de Disponibilidad de Lotes</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="producto-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Selecciona un producto:
        </label>
        <select 
          id="producto-select"
          value={productoSeleccionado}
          onChange={(e) => handleProductoChange(e.target.value)}
          style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">-- Selecciona un producto --</option>
          {productos.map(producto => (
            <option key={producto._id} value={producto._id}>
              {producto.nombre} {producto.referencia ? `(${producto.referencia})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando lotes...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && lotes.length === 0 && productoSeleccionado && (
        <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '4px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#856404' }}>No hay lotes disponibles para este producto.</p>
        </div>
      )}

      {lotes.length > 0 && (
        <div>
          <h2>Lotes disponibles:</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f2f2f2' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Lote</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Cantidad disponible</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Peso disponible (kg)</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Fecha entrada</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map(lote => (
                <tr key={lote._id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lote.lote}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lote.cantidadDisponible}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{lote.pesoDisponible}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {new Date(lote.fechaEntrada).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Renderizar el componente en el div con id "lotes-test"
const rootElement = document.getElementById('lotes-test');
if (rootElement) {
  ReactDOM.render(<TestLotesDisponibilidad />, rootElement);
}
