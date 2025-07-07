import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { API_ENDPOINTS } from '../../config/api';
import {
  Plus,
  Search,
  Filter,
  Users,
  Mail,
  Phone,
  MapPin,
  Gift,
  Star,
  Eye,
  Edit,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ClienteFormCestas from './ClienteFormCestas';

interface Cliente {
  _id: string;
  codigo?: string;
  nombre: string;
  razonSocial?: string;
  nif?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codigoPostal?: string;
  poblacion?: string;
  provincia?: string;
  contacto?: string;
  activo: boolean;
  esCestaNavidad: boolean;
  observaciones?: string;
}

interface EstadisticasClientes {
  totalClientes: number;
  clientesCestasNavidad: number;
  clientesNormales: number;
  porcentajeCestas: number;
}

const ClientManagementPagePremium: React.FC = () => {
  console.log("Montando ClientManagementPagePremium");
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cestas' | 'normales'>('cestas');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasClientes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [clienteEdit, setClienteEdit] = useState<any | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  // Cargar clientes y estadísticas al montar el componente
  useEffect(() => {
    console.log("Llamando a cargarDatos, filtroTipo:", filtroTipo);
    cargarDatos();
  }, [filtroTipo]);

  const cargarDatos = async () => {
    console.log("Ejecutando cargarDatos");
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas
      const statsResponse = await fetch(API_ENDPOINTS.clientes.getEstadisticas);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setEstadisticas(stats);
      }

      // Cargar clientes según el filtro
      let url = API_ENDPOINTS.clientes.getAll;
      if (filtroTipo === 'cestas') {
        url = API_ENDPOINTS.clientes.getCestasNavidad;
      }

      const clientesResponse = await fetch(url);
      if (clientesResponse.ok) {
        const data = await clientesResponse.json();
        // Si viene con estructura {clientes: [...]} usar esa, si no usar directamente
        const clientesData = data.clientes || data;
        setClientes(clientesData);
      } else {
        setError('Error al cargar clientes');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes según búsqueda y filtros
  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefono?.includes(searchTerm) ||
                         cliente.poblacion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filtroTipo === 'todos' ||
                       (filtroTipo === 'cestas' && cliente.esCestaNavidad) ||
                       (filtroTipo === 'normales' && !cliente.esCestaNavidad);

    const matchesActivo = filtroActivo === 'todos' ||
                         (filtroActivo === 'activos' && cliente.activo) ||
                         (filtroActivo === 'inactivos' && !cliente.activo);

    return matchesSearch && matchesTipo && matchesActivo;
  });

  const getClienteBadge = (cliente: Cliente) => {
    if (cliente.esCestaNavidad && cliente.activo) {
      return <Badge variant="success">Normal + Cestas</Badge>;
    } else if (cliente.esCestaNavidad) {
      return <Badge variant="default">Solo Cestas</Badge>;
    } else if (cliente.activo) {
      return <Badge variant="outline">Solo Normal</Badge>;
    } else {
      return <Badge variant="destructive">Inactivo</Badge>;
    }
  };

  const formatearTelefono = (telefono?: string) => {
    if (!telefono) return '-';
    const tel = telefono.trim();
    if (tel.length === 9) {
      return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`;
    }
    return tel;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Cargando clientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 mt-2">
            Administra tus clientes y cestas navideñas premium
          </p>
        </div>
        <Button variant="premium" size="lg" onClick={() => { setClienteEdit(null); setReadOnly(false); setShowForm(true); }}>
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>
      {showForm && (
        <ClienteFormCestas
          cliente={clienteEdit}
          readOnly={readOnly}
          onSuccess={() => { setShowForm(false); setClienteEdit(null); setReadOnly(false); cargarDatos(); }}
          onCancel={() => { setShowForm(false); setClienteEdit(null); setReadOnly(false); }}
        />
      )}

      {/* Error State */}
      {error && (
        <Card variant="default" className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <Button variant="outline" size="sm" onClick={cargarDatos}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{estadisticas.totalClientes}</div>
              <div className="text-xs text-gray-500 mt-1">clientes registrados</div>
            </CardContent>
          </Card>

          <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cestas Navideñas
              </CardTitle>
              <Gift className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{estadisticas.clientesCestasNavidad}</div>
              <div className="text-xs text-gray-500 mt-1">clientes premium</div>
            </CardContent>
          </Card>

          <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clientes Normales
              </CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{estadisticas.clientesNormales}</div>
              <div className="text-xs text-gray-500 mt-1">clientes estándar</div>
            </CardContent>
          </Card>

          <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                % Cestas Premium
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{estadisticas.porcentajeCestas}%</div>
              <div className="text-xs text-gray-500 mt-1">conversión premium</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                variant="premium"
                placeholder="Buscar por nombre, email, teléfono o población..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="todos">Todos los tipos</option>
                <option value="cestas">Solo Cestas Navideñas</option>
                <option value="normales">Solo Normales</option>
              </select>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Solo Activos</option>
                <option value="inactivos">Solo Inactivos</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {clientesFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <Card
              key={cliente._id}
              variant="premium"
              className="group hover:scale-105 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {cliente.nombre}
                    </CardTitle>
                    {cliente.razonSocial && cliente.razonSocial !== cliente.nombre && (
                      <p className="text-sm text-gray-500 mt-1">{cliente.razonSocial}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getClienteBadge(cliente)}
                    {cliente.codigo && (
                      <span className="text-xs text-gray-400">#{cliente.codigo}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {cliente.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{formatearTelefono(cliente.telefono)}</span>
                    </div>
                  )}
                  {(cliente.poblacion || cliente.provincia) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 truncate">
                        {[cliente.poblacion, cliente.provincia].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* NIF */}
                {cliente.nif && (
                  <div className="text-sm">
                    <span className="text-gray-500">NIF: </span>
                    <span className="font-mono text-gray-700">{cliente.nif.trim()}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setClienteEdit(cliente); setReadOnly(true); setShowForm(true); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setClienteEdit(cliente); setReadOnly(false); setShowForm(true); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {cliente.esCestaNavidad && (
                    <Button variant="premium" size="sm">
                      <Gift className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card variant="premium" className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Intenta cambiar los filtros de búsqueda o ajustar los criterios.'
                : 'Comienza añadiendo clientes para gestionar tus cestas navideñas premium.'
              }
            </p>
            {!searchTerm && (
              <Button variant="premium" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Añadir Primer Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Watermark */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-1.5 shadow-lg hover:bg-white/95 transition-all">
          <span className="text-xs font-mono font-bold text-gray-800 tracking-wider">
            JCF2025DV
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClientManagementPagePremium;
