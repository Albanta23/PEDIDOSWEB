import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Plus,
  Search,
  Filter,
  Package,
  Star,
  TrendingUp,
  Euro,
} from 'lucide-react';

const ProductManagementPagePremium: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Las categorías se llenarán dinámicamente cuando se añadan productos

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Gestión de Productos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra tu catálogo de productos para cestas navideñas
          </p>
        </div>
        <Button variant="premium" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-1">productos registrados</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Productos Activos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-1">disponibles</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total Stock
            </CardTitle>
            <Euro className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">€0.00</div>
            <div className="text-xs text-gray-500 mt-1">inventario actual</div>
          </CardContent>
        </Card>

        <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rating Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500 mt-1">sin productos que evaluar</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                variant="premium"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todas las categorías</option>
                {/* Las categorías aparecerán aquí cuando se añadan productos */}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State - Sin productos */}
      <Card variant="premium" className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Tu catálogo está vacío
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Comienza añadiendo productos a tu inventario para gestionar tu catálogo de cestas navideñas premium.
          </p>
          <Button variant="premium" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Añadir Primer Producto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagementPagePremium;
