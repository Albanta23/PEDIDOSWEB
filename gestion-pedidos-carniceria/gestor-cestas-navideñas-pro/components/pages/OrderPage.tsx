import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import OrderForm from '../orders/OrderForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, EyeIcon, DocumentTextIcon, FunnelIcon, TruckIcon, CheckCircleIcon } from '../icons/HeroIcons';
import { getOrderStatusColor } from '../../constants'; // ORDER_STATUS_OPTIONS eliminado
import { getPaymentMethodDescription } from '../../utils/getPaymentMethodDescription';

const OrderPage: React.FC = () => {
  const { orders, customers, generateInvoiceForOrder, getOrderById, updateOrder, invoices } = useData();
  const { addToast } = useToast();
  const confirmAction = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customer = customers.find(c => c.id === order.customerId);
      return (
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); // Sort by most recent
  }, [orders, customers, searchTerm]);


  const openModalForNew = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const openViewModal = (orderId: string) => {
    const orderToView = getOrderById(orderId);
    if(orderToView) {
        setViewingOrder(orderToView);
        setIsViewModalOpen(true);
    } else {
        addToast('Pedido no encontrado.', 'error');
    }
  };

  const handleSaveSuccess = () => { 
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleGenerateInvoice = (orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) {
      addToast("Pedido no encontrado.", "error");
      return;
    }
    const existingInvoice = invoices.find(inv => inv.orderId === orderId);
    if (existingInvoice) {
        addToast(`La factura ${existingInvoice.invoiceNumber} ya existe para este pedido.`, 'info');
        // Optionally open the invoice view modal or navigate
        return;
    }

    const invoice = generateInvoiceForOrder(orderId);
    if (invoice) {
      addToast(`Factura ${invoice.invoiceNumber} generada para el pedido ${order.orderNumber}.`, 'success');
    } else {
      addToast("Error al generar la factura.", 'error');
    }
  };

  const handleQuickStatusChange = (order: Order, newStatus: OrderStatus) => {
    confirmAction(`¿Está seguro de cambiar el estado del pedido ${order.orderNumber} a "${newStatus}"?`, () => {
        try {
            updateOrder({ ...order, status: newStatus }, order.status); // Pass original status for stock logic
            addToast(`Estado del pedido ${order.orderNumber} actualizado a "${newStatus}".`, 'success');
        } catch(e) {
            addToast(`Error al actualizar estado: ${(e as Error).message}`, 'error');
        }
    });
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Pedidos</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
             <Input
              type="text"
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nuevo Pedido
            </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOrder ? `Editar Pedido: ${editingOrder.orderNumber}` : 'Nuevo Pedido'} size="2xl">
        <OrderForm order={editingOrder} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalles del Pedido: ${viewingOrder?.orderNumber}`} size="lg">
        {viewingOrder && (
          <div className="space-y-3">
            <p><strong>Cliente:</strong> {customers.find(c=>c.id === viewingOrder.customerId)?.name || 'N/A'}</p>
            <p><strong>Fecha Pedido:</strong> {new Date(viewingOrder.orderDate).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> <span className={`px-2 py-0.5 text-xs rounded-full ${getOrderStatusColor(viewingOrder.status)}`}>{viewingOrder.status}</span></p>
            <p><strong>Dirección Envío:</strong> {viewingOrder.shippingAddress}</p>
            <p><strong>Forma de Pago:</strong> {getPaymentMethodDescription(viewingOrder.paymentMethod)}</p>
            <div>
              <h4 className="font-semibold mt-2 mb-1">Artículos:</h4>
              <ul className="list-disc list-inside pl-2 space-y-1 bg-neutral-50 p-3 rounded-md border border-neutral-200">
                {viewingOrder.items.map((item, index) => (
                  <li key={index} className="text-sm">{item.hamperName} (x{item.quantity}) - {(item.unitPrice * item.quantity).toFixed(2)}€</li>
                ))}
              </ul>
            </div>
            <p className="font-semibold text-lg text-right">Subtotal: {viewingOrder.totalAmount.toFixed(2)}€</p>
            <p className="text-sm text-neutral-600 text-right">IVA Estimado: {viewingOrder.totalVatAmount.toFixed(2)}€</p>
            <p className="font-bold text-xl text-primary-dark text-right">Total: {(viewingOrder.totalAmount + viewingOrder.totalVatAmount).toFixed(2)}€</p>
            {viewingOrder.notes && <p className="mt-2 pt-2 border-t border-neutral-200"><strong>Notas:</strong> {viewingOrder.notes}</p>}
          </div>
        )}
      </Modal>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nº Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Forma de Pago</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredOrders.map((order) => {
              const customer = customers.find(c => c.id === order.customerId);
              const canInvoice = [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING].includes(order.status) && !invoices.some(inv => inv.orderId === order.id);
              return (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-DEFAULT hover:underline cursor-pointer" onClick={() => openViewModal(order.id)}>{order.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{(order.totalAmount + order.totalVatAmount).toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{getPaymentMethodDescription(order.paymentMethod)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openViewModal(order.id)} aria-label="Ver Pedido" title="Ver Detalles">
                        <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700"/>
                    </Button>
                    {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
                        <Button variant="ghost" size="sm" onClick={() => openModalForEdit(order)} aria-label="Editar Pedido" title="Editar">
                            <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800"/>
                        </Button>
                    )}
                    {order.status === OrderStatus.PACKAGING && (
                         <Button variant="ghost" size="sm" onClick={() => handleQuickStatusChange(order, OrderStatus.SHIPPED)} title="Marcar como Enviado">
                            <TruckIcon className="h-5 w-5 text-purple-600 hover:text-purple-800"/>
                        </Button>
                    )}
                    {order.status === OrderStatus.SHIPPED && (
                         <Button variant="ghost" size="sm" onClick={() => handleQuickStatusChange(order, OrderStatus.DELIVERED)} title="Marcar como Entregado">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 hover:text-green-800"/>
                        </Button>
                    )}
                    {canInvoice && (
                         <Button variant="ghost" size="sm" onClick={() => handleGenerateInvoice(order.id)} title="Generar Factura">
                            <DocumentTextIcon className="h-5 w-5 text-teal-600 hover:text-teal-800"/>
                        </Button>
                    )}
                  </td>
                </tr>
              );
            })}
             {filteredOrders.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-500">
                        {orders.length === 0 ? "No hay pedidos registrados. Comience creando uno." : "No se encontraron pedidos que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderPage;
