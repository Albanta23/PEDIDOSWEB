import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { CubeIcon, ArchiveBoxIcon, DocumentTextIcon, UsersIcon, DocumentMagnifyingGlassIcon, ClipboardDocumentListIcon, CurrencyEuroIcon, ChartBarIcon, CalendarDaysIcon, ShoppingBagIcon } from '../icons/HeroIcons'; // Added ShoppingBagIcon
import { OrderStatus, QuoteStatus, PaymentStatus } from '../../types';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, linkTo }) => {
  const content = (
    <div className={`bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-l-4 ${color.replace('bg-', 'border-')}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} text-white mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-600 font-medium">{title}</p>
          <p className="text-2xl font-semibold text-neutral-800">{value}</p>
        </div>
      </div>
    </div>
  );
  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
};

const DashboardPage: React.FC = () => {
  const { products, hampers, orders, customers, quotes, invoices, activityLog } = useData();

  const processingOrdersCount = useMemo(() => orders.filter(o => o.status === OrderStatus.PROCESSING).length, [orders]);
  const pendingQuotesCount = useMemo(() => quotes.filter(q => q.status === QuoteStatus.SENT || q.status === QuoteStatus.DRAFT).length, [quotes]);
  const unpaidInvoicesCount = useMemo(() => invoices.filter(i => i.paymentStatus === PaymentStatus.PENDING || i.paymentStatus === PaymentStatus.OVERDUE).length, [invoices]);
  
  const lowStockProducts = useMemo(() => products.filter(p => p.stock < 10), [products]);

  const topSellingHampers = useMemo(() => {
    const hamperSales: { [hamperId: string]: { name: string; count: number } } = {};
    orders.forEach(order => {
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED || order.status === OrderStatus.PROCESSING) { // Consider these as "sold"
        order.items.forEach(item => {
          const hamper = hampers.find(h => h.id === item.hamperId);
          if (hamper) {
            if (hamperSales[item.hamperId]) {
              hamperSales[item.hamperId].count += item.quantity;
            } else {
              hamperSales[item.hamperId] = { name: hamper.name, count: item.quantity };
            }
          }
        });
      }
    });
    return Object.values(hamperSales).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders, hampers]);

  const monthlySalesTotal = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return orders
      .filter(order => {
        const orderDate = new Date(order.orderDate);
        return (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED) &&
               orderDate.getMonth() === currentMonth &&
               orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);
  
  const recentActivities = useMemo(() => activityLog.slice(0, 7), [activityLog]);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-neutral-900 mb-8">Panel de Control</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Productos Totales" value={products.length} icon={<CubeIcon className="h-6 w-6"/>} color="bg-sky-500" linkTo="/products"/>
        <StatCard title="Cestas Definidas" value={hampers.length} icon={<ArchiveBoxIcon className="h-6 w-6"/>} color="bg-emerald-500" linkTo="/hampers"/>
        <StatCard title="Presupuestos Pendientes" value={pendingQuotesCount} icon={<DocumentMagnifyingGlassIcon className="h-6 w-6"/>} color="bg-amber-500" linkTo="/quotes"/>
        <StatCard title="Pedidos en Proceso" value={processingOrdersCount} icon={<ClipboardDocumentListIcon className="h-6 w-6"/>} color="bg-indigo-500" linkTo="/orders"/>
        <StatCard title="Facturas Pendientes de Pago" value={unpaidInvoicesCount} icon={<DocumentTextIcon className="h-6 w-6"/>} color="bg-rose-500" linkTo="/invoices"/>
        <StatCard title="Clientes Registrados" value={customers.length} icon={<UsersIcon className="h-6 w-6"/>} color="bg-purple-500" linkTo="/customers"/>
        <StatCard title="Ventas de Este Mes" value={`${monthlySalesTotal.toFixed(2)}€`} icon={<CurrencyEuroIcon className="h-6 w-6"/>} color="bg-teal-500" linkTo="/orders"/>
        <StatCard title="Productos con Bajo Stock" value={lowStockProducts.length} icon={<ShoppingBagIcon className="h-6 w-6"/>} color="bg-orange-500" linkTo="/inventory"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-primary-DEFAULT"/>
            Cestas Más Vendidas (Top 5)
          </h2>
          {topSellingHampers.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {topSellingHampers.map(hamper => (
                <li key={hamper.name + '-' + hamper.count} className="py-3 flex justify-between items-center">
                  <p className="text-md text-neutral-700">{hamper.name}</p>
                  <p className="text-md font-semibold text-primary-dark">{hamper.count} vendidas</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 py-4 text-center">No hay datos de ventas de cestas suficientes.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-primary-DEFAULT"/>
             Actividad Reciente
          </h2>
          {recentActivities.length > 0 ? (
            <ul className="space-y-3">
              {recentActivities.map(activity => (
                <li key={activity.id + '-' + activity.timestamp} className="text-sm text-neutral-600 border-l-2 border-primary-light pl-3 py-1">
                  <span className="font-medium text-neutral-700">{activity.message}</span>
                  <br/>
                  <span className="text-xs text-neutral-400">{new Date(activity.timestamp).toLocaleString('es-ES')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 py-4 text-center">No hay actividad reciente registrada.</p>
          )}
        </div>
      </div>

       <div className="mt-6 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <ShoppingBagIcon className="h-6 w-6 mr-2 text-orange-500"/>
            Productos con Bajo Stock (&lt;10 unidades)
          </h2>
          {lowStockProducts.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {lowStockProducts.map(product => (
                <li key={product.id} className="py-3 flex justify-between items-center">
                  <Link to="/inventory" className="text-md text-primary-DEFAULT hover:underline">{product.name}</Link>
                  <p className={`text-md font-semibold ${product.stock < 5 ? 'text-red-600' : 'text-yellow-700'}`}>{product.stock} {product.unit}(s)</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 py-4 text-center">¡Buen trabajo! No hay productos con bajo stock.</p>
          )}
        </div>
    </div>
  );
};

export default DashboardPage;
