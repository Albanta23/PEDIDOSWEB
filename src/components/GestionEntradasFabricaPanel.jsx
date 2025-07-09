import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaStock from './FormularioEntradaStock';
import { getMovimientosStock } from '../services/movimientosStockService'; // To show history
import { useProductos } from './ProductosContext';

// Define a constant for the factory/central warehouse ID
// This should match an ID in the `tiendas` array or be a special known ID.
// Assuming 'tienda9' is the fábrica based on previous observations.
const ID_ALMACEN_FABRICA = 'tienda9';
const NOMBRE_ALMACEN_FABRICA = 'Fábrica / Almacén Central'; // For display

const GestionEntradasFabricaPanel = ({ onClose }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();

  const cargarHistorialEntradas = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      // Fetch all movements for the factory warehouse and filter for type 'entrada'
      // or a specific type like 'compra_proveedor' if that's used.
      const todosMovimientos = await getMovimientosStock({ tiendaId: ID_ALMACEN_FABRICA });
      const entradas = todosMovimientos.filter(
        (mov) => mov.tipo === 'entrada' || mov.motivo?.toLowerCase().includes('compra') || mov.motivo?.toLowerCase().includes('entrada manual')
      ).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setHistorialEntradas(entradas);
    } catch (err) {
      setErrorHistorial('Error al cargar el historial de entradas: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorialEntradas();
  }, [cargarHistorialEntradas]);

  const handleEntradaRegistrada = () => {
    setMostrarFormulario(false); // Hide form after successful entry
    cargarHistorialEntradas(); // Refresh history
  };

  const getProductName = (productIdentifier) => {
    const product = productos.find(p => p.id === productIdentifier || p.nombre === productIdentifier);
    return product ? product.nombre : productIdentifier;
  };


  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e8e8', paddingBottom: '15px', marginBottom: '25px' }}>
          <h2 style={{ color: '#333', margin: 0 }}>Gestión de Entradas - {NOMBRE_ALMACEN_FABRICA}</h2>
          <button
            onClick={onClose}
            style={{ background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', padding: '8px 15px', cursor: 'pointer' }}
          >
            Cerrar Panel
          </button>
        </div>

        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            style={{ background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 18px', cursor: 'pointer', fontSize: '16px', marginBottom: '25px' }}
          >
            + Registrar Nueva Entrada en Fábrica
          </button>
        )}

        {mostrarFormulario && (
          <div style={{ marginBottom: '30px', border: '1px dashed #007bff', padding: '20px', borderRadius: '8px' }}>
            <FormularioEntradaStock
              tiendaId={ID_ALMACEN_FABRICA}
              onEntradaRegistrada={handleEntradaRegistrada}
              contexto="fabrica"
            />
            <button
              onClick={() => setMostrarFormulario(false)}
              style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px', cursor: 'pointer', marginTop: '15px' }}
            >
              Cancelar Nueva Entrada
            </button>
          </div>
        )}

        <div>
          <h3 style={{ color: '#333', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px', marginBottom: '15px' }}>Historial de Entradas en Fábrica</h3>
          {cargandoHistorial && <p>Cargando historial...</p>}
          {errorHistorial && <p style={{ color: 'red' }}>{errorHistorial}</p>}
          {!cargandoHistorial && !errorHistorial && historialEntradas.length === 0 && (
            <p>No hay entradas registradas para la fábrica.</p>
          )}
          {!cargandoHistorial && !errorHistorial && historialEntradas.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f2f2f2', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Cantidad</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Unidad</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Lote</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Motivo/Ref.</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {historialEntradas.map((mov, index) => (
                  <tr key={mov._id || index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{new Date(mov.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>{getProductName(mov.producto)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{mov.cantidad}</td>
                    <td style={{ padding: '10px' }}>{mov.unidad}</td>
                    <td style={{ padding: '10px' }}>{mov.lote || '-'}</td>
                    <td style={{ padding: '10px' }}>{mov.referenciaDocumento || mov.motivo || '-'}</td>
                    <td style={{ padding: '10px' }}>{mov.proveedorId || '-'} {/* TODO: Fetch supplier name if ID stored */}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionEntradasFabricaPanel;
