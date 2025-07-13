import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaFabricaAvanzado from './FormularioEntradaFabricaAvanzado';
import { getMovimientosStock, registrarEntradaStock } from '../services/movimientosStockService';
import { useProveedores } from './ProveedoresContext';
import { useProductos } from './ProductosContext';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { PlusCircle, ListChecks, RefreshCw, AlertTriangle, PackagePlus, Truck, Beef, Carrot, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ID_ALMACEN_FABRICA = 'tienda9';

const GestionEntradasFabricaPanel = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();
  const [chartData, setChartData] = useState([]);
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

      // Process data for chart
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const entriesByDay = last7Days.map(day => {
        const dayEntries = entradas.filter(e => e.fecha.startsWith(day));
        return {
          name: new Date(day).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          entradas: dayEntries.length,
        };
      });
      setChartData(entriesByDay);

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
        <CardHeader className="bg-gradient-to-br from-gray-50 to-blue-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="p-3 bg-blue-200 rounded-full mr-4">
                <PackagePlus className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle gradient>Gestión de Entradas en Fábrica</CardTitle>
                <CardDescription>Registro y consulta de entradas de mercancía y materias primas.</CardDescription>
              </div>
            </div>
            {!mostrarFormulario && (
              <Button
                variant="premium"
                size="lg"
                onClick={() => setMostrarFormulario(true)}
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Nueva Entrada
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              mostrarFormulario ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {mostrarFormulario && (
              <FormularioEntradaFabricaAvanzado
                onRegistrar={handleRegistrarEntradaAvanzada}
                onCancel={() => setMostrarFormulario(false)}
              />
            )}
          </div>

          <div className={`${mostrarFormulario ? 'hidden' : ''}`}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
              <BarChart2 className="mr-3 h-6 w-6 text-green-500"/>
              Resumen de Actividad (Últimos 7 días)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entradas" fill="#8884d8" name="Nº de Entradas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historialEntradas.map((mov) => {
                  const productName = getProductName(mov.producto);
                  let Icon = PackagePlus;
                  let color = "border-gray-300";
                  if (productName.toLowerCase().includes('ternera') || productName.toLowerCase().includes('cerdo')) {
                    Icon = Beef;
                    color = "border-red-300";
                  } else if (productName.toLowerCase().includes('verdura') || productName.toLowerCase().includes('patata')) {
                    Icon = Carrot;
                    color = "border-green-300";
                  }

                  return (
                    <Card key={mov._id || mov.fecha + mov.producto} variant="glass" className={`border-l-4 ${color}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{productName}</CardTitle>
                            <CardDescription>{new Date(mov.fecha).toLocaleDateString()}</CardDescription>
                          </div>
                          <Icon className="h-6 w-6 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p><strong>Cantidad:</strong> {mov.cantidad} {mov.unidad}</p>
                        <p><strong>Lote:</strong> {mov.lote || '-'}</p>
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-gray-500" />
                          <p><strong>Proveedor:</strong> {getSupplierName(mov.proveedorId)}</p>
                        </div>
                        <p><strong>Coste:</strong> {mov.precioCoste ? `${mov.precioCoste.toFixed(2)}€` : '-'}</p>
                        <p><strong>Ref:</strong> {mov.referenciaDocumento || mov.motivo || '-'}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionEntradasFabricaPanel;
