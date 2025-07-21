import React, { useState, useEffect, useCallback } from 'react';
import FormularioEntradaFabricaAvanzado from './FormularioEntradaFabricaAvanzado';
import { getMovimientosStock, registrarEntradaStock } from '../services/movimientosStockService';
import { useProveedores } from './ProveedoresContext';
import { useProductos } from './ProductosContext';
import { Button } from './ui/Button'; // Assuming relative path
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'; // Assuming relative path
import { PlusCircle, ListChecks, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'; // Icons

// Define a constant for the central warehouse ID (almacen central)
const ID_ALMACEN_CENTRAL = 'almacen_central';
const NOMBRE_ALMACEN_CENTRAL = 'Almacén Central';

// Importar iconos adicionales
import { User, Shield } from 'lucide-react';

const GestionEntradasFabricaPanel = ({ onClose, userRole = 'usuario' }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { productos } = useProductos();
  const { proveedores, loading: loadingProveedores, error: errorProveedores } = useProveedores();
  const [formKey, setFormKey] = useState(Date.now());

  const proveedoresMap = proveedores.reduce((acc, p) => {
    acc[p._id] = p.nombre || p.razonComercial || p.codigo;
    return acc;
  }, {});


  // Permisos basados en el rol - Ahora todos tienen acceso completo
  const esAdministrador = userRole === 'administrador';
  const puedeRegistrarEntradas = true; // Tanto usuario como administrador pueden registrar entradas

  const cargarHistorialEntradas = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      const todosMovimientos = await getMovimientosStock({ tiendaId: ID_ALMACEN_CENTRAL });
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

  // Nueva función para registrar entrada avanzada
  /**
   * Flujo de registro de entrada técnica:
   * 1. Valida proveedor, líneas, referencia y fecha.
   * 2. Envía cada línea al servicio de registro, incluyendo todos los datos relevantes.
   * 3. Actualiza el historial y oculta el formulario.
   * 4. Las entradas quedan disponibles para consumo en ventas y expediciones.
   */
  const handleRegistrarEntradaAvanzada = async ({ proveedor, lineas, referenciaDocumento, fechaEntrada }) => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      for (const l of lineas) {
        await registrarEntradaStock({
          tiendaId: ID_ALMACEN_CENTRAL,
          producto: l.producto,
          cantidad: Number(l.cantidad) || 0,
          unidad: 'kg', // Puedes ajustar según el producto
          lote: l.lote,
          motivo: 'Entrada técnica albarán/factura',
          peso: Number(l.peso) || 0,
          proveedorId: proveedor._id,
          precioCoste: Number(l.precioCoste) || 0,
          fechaEntrada,
          referenciaDocumento,
          notas: l.observaciones
        });
      }
      cargarHistorialEntradas();
      setMostrarFormulario(false);
      setFormKey(Date.now()); // Reset the form by changing the key
    } catch (err) {
      setErrorHistorial(`Error al registrar la entrada: ${err.message}`);
    } finally {
      setCargandoHistorial(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-xl font-bold text-gray-800">Panel técnico de entradas en fábrica</CardTitle>
        <p className="text-sm text-gray-600 mt-2">Registro y consulta de entradas técnicas</p>
        {loadingProveedores && <div className="text-blue-600 text-sm mt-2">Cargando proveedores...</div>}
        {errorProveedores && <div className="text-red-600 text-sm mt-2">{errorProveedores}</div>}
      </CardHeader>
      <CardContent className="p-6">
        {/* Sustituir formulario antiguo por el avanzado */}
        {!mostrarFormulario && (
          <Button
            variant="premium"
            size="lg"
            onClick={() => setMostrarFormulario(true)}
            className="mb-6 w-full md:w-auto"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Registrar Nueva Entrada Técnica en Fábrica
          </Button>
        )}

        {mostrarFormulario && (
          <FormularioEntradaFabricaAvanzado
            key={formKey}
            onRegistrar={handleRegistrarEntradaAvanzada}
            onCancel={() => setMostrarFormulario(false)}
          />
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
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Peso (kg)</th>
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{mov.peso ? mov.peso.toFixed(2) : '-'}</td>
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
  );
};

export default GestionEntradasFabricaPanel;
