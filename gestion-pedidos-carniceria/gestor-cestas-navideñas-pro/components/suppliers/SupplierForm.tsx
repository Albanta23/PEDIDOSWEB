import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Button from '../shared/Button';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSaveSuccess: (supplier: Supplier) => void;
  onCancel: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSaveSuccess, onCancel }) => {
  const { addSupplier, updateSupplier } = useData();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      const { id, ...supplierData } = supplier; // eslint-disable-line @typescript-eslint/no-unused-vars
      setFormData({
        name: supplierData.name || '',
        contactPerson: supplierData.contactPerson || '',
        email: supplierData.email || '',
        phone: supplierData.phone || '',
        address: supplierData.address || '',
      });
    } else {
        setFormData({ name: '', contactPerson: '', email: '', phone: '', address: ''});
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name.trim() === ''){
        addToast('El nombre del proveedor es obligatorio.', 'error');
        return;
    }
    setIsLoading(true);
    try {
      let savedSupplier;
      if (supplier) {
        savedSupplier = { ...formData, id: supplier.id };
        updateSupplier(savedSupplier);
        addToast('Proveedor actualizado correctamente.', 'success');
      } else {
        savedSupplier = addSupplier(formData);
        addToast('Proveedor creado correctamente.', 'success');
      }
      onSaveSuccess(savedSupplier);
    } catch (error) {
      addToast('Error al guardar el proveedor.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre del Proveedor" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Persona de Contacto" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
      <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
      <Input label="Teléfono" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
      <Textarea label="Dirección" name="address" value={formData.address || ''} onChange={handleChange} />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{supplier ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
      </div>
    </form>
  );
};

export default SupplierForm;
