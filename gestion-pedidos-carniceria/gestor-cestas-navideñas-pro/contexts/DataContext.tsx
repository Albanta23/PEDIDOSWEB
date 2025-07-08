import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { 
  Product, Hamper, Customer, Order, Invoice, Supplier, 
  OrderStatus, HamperComponent, Quote, QuoteItem, QuoteStatus, 
  PaymentStatus, ActivityLogEntry, OrderItem, VAT_TYPES, DetailedInvoiceLineItem
} from '../types';
import Modal from '../components/shared/Modal'; 

// Define and export STOCK_AFFECTING_STATUSES
export const STOCK_AFFECTING_STATUSES: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.PACKAGING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

interface DataContextType {
  products: Product[];
  hampers: Hamper[];
  customers: Customer[];
  orders: Order[];
  quotes: Quote[];
  invoices: Invoice[];
  suppliers: Supplier[];
  activityLog: ActivityLogEntry[];

  addProduct: (productData: Omit<Product, 'id'>) => Product;
  updateProduct: (productData: Product) => void;
  deleteProduct: (productId: string) => void;
  clearAllProducts: () => void;
  forceResetInventory: () => void;
  getProductById: (productId: string) => Product | undefined;

  addHamper: (hamperData: Omit<Hamper, 'id' | 'calculatedTotalCostPrice' | 'calculatedTotalWeightGrams' | 'calculatedTotalVolumeMilliliters' | 'calculatedTotalInputVat' | 'calculatedProfit' | 'calculatedProfitPercentage'>) => Hamper;
  updateHamper: (hamperData: Hamper) => void;
  deleteHamper: (hamperId: string) => void;
  getHamperById: (hamperId: string) => Hamper | undefined;
  calculateHamperDetails: (components: HamperComponent[], sellingPrice?: number) => Pick<Hamper, 'calculatedTotalCostPrice' | 'calculatedTotalWeightGrams' | 'calculatedTotalVolumeMilliliters' | 'calculatedTotalInputVat' | 'calculatedProfit' | 'calculatedProfitPercentage'>;
  
  addCustomer: (customerData: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customerData: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  getCustomerById: (customerId: string) => Customer | undefined;

  addOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'totalAmount' | 'totalVatAmount'>) => Order;
  updateOrder: (orderData: Order, originalStatus?: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
  
  addQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'totalAmount' | 'totalVatAmount'>) => Quote;
  updateQuote: (quoteData: Quote) => void;
  deleteQuote: (quoteId: string) => void;
  getQuoteById: (quoteId: string) => Quote | undefined;
  convertQuoteToOrder: (quoteId: string) => Order | null;

  generateInvoiceForOrder: (orderId: string) => Invoice | null;
  updateInvoice: (invoiceData: Invoice) => void;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;

  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (supplierData: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  
  getNextOrderNumber: () => string;
  getNextInvoiceNumber: () => string;
  getNextQuoteNumber: () => string;

  addActivityLogEntry: (message: string, type: ActivityLogEntry['type'], relatedId?: string) => void;
  calculateOrderTotals: (items: OrderItem[] | QuoteItem[]) => {totalAmount: number, totalVatAmount: number};
  
  openConfirmModal: (message: string, onConfirm: () => void, title?: string, confirmVariant?: 'primary' | 'danger') => void;
  calculateDetailedInvoiceLineItems: (order: Order | null) => DetailedInvoiceLineItem[];
}

// --- PEDIDOS DE CESTAS/LOTES ---
export interface BatchOrder {
  _id?: string;
  clienteId: string;
  clienteNombre: string;
  direccion: string;
  estado: string;
  numeroPedido: number;
  lineas: Array<{
    cestaId: string;
    nombreCesta: string;
    cantidad: number;
    precioUnitario: number;
    comentario?: string;
  }>;
  fechaCreacion?: string;
  fechaPedido?: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
  notas?: string;
  tipo?: string;
  usuarioTramitando?: string;
  historialEstados?: Array<{
    estado: string;
    usuario: string;
    fecha: string;
  }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Custom hook to use the DataContext
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Custom hook for confirm modal functionality
export const useConfirm = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useConfirm must be used within a DataProvider');
  }
  return context.openConfirmModal;
};


