import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useData } from '../../contexts/DataContext';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Button from '../shared/Button';

interface CustomerFormProps {
  customer?: Customer | null;
  onSaveSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSaveSuccess, onCancel }) => {
  const { addCustomer, updateCustomer } = useData();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cifNif: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      const { id, ...customerData } = customer; // eslint-disable-line @typescript-eslint/no-unused-vars
      setFormData({
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        cifNif: customerData.cifNif || '',
      });
    } else {
        setFormData({ name: '', email: '', phone: '', address: '', cifNif: '' });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (formData.name.trim() === '') {
        addToast('El nombre del cliente es obligatorio.', 'error');
        return;
    }
    if (formData.email.trim() === '' || !formData.email.includes('@')) { 
        addToast('Por favor, introduzca un email válido.', 'error');
        return;
    }
    setIsLoading(true);
    try {
      let savedCustomer;
      if (customer) {
        savedCustomer = { ...formData, id: customer.id };
        updateCustomer(savedCustomer);
        addToast('Cliente actualizado correctamente.', 'success');
      } else {
        savedCustomer = addCustomer(formData);
        addToast('Cliente creado correctamente.', 'success');
      }
      onSaveSuccess(savedCustomer);
    } catch (error) {
      addToast('Error al guardar el cliente.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre Completo o Razón Social" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <Input label="Teléfono" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
      <Textarea label="Dirección" name="address" value={formData.address || ''} onChange={handleChange} />
      <Input label="CIF/NIF" name="cifNif" value={formData.cifNif || ''} onChange={handleChange} />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{customer ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
      </div>
    </form>
  );
};

export default CustomerForm;
