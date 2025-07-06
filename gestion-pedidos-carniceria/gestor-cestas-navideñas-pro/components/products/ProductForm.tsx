import React, { useState, useEffect } from 'react';
import { Product, PRODUCT_FAMILIES } from '../../types';
import { VAT_RATES, PRODUCT_UNITS } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Select from '../shared/forms/Select';
import Button from '../shared/Button';

interface ProductFormProps {
  product?: Product | null;
  onSaveSuccess: (product: Product) => void; // Changed to indicate success specifically
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSaveSuccess, onCancel }) => {
  const { suppliers, addProduct, updateProduct } = useData();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    costPrice: 0,
    stock: 0,
    unit: PRODUCT_UNITS[0],
    weightGrams: 0,
    volumeMilliliters: undefined,
    vatRate: VAT_RATES.find(r => r.value === 0.21)?.value || 0.21,
    supplierId: undefined,
    family: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      const { id, ...productData } = product; // eslint-disable-line @typescript-eslint/no-unused-vars
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        costPrice: productData.costPrice || 0,
        stock: productData.stock || 0,
        unit: productData.unit || PRODUCT_UNITS[0],
        weightGrams: productData.weightGrams || 0,
        volumeMilliliters: productData.volumeMilliliters, 
        vatRate: productData.vatRate || 0.21,
        supplierId: productData.supplierId, 
        family: productData.family || undefined,
      });
    } else {
         setFormData({
            name: '', description: '', costPrice: 0, stock: 0, unit: PRODUCT_UNITS[0],
            weightGrams: 0, volumeMilliliters: undefined, vatRate: 0.21, supplierId: undefined, family: undefined,
        });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'costPrice' || name === 'stock' || name === 'weightGrams' || name === 'volumeMilliliters' || name === 'vatRate') 
                     ? parseFloat(value) : value;
    setFormData(prev => ({ 
        ...prev, 
        [name]: (name === 'volumeMilliliters' && value === '') ? undefined : 
                (name === 'family' && value === '') ? undefined : numValue 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name.trim() === '') {
        addToast('El nombre del producto es obligatorio.', 'error');
        return;
    }
    setIsLoading(true);
    try {
      let savedProduct;
      if (product) {
        savedProduct = { ...formData, id: product.id };
        updateProduct(savedProduct);
        addToast('Producto actualizado correctamente.', 'success');
      } else {
        // ID will be set by context if new
        savedProduct = addProduct(formData); 
        addToast('Producto creado correctamente.', 'success');
      }
      onSaveSuccess(savedProduct);
    } catch (error) {
      addToast('Error al guardar el producto.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre del Producto" name="name" value={formData.name} onChange={handleChange} required />
      <Textarea label="Descripción" name="description" value={formData.description} onChange={handleChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Precio de Costo (€)" name="costPrice" type="number" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} required />
        <Input label="Stock Actual" name="stock" type="number" step="1" min="0" value={formData.stock} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Unidad" name="unit" value={formData.unit} onChange={handleChange} options={PRODUCT_UNITS.map(u => ({ value: u, label: u }))} />
        <Select label="Tasa de IVA" name="vatRate" value={formData.vatRate} onChange={handleChange} options={VAT_RATES} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Peso (gramos)" name="weightGrams" type="number" step="1" min="0" value={formData.weightGrams} onChange={handleChange} required />
        <Input label="Volumen (mililitros)" name="volumeMilliliters" type="number" step="1" min="0" value={formData.volumeMilliliters || ''} onChange={handleChange} placeholder="Opcional" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Proveedor (Opcional)" name="supplierId" value={formData.supplierId || ''} onChange={handleChange} options={supplierOptions} placeholder="Seleccionar proveedor" />
        <Select label="Familia Producto (Opcional)" name="family" value={formData.family || ''} onChange={handleChange} options={PRODUCT_FAMILIES.map(f => ({ value: f, label: f }))} placeholder="Seleccionar familia" />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{product ? 'Guardar Cambios' : 'Crear Producto'}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
