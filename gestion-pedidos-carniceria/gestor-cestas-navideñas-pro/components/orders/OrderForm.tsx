import * as React from 'react';
import { Order, OrderItem, OrderStatus } from '../../types';
import { PAYMENT_METHODS } from '../../paymentMethods';
import { useData, STOCK_AFFECTING_STATUSES } from '../../contexts/DataContext'; // Import STOCK_AFFECTING_STATUSES
import { useToast } from '../../contexts/ToastContext';
import Select from '../shared/forms/Select';
import Input from '../shared/forms/Input';
import Textarea from '../shared/forms/Textarea';
import Button from '../shared/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/HeroIcons';
import { ORDER_STATUS_OPTIONS } from '../../constants';

interface OrderFormProps {
  order?: Order | null;
  onSaveSuccess: (order: Order) => void;
  onCancel: () => void;
  initialCustomerId?: string; // For converting quote to order
  initialItems?: OrderItem[]; // For converting quote to order
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onSaveSuccess, onCancel, initialCustomerId, initialItems }: OrderFormProps) => {
  const { customers, hampers, products, orders, getHamperById, calculateHamperDetails, addOrder, updateOrder } = useData(); // Added orders
  const { addToast } = useToast();

  const [customerId, setCustomerId] = React.useState<string>(initialCustomerId || '');
  const [items, setItems] = React.useState<OrderItem[]>(initialItems || []);
  const [shippingAddress, setShippingAddress] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [status, setStatus] = React.useState<OrderStatus>(OrderStatus.DRAFT);
  const [originalStatusForStock, setOriginalStatusForStock] = React.useState<OrderStatus | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = React.useState<string>('');
  
  const [calculatedTotal, setCalculatedTotal] = React.useState(0);
  const [calculatedVat, setCalculatedVat] = React.useState(0); 
  const [isLoading, setIsLoading] = React.useState(false);

  const updateCalculatedTotals = React.useCallback(() => {
    let currentTotal = 0;
    let currentVat = 0;
    items.forEach(item => {
        currentTotal += item.unitPrice * item.quantity;
        const hamperDetails = getHamperById(item.hamperId);
        if (hamperDetails) {
            const { calculatedTotalCostPrice, calculatedTotalInputVat } = calculateHamperDetails(hamperDetails.components);
            if (calculatedTotalCostPrice && calculatedTotalCostPrice > 0 && calculatedTotalInputVat) {
                const effectiveVatRate = calculatedTotalInputVat / calculatedTotalCostPrice;
                currentVat += item.unitPrice * item.quantity * effectiveVatRate; 
            } else { 
                 currentVat += item.unitPrice * item.quantity * 0.21; // Fallback VAT
            }
        } else {
             currentVat += item.unitPrice * item.quantity * 0.21; // Fallback VAT if hamper not found
        }
    });
    setCalculatedTotal(parseFloat(currentTotal.toFixed(2)));
    setCalculatedVat(parseFloat(currentVat.toFixed(2)));
  }, [items, getHamperById, calculateHamperDetails]);

  React.useEffect(() => {
    if (order) {
      setCustomerId(order.customerId);
      setItems(order.items);
      setShippingAddress(order.shippingAddress);
      setNotes(order.notes || '');
      setStatus(order.status);
      setOriginalStatusForStock(order.status); // Store original status for stock logic
      setPaymentMethod(order.paymentMethod || ''); // Set payment method if order exists
    } else {
      setCustomerId(initialCustomerId || '');
      setItems(initialItems || []);
      setShippingAddress(customers.find(c => c.id === (initialCustomerId || ''))?.address || '');
      setNotes('');
      setStatus(OrderStatus.DRAFT);
      setOriginalStatusForStock(undefined);
      setPaymentMethod('');
    }
  }, [order, initialCustomerId, initialItems, customers]);

  React.useEffect(() => {
    updateCalculatedTotals();
  }, [items, updateCalculatedTotals]);
  
  React.useEffect(() => {
    if (customerId && !order && !initialItems) { // Only pre-fill for new orders without initial items (not quote conversion)
        const customer = customers.find(c => c.id === customerId);
        if (customer && customer.address && (!shippingAddress || shippingAddress === '')) { 
            setShippingAddress(customer.address);
        }
    }
  }, [customerId, customers, order, shippingAddress, initialItems]);

  const handleAddItem = () => {
    if (hampers.length > 0) {
      const firstHamper = hampers[0];
      setItems([...items, { hamperId: firstHamper.id, quantity: 1, unitPrice: firstHamper.sellingPrice, hamperName: firstHamper.name }]);
    } else {
        addToast("No hay cestas disponibles para añadir al pedido.", 'warning');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = <K extends keyof OrderItem,>(itemIndex: number, field: K, value: OrderItem[K]) => {
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

  const checkStockAvailability = React.useCallback((): boolean => {
    for (const item of items) {
        const hamper = getHamperById(item.hamperId);
        if (hamper) {
            for (const comp of hamper.components) {
                const product = products.find(p => p.id === comp.productId);
                if (product) {
                    const requiredStock = comp.quantity * item.quantity;
                    let currentProductStock = product.stock;

                    // If editing an existing order, and its original status affected stock,
                    // temporarily add back its original contribution to stock for the current check.
                    const existingOrder = order ? orders.find(o => o.id === order.id) : null;
                    if (existingOrder && originalStatusForStock && STOCK_AFFECTING_STATUSES.includes(originalStatusForStock)) {
                        const originalOrderItem = existingOrder.items.find(oi => oi.hamperId === item.hamperId);
                        if (originalOrderItem) {
                            const originalHamperComp = getHamperById(originalOrderItem.hamperId)?.components.find(c => c.productId === comp.productId);
                            if (originalHamperComp) {
                                // Add back stock of the component from the original order item if items are being modified,
                                // but only if we are not changing the quantity of this specific item itself to 0 (which would be removal)
                                // This logic might need more refinement if items can be completely swapped.
                                // For simplicity, we add back the *entire* original item's component quantity.
                                // This is okay because updateOrder in DataContext will do a full revert then deduct.
                                currentProductStock += originalHamperComp.quantity * originalOrderItem.quantity;
                            }
                        }
                    }
                    
                    if (currentProductStock < requiredStock) {
                        addToast(`Stock insuficiente para "${product.name}" en la cesta "${hamper.name}". Necesarias: ${requiredStock}, Disponible (considerando ajuste): ${currentProductStock}, Real en almacén: ${product.stock}.`, 'error');
                        return false;
                    }
                } else {
                     addToast(`Producto con ID ${comp.productId} no encontrado.`, 'error'); return false;
                }
            }
        } else {
            addToast(`Cesta con ID ${item.hamperId} no encontrada.`, 'error'); return false;
        }
    }
    return true;
  }, [items, getHamperById, products, order, originalStatusForStock, addToast, orders]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { addToast('Por favor, seleccione un cliente.', 'error'); return; }
    if (items.length === 0) { addToast('El pedido debe tener al menos un artículo.', 'error'); return; }
    if (!shippingAddress.trim()) { addToast('Por favor, ingrese una dirección de envío.', 'error'); return; }

    setIsLoading(true);
    
    // Determine if the new status will affect stock
    const newStatusWillAffectStock = STOCK_AFFECTING_STATUSES.includes(status);
    // Determine if the old status (if editing) affected stock
    const oldStatusAffectedStock = order && originalStatusForStock ? STOCK_AFFECTING_STATUSES.includes(originalStatusForStock) : false;

    // Check stock if:
    // 1. It's a new order and the status will affect stock.
    // 2. It's an existing order, the new status affects stock, AND (it's different from old status OR items changed OR old status didn't affect stock but new one does)
    let performStockCheck = false;
    if (newStatusWillAffectStock) {
        if (!order) { // New order
            performStockCheck = true;
        } else { // Editing order
            // If status changes from non-affecting to affecting
            if (!oldStatusAffectedStock) performStockCheck = true;
            // If status remains affecting or changes between affecting types, check if items changed
            else if (JSON.stringify(order.items) !== JSON.stringify(items)) performStockCheck = true;
            // If status changes from affecting to another affecting one (e.g. Processing to Shipped)
            else if (originalStatusForStock !== status) performStockCheck = true;
        }
    }


    if (performStockCheck && !checkStockAvailability()) {
        setIsLoading(false);
        return; 
    }
    
    const orderDataToSave: Omit<Order, 'id' | 'orderNumber' | 'totalAmount' | 'totalVatAmount'> = {
        customerId,
        items,
        orderDate: order ? order.orderDate : new Date().toISOString(),
        status,
        shippingAddress,
        notes,
        paymentMethod,
    };

    try {
      let savedOrder;
      if (order) {
        const completeOrderData = { ...orderDataToSave, id: order.id, orderNumber: order.orderNumber, totalAmount: calculatedTotal, totalVatAmount: calculatedVat };
        updateOrder(completeOrderData, originalStatusForStock); 
        savedOrder = completeOrderData;
        addToast('Pedido actualizado correctamente.', 'success');
      } else {
        savedOrder = addOrder(orderDataToSave);
        addToast('Pedido creado correctamente.', 'success');
      }
      onSaveSuccess(savedOrder);
    } catch (error) {
      addToast('Error al guardar el pedido.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const hamperOptions = hampers.map(h => ({ value: h.id, label: `${h.name} (${h.sellingPrice.toFixed(2)}€)` }));
  // Opciones para el selector de formas de pago
  const paymentMethodOptions = PAYMENT_METHODS.map(pm => ({ value: pm.FPago, label: pm.DescripcionFpago }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select label="Cliente" value={customerId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCustomerId(e.target.value)} options={customerOptions} placeholder="Seleccionar Cliente" required />
        <Select label="Estado del Pedido" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as OrderStatus)} options={ORDER_STATUS_OPTIONS} />
      </div>
      <Select label="Forma de Pago" value={paymentMethod} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)} options={paymentMethodOptions} placeholder="Seleccionar forma de pago" required className="mb-4" />
      <Textarea label="Dirección de Envío" value={shippingAddress} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShippingAddress(e.target.value)} required />

      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Artículos del Pedido</h3>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col md:flex-row md:items-end space-y-2 md:space-y-0 md:space-x-3 mb-3 p-3 border border-neutral-200 rounded-md bg-neutral-50">
            <Select
              containerClassName="flex-grow mb-0"
              label="Cesta"
              value={item.hamperId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleItemChange(index, 'hamperId', e.target.value)}
              options={hamperOptions}
            />
            <Input
              containerClassName="w-full md:w-28 mb-0"
              label="Cantidad"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))}
            />
             <Input
                containerClassName="w-full md:w-32 mb-0"
                label="Precio Unit."
                type="number"
                step="0.01"
                value={item.unitPrice.toFixed(2)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                readOnly // Usually fixed from hamper
            />
            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(index)} aria-label="Eliminar artículo" className="h-10 mt-auto">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {hampers.length === 0 && items.length === 0 && (
             <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">No hay cestas disponibles. Añada cestas en la sección 'Cestas' para poder crear pedidos.</p>
        )}
        <Button type="button" variant="outline" onClick={handleAddItem} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} disabled={hampers.length === 0 || isLoading} className="mt-2">
          Añadir Artículo
        </Button>
      </div>
      
      <Textarea label="Notas Adicionales" value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />

      <div className="bg-neutral-100 p-4 rounded-md border border-neutral-200 text-right">
        <p className="text-md text-neutral-700">Subtotal: {calculatedTotal.toFixed(2)}€</p>
        <p className="text-sm text-neutral-500">IVA (Estimado sobre costo): {calculatedVat.toFixed(2)}€</p>
        <p className="text-xl font-bold text-primary-dark mt-1">Total Pedido: {(calculatedTotal + calculatedVat).toFixed(2)}€</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>{order ? 'Actualizar Pedido' : 'Crear Pedido'}</Button>
      </div>
    </form>
  );
};

export default OrderForm;
