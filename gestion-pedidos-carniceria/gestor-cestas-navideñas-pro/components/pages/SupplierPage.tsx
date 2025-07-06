import React, { useState, useMemo } from 'react';
import { Supplier } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import SupplierForm from '../suppliers/SupplierForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, TrashIcon, FunnelIcon } from '../icons/HeroIcons';

const SupplierPage: React.FC = () => {
  const { suppliers } = useData(); // remove add/update/delete, handled by form or here
  const { addToast } = useToast();
  const confirmAction = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const openModalForNew = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    confirmAction('¿Está seguro de que desea eliminar este proveedor? Esto podría afectar a productos existentes.', () => {
      try {
        const dataContext = useData(); // Re-access for delete
        dataContext.deleteSupplier(supplierId);
        addToast('Proveedor eliminado correctamente.', 'success');
      } catch (error) {
        addToast('Error al eliminar el proveedor.', 'error');
        console.error(error);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Proveedores</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
             <Input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nuevo Proveedor
            </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <SupplierForm supplier={editingSupplier} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{supplier.contactPerson || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{supplier.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{supplier.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(supplier)} aria-label="Editar">
                    <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSupplier(supplier.id)} aria-label="Eliminar">
                    <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                        {suppliers.length === 0 ? "No hay proveedores registrados." : "No se encontraron proveedores que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierPage;
