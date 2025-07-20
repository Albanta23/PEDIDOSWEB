import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useProveedores } from './ProveedoresContext';
import { useProductos } from './ProductosContext'; // <--- Importar contexto de productos
import { v4 as uuidv4 } from 'uuid';

/**
 * Este formulario avanzado permite registrar entradas técnicas en fábrica, capturando todos los datos relevantes:
 * - Proveedor (selección y validación)
 * - Producto, cantidad, peso, lote, precio coste, observaciones
 * - Referencia de documento (albarán/factura) y fecha de entrada
 * Las líneas de productos se validan para asegurar que ningún campo obligatorio quede vacío.
 * Al enviar, se llama a onRegistrar con todos los datos para su registro en el sistema y disponibilidad en los paneles de ventas y expediciones.
 */

const lineaVacia = {
  id: uuidv4(),
  producto: '',
  cantidad: '',
  peso: '',
  lote: '',
  precioCoste: '',
  observaciones: ''
};

const FormularioEntradaFabricaAvanzado = ({ onRegistrar }) => {
  const { proveedores, loading, error: errorProveedores } = useProveedores();
  const { productos } = useProductos();
  // Recuperar proveedor guardado
  const proveedorGuardado = (() => {
    try {
      const p = localStorage.getItem('proveedorSeleccionado');
      return p ? JSON.parse(p) : null;
    } catch { return null; }
  })();
  const [proveedor, setProveedor] = useState(proveedorGuardado);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [proveedorInputTouched, setProveedorInputTouched] = useState(false);
  const [lineas, setLineas] = useState([{ ...lineaVacia }]);
  const [referenciaDocumento, setReferenciaDocumento] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState('');
  const [error, setError] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');

  // Filtrado de proveedores
  const proveedoresFiltrados = proveedores.filter(p => {
    const texto = busquedaProveedor.trim().toLowerCase();
    return (
      p.codigo?.includes(texto) ||
      p.nombre?.toLowerCase().includes(texto) ||
      (p.razonComercial && p.razonComercial.toLowerCase().includes(texto))
    );
  });

  // Obtener familias únicas por nombre
  const familias = Array.from(new Set(productos.map(p => p.nombreFamilia || p.familia).filter(Boolean)));

  // Filtrar productos por familia por nombre
  const productosFiltrados = filtroFamilia
    ? productos.filter(p => (p.nombreFamilia || p.familia) === filtroFamilia)
    : productos;

  // Añadir línea
  const agregarLinea = () => setLineas([...lineas, { ...lineaVacia, id: uuidv4() }]);
  // Eliminar línea
  const eliminarLinea = idx => setLineas(lineas.filter((_, i) => i !== idx));
  // Actualizar campo de línea
  const actualizarLinea = (idx, campo, valor) => {
    const nuevas = [...lineas];
    nuevas[idx][campo] = valor;
    setLineas(nuevas);
  };

  // Al seleccionar proveedor, guardar en localStorage
  const seleccionarProveedor = (p) => {
    setProveedor(p);
    setBusquedaProveedor(p.nombre);
    setProveedorInputTouched(false);
    try { localStorage.setItem('proveedorSeleccionado', JSON.stringify(p)); } catch {}
  };

  // Validación y registro
  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    // Validar proveedor
    if (!proveedor) return setError('Seleccione un proveedor.');
    // Validar líneas
    for (const [i, l] of lineas.entries()) {
      if (!l.producto) return setError(`Producto obligatorio en línea ${i + 1}`);
      if (!l.lote) return setError(`Lote obligatorio en línea ${i + 1}`);
      if (!l.cantidad && !l.peso) return setError(`Debe indicar cantidad o peso en línea ${i + 1}`);
    }
    // Validar referencia documento
    if (!referenciaDocumento) return setError('Referencia de albarán/factura obligatoria.');
    // Validar fecha
    if (!fechaEntrada) return setError('Fecha de entrada obligatoria.');
    // Registrar
    onRegistrar({
      proveedor,
      lineas,
      referenciaDocumento,
      fechaEntrada
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-xl font-bold text-gray-800">Registro técnico de entrada en fábrica</CardTitle>
        <p className="text-sm text-gray-600 mt-2">Complete los datos del albarán/factura y las líneas de productos</p>
        {loading && <div className="text-blue-600 text-sm mt-2">Cargando proveedores...</div>}
        {errorProveedores && <div className="text-red-600 text-sm mt-2">{errorProveedores}</div>}
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input
              type="text"
              value={busquedaProveedor}
              onChange={e => {
                setBusquedaProveedor(e.target.value);
                setProveedor(null);
                setProveedorInputTouched(true);
              }}
              placeholder="Buscar proveedor por código, nombre o razón comercial"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
            />
            {busquedaProveedor && proveedoresFiltrados.length > 0 && proveedorInputTouched && (
              <ul className="bg-white border border-gray-200 rounded-lg shadow max-h-40 overflow-y-auto">
                {proveedoresFiltrados.map(p => (
                  <li
                    key={p.codigo}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${proveedor?.codigo === p.codigo ? 'bg-blue-100' : ''}`}
                    onClick={() => seleccionarProveedor(p)}
                  >
                    <span className="font-semibold text-blue-700">{p.codigo}</span> - <span>{p.nombre}</span>
                    {p.razonComercial && <span className="text-xs text-gray-500 ml-2">({p.razonComercial})</span>}
                  </li>
                ))}
              </ul>
            )}
            {/* Aviso si no hay coincidencias y el input fue tocado */}
            {busquedaProveedor && proveedoresFiltrados.length === 0 && proveedorInputTouched && (
              <div className="text-red-600 text-xs mt-1">No hay proveedores que coincidan con la búsqueda. Debe seleccionar uno de la lista.</div>
            )}
            {proveedor && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <strong>Proveedor seleccionado:</strong> {proveedor.codigo} - {proveedor.nombre}
              </div>
            )}
          </div>
          {/* Referencia documento y fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia albarán/factura</label>
              <input
                type="text"
                value={referenciaDocumento}
                onChange={e => setReferenciaDocumento(e.target.value)}
                placeholder="Nº albarán o factura"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrada</label>
              <input
                type="date"
                value={fechaEntrada}
                onChange={e => setFechaEntrada(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          {/* Filtro de familia de productos */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar productos por familia</label>
            <select
              value={filtroFamilia}
              onChange={e => setFiltroFamilia(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todas las familias</option>
              {familias.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          {/* Tabla de líneas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Líneas de productos</label>
            <table className="min-w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Producto</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Cantidad (ud)</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Peso (kg)</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Lote</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Precio coste</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Observaciones</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, idx) => {
                  // NO usar hooks dentro del render loop - esto viola las Reglas de Hooks
                  return (
                    <tr key={l.id} className="bg-white">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={l.producto}
                          onChange={e => actualizarLinea(idx, 'producto', e.target.value)}
                          placeholder="Buscar por nombre o referencia"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          required
                          list={`productos-catalogo-${filtroFamilia || 'todas'}`}
                        />
                        <datalist id={`productos-catalogo-${filtroFamilia || 'todas'}`}>
                          {productosFiltrados.map(prod => (
                            <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                              {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''} {prod.familia ? `- ${prod.familia}` : ''}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={l.cantidad}
                          onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                          placeholder="Unidades"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.peso}
                          onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                          placeholder="Peso (kg)"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <label className="block text-xs text-gray-600 mb-1">Lote</label>
                        <input
                          type="text"
                          value={l.lote}
                          onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                          placeholder="Escribe lote manualmente"
                          className="w-full px-2 py-1 border border-gray-300 rounded mb-1"
                          required
                        />
                        <small className="text-xs text-gray-500">
                          Introduce el lote del producto
                        </small>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.precioCoste}
                          onChange={e => actualizarLinea(idx, 'precioCoste', e.target.value)}
                          placeholder="Precio"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={l.observaciones}
                          onChange={e => actualizarLinea(idx, 'observaciones', e.target.value)}
                          placeholder="Observaciones"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {lineas.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => eliminarLinea(idx)} title="Eliminar línea">🗑️</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2">
              <Button type="button" variant="premium" onClick={agregarLinea}>+ Añadir línea</Button>
            </div>
          </div>
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">{error}</div>
          )}
          {/* Botón de registro */}
          <div className="mt-6 flex justify-end">
            <Button type="submit" className="px-6 py-3 text-lg font-semibold">Registrar entrada</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FormularioEntradaFabricaAvanzado;
