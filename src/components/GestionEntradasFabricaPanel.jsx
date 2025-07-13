import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaFabricaAvanzado from './FormularioEntradaFabricaAvanzado';
import { getMovimientosStock, registrarEntradaStock } from '../services/movimientosStockService';
import { useProveedores } from './ProveedoresContext';
import { useProductos } from './ProductosContext';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { PlusCircle, ListChecks, RefreshCw, AlertTriangle, PackagePlus } from 'lucide-react';

const ID_ALMACEN_FABRICA = 'tienda9';

const GestionEntradasFabricaPanel = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();
  const proveedoresContext = useProveedores();

  if (!proveedoresContext) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
        <AlertTriangle className="inline-block mr-2 h-6 w-6" />
        Error: El contexto de proveedores no está disponible.
      </div>
    );
  }
  const { proveedores, loading: loadingProveedores, error: errorProveedores } = proveedoresContext;

  const proveedoresMap = proveedores.reduce((acc, p) => {
    acc[p.codigo] = p.nombre || p.razonComercial || p.codigo;
    return acc;
  }, {});

  const cargarHistorialEntradas = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      const todosMovimientos = await getMovimientosStock({ tiendaId: ID_ALMACEN_FABRICA });
      const entradas = todosMovimientos
        .filter(mov => mov.tipo === 'entrada' || mov.motivo?.toLowerCase().includes('compra') || mov.motivo?.toLowerCase().includes('entrada manual'))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setHistorialEntradas(entradas);
    } catch (err) {
      setErrorHistorial(`Error al cargar el historial: ${err.message || 'desconocido'}`);
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

  const handleRegistrarEntradaAvanzada = async ({ proveedor, lineas, referenciaDocumento, fechaEntrada }) => {
    setCargandoHistorial(true);
    try {
      const entradaData = {
        tiendaId: ID_ALMACEN_FABRICA,
        proveedorId: proveedor.codigo,
        referenciaDocumento,
        fechaEntrada,
        lineas,
        motivo: 'Entrada técnica albarán/factura',
      };
      await registrarEntradaStock(entradaData);
      setMostrarFormulario(false);
      cargarHistorialEntradas();
    } catch (err) {
      setErrorHistorial(`Error al registrar entrada: ${err.message || 'desconocido'}`);
    } finally {
      setCargandoHistorial(false);
    }
  };

  if (loadingProveedores) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-3 text-gray-600">Cargando datos maestros...</p>
      </div>
    );
  }

  if (errorProveedores) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
        <AlertTriangle className="inline-block mr-2 h-6 w-6" />
        Error cargando proveedores: {errorProveedores}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card variant="premium" className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle gradient>Gestión de Entradas en Fábrica</CardTitle>
              <CardDescription>Registro y consulta de entradas de mercancía y materias primas.</CardDescription>
            </div>
            {!mostrarFormulario && (
              <Button
                variant="premium"
                size="lg"
                onClick={() => setMostrarFormulario(true)}
              >
                <PackagePlus className="mr-2 h-5 w-5" /> Registrar Nueva Entrada
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {mostrarFormulario ? (
            <FormularioEntradaFabricaAvanzado
              onRegistrar={handleRegistrarEntradaAvanzada}
              onCancel={() => setMostrarFormulario(false)}
            />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <ListChecks className="mr-3 h-6 w-6 text-blue-500"/>
                  Historial de Entradas Recientes
                </h3>
                <Button variant="outline" size="sm" onClick={cargarHistorialEntradas} disabled={cargandoHistorial}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${cargandoHistorial ? 'animate-spin' : ''}`} />
                  Refrescar Historial
                </Button>
              </div>

              {cargandoHistorial && (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="ml-3 text-gray-600">Cargando historial...</p>
                </div>
              )}
              {errorHistorial && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2"/> {errorHistorial}
                </div>
              )}
              {!cargandoHistorial && !errorHistorial && historialEntradas.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
                  <ListChecks className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                  <p className="text-gray-600 font-semibold">No hay entradas registradas.</p>
                  <p className="text-gray-500 mt-1">Utilice el botón "Registrar Nueva Entrada" para comenzar.</p>
                </div>
              )}
              {!cargandoHistorial && !errorHistorial && historialEntradas.length > 0 && (
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                        <th scope="col" className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unidad</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lote</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref./Motivo</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                        <th scope="col" className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">P. Coste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historialEntradas.map((mov) => (
                        <tr key={mov._id || mov.fecha + mov.producto} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(mov.fecha).toLocaleDateString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{getProductName(mov.producto)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right font-semibold">{mov.cantidad}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{mov.unidad}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{mov.lote || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs" title={mov.referenciaDocumento || mov.motivo}>{mov.referenciaDocumento || mov.motivo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{getSupplierName(mov.proveedorId)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right">{mov.precioCoste ? `${mov.precioCoste.toFixed(2)}€` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionEntradasFabricaPanel;
