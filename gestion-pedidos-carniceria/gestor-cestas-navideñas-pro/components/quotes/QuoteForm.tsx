import React, { useState, useEffect, useCallback } from 'react';
import { Quote, QuoteItem, Customer, QuoteStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Select from '../shared/forms/Select';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Button from '../shared/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/HeroIcons';
import { QUOTE_STATUS_OPTIONS } from '../../constants';

interface QuoteFormProps {
  quote?: Quote | null;
  onSaveSuccess: (quote: Quote) => void;
  onCancel: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, onSaveSuccess, onCancel }) => {
  const { customers, hampers, getHamperById, calculateOrderTotals, addQuote, updateQuote } = useData();
  const { addToast } = useToast();

  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<QuoteStatus>(QuoteStatus.DRAFT);
  const [quoteDate, setQuoteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);
  
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [calculatedVat, setCalculatedVat] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);

  const updateFormTotals = useCallback(() => {
    const {totalAmount, totalVatAmount} = calculateOrderTotals(items);
    setCalculatedTotal(totalAmount);
    setCalculatedVat(totalVatAmount);
  }, [items, calculateOrderTotals]);

  useEffect(() => {
    if (quote) {
      setCustomerId(quote.customerId);
      setItems(quote.items);
      setShippingAddress(quote.shippingAddress || '');
      setNotes(quote.notes || '');
      setStatus(quote.status);
      setQuoteDate(quote.quoteDate.split('T')[0]);
      setExpiryDate(quote.expiryDate ? quote.expiryDate.split('T')[0] : undefined);
    } else {
      // Reset form for new quote
      setCustomerId('');
      setItems([]);
      setShippingAddress('');
      setNotes('');
      setStatus(QuoteStatus.DRAFT);
      setQuoteDate(new Date().toISOString().split('T')[0]);
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30); // Default expiry 30 days
      setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
    }
  }, [quote]);

  useEffect(() => {
    updateFormTotals();
  }, [items, updateFormTotals]);
  
  useEffect(() => {
    if (customerId && !quote) { // Pre-fill address for new quotes if customer selected
        const customer = customers.find(c => c.id === customerId);
        if (customer && customer.address && !shippingAddress) {
            setShippingAddress(customer.address);
        }
    }
  }, [customerId, customers, quote, shippingAddress]);

  const handleAddItem = () => {
    if (hampers.length > 0) {
      const firstHamper = hampers[0];
      setItems([...items, { hamperId: firstHamper.id, quantity: 1, unitPrice: firstHamper.sellingPrice, hamperName: firstHamper.name }]);
    } else {
        addToast("No hay cestas disponibles para añadir.", 'warning');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = <K extends keyof QuoteItem,>(itemIndex: number, field: K, value: QuoteItem[K]) => {
    const newItems = [...items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    if (field === 'hamperId') {
        const selectedHamper = hampers.find(h => h.id === value);
        if (selectedHamper) {
            newItems[itemIndex].unitPrice = selectedHamper.sellingPrice;
            newItems[itemIndex].hamperName = selectedHamper.name;
        }
    }
    if (field === 'quantity') {
        newItems[itemIndex].quantity = Math.max(1, parseInt(value as string, 10) || 1);
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { addToast('Por favor, seleccione un cliente.', 'error'); return; }
    if (items.length === 0) { addToast('El presupuesto debe tener al menos un artículo.', 'error'); return; }
    
    setIsLoading(true);
    
    const quoteDataToSave: Omit<Quote, 'id' | 'quoteNumber' | 'totalAmount' | 'totalVatAmount'> = {
        customerId,
        items,
        quoteDate,
        expiryDate,
        status,
        shippingAddress: shippingAddress.trim() === '' ? undefined : shippingAddress,
        notes,
        relatedOrderId: quote?.relatedOrderId // Preserve if editing
    };

    try {
      let savedQuote;
      if (quote) {
        const completeQuoteData = { ...quoteDataToSave, id: quote.id, quoteNumber: quote.quoteNumber, totalAmount: calculatedTotal, totalVatAmount: calculatedVat };
        updateQuote(completeQuoteData); 
        savedQuote = completeQuoteData;
        addToast('Presupuesto actualizado correctamente.', 'success');
      } else {
        savedQuote = addQuote(quoteDataToSave);
        addToast('Presupuesto creado correctamente.', 'success');
      }
      onSaveSuccess(savedQuote);
    } catch (error) {
      addToast('Error al guardar el presupuesto.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const hamperOptions = hampers.map(h => ({ value: h.id, label: `${h.name} (${h.sellingPrice.toFixed(2)}€)` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select label="Cliente" value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={customerOptions} placeholder="Seleccionar Cliente" required />
        <Select label="Estado del Presupuesto" value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)} options={QUOTE_STATUS_OPTIONS} />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Fecha del Presupuesto" type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} required />
        <Input label="Fecha de Expiración (Opcional)" type="date" value={expiryDate || ''} onChange={e => setExpiryDate(e.target.value)} />
      </div>
      
      <Textarea label="Dirección de Envío (Opcional)" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />

      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Artículos del Presupuesto</h3>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col md:flex-row md:items-end space-y-2 md:space-y-0 md:space-x-3 mb-3 p-3 border border-neutral-200 rounded-md bg-neutral-50">
            <Select
              containerClassName="flex-grow mb-0"
              label="Cesta"
              value={item.hamperId}
              onChange={(e) => handleItemChange(index, 'hamperId', e.target.value)}
              options={hamperOptions}
            />
            <Input
              containerClassName="w-full md:w-28 mb-0"
              label="Cantidad"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))}
            />
             <Input
                containerClassName="w-full md:w-32 mb-0"
                label="Precio Unit."
                type="number"
                step="0.01"
                value={item.unitPrice.toFixed(2)}
                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                readOnly // Usually fixed from hamper
            />
            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(index)} aria-label="Eliminar artículo" className="h-10 mt-auto">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {hampers.length === 0 && items.length === 0 && (
             <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">No hay cestas disponibles. Añada cestas en la sección 'Cestas' para poder crear presupuestos.</p>
        )}
        <Button type="button" variant="outline" onClick={handleAddItem} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} disabled={hampers.length === 0 || isLoading} className="mt-2">
          Añadir Artículo
        </Button>
      </div>
      
      <Textarea label="Notas Adicionales" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="bg-neutral-100 p-4 rounded-md border border-neutral-200 text-right">
        <p className="text-md text-neutral-700">Subtotal: {calculatedTotal.toFixed(2)}€</p>
        <p className="text-sm text-neutral-500">IVA (Estimado sobre costo): {calculatedVat.toFixed(2)}€</p>
        <p className="text-xl font-bold text-primary-dark mt-1">Total Presupuesto: {(calculatedTotal + calculatedVat).toFixed(2)}€</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{quote ? 'Actualizar Presupuesto' : 'Crear Presupuesto'}</Button>
      </div>
    </form>
  );
};

export default QuoteForm;
