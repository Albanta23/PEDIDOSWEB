import React, { useState, useEffect } from 'react';
import { useProductos } from './ProductosContext';
import { getProveedores } from '../services/proveedoresService';
import { registrarEntradaStock } from '../services/movimientosStockService';
import { Button } from './ui/Button'; // Assuming Button is in ../ui/Button relative to this file if this is in src/components
import { Input } from './ui/Input';   // Assuming Input is in ../ui/Input
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'; // Assuming Card is in ../ui/Card
// If ui components are in 'gestor-cestas-navideñas-pro/src/components/ui/', adjust path:
// import { Button } from '../../gestor-cestas-navideñas-pro/src/components/ui/Button';
// For now, using relative paths assuming a structure like src/components/ui/Button.jsx

const FormularioEntradaStock = ({ tiendaId, onEntradaRegistrada, contexto }) => {
  const { productos: listaProductosCatalogo } = useProductos();

  const [productoId, setProductoId] = useState('');
  const [nombreProductoManual, setNombreProductoManual] = useState('');
  const [usarProductoManual, setUsarProductoManual] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
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
        setListaProveedores([]);
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
      setNombreProductoManual('');
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
        lote: lote.trim() || undefined,
        proveedorId: proveedorId || undefined,
        precioCoste: precioCoste ? parseFloat(precioCoste) : undefined,
        fechaEntrada,
        referenciaDocumento: referenciaDocumento.trim() || undefined,
        notas: notas.trim() || undefined, // Changed from notasEntrada to notas to match state
        motivo: `Entrada ${contexto === 'fabrica' ? 'fábrica' : 'tienda'}${proveedorId ? ' (Compra)' : ''}`,
        peso: unidad === 'kg' ? parseFloat(cantidad) : undefined,
      };

      await registrarEntradaStock(entradaData);

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
      alert('Entrada registrada con éxito!'); // Consider using a more integrated notification system
    } catch (err) {
      setError('Error al registrar entrada: ' + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Tailwind classes for form elements (consistent with Shadcn/ui if that's the base)
  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">
          Registrar Nueva Entrada de Stock ({contexto === 'fabrica' ? 'Fábrica/Central' : tiendaId})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="productoEntrada" className={labelClassName}>Producto:</label>
              <select
                id="productoEntrada"
                value={usarProductoManual ? '__MANUAL__' : productoId}
                onChange={handleProductoChange}
                className={inputClassName}
              >
                <option value="">Seleccionar producto catálogo</option>
                {listaProductosCatalogo.map(p => (
                  <option key={p.id || p.nombre} value={p.id || p.nombre}>{p.nombre} ({p.referencia || 'Sin ref.'})</option>
                ))}
                <option value="__MANUAL__">-- Ingresar nombre manualmente --</option>
              </select>
              {usarProductoManual && (
                <Input
                  type="text"
                  placeholder="Nombre del producto manual"
                  value={nombreProductoManual}
                  onChange={(e) => setNombreProductoManual(e.target.value)}
                  required={usarProductoManual}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <label htmlFor="cantidadEntrada" className={labelClassName}>Cantidad:</label>
              <Input id="cantidadEntrada" type="number" step="any" placeholder="Ej: 10 o 12.5" value={cantidad} onChange={e => setCantidad(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="unidadEntrada" className={labelClassName}>Unidad:</label>
              <select id="unidadEntrada" value={unidad} onChange={e => setUnidad(e.target.value)} className={inputClassName}>
                <option value="kg">kg</option>
                <option value="ud">ud (unidades)</option>
              </select>
            </div>

            <div>
              <label htmlFor="loteEntrada" className={labelClassName}>Lote (Opcional):</label>
              <Input id="loteEntrada" type="text" placeholder="Lote del producto" value={lote} onChange={e => setLote(e.target.value)} />
            </div>

            <div>
              <label htmlFor="proveedorEntrada" className={labelClassName}>Proveedor (Opcional):</label>
              <select id="proveedorEntrada" value={proveedorId} onChange={e => setProveedorId(e.target.value)} className={inputClassName}>
                <option value="">Seleccionar proveedor</option>
                {listaProveedores.map(prov => (
                  <option key={prov._id} value={prov._id}>{prov.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="precioCosteEntrada" className={labelClassName}>Precio Coste (Opcional):</label>
              <Input id="precioCosteEntrada" type="number" step="any" placeholder="Coste de esta entrada" value={precioCoste} onChange={e => setPrecioCoste(e.target.value)} />
            </div>

            <div>
              <label htmlFor="fechaEntrada" className={labelClassName}>Fecha Entrada:</label>
              <Input id="fechaEntrada" type="date" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="referenciaDocumentoEntrada" className={labelClassName}>Ref. Documento (Opcional):</label>
              <Input id="referenciaDocumentoEntrada" type="text" placeholder="Nº Albarán/Factura" value={referenciaDocumento} onChange={e => setReferenciaDocumento(e.target.value)} />
            </div>
          </div>

          <div className="col-span-full"> {/* Ensure Textarea takes full width if grid has more than 1 col */}
            <label htmlFor="notasEntrada" className={labelClassName}>Notas Adicionales (Opcional):</label>
            <textarea
              id="notasEntrada"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows="3"
              className={`${inputClassName} min-h-[80px]`}
              placeholder="Notas sobre la entrada..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="premium" size="lg" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Registrar Entrada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FormularioEntradaStock;
