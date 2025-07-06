import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import CustomerForm from '../customers/CustomerForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, TrashIcon, FunnelIcon } from '../icons/HeroIcons';

const CustomerPage: React.FC = () => {
  const { customers } = useData(); // addCustomer, updateCustomer, deleteCustomer removed from here
  const { addToast } = useToast();
  const confirmAction = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.cifNif?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const openModalForNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    confirmAction('¿Está seguro de que desea eliminar este cliente? Esto podría afectar a pedidos/facturas existentes.', () => {
      try {
        const dataContext = useData(); // Re-access for delete
        dataContext.deleteCustomer(customerId);
        addToast('Cliente eliminado correctamente.', 'success');
      } catch (error) {
        addToast('Error al eliminar el cliente.', 'error');
        console.error(error);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Clientes</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nuevo Cliente
            </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <CustomerForm customer={editingCustomer} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">CIF/NIF</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer.cifNif || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(customer)} aria-label="Editar">
                    <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id)} aria-label="Eliminar">
                    <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
                  </Button>
                </td>
              </tr>
            ))}
             {filteredCustomers.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                        {customers.length === 0 ? "No hay clientes registrados. Comience añadiendo uno." : "No se encontraron clientes que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerPage;