const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [hampers, setHampers] = useLocalStorage<Hamper[]>('hampers', []);
  // Cambia useLocalStorage por useState para clientes
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('quotes', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [activityLog, setActivityLog] = useLocalStorage<ActivityLogEntry[]>('activityLog', []);
  
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    title?: string;
    confirmVariant?: 'primary' | 'danger';
  }>({ isOpen: false, message: '', onConfirm: () => {}, title: 'Confirmar Acción', confirmVariant: 'primary' });


  // --- PEDIDOS DE CESTAS/LOTES ---
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>([]);

  // Function to add an entry to the activity log
  const addActivityLogEntry = useCallback((message: string, type: ActivityLogEntry['type'], relatedId?: string) => {
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message,
      type,
      relatedId,
    };
    setActivityLog(prev => [newEntry, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50)); // Keep last 50
  }, [setActivityLog]);


  // Confirm Modal Logic
  const openConfirmModal = useCallback((message: string, onConfirmCallback: () => void, title: string = 'Confirmar Acción', confirmVariant : 'primary' | 'danger' = 'primary') => {
    setConfirmModalState({ isOpen: true, message, onConfirm: onConfirmCallback, title, confirmVariant });
  }, []);

  const handleConfirm = () => {
    confirmModalState.onConfirm();
    setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
  };

  const handleCancelConfirm = () => {
    setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
  };


  // Product Management
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = { ...productData, id: `prod-${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);
    addActivityLogEntry(`Producto "${newProduct.name}" creado.`, 'product_stock', newProduct.id);
    return newProduct;
  };

  const updateProduct = (productData: Product) => {
    setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
     addActivityLogEntry(`Producto "${productData.name}" actualizado.`, 'product_stock', productData.id);
  };

  const deleteProduct = (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    // Check if product is used in any hamper
    const isUsedInHamper = hampers.some(h => h.components.some(c => c.productId === productId));
    if (isUsedInHamper) {
      throw new Error("Este producto no puede ser eliminado porque está siendo usado en una o más cestas.");
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (productToDelete) {
        addActivityLogEntry(`Producto "${productToDelete.name}" eliminado.`, 'product_stock', productId);
    }
  }

  // Clear all products from inventory
  const clearAllProducts = () => {
    // Check if any product is used in hampers
    const usedProducts = products.filter(product => 
      hampers.some(h => h.components.some(c => c.productId === product.id))
    );
    
    if (usedProducts.length > 0) {
      const productNames = usedProducts.map(p => p.name).join(', ');
      throw new Error(`Los siguientes productos no pueden ser eliminados porque están siendo usados en cestas: ${productNames}`);
    }
    
    setProducts([]);
    addActivityLogEntry(`Todos los productos del inventario han sido eliminados (${products.length} productos).`, 'product_stock');
  };

  // Clear all products and reset to empty state (ignoring hamper dependencies)
  const forceResetInventory = () => {
    setProducts([]);
    // Also clear hampers since they depend on products
    setHampers([]);
    addActivityLogEntry(`Inventario completamente reiniciado. Todos los productos y cestas eliminados.`, 'product_stock');
  };

  const getProductById = useCallback((productId: string) => products.find(p => p.id === productId), [products]);


  // Hamper Management
  const calculateHamperDetails = useCallback((components: HamperComponent[], sellingPrice?: number) => {
    let calculatedTotalCostPrice = 0;
    let calculatedTotalWeightGrams = 0;
    let calculatedTotalVolumeMilliliters = 0;
    let calculatedTotalInputVat = 0;

    components.forEach(comp => {
      const product = getProductById(comp.productId);
      if (product) {
        calculatedTotalCostPrice += product.costPrice * comp.quantity;
        calculatedTotalWeightGrams += (product.weightGrams || 0) * comp.quantity;
        calculatedTotalVolumeMilliliters += (product.volumeMilliliters || 0) * comp.quantity;
        calculatedTotalInputVat += (product.costPrice * product.vatRate) * comp.quantity;
      }
    });
    
    let calculatedProfit = 0;
    let calculatedProfitPercentage = 0;

    if (sellingPrice !== undefined) {
        calculatedProfit = sellingPrice - calculatedTotalCostPrice;
        if (calculatedTotalCostPrice > 0) {
            calculatedProfitPercentage = (calculatedProfit / calculatedTotalCostPrice) * 100;
        } else if (sellingPrice > 0) { // Infinite profit if cost is 0 and selling price > 0
            calculatedProfitPercentage = Infinity; 
        }
    }

    return {
      calculatedTotalCostPrice,
      calculatedTotalWeightGrams,
      calculatedTotalVolumeMilliliters,
      calculatedTotalInputVat,
      calculatedProfit,
      calculatedProfitPercentage
    };
  }, [getProductById]);

  const addHamper = (hamperData: Omit<Hamper, 'id' | 'calculatedTotalCostPrice' | 'calculatedTotalWeightGrams' | 'calculatedTotalVolumeMilliliters' | 'calculatedTotalInputVat' | 'calculatedProfit' | 'calculatedProfitPercentage'>): Hamper => {
    const newHamper: Hamper = { ...hamperData, id: `hamper-${Date.now()}` };
    setHampers(prev => [...prev, newHamper]);
    addActivityLogEntry(`Cesta "${newHamper.name}" creada.`, 'product_stock', newHamper.id); // Or a 'hamper' type
    return newHamper;
  };

  const updateHamper = (hamperData: Hamper) => {
    setHampers(prev => prev.map(h => h.id === hamperData.id ? hamperData : h));
     addActivityLogEntry(`Cesta "${hamperData.name}" actualizada.`, 'product_stock', hamperData.id);
  };

  const deleteHamper = (hamperId: string) => {
    const hamperToDelete = hampers.find(h => h.id === hamperId);
     // Check if hamper is used in orders or quotes
    const isUsedInOrder = orders.some(o => o.items.some(item => item.hamperId === hamperId));
    const isUsedInQuote = quotes.some(q => q.items.some(item => item.hamperId === hamperId));
    if (isUsedInOrder || isUsedInQuote) {
        throw new Error("Esta cesta no puede ser eliminada porque está incluida en pedidos o presupuestos existentes.");
    }
    setHampers(prev => prev.filter(h => h.id !== hamperId));
    if(hamperToDelete) {
        addActivityLogEntry(`Cesta "${hamperToDelete.name}" eliminada.`, 'product_stock', hamperId);
    }
  };
  const getHamperById = useCallback((hamperId: string) => hampers.find(h => h.id === hamperId), [hampers]);


  // Customer Management
  const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    const newCustomer: Customer = { ...customerData, id: `cust-${Date.now()}` };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (customerData: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
  };

  const deleteCustomer = (customerId: string) => {
    // Check if customer is used in orders, quotes, or invoices
    const isUsedInOrder = orders.some(o => o.customerId === customerId);
    const isUsedInQuote = quotes.some(q => q.customerId === customerId);
    // Invoices store customerName, but check original order's customerId
    const isUsedInInvoiceViaOrder = invoices.some(inv => {
        const order = orders.find(o => o.id === inv.orderId);
        return order?.customerId === customerId;
    });

    if (isUsedInOrder || isUsedInQuote || isUsedInInvoiceViaOrder) {
        throw new Error("Este cliente no puede ser eliminado porque tiene pedidos, presupuestos o facturas asociadas.");
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };
  const getCustomerById = useCallback((customerId: string) => customers.find(c => c.id === customerId), [customers]);

  // Order Management
  const getNextOrderNumber = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    let maxNum = 0;
    orders.forEach(o => {
      if (o.orderNumber.startsWith(yearPrefix)) {
        const numPart = parseInt(o.orderNumber.substring(yearPrefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    return `${yearPrefix}${(maxNum + 1).toString().padStart(4, '0')}`;
  }, [orders]);

  const calculateOrderTotals = useCallback((orderItems: OrderItem[] | QuoteItem[]) => {
    let totalAmount = 0; // Base total (subtotal)
    let totalVatAmount = 0;

    orderItems.forEach(item => {
        const itemTotalBase = item.unitPrice * item.quantity;
        totalAmount += itemTotalBase;
        
        const hamper = getHamperById(item.hamperId);
        if (hamper) {
            let itemVat = 0;
            // Calculate VAT based on constituent products' VAT rates and cost proportion
            const { components } = hamper; // Use hamper's own components
            let totalHamperCostForProportions = 0;
            const costByVatRateForProportions: { [rate: string]: number } = {};
             VAT_TYPES.forEach(rate => costByVatRateForProportions[rate.toString()] = 0);

            // Re-calculate details if not available or forced (e.g. from a quote without stored costs)
            const hamperDetails = calculateHamperDetails(components); // Recalculate based on current product data

            if (hamperDetails.calculatedTotalCostPrice && hamperDetails.calculatedTotalCostPrice > 0) {
                totalHamperCostForProportions = hamperDetails.calculatedTotalCostPrice;
                 components.forEach(hc => {
                    const product = getProductById(hc.productId);
                    if (product) {
                        costByVatRateForProportions[product.vatRate.toString()] = 
                            (costByVatRateForProportions[product.vatRate.toString()] || 0) + (product.costPrice * hc.quantity);
                    }
                });
            }

            if (totalHamperCostForProportions > 0) {
                 VAT_TYPES.forEach(rate => {
                    const rateStr = rate.toString();
                    const proportion = (costByVatRateForProportions[rateStr] || 0) / totalHamperCostForProportions;
                    itemVat += (itemTotalBase * proportion) * rate;
                });
            } else if (hamper.components.length > 0) {
                const distinctVatRates = new Set(hamper.components.map(hc => getProductById(hc.productId)?.vatRate).filter(r => r !== undefined));
                if (distinctVatRates.size === 1) {
                    const singleRate = distinctVatRates.values().next().value;
                    if (singleRate !== undefined) {
                      itemVat = itemTotalBase * singleRate;
                    } else {
                      itemVat = itemTotalBase * 0.21;
                    }
                } else {
                    itemVat = itemTotalBase * 0.21; 
                }
            } else {
                 itemVat = itemTotalBase * 0.21; 
            }
            totalVatAmount += itemVat;
        } else {
            totalVatAmount += itemTotalBase * 0.21; // Fallback if hamper details not found
        }
    });
    return { 
        totalAmount: parseFloat(totalAmount.toFixed(2)), 
        totalVatAmount: parseFloat(totalVatAmount.toFixed(2)) 
    };
  }, [getHamperById, getProductById, calculateHamperDetails]);


  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'totalAmount' | 'totalVatAmount'>): Order => {
    const { totalAmount, totalVatAmount } = calculateOrderTotals(orderData.items);
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      orderNumber: getNextOrderNumber(),
      totalAmount,
      totalVatAmount
    };
    
    if (STOCK_AFFECTING_STATUSES.includes(newOrder.status)) {
        const updatedProducts = [...products];
        newOrder.items.forEach(item => {
            const hamper = getHamperById(item.hamperId);
            hamper?.components.forEach(comp => {
                const productIndex = updatedProducts.findIndex(p => p.id === comp.productId);
                if (productIndex > -1) {
                    updatedProducts[productIndex].stock -= comp.quantity * item.quantity;
                }
            });
        });
        setProducts(updatedProducts);
        addActivityLogEntry(`Stock ajustado por nuevo pedido ${newOrder.orderNumber} (${newOrder.status}).`, 'product_stock', newOrder.id);
    }

    setOrders(prev => [...prev, newOrder]);
    addActivityLogEntry(`Pedido ${newOrder.orderNumber} creado.`, 'order', newOrder.id);
    return newOrder;
  };

  const updateOrder = (orderData: Order, originalStatus?: OrderStatus) => {
    const { totalAmount, totalVatAmount } = calculateOrderTotals(orderData.items);
    const updatedOrder = { ...orderData, totalAmount, totalVatAmount };

    const originalOrder = orders.find(o => o.id === updatedOrder.id);
    const effectiveOriginalStatus = originalStatus || originalOrder?.status;

    let productsToUpdate = [...products];
    const originalStatusAffectedStock = effectiveOriginalStatus && STOCK_AFFECTING_STATUSES.includes(effectiveOriginalStatus);
    const newStatusAffectsStock = STOCK_AFFECTING_STATUSES.includes(updatedOrder.status);

    if (originalOrder) {
        if (originalStatusAffectedStock) {
            originalOrder.items.forEach(item => {
                const hamper = getHamperById(item.hamperId);
                hamper?.components.forEach(comp => {
                    const productIndex = productsToUpdate.findIndex(p => p.id === comp.productId);
                    if (productIndex > -1) {
                        productsToUpdate[productIndex].stock += comp.quantity * item.quantity;
                    }
                });
            });
            addActivityLogEntry(`Stock revertido (actualización) para pedido ${originalOrder.orderNumber} (estado original ${effectiveOriginalStatus}).`, 'product_stock', originalOrder.id);
        }

        if (newStatusAffectsStock) {
            updatedOrder.items.forEach(item => {
                const hamper = getHamperById(item.hamperId);
                hamper?.components.forEach(comp => {
                    const productIndex = productsToUpdate.findIndex(p => p.id === comp.productId);
                    if (productIndex > -1) {
                        const required = comp.quantity * item.quantity;
                        if (productsToUpdate[productIndex].stock < required && !originalStatusAffectedStock) { 
                             throw new Error(`Stock insuficiente para ${productsToUpdate[productIndex].name} al actualizar pedido.`);
                        }
                        productsToUpdate[productIndex].stock -= required;
                    }
                });
            });
            addActivityLogEntry(`Stock ajustado por actualización de pedido ${updatedOrder.orderNumber} (nuevo estado ${updatedOrder.status}).`, 'product_stock', updatedOrder.id);
        }
        setProducts(productsToUpdate);
    }
    
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    addActivityLogEntry(`Pedido ${updatedOrder.orderNumber} actualizado. Estado: ${updatedOrder.status}.`, 'order', updatedOrder.id);
  };
  const getOrderById = useCallback((orderId: string) => orders.find(o => o.id === orderId), [orders]);

  // Quote Management
   const getNextQuoteNumber = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `PRE-${currentYear}-`;
    let maxNum = 0;
    quotes.forEach(q => {
      if (q.quoteNumber.startsWith(yearPrefix)) {
        const numPart = parseInt(q.quoteNumber.substring(yearPrefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    return `${yearPrefix}${(maxNum + 1).toString().padStart(4, '0')}`;
  }, [quotes]);

  const addQuote = (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'totalAmount' | 'totalVatAmount'>): Quote => {
    const { totalAmount, totalVatAmount } = calculateOrderTotals(quoteData.items);
    const newQuote: Quote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      quoteNumber: getNextQuoteNumber(),
      totalAmount,
      totalVatAmount
    };
    setQuotes(prev => [...prev, newQuote]);
    addActivityLogEntry(`Presupuesto ${newQuote.quoteNumber} creado.`, 'quote', newQuote.id);
    return newQuote;
  };

  const updateQuote = (quoteData: Quote) => {
    const { totalAmount, totalVatAmount } = calculateOrderTotals(quoteData.items);
    const updatedQuote = {...quoteData, totalAmount, totalVatAmount };
    setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    addActivityLogEntry(`Presupuesto ${updatedQuote.quoteNumber} actualizado.`, 'quote', updatedQuote.id);
  };

  const deleteQuote = (quoteId: string) => {
    const quoteToDelete = quotes.find(q => q.id === quoteId);
    if (quoteToDelete && quoteToDelete.status === QuoteStatus.CONVERTED_TO_ORDER) {
        throw new Error("No se puede eliminar un presupuesto que ha sido convertido a pedido.");
    }
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
     if(quoteToDelete){
        addActivityLogEntry(`Presupuesto ${quoteToDelete.quoteNumber} eliminado.`, 'quote', quoteId);
    }
  };
  const getQuoteById = useCallback((quoteId: string) => quotes.find(q => q.id === quoteId), [quotes]);
  
  const convertQuoteToOrder = useCallback((quoteId: string): Order | null => {
    const quote = getQuoteById(quoteId);
    if (!quote || quote.status === QuoteStatus.CONVERTED_TO_ORDER) {
      console.error("Presupuesto no encontrado o ya convertido.");
      return null;
    }

    const orderItems: OrderItem[] = quote.items.map(qi => ({
      hamperId: qi.hamperId,
      quantity: qi.quantity,
      unitPrice: qi.unitPrice, 
      hamperName: qi.hamperName,
    }));

    const newOrderData: Omit<Order, 'id' | 'orderNumber' | 'totalAmount' | 'totalVatAmount'> = {
      customerId: quote.customerId,
      items: orderItems,
      orderDate: new Date().toISOString(),
      status: OrderStatus.PENDING_PAYMENT, 
      shippingAddress: quote.shippingAddress || customers.find(c => c.id === quote.customerId)?.address || '',
      notes: `Convertido desde Presupuesto ${quote.quoteNumber}. ${quote.notes || ''}`.trim(),
      paymentMethod: 'transferencia', // Valor por defecto, ajusta según tu modelo
    };
    
    const createdOrder = addOrder(newOrderData); 
    
    updateQuote({ ...quote, status: QuoteStatus.CONVERTED_TO_ORDER, relatedOrderId: createdOrder.id });
    addActivityLogEntry(`Presupuesto ${quote.quoteNumber} convertido a Pedido ${createdOrder.orderNumber}.`, 'order', createdOrder.id);
    return createdOrder;
  }, [getQuoteById, customers, addOrder, updateQuote]);


  // Invoice Management
  const getNextInvoiceNumber = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `FAC-${currentYear}-`;
    let maxNum = 0;
    invoices.forEach(inv => {
      if (inv.invoiceNumber.startsWith(yearPrefix)) {
        const numPart = parseInt(inv.invoiceNumber.substring(yearPrefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    return `${yearPrefix}${(maxNum + 1).toString().padStart(4, '0')}`;
  }, [invoices]);

  const generateInvoiceForOrder = (orderId: string): Invoice | null => {
    const order = getOrderById(orderId);
    if (!order) return null;
    const customer = getCustomerById(order.customerId);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: getNextInvoiceNumber(),
      orderId: order.id,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
      paymentStatus: PaymentStatus.PENDING,
      customerName: customer?.name || 'Cliente Desconocido',
      customerAddress: customer?.address,
      customerCifNif: customer?.cifNif,
      totalAmount: order.totalAmount, 
      totalVatAmount: order.totalVatAmount, 
      grandTotal: parseFloat((order.totalAmount + order.totalVatAmount).toFixed(2)),
      notes: `Factura correspondiente al pedido ${order.orderNumber}. ${order.notes || ''}`.trim(),
    };
    setInvoices(prev => [...prev, newInvoice]);
    addActivityLogEntry(`Factura ${newInvoice.invoiceNumber} generada para pedido ${order.orderNumber}.`, 'invoice', newInvoice.id);
    return newInvoice;
  };

  const updateInvoice = (invoiceData: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv));
    addActivityLogEntry(`Factura ${invoiceData.invoiceNumber} actualizada. Estado de pago: ${invoiceData.paymentStatus}.`, 'invoice', invoiceData.id);
  };
  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(inv => inv.id === invoiceId), [invoices]);

  // Supplier Management
  const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier: Supplier = { ...supplierData, id: `supp-${Date.now()}` };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (supplierData: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
  };

  const deleteSupplier = (supplierId: string) => {
    const isUsedInProduct = products.some(p => p.supplierId === supplierId);
    if (isUsedInProduct) {
      throw new Error("Este proveedor no puede ser eliminado porque está asignado a uno o más productos.");
    }
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };
  const getSupplierById = useCallback((supplierId: string) => suppliers.find(s => s.id === supplierId), [suppliers]);

  const calculateDetailedInvoiceLineItems = useCallback((order: Order | null): DetailedInvoiceLineItem[] => {
    if (!order) return [];

    return order.items
      .map((orderItem: OrderItem) => {
        const hamper = getHamperById(orderItem.hamperId);
        const detailedLine: DetailedInvoiceLineItem = {
          hamperId: orderItem.hamperId,
          hamperName: orderItem.hamperName || hamper?.name || 'Cesta Desconocida',
          hamperQuantity: orderItem.quantity,
          hamperUnitPriceBase: orderItem.unitPrice,
          baseAmountByVatRate: {},
          vatAmountByVatRate: {},
          totalBaseForLine: 0,
          totalVatForLine: 0,
          totalWithVatForLine: 0,
          componentsDisplay: []
        };

        VAT_TYPES.forEach(rate => {
          detailedLine.baseAmountByVatRate[rate.toString()] = 0;
          detailedLine.vatAmountByVatRate[rate.toString()] = 0;
        });
        
        let totalHamperCostForProportions = 0;
        const costByVatRateForProportions: { [rate: string]: number } = {};
        VAT_TYPES.forEach(rate => costByVatRateForProportions[rate.toString()] = 0);

        if (hamper) {
          detailedLine.componentsDisplay = hamper.components.map(hc => {
            const product = getProductById(hc.productId);
            return {
              name: product?.name || 'Producto desconocido',
              quantityPerHamper: hc.quantity,
              unit: product?.unit || 'ud'
            };
          });

          hamper.components.forEach(hc => {
            const product = getProductById(hc.productId);
            if (product) {
              const componentCost = product.costPrice * hc.quantity;
              totalHamperCostForProportions += componentCost;
              costByVatRateForProportions[product.vatRate.toString()] = (costByVatRateForProportions[product.vatRate.toString()] || 0) + componentCost;
            }
          });
        }
        
        const lineTotalBasePrice = detailedLine.hamperUnitPriceBase * detailedLine.hamperQuantity;
        detailedLine.totalBaseForLine = parseFloat(lineTotalBasePrice.toFixed(2));

        if (totalHamperCostForProportions > 0) {
          VAT_TYPES.forEach(rate => {
            const rateStr = rate.toString();
            const proportion = (costByVatRateForProportions[rateStr] || 0) / totalHamperCostForProportions;
            const baseForThisRateOnLine = lineTotalBasePrice * proportion;
            detailedLine.baseAmountByVatRate[rateStr] = parseFloat(baseForThisRateOnLine.toFixed(2));
            detailedLine.vatAmountByVatRate[rateStr] = parseFloat((baseForThisRateOnLine * rate).toFixed(2));
          });
        } else if (hamper && hamper.components.length > 0) {
          const distinctVatRates = new Set(hamper.components.map(hc => getProductById(hc.productId)?.vatRate).filter(r => r !== undefined));
          if (distinctVatRates.size === 1) {
              const singleRate = distinctVatRates.values().next().value;
              if (singleRate !== undefined) {
                  detailedLine.baseAmountByVatRate[singleRate.toString()] = parseFloat(lineTotalBasePrice.toFixed(2));
                  detailedLine.vatAmountByVatRate[singleRate.toString()] = parseFloat((lineTotalBasePrice * singleRate).toFixed(2));
              }
        } else {
           detailedLine.baseAmountByVatRate["0.21"] = parseFloat(lineTotalBasePrice.toFixed(2));
           detailedLine.vatAmountByVatRate["0.21"] = parseFloat((lineTotalBasePrice * 0.21).toFixed(2));
        }
        }
        detailedLine.totalVatForLine = parseFloat(Object.values(detailedLine.vatAmountByVatRate).reduce((sum, val) => sum + val, 0).toFixed(2));
        detailedLine.totalWithVatForLine = parseFloat((detailedLine.totalBaseForLine + detailedLine.totalVatForLine).toFixed(2));
        return detailedLine;
      })
      .filter((line): line is DetailedInvoiceLineItem => !!line);
  }, [getHamperById, getProductById]);

  const fetchBatchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/pedidos-lotes');
      if (!response.ok) throw new Error('Error al cargar pedidos de cestas/lotes');
      const data = await response.json();
      setBatchOrders(data);
    } catch (error) {
      console.error('Error cargando pedidos de cestas/lotes:', error);
    }
  }, []);

  const addBatchOrder = async (order: Omit<BatchOrder, '_id' | 'numeroPedido'>) => {
    const response = await fetch('/api/pedidos-lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Error al crear pedido de lote');
    await fetchBatchOrders();
  };

  const updateBatchOrder = async (id: string, order: Partial<BatchOrder>) => {
    const response = await fetch(`/api/pedidos-lotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Error al actualizar pedido de lote');
    await fetchBatchOrders();
  };

  const deleteBatchOrder = async (id: string) => {
    const response = await fetch(`/api/pedidos-lotes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar pedido de lote');
    await fetchBatchOrders();
  };

  const getBatchOrderById = useCallback((id: string) => batchOrders.find(o => o._id === id), [batchOrders]);

  const value: DataContextType & {
    batchOrders: BatchOrder[];
    addBatchOrder: typeof addBatchOrder;
    updateBatchOrder: typeof updateBatchOrder;
    deleteBatchOrder: typeof deleteBatchOrder;
    getBatchOrderById: typeof getBatchOrderById;
  } = {
    products, 
    hampers, 
    customers, 
    orders, 
    quotes, 
    invoices, 
    suppliers, 
    activityLog, 

    addProduct, updateProduct, deleteProduct, clearAllProducts, forceResetInventory, getProductById,
    addHamper, updateHamper, deleteHamper, getHamperById, calculateHamperDetails,
    addCustomer, updateCustomer, deleteCustomer, getCustomerById,
    addOrder, updateOrder, getOrderById,
    addQuote, updateQuote, deleteQuote, getQuoteById, convertQuoteToOrder,
    generateInvoiceForOrder, updateInvoice, getInvoiceById,
    addSupplier, updateSupplier, deleteSupplier, getSupplierById,
    getNextOrderNumber, getNextInvoiceNumber, getNextQuoteNumber,
    addActivityLogEntry,
    calculateOrderTotals,
    openConfirmModal,
    calculateDetailedInvoiceLineItems,

    batchOrders,
    addBatchOrder,
    updateBatchOrder,
    deleteBatchOrder,
    getBatchOrderById,
  };

  // Cargar clientes modernos desde la API al montar el DataProvider
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/clientes');
        if (!response.ok) throw new Error('Error al cargar clientes');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Respuesta inesperada al cargar clientes:', text);
          throw new Error('La respuesta del servidor no es JSON. Verifica la ruta /api/clientes.');
        }
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error cargando clientes modernos:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Cargar pedidos modernos desde la API al montar el DataProvider
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/pedidos');
        if (!response.ok) throw new Error('Error al cargar pedidos');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Respuesta inesperada al cargar pedidos:', text);
          throw new Error('La respuesta del servidor no es JSON. Verifica la ruta /api/pedidos.');
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error cargando pedidos modernos:', error);
      }
    };
    fetchOrders();
  }, []);

  // Cargar presupuestos modernos desde la API al montar el DataProvider
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/presupuestos');
        if (!response.ok) throw new Error('Error al cargar presupuestos');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Respuesta inesperada al cargar presupuestos:', text);
          throw new Error('La respuesta del servidor no es JSON. Verifica la ruta /api/presupuestos.');
        }
        const data = await response.json();
        // Ajuste: si la respuesta es { ok, presupuestos }, extraer el array
        if (data && Array.isArray(data.presupuestos)) {
          setQuotes(data.presupuestos);
        } else if (Array.isArray(data)) {
          setQuotes(data);
        } else {
          setQuotes([]);
        }
      } catch (error) {
        console.error('Error cargando presupuestos modernos:', error);
      }
    };
    fetchQuotes();
  }, []);

  // Cargar pedidos de cestas/lotes desde la API al montar el DataProvider
  useEffect(() => {
    const fetchBatchOrders = async () => {
      try {
        const response = await fetch('/api/pedidos-lotes');
        if (!response.ok) throw new Error('Error al cargar pedidos de cestas/lotes');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Respuesta inesperada al cargar pedidos de cestas/lotes:', text);
          throw new Error('La respuesta del servidor no es JSON. Verifica la ruta /api/pedidos-lotes.');
        }
        const data = await response.json();
        setBatchOrders(data);
      } catch (error) {
        console.error('Error cargando pedidos de cestas/lotes:', error);
      }
    };
    fetchBatchOrders();
  }, []);

  return (
    <DataContext.Provider value={value}>
      {children}
      {confirmModalState.isOpen && (
        <Modal
          isOpen={confirmModalState.isOpen}
          onClose={handleCancelConfirm}
          title={confirmModalState.title || "Confirmar Acción"}
          size="sm"
          showConfirmButtons
          onConfirm={handleConfirm}
          confirmText="Confirmar"
          cancelText="Cancelar"
          confirmButtonVariant={confirmModalState.confirmVariant}
        >
          <p>{confirmModalState.message}</p>
        </Modal>
      )}
    </DataContext.Provider>
  );
};
