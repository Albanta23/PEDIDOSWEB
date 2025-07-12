import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaStock from './FormularioEntradaStock';
import { getMovimientosStock } from '../services/movimientosStockService';
import { getProveedores } from '../services/proveedoresService'; // For fetching supplier names
import { useProductos } from './ProductosContext';
import { Button } from './ui/Button'; // Assuming relative path
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'; // Assuming relative path
import { PlusCircle, ListChecks, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'; // Icons

// Define a constant for the factory/central warehouse ID
const ID_ALMACEN_FABRICA = 'tienda9';
const NOMBRE_ALMACEN_FABRICA = 'Fábrica / Almacén Central';

// Importar iconos adicionales
import { User, Shield } from 'lucide-react';

const GestionEntradasFabricaPanel = ({ onClose, userRole = 'usuario' }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();
  const [proveedoresMap, setProveedoresMap] = useState({});
  
  // Permisos basados en el rol - Ahora todos tienen acceso completo
  const esAdministrador = userRole === 'administrador';
  const puedeRegistrarEntradas = true; // Tanto usuario como administrador pueden registrar entradas

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
    return proveedoresMap[supplierId] || supplierId || '-';
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-2xl text-gray-800 flex items-center">
                <div className="mr-3">
                  {esAdministrador ? (
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-purple-600 mr-2" />
                      <span className="text-purple-700 text-sm font-medium bg-purple-100 px-2 py-1 rounded">
                        Administrador
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <User className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="text-blue-700 text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                        Usuario
                      </span>
                    </div>
                  )}
                </div>
                Gestión de Entradas - {NOMBRE_ALMACEN_FABRICA}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} title="Cerrar Panel">
              <XCircle className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!mostrarFormulario && (
            <Button
              variant="premium"
              size="lg"
              onClick={() => setMostrarFormulario(true)}
              className="mb-6 w-full md:w-auto"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Registrar Nueva Entrada en Fábrica
            </Button>
          )}

          {mostrarFormulario && (
            <Card variant="outline" className="mb-6 p-2 md:p-0 shadow-inner bg-slate-50"> {/* Contenedor del formulario */}
              {/* FormularioEntradaStock ya tiene su propio Card, así que podemos quitar este Card si FormularioEntradaStock se ve bien solo */}
              <FormularioEntradaStock
                tiendaId={ID_ALMACEN_FABRICA}
                onEntradaRegistrada={handleEntradaRegistrada}
                contexto="fabrica"
              />
              <div className="mt-4 flex justify-end p-4 md:p-0">
                <Button variant="outline" onClick={() => setMostrarFormulario(false)}>
                  Cancelar Nueva Entrada
                </Button>
              </div>
            </Card>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                <ListChecks className="mr-2 h-6 w-6 text-primary-500"/>
                Historial de Entradas en Fábrica
              </h3>
              <Button variant="outline" size="sm" onClick={cargarHistorialEntradas} disabled={cargandoHistorial}>
                <RefreshCw className={`mr-2 h-4 w-4 ${cargandoHistorial ? 'animate-spin' : ''}`} />
                Refrescar
              </Button>
            </div>

            {cargandoHistorial && (
              <div className="flex justify-center items-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
                <p className="ml-3 text-gray-600">Cargando historial...</p>
              </div>
            )}
            {errorHistorial && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2"/> {errorHistorial}
              </div>
            )}
            {!cargandoHistorial && !errorHistorial && historialEntradas.length === 0 && (
              <div className="text-center py-10 bg-gray-100 rounded-lg">
                <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-3"/>
                <p className="text-gray-500">No hay entradas registradas para la fábrica.</p>
              </div>
            )}
            {!cargandoHistorial && !errorHistorial && historialEntradas.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unidad</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lote</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref./Motivo</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">P. Coste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historialEntradas.map((mov) => (
                      <tr key={mov._id || mov.fecha + mov.producto} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(mov.fecha).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{getProductName(mov.producto)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{mov.cantidad}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{mov.unidad}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{mov.lote || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={mov.referenciaDocumento || mov.motivo}>{mov.referenciaDocumento || mov.motivo || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getSupplierName(mov.proveedorId)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{mov.precioCoste ? `${mov.precioCoste.toFixed(2)}€` : '-'}</td>
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
