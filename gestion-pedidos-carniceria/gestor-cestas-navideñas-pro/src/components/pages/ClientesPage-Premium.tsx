import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { API_ENDPOINTS } from '../../config/api';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Building,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  UserCheck,
  UserX,
  Activity,
  Gift,
  Sparkles,
} from 'lucide-react';

interface Cliente {
  _id: string;
  codigo: string;
  nombre: string;
  razonSocial: string;
  nif: string;
  email: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  contacto: string;
  activo: boolean;
  esCestaNavidad: boolean;
  observaciones?: string;
}

interface ClientesStats {
  total: number;
  activos: number;
  inactivos: number;
  conEmail: number;
  conTelefono: number;
}

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [provinciasFilter, setProvinciasFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClientesStats>({
    total: 0,
    activos: 0,
    inactivos: 0,
    conEmail: 0,
    conTelefono: 0
  });

  // Cargar clientes de cestas navideñas desde el backend
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.clientes.getCestasNavidad);
      const data = await response.json();
      
      if (data.clientes) {
        setClientes(data.clientes);
        setFilteredClientes(data.clientes);
        calcularEstadisticas(data.clientes);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas de los clientes
  const calcularEstadisticas = (clientesData: Cliente[]) => {
    const stats = {
      total: clientesData.length,
      activos: clientesData.filter(c => c.activo).length,
      inactivos: clientesData.filter(c => !c.activo).length,
      conEmail: clientesData.filter(c => c.email && c.email.trim() !== '').length,
      conTelefono: clientesData.filter(c => c.telefono && c.telefono.trim() !== '').length,
    };
    setStats(stats);
  };

  // Filtrar clientes
  useEffect(() => {
    let filtered = clientes;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.poblacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.provincia.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'activos') {
        filtered = filtered.filter(c => c.activo);
      } else if (statusFilter === 'inactivos') {
        filtered = filtered.filter(c => !c.activo);
      } else if (statusFilter === 'con-email') {
        filtered = filtered.filter(c => c.email && c.email.trim() !== '');
      } else if (statusFilter === 'con-telefono') {
        filtered = filtered.filter(c => c.telefono && c.telefono.trim() !== '');
      }
    }

    // Filtro por provincia
    if (provinciasFilter !== 'all') {
      filtered = filtered.filter(c => c.provincia.trim() === provinciasFilter);
    }

    setFilteredClientes(filtered);
  }, [searchTerm, statusFilter, provinciasFilter, clientes]);

  // Obtener provincias únicas
  const provinciasUnicas = [...new Set(clientes.map(c => c.provincia.trim()))].sort();

  // Formatear texto (limpiar espacios extra)
  const formatText = (text: string) => text?.trim() || '';

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
            Clientes Cestas Navideñas
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de clientes para cestas navideñas premium
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="premium" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">cestas navideñas</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Activos
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activos}</div>
            <div className="text-xs text-gray-500 mt-1">disponibles</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inactivos
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <UserX className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.inactivos}</div>
            <div className="text-xs text-gray-500 mt-1">no disponibles</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Con Email
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <Mail className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.conEmail}</div>
            <div className="text-xs text-gray-500 mt-1">contactables</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Con Teléfono
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-100">
              <Phone className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.conTelefono}</div>
            <div className="text-xs text-gray-500 mt-1">contactables</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                variant="premium"
                placeholder="Buscar por nombre, código, NIF, población..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos los estados</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
                <option value="con-email">Con email</option>
                <option value="con-telefono">Con teléfono</option>
              </select>
              
              <select
                value={provinciasFilter}
                onChange={(e) => setProvinciasFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todas las provincias</option>
                {provinciasUnicas.map(provincia => (
                  <option key={provincia} value={provincia}>{provincia}</option>
                ))}
              </select>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <Card variant="premium" className="text-center py-12">
          <CardContent>
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Cargando clientes...</p>
          </CardContent>
        </Card>
      ) : filteredClientes.length === 0 ? (
        <Card variant="premium" className="text-center py-12">
          <CardContent>
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No hay clientes de cestas navideñas
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'Aún no tienes clientes marcados para cestas navideñas.'}
            </p>
            <Button variant="premium" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Añadir Primer Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => (
            <Card
              key={cliente._id}
              variant="premium"
              className="group hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="h-5 w-5 text-red-600" />
                      <Badge variant="success" className="bg-red-100 text-red-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Cesta Navidad
                      </Badge>
                      {cliente.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {formatText(cliente.nombre)}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mb-1">
                      Código: {formatText(cliente.codigo)}
                    </p>
                    <p className="text-sm text-gray-500">
                      NIF: {formatText(cliente.nif)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  {formatText(cliente.email) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{formatText(cliente.email)}</span>
                    </div>
                  )}
                  {formatText(cliente.telefono) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{formatText(cliente.telefono)}</span>
                    </div>
                  )}
                </div>

                {/* Dirección */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{formatText(cliente.direccion)}</span>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    {formatText(cliente.codigoPostal)} {formatText(cliente.poblacion)}
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    {formatText(cliente.provincia)}
                  </div>
                </div>

                {/* Razón Social si es diferente */}
                {formatText(cliente.razonSocial) !== formatText(cliente.nombre) && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="truncate text-gray-600">
                      {formatText(cliente.razonSocial)}
                    </span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Gift className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

export default ClientesPage;
