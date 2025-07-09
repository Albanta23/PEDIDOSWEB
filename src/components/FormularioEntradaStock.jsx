import React, { useState, useEffect, useCallback } from 'react';
import { useProductos } from './ProductosContext'; // Assuming this context provides all products
import { getProveedores } from '../services/proveedoresService'; // Service created in previous step
import { registrarEntradaStock } from '../services/movimientosStockService';

const FormularioEntradaStock = ({ tiendaId, onEntradaRegistrada, contexto }) => {
  const { productos: listaProductosCatalogo } = useProductos(); // From context

  const [productoId, setProductoId] = useState('');
  const [nombreProductoManual, setNombreProductoManual] = useState('');
  const [usarProductoManual, setUsarProductoManual] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg'); // Default 'kg', can be 'ud'
  const [lote, setLote] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [precioCoste, setPrecioCoste] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [referenciaDocumento, setReferenciaDocumento] = useState('');
  const [notas, setNotas] = useState('');

  const [listaProveedores, setListaProveedores] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const data = await getProveedores();
        setListaProveedores(data || []);
      } catch (err) {
        setError('Error al cargar proveedores: ' + err.message);
        setListaProveedores([]); // Ensure it's an array on error
      }
    };
    cargarProveedores();
  }, []);

  const handleProductoChange = (e) => {
    const { value } = e.target;
    if (value === '__MANUAL__') {
      setUsarProductoManual(true);
      setProductoId('');
    } else {
      setUsarProductoManual(false);
      setProductoId(value);
      setNombreProductoManual(''); // Clear manual input if catalog product selected
      // Auto-set unit if product is selected from catalog
      const selectedProd = listaProductosCatalogo.find(p => p.id === value || p.nombre === value);
      if (selectedProd && selectedProd.unidad) {
        setUnidad(selectedProd.unidad);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const productoFinal = usarProductoManual ? nombreProductoManual.trim() : listaProductosCatalogo.find(p => p.id === productoId)?.nombre;

    if (!productoFinal) {
      setError('Debe seleccionar o ingresar un nombre de producto.');
      setCargando(false);
      return;
    }
    if (!cantidad && !precioCoste) { // Allow entry if only price is changing for an existing item perhaps, though this form is for new entries.
        // For new entries, quantity or weight is typically required.
        // For now, let's assume quantity or weight (implicitly via 'cantidad' for 'ud' or 'kg') is needed.
        // Or, if 'peso' becomes a direct field, then 'peso' or 'cantidad'
    }
    if (isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
        setError('La cantidad debe ser un número positivo.');
        setCargando(false);
        return;
    }
     if (precioCoste && (isNaN(parseFloat(precioCoste)) || parseFloat(precioCoste) < 0)) {
        setError('El precio de coste debe ser un número positivo o cero.');
        setCargando(false);
        return;
    }


    try {
      const entradaData = {
        tiendaId,
        producto: productoFinal,
        cantidad: parseFloat(cantidad),
        unidad,
        lote: lote.trim() || undefined, // Send undefined if empty, not empty string
        proveedorId: proveedorId || undefined,
        precioCoste: precioCoste ? parseFloat(precioCoste) : undefined,
        fechaEntrada, // Backend should handle if not provided, or UI ensures it
        referenciaDocumento: referenciaDocumento.trim() || undefined,
        notas: notas.trim() || undefined,
        // Assuming 'motivo' is set by backend or a more specific type like 'compra_proveedor'
        // Backend 'registrarEntradaStock' might need adjustment for these new fields
        // The existing `registrarEntradaStock` in `movimientosStockService` takes:
        // { tiendaId, producto, cantidad, unidad, lote, motivo, pedidoId, peso }
        // We need to align this. For now, let's assume 'motivo' can be generic.
        motivo: `Entrada ${contexto === 'fabrica' ? 'fábrica' : 'tienda'}${proveedorId ? ' (Compra)' : ''}`,
        // 'peso' is not directly in this form, but could be derived if 'unidad' is 'kg' and 'cantidad' is weight.
        // Or, we add a separate 'peso' field if 'cantidad' is always units.
        // For now, assuming 'cantidad' covers weight if unit is 'kg'.
        peso: unidad === 'kg' ? parseFloat(cantidad) : undefined // Example logic for peso
      };

      await registrarEntradaStock(entradaData);

      // Limpiar formulario
      setProductoId('');
      setNombreProductoManual('');
      setUsarProductoManual(false);
      setCantidad('');
      setUnidad('kg');
      setLote('');
      setProveedorId('');
      setPrecioCoste('');
      setFechaEntrada(new Date().toISOString().split('T')[0]);
      setReferenciaDocumento('');
      setNotas('');

      if (onEntradaRegistrada) {
        onEntradaRegistrada();
      }
      alert('Entrada registrada con éxito!');
    } catch (err) {
      setError('Error al registrar entrada: ' + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px', background: '#f9f9f9' }}>
      <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        Registrar Nueva Entrada de Stock ({contexto === 'fabrica' ? 'Fábrica/Central' : tiendaId})
      </h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label>Producto:</label>
            <select value={usarProductoManual ? '__MANUAL__' : productoId} onChange={handleProductoChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="">Seleccionar producto catálogo</option>
              {listaProductosCatalogo.map(p => (
                <option key={p.id || p.nombre} value={p.id || p.nombre}>{p.nombre} ({p.referencia || 'Sin ref.'})</option>
              ))}
              <option value="__MANUAL__">-- Ingresar nombre manualmente --</option>
            </select>
            {usarProductoManual && (
              <input
                type="text"
                placeholder="Nombre del producto manual"
                value={nombreProductoManual}
                onChange={(e) => setNombreProductoManual(e.target.value)}
                required={usarProductoManual}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '5px' }}
              />
            )}
          </div>

          <div>
            <label htmlFor="cantidadEntrada">Cantidad:</label>
            <input id="cantidadEntrada" type="number" step="any" placeholder="Ej: 10 o 12.5" value={cantidad} onChange={e => setCantidad(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}/>
          </div>

          <div>
            <label htmlFor="unidadEntrada">Unidad:</label>
            <select id="unidadEntrada" value={unidad} onChange={e => setUnidad(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="kg">kg</option>
              <option value="ud">ud (unidades)</option>
              {/* Add other units if necessary */}
            </select>
          </div>

          <div>
            <label htmlFor="loteEntrada">Lote (Opcional):</label>
            <input id="loteEntrada" type="text" placeholder="Lote del producto" value={lote} onChange={e => setLote(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>

          <div>
            <label htmlFor="proveedorEntrada">Proveedor (Opcional):</label>
            <select id="proveedorEntrada" value={proveedorId} onChange={e => setProveedorId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="">Seleccionar proveedor</option>
              {listaProveedores.map(prov => (
                <option key={prov._id} value={prov._id}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="precioCosteEntrada">Precio Coste Total (Opcional):</label>
            <input id="precioCosteEntrada" type="number" step="any" placeholder="Coste total de esta entrada" value={precioCoste} onChange={e => setPrecioCoste(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}/>
          </div>

          <div>
            <label htmlFor="fechaEntrada">Fecha Entrada:</label>
            <input id="fechaEntrada" type="date" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}/>
          </div>

          <div>
            <label htmlFor="referenciaDocumentoEntrada">Ref. Documento (Albarán/Factura, Opcional):</label>
            <input id="referenciaDocumentoEntrada" type="text" placeholder="Nº Albarán/Factura" value={referenciaDocumento} onChange={e => setReferenciaDocumento(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}/>
          </div>
        </div>

        <div style={{marginTop: '15px'}}>
            <label htmlFor="notasEntrada">Notas Adicionales (Opcional):</label>
            <textarea id="notasEntrada" value={notas} onChange={e => setNotas(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>

        <button type="submit" disabled={cargando} style={{ marginTop: '20px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
          {cargando ? 'Registrando...' : 'Registrar Entrada'}
        </button>
      </form>
    </div>
  );
};

export default FormularioEntradaStock;
