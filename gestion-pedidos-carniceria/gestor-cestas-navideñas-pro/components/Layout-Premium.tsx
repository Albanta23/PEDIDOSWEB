import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../src/contexts/ThemeContext';
import { Button } from './ui/Button';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Bell,
  Search,
  Gift,
  Warehouse,
  Calculator,
  Receipt,
  Truck,
  Building,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Productos',
    href: '/products',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Cestas',
    href: '/hampers',
    icon: Gift,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Inventario',
    href: '/inventory',
    icon: Warehouse,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'Presupuestos',
    href: '/quotes',
    icon: Calculator,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    name: 'Pedidos',
    href: '/orders',
    icon: ShoppingCart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    name: 'Facturación',
    href: '/invoices',
    icon: Receipt,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Clientes',
    href: '/customers',
    icon: Users,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    name: 'Proveedores',
    href: '/suppliers',
    icon: Truck,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    name: 'Info Fiscal',
    href: '/tax-info',
    icon: Building,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  {
    name: 'Pedidos Cestas/Lotes',
    href: '/batch-orders',
    icon: Gift,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0" +
          (sidebarOpen ? " translate-x-0" : " -translate-x-full")
        }
      >
        <div className="flex h-full flex-col bg-white/80 backdrop-blur-lg border-r border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm">
                CN
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Cestas Pro
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-premium">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200" +
                    (isActive
                      ? " bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105"
                      : " text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white")
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-md mr-3 transition-colors" +
                      (isActive ? " bg-white/20" : ` ${item.bgColor} dark:bg-gray-700`)
                    }
                  >
                    <Icon
                      className={
                        "h-4 w-4" + (isActive ? " text-white" : item.color)
                      }
                    />
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                v2.0.0 Premium
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 w-64 text-sm bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-gray-800 dark:text-white dark:focus:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuario Admin
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
