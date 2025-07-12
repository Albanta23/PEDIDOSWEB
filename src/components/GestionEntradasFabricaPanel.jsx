import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaStock from './FormularioEntradaStock';
import { getMovimientosStock } from '../services/movimientosStockService';
import { getProveedores } from '../services/proveedoresService';
import { useProductos } from './ProductosContext';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { PlusCircle, ListChecks, XCircle, RefreshCw, AlertTriangle, PackagePlus } from 'lucide-react';

const ID_ALMACEN_FABRICA = 'tienda9';
const NOMBRE_ALMACEN_FABRICA = 'Fábrica / Almacén Central';

const GestionEntradasFabricaPanel = ({ onClose }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();
  const [proveedoresMap, setProveedoresMap] = useState({});

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const provs = await getProveedores();
        const map = {};
        provs.forEach(p => map[p._id] = p.nombre);
        setProveedoresMap(map);
      } catch (error) {
        console.error("Error fetching suppliers for panel:", error);
      }
    };
    fetchProveedores();
  }, []);

  const cargarHistorialEntradas = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
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
    setMostrarFormulario(false);
    cargarHistorialEntradas();
  };

  const getProductName = (productIdentifier) => {
    const product = productos.find(p => p.id === productIdentifier || p.nombre === productIdentifier);
    return product ? product.nombre : productIdentifier;
  };

  const getSupplierName = (supplierId) => {
    return proveedoresMap[supplierId] || supplierId || 'N/A';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
      <Card variant="premium" className="max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle gradient className="text-3xl">Gestión de Entradas</CardTitle>
              <p className="text-gray-500 mt-1">{NOMBRE_ALMACEN_FABRICA}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} title="Cerrar Panel">
              <XCircle className="h-7 w-7 text-gray-400 hover:text-red-500 transition-colors" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!mostrarFormulario && (
            <Button
              variant="premium"
              size="xl"
              onClick={() => setMostrarFormulario(true)}
              className="mb-8 w-full md:w-auto animate-pulse hover:animate-none"
            >
              <PackagePlus className="mr-3 h-6 w-6" /> Registrar Nueva Entrada de Mercancía
            </Button>
          )}

          {mostrarFormulario && (
            <Card variant="glass" className="mb-8 p-4 md:p-6 shadow-inner bg-white/60">
              <FormularioEntradaStock
                tiendaId={ID_ALMACEN_FABRICA}
                onEntradaRegistrada={handleEntradaRegistrada}
                contexto="fabrica"
              />
              <div className="mt-6 flex justify-end">
                <Button variant="destructive" onClick={() => setMostrarFormulario(false)}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              </div>
            </Card>
          )}

          <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-purple-600"/>
                Historial de Entradas
              </h3>
              <Button variant="outline" size="default" onClick={cargarHistorialEntradas} disabled={cargandoHistorial}>
                <RefreshCw className={`mr-2 h-4 w-4 ${cargandoHistorial ? 'animate-spin' : ''}`} />
                {cargandoHistorial ? 'Actualizando...' : 'Refrescar Historial'}
              </Button>
            </div>

            {cargandoHistorial && (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-10 w-10 animate-spin text-purple-500" />
                <p className="ml-4 text-lg text-gray-600">Cargando, por favor espere...</p>
              </div>
            )}
            {errorHistorial && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md shadow-md flex items-center">
                <AlertTriangle className="h-6 w-6 mr-3"/>
                <div>
                  <p className="font-bold">Error</p>
                  <p>{errorHistorial}</p>
                </div>
              </div>
            )}
            {!cargandoHistorial && !errorHistorial && historialEntradas.length === 0 && (
              <div className="text-center py-16 bg-gray-100/50 rounded-xl border border-dashed">
                <ListChecks className="h-16 w-16 text-gray-300 mx-auto mb-4"/>
                <h3 className="text-xl font-semibold text-gray-600">No hay entradas registradas</h3>
                <p className="text-gray-400 mt-2">Utilice el botón de "Registrar Nueva Entrada" para comenzar.</p>
              </div>
            )}
            {!cargandoHistorial && !errorHistorial && historialEntradas.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200/80 shadow-lg bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Producto</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Cantidad</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Unidad</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Lote</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ref./Motivo</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Proveedor</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">P. Coste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80">
                    {historialEntradas.map((mov) => (
                      <tr key={mov._id || mov.fecha + mov.producto} className="hover:bg-purple-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{getProductName(mov.producto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{mov.cantidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mov.unidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Badge variant={mov.lote ? 'secondary' : 'outline'}>{mov.lote || 'N/A'}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-sm" title={mov.referenciaDocumento || mov.motivo}>{mov.referenciaDocumento || mov.motivo || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getSupplierName(mov.proveedorId)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{mov.precioCoste ? `${mov.precioCoste.toFixed(2)}€` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionEntradasFabricaPanel;
