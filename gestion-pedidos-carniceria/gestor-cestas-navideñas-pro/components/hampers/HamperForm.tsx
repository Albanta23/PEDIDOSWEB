import React, { useState, useEffect, useCallback } from 'react';
import { Hamper, HamperComponent, PRODUCT_FAMILIES } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Select from '../shared/forms/Select';
import Button from '../shared/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/HeroIcons';

interface HamperFormProps {
  hamper?: Hamper | null;
  onSaveSuccess: (hamper: Hamper) => void;
  onCancel: () => void;
}

const HamperForm: React.FC<HamperFormProps> = ({ hamper, onSaveSuccess, onCancel }) => {
  const { products, addHamper, updateHamper, calculateHamperDetails } = useData();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [components, setComponents] = useState<HamperComponent[]>([]);
  const [family, setFamily] = useState<string | undefined>(undefined);
  
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [calculatedWeight, setCalculatedWeight] = useState(0);
  const [calculatedVolume, setCalculatedVolume] = useState(0);
  const [calculatedInputVat, setCalculatedInputVat] = useState(0);
  const [calculatedProfit, setCalculatedProfit] = useState(0);
  const [calculatedProfitPercentage, setCalculatedProfitPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  const updateCalculatedValues = useCallback(() => {
    const details = calculateHamperDetails(components, sellingPrice);
    setCalculatedCost(details.calculatedTotalCostPrice || 0);
    setCalculatedWeight(details.calculatedTotalWeightGrams || 0);
    setCalculatedVolume(details.calculatedTotalVolumeMilliliters || 0);
    setCalculatedInputVat(details.calculatedTotalInputVat || 0);
    setCalculatedProfit(details.calculatedProfit || 0);
    setCalculatedProfitPercentage(details.calculatedProfitPercentage || 0);
  }, [components, sellingPrice, calculateHamperDetails]);

  useEffect(() => {
    if (hamper) {
      setName(hamper.name);
      setDescription(hamper.description);
      setSellingPrice(hamper.sellingPrice);
      setComponents(hamper.components);
      setFamily(hamper.family);
    } else {
      setName('');
      setDescription('');
      setSellingPrice(0);
      setComponents([]);
      setFamily(undefined);
    }
  }, [hamper]);

  useEffect(() => {
    updateCalculatedValues();
  }, [components, sellingPrice, updateCalculatedValues]);

  // Filtrar productos según la familia seleccionada
  const filteredProducts = family ? products.filter(p => p.family === family) : products;
  const productOptions = filteredProducts.map(p => ({ value: p.id, label: `${p.name} (Stock: ${p.stock})` }));

  // Si cambia la familia, resetea los componentes
  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFamily = e.target.value || undefined;
    setFamily(newFamily);
    setComponents([]); // Limpiar componentes al cambiar familia
  };

  const handleAddComponent = () => {
    if (products.length > 0) {
      setComponents([...components, { productId: products[0].id, quantity: 1 }]);
    } else {
      addToast("No hay productos disponibles para añadir a la cesta.", 'warning');
    }
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = <K extends keyof HamperComponent,>(index: number, field: K, value: HamperComponent[K]) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    setComponents(newComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
        addToast('El nombre de la cesta es obligatorio.', 'error');
        return;
    }
    if (components.length === 0) {
        addToast('Una cesta debe tener al menos un componente.', 'error');
        return;
    }
    if (sellingPrice <= 0) {
        addToast('El precio de venta debe ser mayor que cero.', 'error');
        return;
    }
    setIsLoading(true);

    const hamperDataToSave: Omit<Hamper, 'id'> = { 
        name, 
        description, 
        sellingPrice, 
        components, 
        family
    };
    
    try {
      let savedHamper;
      if (hamper) {
        savedHamper = { ...hamperDataToSave, id: hamper.id };
        updateHamper(savedHamper);
        addToast('Cesta actualizada correctamente.', 'success');
      } else {
        savedHamper = addHamper(hamperDataToSave); // ID is set by context for new
        addToast('Cesta creada correctamente.', 'success');
      }
      onSaveSuccess(savedHamper);
    } catch (error) {
      addToast('Error al guardar la cesta.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Nombre de la Cesta" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
      <Textarea label="Descripción" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} />
      <Input label="Precio de Venta (€)" type="number" step="0.01" min="0.01" value={sellingPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSellingPrice(parseFloat(e.target.value))} required />

      <Select
        label="Familia de la Cesta"
        value={family || ''}
        onChange={handleFamilyChange}
        options={[{ value: '', label: 'Sin familia' }, ...PRODUCT_FAMILIES.map(f => ({ value: f, label: f }))]}
        containerClassName="mb-4"
      />

      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Componentes de la Cesta</h3>
        {components.map((component, index) => {
          return (
            <div key={index} className="flex items-center space-x-3 mb-3 p-3 border border-neutral-200 rounded-md bg-neutral-50">
              <Select
                containerClassName="flex-grow mb-0"
                label="Producto"
                value={component.productId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleComponentChange(index, 'productId', e.target.value)}
                options={productOptions}
              />
              <Input
                containerClassName="w-28 mb-0"
                label="Cantidad"
                type="number"
                min="1"
                value={component.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleComponentChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
              />
              <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveComponent(index)} aria-label="Eliminar componente">
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {products.length === 0 && components.length === 0 && (
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">No hay productos disponibles. Añada productos en la sección 'Productos' para poder crear cestas.</p>
        )}
        <Button type="button" variant="outline" onClick={handleAddComponent} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} disabled={products.length === 0 || isLoading}>
          Añadir Componente
        </Button>
      </div>

      <div className="bg-neutral-100 p-4 rounded-md space-y-1 border border-neutral-200">
        <h4 className="text-md font-semibold text-neutral-800 mb-2">Resumen Calculado de la Cesta:</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-neutral-600">Costo Componentes:</span><span className="font-medium text-neutral-800 text-right">{calculatedCost.toFixed(2)}€</span>
            <span className="text-neutral-600">Peso Estimado:</span><span className="font-medium text-neutral-800 text-right">{(calculatedWeight / 1000).toFixed(2)} kg</span>
            {calculatedVolume > 0 && <> <span className="text-neutral-600">Volumen Estimado:</span><span className="font-medium text-neutral-800 text-right">{(calculatedVolume / 1000).toFixed(2)} L</span></>}
            <span className="text-neutral-600">IVA Soportado (costo):</span><span className="font-medium text-neutral-800 text-right">{calculatedInputVat.toFixed(2)}€</span>
            <span className="text-neutral-600">Margen Bruto:</span><span className={`font-medium text-right ${calculatedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{calculatedProfit.toFixed(2)}€</span>
            <span className="text-neutral-600">Margen (% sobre costo):</span><span className={`font-medium text-right ${calculatedProfitPercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>{isFinite(calculatedProfitPercentage) ? calculatedProfitPercentage.toFixed(2) + '%' : 'N/A'}</span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{hamper ? 'Guardar Cambios' : 'Crear Cesta'}</Button>
      </div>
    </form>
  );
};

export default HamperForm;
