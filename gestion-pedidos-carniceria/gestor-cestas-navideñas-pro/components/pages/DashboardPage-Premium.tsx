import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  Euro,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Target,
  Gift,
  BarChart3,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
  description,
}) => {
  const isPositive = change >= 0;

  return (
    <Card variant="premium" className="group hover:scale-105 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center space-x-2 mt-2">
          <div
            className={cn(
              "flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const metrics = [
    {
      title: "Ventas Totales",
      value: "€45,231",
      change: 12.5,
      icon: Euro,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "vs mes anterior",
    },
    {
      title: "Pedidos Activos",
      value: "127",
      change: 8.2,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "en proceso",
    },
    {
      title: "Clientes",
      value: "2,845",
      change: -2.1,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "clientes activos",
    },
    {
      title: "Cestas Creadas",
      value: "189",
      change: 15.3,
      icon: Gift,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      description: "este mes",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "María García",
      amount: "€125.50",
      status: "pending",
      date: "2024-01-15",
    },
    {
      id: "ORD-002",
      customer: "Juan Pérez",
      amount: "€89.20",
      status: "completed",
      date: "2024-01-15",
    },
    {
      id: "ORD-003",
      customer: "Ana Martín",
      amount: "€234.80",
      status: "processing",
      date: "2024-01-14",
    },
    {
      id: "ORD-004",
      customer: "Carlos López",
      amount: "€156.30",
      status: "completed",
      date: "2024-01-14",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completado</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="default">Procesando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard Premium
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control de Cestas Navideñas Pro
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 días
          </Button>
          <Button variant="premium" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Informes
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card variant="premium" className="lg:col-span-2">
          <CardHeader>
            <CardTitle gradient>Evolución de Ventas</CardTitle>
            <CardDescription>
              Rendimiento de ventas en los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Gráfico de ventas interactivo</p>
                <p className="text-sm text-gray-400 mt-2">
                  Datos en tiempo real actualizándose...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle>Productos Populares</CardTitle>
            <CardDescription>Top 5 productos más vendidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Cesta Premium", sales: 45, trend: "up" },
              { name: "Cesta Familiar", sales: 38, trend: "up" },
              { name: "Cesta Deluxe", sales: 32, trend: "down" },
              { name: "Cesta Tradicional", sales: 28, trend: "up" },
              { name: "Cesta Gourmet", sales: 24, trend: "up" },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{product.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{product.sales}</span>
                  {product.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card variant="premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle gradient>Pedidos Recientes</CardTitle>
            <CardDescription>
              Últimos pedidos realizados en la plataforma
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Pedido
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Importe
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {order.amount}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-gray-600">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Operaciones frecuentes para agilizar tu trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="premium" className="h-16 flex-col space-y-2">
              <Package className="h-5 w-5" />
              <span>Nuevo Producto</span>
            </Button>
            <Button variant="default" className="h-16 flex-col space-y-2">
              <Gift className="h-5 w-5" />
              <span>Crear Cesta</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Users className="h-5 w-5" />
              <span>Añadir Cliente</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
