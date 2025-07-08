import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import BatchOrderForm from '../orders/BatchOrderForm';

const BatchOrderPage: React.FC = () => {
  const { batchOrders, customers, addBatchOrder, updateBatchOrder, deleteBatchOrder, getBatchOrderById } = useData() as any;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    return batchOrders.filter((order: any) => {
      const customer = customers.find((c: any) => c.id === order.clienteId);
      return (
        (order.numeroPedido?.toString() || '').includes(searchTerm) ||
        (customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.estado?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }).sort((a: any, b: any) => new Date(b.fechaPedido || b.fechaCreacion).getTime() - new Date(a.fechaPedido || a.fechaCreacion).getTime());
  }, [batchOrders, customers, searchTerm]);

  const openModalForNew = () => {
    setEditingOrderId(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (orderId: string) => {
    setEditingOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleSave = async (order: any) => {
    if (editingOrderId) {
      await updateBatchOrder(editingOrderId, order);
    } else {
      await addBatchOrder(order);
    }
    setIsModalOpen(false);
    setEditingOrderId(null);
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este pedido de lote?')) {
      await deleteBatchOrder(orderId);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Pedidos de Cestas/Lotes</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Buscar pedidos de lote..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            containerClassName="mb-0 flex-grow"
          />
          <Button onClick={openModalForNew} className="whitespace-nowrap">Nuevo Pedido Lote</Button>
        </div>
      </div>
      {/* Modal para crear/editar pedido de lote (puedes reutilizar un formulario similar al de pedidos normales) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOrderId ? 'Editar Pedido Lote' : 'Nuevo Pedido Lote'} size="2xl">
        <BatchOrderForm
          order={editingOrderId ? getBatchOrderById(editingOrderId) : null}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      <div className="bg-white shadow-lg rounded-lg overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nº Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredOrders.map((order: any) => {
              const customer = customers.find((c: any) => c.id === order.clienteId);
              return (
                <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-DEFAULT">{order.numeroPedido}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer?.name || order.clienteNombre || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{order.fechaPedido ? new Date(order.fechaPedido).toLocaleDateString() : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{order.estado}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(order._id)} aria-label="Editar Pedido" title="Editar">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(order._id)} aria-label="Eliminar Pedido" title="Eliminar">
                      Eliminar
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                  {batchOrders.length === 0 ? 'No hay pedidos de lote registrados.' : 'No se encontraron pedidos de lote que coincidan con su búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchOrderPage;
