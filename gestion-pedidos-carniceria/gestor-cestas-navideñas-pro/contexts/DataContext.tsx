import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { 
  Product, Hamper, Customer, Order, Invoice, Supplier, 
  OrderStatus, HamperComponent, Quote, QuoteItem, QuoteStatus, 
  PaymentStatus, ActivityLogEntry, OrderItem, VAT_TYPES, PRODUCT_FAMILIES, DetailedInvoiceLineItem
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

const tabArticulosXmlData = `<?xml version="1.0" encoding="UTF-8"?>
<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  xsi:noNamespaceSchemaLocation="TabArticulos.xsd" generated="2025-06-21T11:37:20">
<TabArticulos>
<NumArticulo>120001</NumArticulo>
<Descripcion>JAMON SERRANO CURADO C/P 6/7 KG</Descripcion>
<Comentario>Delicioso Jamón Serrano curado de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>SERRANOS</Especificacion>
<PCompra>32</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120002</NumArticulo>
<Descripcion>JAMON BODEGA MATANZA GRAN RESERVA 8/9 KG</Descripcion>
<Comentario>Delicioso Jamón curado de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>BODEGA</Especificacion>
<PCompra>45</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120003</NumArticulo>
<Descripcion>JAMON BODEGA LONCHEADO SOBRES 100 GRS</Descripcion>
<Comentario>Delicioso Jamón curado de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>BODEGA</Especificacion>
<PCompra>2</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120004</NumArticulo>
<Descripcion>JAMON IBERICO GRAN RESERVA 6/7 KG</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestro jamón ibérico presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>105</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120005</NumArticulo>
<Descripcion>JAMON DE CEBO IBERICO 7/8 KG 50 % RAZA IBERICA</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestro jamón ibérico presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>80</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120006</NumArticulo>
<Descripcion>JAMON DE BELLOTA IBERICO 7/8 KG ETIQUETA ROJA 50 % RAZA IBER</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor del jamón ibérico de bellota. Una garantía de satisfacción y calidad para los clientes más exigentes.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<DOrigen>GUIJUELO</DOrigen>
<PCompra>170</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120007</NumArticulo>
<Descripcion>JAMON DE BELLOTA IBERICO D.O. GUIJUELO 7/8 KG ETIQUETA NEGRA</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor del jamón ibérico de bellota.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>200</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120008</NumArticulo>
<Descripcion>PALETA SERRANA CURADA 4/5 KG</Descripcion>
<Comentario>Deliciosa Paleta Serrana curada de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>BLANCAS</SubFamilia>
<Especificacion>SERRANAS</Especificacion>
<PCompra>18.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120009</NumArticulo>
<Descripcion>PALETA SERRANA GRAN RESERVA</Descripcion>
<Comentario>Deliciosa Paleta Serrana curada de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>BLANCAS</SubFamilia>
<Especificacion>SERRANAS</Especificacion>
<PCompra>25</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120010</NumArticulo>
<Descripcion>PALETA LA PEPONA GRAN RESERVA 5 KG</Descripcion>
<Comentario>Deliciosa Paleta Serrana curada de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>BLANCAS</SubFamilia>
<Especificacion>SERRANAS</Especificacion>
<PCompra>21</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120011</NumArticulo>
<Descripcion>PALETA IBERICA CEBO RESERVA 4/5 KG</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestra paleta de jamón ibérica presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>35</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120012</NumArticulo>
<Descripcion>PALETA IBERICA RESERVA 4&apos;5/5 KG</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad. Nuestra paleta de jamón ibérica presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>45</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120013</NumArticulo>
<Descripcion>PALETA IBERICA LONCHEADA SOBRES 100 GRS</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestra paleta de jamón ibérica presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>3.33</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120014</NumArticulo>
<Descripcion>PALETA IBERICA BELLOTA GRAN RESERVA 4&apos;5/5 KG</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>90</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120015</NumArticulo>
<Descripcion>PALETA IBERICA BELLOTA D.O. GUIJUELO 5/6 KG</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota. Una garantía de satisfacción y calidad para los clientes más exigentes.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<DOrigen>GUIJUELO</DOrigen>
<PCompra>115</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120016</NumArticulo>
<Descripcion>PALETA IBERICA BELLOTA 4/5 KG</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota. Origen Guijuelo.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>45</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120017</NumArticulo>
<Descripcion>PALETA IBERICO BELLOTA LONCHEADO SOBRE 100 GRS</Descripcion>
<Comentario>Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>4.2</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120018</NumArticulo>
<Descripcion>CHORIZO IBERICO BELLOTA VELA DULCE 225 GRS/250 GRS</Descripcion>
<Comentario>De origen Guijuelo, elaborado artesanalmente con magro de cerdos ibéricos. El resultado hace un producto exclusivo de sabor suave y agradable.Formato ideal para los pequeños gourmets de la casa.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>1.55</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120019</NumArticulo>
<Descripcion>CHORIZO IBERICO BELLOTA VELA PICANTE 225 GRS/250 GRS</Descripcion>
<Comentario>De origen Guijuelo, elaborado artesanalmente con magro de cerdos ibéricos. El resultado hace un producto exclusivo de sabor suave y agradable.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>1.95</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120020</NumArticulo>
<Descripcion>SALCHICHON IBERICO BELLOTA VELA 225 GRS/250GRS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico de bellota, con un picado más fino de la carne, condimentado with ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una textura suave y un sabor único.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>1.55</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120021</NumArticulo>
<Descripcion>CHORIZO CULAR IBERICO SELECCIÓN 1 KG</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, un picado grueso del magro y de la grasa y un punto exacto de pimentón, hacen que la jugosidad sea perfecta, un aroma intenso con una persistencia sutil y agradable al paladar.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>12.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120022</NumArticulo>
<Descripcion>SALCHICHON CULAR IBERICO SELECCIÓN 1 KG</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, condimentado con ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una delicada textura y un sabor suave y único.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>12.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120023</NumArticulo>
<Descripcion>CHORIZO CULAR IBERICO BELLOTA SELECCIÓN MEDIOS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico,  un picado grueso del magro y de la grasa y un punto exacto de pimentón, hacen que la jugosidad sea perfecta, un aroma intenso con una persistencia sutil y agradable al paladar</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>6.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120024</NumArticulo>
<Descripcion>SALCHICHON CULAR IBERICO BELLOTA SELECCIÓN MEDIOS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, condimentado con ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una delicada textura y un sabor suave y único.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>6.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120025</NumArticulo>
<Descripcion>CHORIZO CULAR IBERICO BELLOTA GRAN SELECCIÓN</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico de bellota, un picado grueso del magro y de la grasa y un punto exacto de pimentón, hacen que la jugosidad sea perfecta, un aroma intenso con una persistencia sutil y agradable al paladar.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>11.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120026</NumArticulo>
<Descripcion>SALCHICHON CULAR IBERICO BELLOTA GRAN SELECCIÓN</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico de bellota, condimentado con ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una delicada textura y un sabor suave y único caracteristico de este producto.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>11.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120027</NumArticulo>
<Descripcion>CHORIZO IBERICO BELLOTA VELA DULCE 420/520 GRS</Descripcion>
<Comentario>De origen Guijuelo, elaborado artesanalmente con magro de cerdos ibéricos. El resultado hace un producto exclusivo de sabor suave y agradable.Formato ideal para los pequeños gourmets de la casa.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120028</NumArticulo>
<Descripcion>LOMO CABECERO EMBUCHADO ENTERO</Descripcion>
<Comentario>Un sabor inconfundible, sin acidez y con poca sal, son las características del exquisito producto para cualquier ocasión. De sabor suave y agradable.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>SERRANOS</Especificacion>
<PCompra>9</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120029</NumArticulo>
<Descripcion>LOMO CASERO EMBUCHADO TROZOS 400 GRS</Descripcion>
<Comentario>Elaborado con lomos frescos de Cerdo de capa blanca, cuidadosamente salado y adobado, su curación en secaderos naturales le conceden una calidad y bouquet inigualable. Sin apenas contenido graso e con una dosis muy baja de sal hacen que este producto sea bajo el punto de vista nutricional, excepcional.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>SERRANOS</Especificacion>
<PCompra>3.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120030</NumArticulo>
<Descripcion>LOMO IBERICO BELLOTA SELECCIÓN 400 GRS</Descripcion>
<Comentario>Elaborado de la manera más natural y artesanal, condimentado con Pimentón de la Vera y sal, una curación lenta y pausada, conseguimos un lomo ibérico embuchado de cebo, con un sabor característico y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>10.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120031</NumArticulo>
<Descripcion>LOMO IBERICO BELLOTA GRAN SELECCIÓN 1&apos;2 KG</Descripcion>
<Comentario>De los mejores cerdos ibéricos de bellota.Elaborado natural y artesanal, con una curación lenta y pausada, conseguimos una textura fina y delicada con una infiltración de grasa, que le confieren un sabor y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>34</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120032</NumArticulo>
<Descripcion>LOMITO IBERICO BELLOTA GRAN SELECCIÓN 400/500 GRS </Descripcion>
<Comentario>El Lomito ibérico de bellota es la parte noble por excelencia del cerdo ibérico de bellota, criado suelto por el campo y alimentado con bellotas en montanera.Su fino veteado es característico del auténtico lomito ibérico de bellota, con su sabor suave y unico hace un producto excepcional.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>14</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120033</NumArticulo>
<Descripcion>LOMO IBERICO CEBO 1&apos;2 KG</Descripcion>
<Comentario>Elaborado de la manera más natural y artesanal, condimentado con Pimentón de la Vera y sal, una curación lenta y pausada, conseguimos un lomo ibérico embuchado de cebo, con un sabor característico y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>31</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120034</NumArticulo>
<Descripcion>MORCON IBERICO BELLOTA 1 KG</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>11.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120036</NumArticulo>
<Descripcion>CECINA DE VACA 1 KG</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>SERRANOS</Especificacion>
<PCompra>13.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120037</NumArticulo>
<Descripcion>SARTA MATANZA DULCE 450 GRS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, un picado fino del magro y de la grasa y un punto exacto de pimentón, hacen que la jugosidad sea perfecta, un aroma intenso con una persistencia sutil y agradable al paladar.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120038</NumArticulo>
<Descripcion>SARTA MATANZA PICANTE 450 GRS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, un picado fino del magro y de la grasa y un punto exacto de pimentón picante, hacen que la jugosidad sea perfecta, un aroma intenso con una persistencia sutil y agradable al paladar mas exigente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120039</NumArticulo>
<Descripcion>SARTA MATANZA SALCHICHON 450 GRS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico, condimentado con ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una delicada textura y un sabor suave y único.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120040</NumArticulo>
<Descripcion>QUESO MEZCLA SAN VICENTE MINI C/C 500 GRS</Descripcion>
<Comentario>Elaborado con leche cruda.Color amarillo marfil, sabor intenso equilibrado con recuerdos lácticos, olor intenso y textura firme, agradable, cremoso al paladar.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>3.39</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120041</NumArticulo>
<Descripcion>QUESO ARTESANO CABRA MINI 500 GRS</Descripcion>
<Comentario>Elaborado con leche pasteurizada de cabra. Color blanco, sabor equilibrado con recuerdos lácticos, olor suave característico y textura firme, agradable, cremoso al paladar.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>4.2</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120042</NumArticulo>
<Descripcion>QUESO SANSUEÑA VIEJO 1 KG </Descripcion>
<Comentario>Un Queso de caráter único, cuya fermentación se realiza con la propia bacteria natural de la leche, sin adición de conservantes ni fermentos.Madurado lentamente para obtener un producto artesanal de sabor intenso y puro, de inconfundible aroma y de fina textura.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>9.6</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120043</NumArticulo>
<Descripcion>QUESO OVEJA LECHE CRUDA &quot;BALLESTEROS&quot; 850/900 GRS</Descripcion>
<Comentario>Queso elaborado con leche cruda de oveja.Color amarillento de sabor tipico a queso de oveja, intenso pero nunca picante. Buquet fino y elegante.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>9.5</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120044</NumArticulo>
<Descripcion>QUESO OVEJA SANSUEÑA CUÑAS OCTAVOS</Descripcion>
<Comentario>Queso elaborado con leche cruda de oveja.Color amarillento de sabor tipico a queso de oveja, intenso pero nunca picante. Buquet fino y elegante.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>3.7</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120045</NumArticulo>
<Descripcion>QUESO MEZCLA SAN VICENTE MINI S/C 500 GRS</Descripcion>
<Comentario>Elaborado con leche cruda. Color amarillo marfil, sabor intenso equilibrado con recuerdos lácticos, olor intenso y textura firme, agradable, cremoso al paladar.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>3.09</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120046</NumArticulo>
<Descripcion>QUESO SANSUEÑA VIEJO 3 KG APROX CURADO EN MANTECA</Descripcion>
<Comentario>Un Queso de caráter único, cuya fermentación se realiza con la propia bacteria natural de la leche, sin adición de conservantes ni fermentos.Madurado lentamente durante un año, para obtener un producto artesanal de sabor intenso y puro, de inconfundible aroma y de fina textura.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>32</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120047</NumArticulo>
<Descripcion>QUESO CUÑA SAN VICENTE  SEMI-CURADO 250 GRS</Descripcion>
<Comentario>Elaborado con leche pasteurizada de vaca, oveja y cabra. Color blanco marfil, Sabor equilibrado con recuerdos lácticos,  olor suave característico y Textura firme, agradable, cremoso al paladar.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>1.3</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120049</NumArticulo>
<Descripcion>VINO TINTO OPERA PRIMA CRIANZA D.O LA MANCHA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>LA MANCHA</DOrigen>
<PCompra>1.025</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120051</NumArticulo>
<Descripcion>CAVA CRISTALINO BRUT JAUME SERRA</Descripcion>
<Comentario>Los cavas Jaume Serra Cristalino son muy apreciados en España y en el extranjero por su calidad y cuentan en su haber con numerosos premios nacionales e internacionales.De sabor suave y agradable.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT</Especificacion>
<PCompra>1.406</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120052</NumArticulo>
<Descripcion>CAVA JAUME SERRA BRUT ROSADO</Descripcion>
<Comentario>Es de color rosa frambuesa, brillante y limpio. Burbuja fina, abundante y persistente.Con buena intensidad aromática, muy fresco y frutal. Elaborado con el metodo tradicional.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT</Especificacion>
<PCompra>1.753</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120053</NumArticulo>
<Descripcion>CAVA JAUME SERRA BRUT NATURE RESERVA</Descripcion>
<Comentario>Este es un cava con burbuja abundante de pequeño tamaño y buena  intensidad aromatica en nariz.Las sensaciones son limpias, frescas y persistentes.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT RESERVA</Especificacion>
<PCompra>1.406</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120054</NumArticulo>
<Descripcion>VINO TINTO MARQUES DEL ALTILLO JOVEN D.O. RIOJA</Descripcion>
<Comentario>De color rojo granate, brillante e intenso, afrutado y limpio, con dejos a frutos rojos como la fresa o la frambuesa. Es un vino suave y afrutado,  largo, persistente y bien estructurado, y con un final armónico y agradable.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>1.21</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120055</NumArticulo>
<Descripcion>VINO TINTO MARQUES DEL ALTILLO CRIANZA D.O. RIOJA</Descripcion>
<Comentario>De color rojo cereza-granate, brillante, intenso y aromático, donde sobresalen notas balsámicas con recuerdos a coco y a vainilla y frutas maduras muy bien integradas. Es un vino con complejidad y armonía, aterciopelado y sabroso, con notas de madera que le aportan una excelente redondez y finura.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>2.012</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120056</NumArticulo>
<Descripcion>VINO TINTO TOTIUM JOVEN D.O. RIBERA DE DUERO</Descripcion>
<Comentario>Vino tinto joven.Este vino ofrece un color cereza intenso con ribetes violetas. De nariz es intenso, con mucha fruta madura . Carnoso, bien equilibrado y de final largo.  Maridaje: aperitivos, arroces, carnes, quesos, pasta</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>1</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120057</NumArticulo>
<Descripcion>VINO BLANCO FINCA ARIADNA VERDEJO D.O. RUEDA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>RUEDA</DOrigen>
<PCompra>1.262</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120058</NumArticulo>
<Descripcion>VINO TINTO FINCA LAMEDA ROBLE D.O. TORO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>ROBLE</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>2.85</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120059</NumArticulo>
<Descripcion>VINO TINTO CONDADO DE ORIZA CRIANZA D.O. RIBERA DE DUERO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>4.75</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120060</NumArticulo>
<Descripcion>VINO TINTO ARNEGUI CRIANZA D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>3.4</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120061</NumArticulo>
<Descripcion>VINO TINTO PEÑAMONTE CRIANZA D.O. TORO</Descripcion>
<Comentario>Ligera permanencia en barricas nuevas de roble americano buscando adquirir finura de color, complejidad de nariz y suavidad en boca.Color intenso, granate con tonos violáceos, limpio. Aromas potentes, vinoso, muy afrutado, con notas de madera fina, las justas para limar tonos ardientes y agrestes. En boca es carnoso, cálido, frutal, con cuerpo, sus abundantes taninos han sido pulidos y dulcificados. Final forte de gran sabor y persistencia. Muy genuino, lleno de tipicidad.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>2.3</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120062</NumArticulo>
<Descripcion>VINO TINTO PEÑAMONTE JOVEN D.O. TORO</Descripcion>
<Comentario>Color cereza picota intenso de bonitos tonos morados. Aromas conjuntados de frutillas negras, moras, arándanos con una sutil nota de flor de violeta.  En boca es carnoso, afrutado, con una punta de frescor que lo hace muy agradable.Perfecto con carnes rojas, asadas o guisadas, quesos curados.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>1.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120063</NumArticulo>
<Descripcion>VINO TINTO MONTE REAL RESERVA DE LA FAMILIA D.O. RIOJA</Descripcion>
<Comentario>Rojo picota profundo con ribete naranja, brillante y de capa media.Aromático, predominan aromas de su crianza (especiados, cacao, tostados) La fruta roja es madura.Boca viva, buena estrutura, fino, suave paso por boca. Recuerdos de ciruelas con tanicidad de madera algo presente en un vino de corte clásico. Equilibrado.
 Especial para  guisos tradicionales suaves sin picantes, patatas a la rioja, verduritas salteadas con jamón. En general excelente con carnes en general no muy especiadas.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>RESERVA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>3.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120064</NumArticulo>
<Descripcion>VINO TINTO VIÑA ALBINA RESERVA SELECCIÓN D.O. RIOJA</Descripcion>
<Comentario>Muy representativo de los vinos clásicos de Rioja Alta, bien hecho, sabroso. Puro Rioja. De la conjunción de diversas variedades de uva, como son tempranillo, Mazuelo y Graciano y una elaboración con uva despalillada, estrujada, con larga maceración, se obtiene un vino de color rubí, elegante en nariz fino y bien construido en boca, con buena acidez y pulidos taninos. Posee una compleja via retronasal, así como una fragancia delicada y persistente.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>RESERVA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>3.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120065</NumArticulo>
<Descripcion>VINO TINTO PUERTA VIEJA CRIANZA SELECCIÓN D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>2.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120066</NumArticulo>
<Descripcion>VINO BLANCO EXPOLIO VERDEJO JOVEN D.O. RUEDA</Descripcion>
<Comentario>Con la receta de Verdejo fresco, ligero y de acento goloso moderado. Goza de cierta nobleza varietal que lo honra</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>RUEDA</DOrigen>
<PCompra>1.55</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120067</NumArticulo>
<Descripcion>VINO TINTO MARQUES DE LA VILLA JOVEN D.O. TORO</Descripcion>
<Comentario>Vino joven amplio, sabroso y persistente, con aromas a frutas negras y rojas típicas de la variedad Tinta de Toro con la que está elaborado.De color rojo picota cereza muy vivo, es un vino estructurado y bien equilibrado.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>1.35</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120068</NumArticulo>
<Descripcion>VINO TINTO MARQUES DE LA VILLA ROBLE D.O. TORO</Descripcion>
<Comentario>Tras permanecer en barrica durante 3-4 meses, Marqués de la Villa Roble es el vino ideal para aquellos que buscan un vino que conserve la fruta de los vinos jóvenes, combinado con un sutil toque de madera que lo convierte en un vino armonioso, elegante y rico al paladar.Medalla de plata International Wine Challenge Catavinum 2012 y Zarcillo de Plata. Premios Zarcillo 2013</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>ROBLE</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>1.79</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120069</NumArticulo>
<Descripcion>VINO TINTO MARQUES DE LA VILLA CRIANZA D.O. TORO</Descripcion>
<Comentario>Con los aromas típicos de la variedad y con gran riqueza y profusión de matices, Marqués de la Villa Crianza es un vino persistente, glicérico y brillante.De color rojo picota intenso, es fino en boca, con una complejidad aromática y con unos taninos redondos y perfectamente integrados que hacen de él un vino sabroso y largo en sensación, fruto de su cuidada elaboración y su crianza.Medalla de plata International Wine Challenge Catavinum 2012</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>2.87</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120070</NumArticulo>
<Descripcion>WHISKY BLANTON&apos;S SINGLE BARREL 70 CL</Descripcion>
<Comentario>GREEN LABEL &quot;THE BEST WHISKEY IN THE WORLD&quot; BOTELLA NUMERADA MAS ESTUCHE.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>13.58</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120071</NumArticulo>
<Descripcion>WHISKY GOLFIELD SOCTH &quot;OLD DELUXE WHISKY&quot; 70 CL</Descripcion>
<Comentario>70 CL. 40 º. WHISKY 100 % ESCOCES &quot;GOLFIELD&quot; EMBOTELLADO EN ESCOCIA. 92 PUNTOS EN LA GUIA PEÑIN. Goldfield es una selección de los mejores Maltas y granos de Escocia. Elaborado a partir de la más pura agua de montaña. Destilado y madurado en Escocia. Es un Whisky suave y elegante, con cuerpo, maleable, y bien conjuntado, de paladar puramente escocés y delicado aroma. Para saborear solo o combinado con el refresco de su elección. Es presentado en distintiva botella cuadrada que resalta su estilo clásico.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>5.45</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120072</NumArticulo>
<Descripcion>RON BERMUDEZ AÑEJO SELECTO 7 AÑOS</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>RON</SubFamilia>
<PCompra>5.8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120073</NumArticulo>
<Descripcion>GIN GALESA PREMIUN &quot;BRECON&quot;  70 CL</Descripcion>
<Comentario>5 DESTILACIONES / 10 BOTANICAS</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>GINEBRAS</SubFamilia>
<PCompra>13.97</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120074</NumArticulo>
<Descripcion>GIN INGLESA PREMIUM &quot; THE BOTANICAL&apos;S&quot; 70 CL</Descripcion>
<Comentario>5 DESTILACIONES / 14 BOTANICAS</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>GINEBRAS</SubFamilia>
<PCompra>14.95</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120075</NumArticulo>
<Descripcion>GIN ESCOCESA PREMIUM &quot;BOË&quot;</Descripcion>
<Comentario>3 DESTILACIONES / 13 BOTANICAS</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>GINEBRAS</SubFamilia>
<PCompra>12.46</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120076</NumArticulo>
<Descripcion>CAVA PARXET BRUT RESERVA</Descripcion>
<Comentario>Tono muy pálido con reflejos verdes, burbuja muy fina y persistente. Nariz delidada y personalizada en la que la Pansa Blanca caracteriza su sello de Alella. En boca es amplio, con personalidad y con volumen.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT RESERVA</Especificacion>
<PCompra>3.55</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120077</NumArticulo>
<Descripcion>CAVA PARXET MARIA CABANÉ</Descripcion>
<Comentario>Tono muy pálido con reflejos verdes, burbuja muy fina y persistente con tendencia a formar corona de espuma. Nariz delicada personalizada en la que la Pansa Blanca caracteriza su sello de Alella. En boca es amplio, con personalidad y con volumen.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<PCompra>3.69</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120078</NumArticulo>
<Descripcion>WHISKY PASSPORT 0&apos;50 CL</Descripcion>
<Comentario>Combina el sabor a malta de las tierras más altas con el whisky de las tierras más bajas, más ligero y dulce. Su sabor es suave elegancia. Los sabores equilibrados crean una notable suavidad en el paladar. De cuerpo medio, con un acabado suave y elegante.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>4.744</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120079</NumArticulo>
<Descripcion>WHISKY CHIVAS REGAL 12 AÑOS 0&apos;70 CL</Descripcion>
<Comentario>Lider de ventas desde hace décadas. Bonito color ambar cálido radiante. Surgen aromás a brezo ,miel y mezcla de frutas, es whisky muy completo, cremoso y muy bien balanzeado, con una rica mezcla de sabores predominando la miel y la manzana muy madura con toques de vainilla y avellanas y unas ligeras notas de mantequilla, con un final largo y muy aceptable. Todo un clásico.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>14.062</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120080</NumArticulo>
<Descripcion>RON HAVANA CLUB ESPECIAL 5 AÑOS 50 CL</Descripcion>
<Comentario>El ron Havana Club Añejo Reserva, hermoso por su color ámbar, con tintes de albaricoque asado posee un olor floral, al principio con aromas de vainilla y tabaco rubio, después con notas más fuertes de madera. Tiene un sabor delicado, con complejos aromas de cacao, café, tabaco forte y especias.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>RON</SubFamilia>
<PCompra>5.24</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120081</NumArticulo>
<Descripcion>CREMA DE ORUJO  RUA VIEJA 50 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>CREMAS</SubFamilia>
<PCompra>4.676</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120082</NumArticulo>
<Descripcion>LICOR AGUARDIENTE DE HIERBAS</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>AGUARDIENTES</SubFamilia>
<PCompra>3.13</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120084</NumArticulo>
<Descripcion>WHISKY CHIVAS REGAL 18 AÑOS 0&apos;70 CL</Descripcion>
<Comentario>Chivas 18 es una mezcla única, rica y con múltiples capas que contiene más de 20 de los whiskys más excepcionales de Escocia de una sola malta. Con 85 sabores en todas sus gotas, cada sorbo es un nuevo descubrimiento.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>32.44</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120085</NumArticulo>
<Descripcion>WHISKY THE GLENLIVET 12 AÑOS 70 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>15.905</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120086</NumArticulo>
<Descripcion>BRANDY PRINCIPE 70 CL</Descripcion>
<Comentario>Color ámbar intenso. Aroma a madera, con apuntes de pastelería. En boca tonos dulces, ligeramente ardiente, cálido. Excelente calidad-precio para ser un brandy de reserva especial.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>BRANDY</SubFamilia>
<PCompra>6.59</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120087</NumArticulo>
<Descripcion>CHAMPAGNE MUMM CORDON ROUGE BRUT 75 CL</Descripcion>
<Comentario>Tiene como estandarte de marca a su cordón rouge (cordón rojo) desde 1876 en honor a la banda roja la más alta distinción de la Legión Francesa. Se presenta a la vista burbujas abundantes pero finas y elegantes que ya demuestran la finura y la dinámica de este champán. Una capa fresca, amarillo dorada con reflejos de jade.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CHAMPAGNES</SubFamilia>
<Especificacion>BRUT</Especificacion>
<PCompra>22.866</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120088</NumArticulo>
<Descripcion>CAVA SUMARROCA BRUT GRAN RESERVA</Descripcion>
<Comentario>Es un cava que puede acompañar cualquier aperitivo y comida.El aroma es fresco, es fácil de beber, cremoso pero seco y ligeramente dulce.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT RESERVA</Especificacion>
<PCompra>3.25</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120089</NumArticulo>
<Descripcion>CAVA JUVE Y CAMPS RESERVA DE LA FAMILIA BRUT NATURE</Descripcion>
<Comentario>Pocas palabras hacen falta para describir al cava Juvé y Camps Reserva de la Familia  . Reconocido internacionalmente, es uno de los espumosos con mejor reputación y arraigo. Para su elaboración se utilizan uvas Macabeo, Xarel·lo y Perallada, de las que se extrae un mosto que dará paso a espumoso de burbuja fina, fresco, amplio y cremoso. En Juvé &amp; Camps siguen elaborando el cava como lo han hecho siempre desde hace más de 200 años. Un modo artesano cuyo resultado es un cava excelente y además de de gran fama internacional. Juvé &amp; Camps Reserva de la Familia es un brut nature criado en las silenciosas cavas bajo una luz tenue y que es tratado con muchísimo mimo durante toda su estancia. Un clásico que imprime solemnidad y elegancia a toda celebración.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT NATURE</Especificacion>
<PCompra>8.71</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120090</NumArticulo>
<Descripcion>CAVA JUVE Y CAMPS RESERVA CINTA PURPURA BRUT</Descripcion>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<Especificacion>BRUT</Especificacion>
<PCompra>7.2</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120091</NumArticulo>
<Descripcion>SALCHICHON IBERICO BELLOTA VELA 420/520 GRS</Descripcion>
<Comentario>Elaborado con piezas nobles de cerdo ibérico de bellota, con un picado más fino de la carne, condimentado con ajo y pimienta y alcanzando un equilibrio perfecto entre magro y grasa, que le confiere una textura suave y un sabor único.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120092</NumArticulo>
<Descripcion>LOMO IBERICO TROZOS 500 GRS</Descripcion>
<Comentario>Elaborado de la manera más natural y artesanal, condimentado con Pimentón de la Vera y sal, una curación lenta y pausada, conseguimos un lomo ibérico embuchado, con un sabor característico y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>12</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120093</NumArticulo>
<Descripcion>ESTUCHE SURTIDO ESPECIAL MANTECADOS Y POLVORONES 300 GRS</Descripcion>
<Comentario>DULCESTEPA. El autentico dulce de Estepa.Exquisitos Surtidos Navideños realizados con la mejor materia prima.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.9</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120094</NumArticulo>
<Descripcion>PASTAS SURTIDAS 100 GRS DULCESTEPA</Descripcion>
<Comentario>Exquisitas Pastas Surtidas Navideñas realizadas con la mejor materia prima.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.59</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120095</NumArticulo>
<Descripcion>ESTUCHE SURTIDO TRADICIONAL DULCESTEPA 200 GRS</Descripcion>
<Comentario>Tradional y delicioso surtido de mantecados y polvorones navideños elaborados artesanalmente.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120096</NumArticulo>
<Descripcion>SURTIDO COFRE CHOCOLATE 150 GRS DULCESTEPA</Descripcion>
<Comentario>Selección de Chocolates en formato caja cofre.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>1.24</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120097</NumArticulo>
<Descripcion>SURTIDO CREPS 75 GRS DULCESTEPA</Descripcion>
<Comentario>Combinacion de creps recubiertos de chocolate con almendras.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>0.55</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120098</NumArticulo>
<Descripcion>PETALOS DE NARANJA 6 UNIDADES DULCESTEPA</Descripcion>
<Comentario>Deliciosos petalos de chocolate de flor de pascua a la naranja.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>0.56</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120099</NumArticulo>
<Descripcion>BOMBONES FERRERO ROCHER 16 UNIDADES </Descripcion>
<Comentario>Crujientes especialidades de chocolate con leche y avellanas, con relleno cremoso y avellana entera.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>3.46</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120100</NumArticulo>
<Descripcion>BOMBONES NESTLE CAJA ROJA 200 GRS</Descripcion>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>3.49</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120101</NumArticulo>
<Descripcion>FRUITS D&apos;OR 135 GRS BIRBA</Descripcion>
<Comentario>Milhojas de galleta con crema de coco, bañadas en chocolate fondant (60% de cacao).</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.333</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120102</NumArticulo>
<Descripcion>EXTRAFINAS ALMENDRA 35 GRS BIRBA</Descripcion>
<Comentario>Crujientes galletas de almendra. Un capricho irresistible.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.333</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120103</NumArticulo>
<Descripcion>AMETLLATS 75 GRS BIRBA</Descripcion>
<Comentario>Crujientes bocados de deliciosa galleta de almendra.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.323</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120104</NumArticulo>
<Descripcion>BRISALETS 115 GRS BIRBA</Descripcion>
<Comentario>Milhojas de galleta con crema de chocolate y coco.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.078</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120105</NumArticulo>
<Descripcion>MOS NARANJA Y CHOCOLATE 120 GRS BIRBA</Descripcion>
<Comentario>Pequeños bocados crujientes de naranja, con base de chocolate.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.441</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120106</NumArticulo>
<Descripcion>TURRON JIJONA HEMM 300 GRS</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.74</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120107</NumArticulo>
<Descripcion>TURRON ALICANTE HEMM 300 GRS</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.74</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120108</NumArticulo>
<Descripcion>TURRON YEMA TOSTADA HEMM 300 GRS</Descripcion>
<Comentario>La exquisita mezcla de la almendra y la yema de huevo logran un sabor único, que una vez tostado se convierte en un característico producto, muy apreciado por su delicado sabor y una suave textura.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.05</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120109</NumArticulo>
<Descripcion>TURRON CHOCOLATE CON ALMENDRAS RILSAN 300 GRS E.GARRIGOS</Descripcion>
<Comentario>Calidad Suprema.Excelente Turrón de Chocolate negro, con almendras marconas. Fusionados en su máxima expresión.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.89</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120110</NumArticulo>
<Descripcion>TURRON JIJONA ARTESANIA 200 GRS</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.01</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120111</NumArticulo>
<Descripcion>TURRON JIJONA 150 GRS ARTESANIA</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>1.32</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120112</NumArticulo>
<Descripcion>TURRON ALICANTE ARTESANIA 200 GRS</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.01</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120113</NumArticulo>
<Descripcion>TURRON ALICANTE IMPERIAL 150 GRS ARTESANIA</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>1.32</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120115</NumArticulo>
<Descripcion>TURRON JIJONA 500 GRS RILSAN</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.85</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120116</NumArticulo>
<Descripcion>TURRON ALICANTE 500 GRS RILSAN</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.85</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120117</NumArticulo>
<Descripcion>TURRON YEMA TOSTADA 500 GRS RILSAN</Descripcion>
<Comentario>La exquisita mezcla de la almendra y la yema de huevo logran un sabor único, que una vez tostado se convierte en un característico producto, muy apreciado por su delicado sabor y una suave textura.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.75</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120118</NumArticulo>
<Descripcion>TURRON CHOCOLATE CON ALMENDRAS 500 GRS RILSAN</Descripcion>
<Comentario>Calidad Suprema.Excelente Turrón de Chocolate negro, con almendras marconas. Fusionados en su máxima expresión.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.85</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120119</NumArticulo>
<Descripcion>TURRON CHOCOLATE CON ALMENDRAS 300 GRS ARTESANIA</Descripcion>
<Comentario>Calidad Suprema.Excelente Turrón de Chocolate negro, con almendras marconas. Fusionados en su máxima expresión.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>2.87</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120120</NumArticulo>
<Descripcion>FIGURITAS DE MAZAPAN 100 GRS ARTESANIA</Descripcion>
<Comentario>ENRIQUE GARRIGOS CALIDAD SUPREMA. Elaboradas con almendras  seleccionadas y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.97</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120121</NumArticulo>
<Descripcion>DELICIAS DE TURRON 100 GRS ARTESANIA</Descripcion>
<Comentario>Crujiente barquillo relleno de una deliciosa y suave crema de turrón.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>0.654</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120122</NumArticulo>
<Descripcion>POLVORON ARTESANO DE ALMENDRA 330 GRS E. MORENO</Descripcion>
<Comentario>Envueltos a mano. Tradionales y deliciosos polvorones de almendra elaborados artesnalmente.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.41</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120123</NumArticulo>
<Descripcion>ESTUCHE SURTIDO ESPECIAL 400 GRS E. MORENO</Descripcion>
<Comentario>Tradional y delicioso surtido de polvorones navideños elaborados artesnalmente.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>2.28</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120124</NumArticulo>
<Descripcion>BOMBON TROSSET 150 GRS E. MORENO</Descripcion>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>1.45</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120125</NumArticulo>
<Descripcion>CHOCOUVAS DE LA SUERTE 12 UNIDADES E. MORENO</Descripcion>
<Comentario>Deliciosas uvas recuertas de chocolate con leche. Tipico producto navideño que no puede faltar en su mesa para la diversion de los mas pequeños.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>0.62</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120126</NumArticulo>
<Descripcion>WHISKY CHIVAS REGAL 12 AÑOS 0&apos;50 CL</Descripcion>
<Comentario>Lider de ventas desde hace décadas. Bonito color ambar cálido radiante. Surgen aromás a brezo ,miel y mezcla de frutas, es whisky muy completo, cremoso y muy bien balanzeado, con una rica mezcla de sabores predominando la miel y la manzana muy madura con toques de vainilla y avellanas y unas ligeras notas de mantequilla, con un final largo y muy aceptable. Todo un clásico.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>10.647</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120127</NumArticulo>
<Descripcion>RON HAVANA CLUB ESPECIAL 5 AÑOS 70 CL</Descripcion>
<Comentario>El ron Havana Club Añejo Reserva, hermoso por su color ámbar, con tintes de albaricoque asado posee un olor floral, al principio con aromas de vainilla y tabaco rubio, después con notas más fuertes de madera. Tiene un sabor delicado, con complejos aromas de cacao, café, tabaco forte y especias.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>RON</SubFamilia>
<PCompra>7.62</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120128</NumArticulo>
<Descripcion>VODKA ABSOLUT 50 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>VODKA</SubFamilia>
<PCompra>5.567</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120129</NumArticulo>
<Descripcion>CAJA DE CARTON DECORADO MEDIANA ROJA CON ASAS</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>1.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120130</NumArticulo>
<Descripcion>CAJA DE CARTON DECORADA ESTUCHE</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>1.4</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120131</NumArticulo>
<Descripcion>CAJA DE CARTON JAMONERA SAI</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>1.98</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120132</NumArticulo>
<Descripcion>CAJA DE CARTON TAPA FONDO LILA</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>1.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120133</NumArticulo>
<Descripcion>CAJA TROLLEY CARTON BAUL</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>4.66</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120134</NumArticulo>
<Descripcion>CAJA TROLLEY CARTON 15</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>3.9</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120135</NumArticulo>
<Descripcion>CAJA DE CARTON DECORADA CON ASA DISEÑO VERDE JAMONERA</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>1.8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120136</NumArticulo>
<Descripcion>ESTUCHE DE MADERA 2 BOTELLAS</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>2.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120137</NumArticulo>
<Descripcion>BAUL DISEÑO PIEL GRANDE</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>46</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120138</NumArticulo>
<Descripcion>ESTUCHE MADERA DISEÑO INTRAS</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>3</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120139</NumArticulo>
<Descripcion>CAJA DE MADERA FUNDACION PERSONAS</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>8.8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120140</NumArticulo>
<Descripcion>CAJA DE MADERA FUNDACION PERSONAS PERSONALIZADA</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>11.3</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120141</NumArticulo>
<Descripcion>LOMO IBERICO BELLOTA 400 GRS</Descripcion>
<Comentario>De los mejores cerdos ibéricos de bellota.Elaborado natural y artesanal, con una curación lenta y pausada, conseguimos una textura fina y delicada con una infiltración de grasa, que le confieren un sabor y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>13</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120142</NumArticulo>
<Descripcion>LOMO IBERICO BELLOTA 500 GRS</Descripcion>
<Comentario>De los mejores cerdos ibéricos de bellota.Elaborado natural y artesanal, con una curación lenta y pausada, conseguimos una textura fina y delicada con una infiltración de grasa, que le confieren un sabor y un bouquet persistente y envolvente.</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>15</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120144</NumArticulo>
<Descripcion>ESTUCHE PASAS MOSCATEL SEKITOS 90 GRS</Descripcion>
<Comentario>Productos exclusivos para adornar la Navidad. Selección de pasas Moscatel.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>FRUTOS SECOS</SubFamilia>
<PCompra>0.34</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120145</NumArticulo>
<Descripcion>DATIL AL VACIO SEKITOS 100 GRS</Descripcion>
<Comentario>Datiles confitados selección SEKITOS.Productos exclusivos para adornar la Navidad.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>FRUTOS SECOS</SubFamilia>
<PCompra>0.31</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120146</NumArticulo>
<Descripcion>VINO TINTO MURUVE JOVEN D.O. TORO</Descripcion>
<Comentario>Variedad Tinta de Toro.Aroma a fruta roja y madura propia de bayas silvestres (mora y zarzamora) con taninos agradables. Estructurado, amplio y frutoso.Color rojo guinda vivo, brillante e intenso con matices azulados y violáceos.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>2.21</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120147</NumArticulo>
<Descripcion>VINO TINTO MURUVE CRIANZA D.O. TORO</Descripcion>
<Comentario>Color rojo rubí bien cubierto, límpio y brillante. Aroma complejo y elegante con aromas de crianza en buena madera.Vigoroso, con gran carácter, sabroso, amplio y de larga persistencia.Envejecimiento: 12 meses en barrica. Maridaje con Carnes asadas y quesos curados.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>4.4</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120148</NumArticulo>
<Descripcion>VINO TINTO SIERRA CANTABRIA CRIANZA D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>4.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120149</NumArticulo>
<Descripcion>VINO TINTO SIERRA CANTABRIA RESERVA D.O RIOJA</Descripcion>
<Comentario>Color: rojo rubí-teja brillante y de buena capa. Aroma: intenso, complejo y cálido en nariz, con elegante bouquet de crianza y amplia gama de sensaciones bien conjuntadas percibiéndose las notas de fruta fresca y madura combinada con toques de especias, vainilla y tostados. En boca: bouquet aterciopelado complejo y pleno, desarrollando con fuerza notas de frutos rojos bien maduros. Buena estrutura y equilibrio tánico proporcionando una estrutura potente y elegante. En el retrogusto se aprecian con fuerza las notas de torrefactos, vainilla y ligeros toques balsámicos sobresaliendo las sensaciones de frutos rojos. Final largo y persistente.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>RESERVA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>7.95</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120150</NumArticulo>
<Descripcion>VINO TINTO SIERRA CANTABRIA SELECCIÓN D.O. RIOJA</Descripcion>
<Comentario>Tempranillo riojano de Sierra Cantabria de maceración carbónica, joven, franco y con todas las garantías de la familia Eguren. Color cereza picota. Limpio y brillante. En nariz, aromas de frutos rojos y negros bien maduros con notas de regaliz. Intenso y persistente. En boca cuerpo y taninos maduros, fresco, sedoso, bien equilibrado y frutal.Maridaje: Entremeses y embutidos, patatas, legumbres, arroces, paella, carnes blancas y rojas asadas sin mucha condimentación, quesos frescos y semicurados.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>SELECCIÓN</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>3.18</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120151</NumArticulo>
<Descripcion>VINO TINTO ALMIREZ D.O. TORO</Descripcion>
<Comentario>De intenso color Picota de capa alta, amplio ribete y abundante lágrima. Notas aromáticas y complejas. Tostados y especias. En boca se muestra sedoso y fresco. Es estructurado y equilibrado. Con final largo con un postgusto goloso.Maridará perfectamente con pescado azul a la plancha, caza de pluma, guisos de carne de cerdo, ternera.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<DOrigen>TORO</DOrigen>
<PCompra>10.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120152</NumArticulo>
<Descripcion>VINO TINTO VICTORINO  D.O. TORO</Descripcion>
<Comentario>Un vino de los más elegantes y contundentes de la denominación de Toro. Elaborado con Tinta de Toro de más de 45 años de distintos viñedos propios con bajos rendimientos. Se realiza totalmente manual con una doble selección en la planta y en la mesa de selección de la bodega.Recomendamos decantarlo unas 4 horas antes de servir, como mínimo. Color cereza muy oscuro y brillante con reflejos amoratados. Un gran vino que no nos dejará indiferentes.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>19.93</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120153</NumArticulo>
<Descripcion>VINO TINTO ROMANICO CRIANZA D.O. TORO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>TORO</DOrigen>
<PCompra>4.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120154</NumArticulo>
<Descripcion>VINO TINTO ABADIA RETUERTA SELECCIÓN ESPECIAL</Descripcion>
<Comentario>DE SARDON DE DUERO</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>SELECCIÓN</Especificacion>
<DOrigen>SIN D.O.</DOrigen>
<PCompra>12.98</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120155</NumArticulo>
<Descripcion>VINO BLANCO ONA DE MARFIL D.O. ALELLA</Descripcion>
<Comentario>Color amarillo pálido con reflejos verdosos, limpio,brillante y transparente.Destacan notas de manzana, pera dulce,cítricos y algunos aromas más melosos (miel).El conjunto acompañado por la textura característica que presentan los vinos de Pansa blanca de Alella.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>ALELLA</DOrigen>
<PCompra>1.8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120156</NumArticulo>
<Descripcion>VINO ROSADO ONA DE MARFIL D.O. ALELLA</Descripcion>
<Comentario>Se trata de un rosado de color rojo claro con tonalidades asalmonadas, con nariz madura de frutos rojos (fresa, arándanos) y especiados. Se muestra fresco, meloso y potente. Se adapta bien a las ensaladas, surtidos de embutidos ibéricos, tostadas de pimientos asados y ventresca, parrilladas de verduras, pasta fresca, caracoles a la brasa, pollo asado, arroces…</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>ROSADOS</SubFamilia>
<DOrigen>ALELLA</DOrigen>
<PCompra>1.8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120157</NumArticulo>
<Descripcion>VINO BLANCO BUENA POSADA VERDEJO 100 %</Descripcion>
<Comentario>Vino 100% Verdejo. Color pajizo con ribetes dorados. Olor a fruta de hueso, hierbas aromáticas y un toque a hierba seca. Con cuerpo y balsámico.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>SIN D.O.</DOrigen>
<PCompra>0.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120158</NumArticulo>
<Descripcion>PATE DE HIGADO DE PATO 100 GRS ZUBIA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>0.7</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120159</NumArticulo>
<Descripcion>PATE DE HIGADO DE OCA 100 GRS ZUBIA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>0.71</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120160</NumArticulo>
<Descripcion>BLOC DE FOIE GRAS DE OCA 130 GRS  ZUBIA LATA CAMPANA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>3.12</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120161</NumArticulo>
<Descripcion>BLOC DE FOIE GRAS DE PATO 130 GRS ZUBIA. LATA CAMPANA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>2.82</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120162</NumArticulo>
<Descripcion>MOUSSE DE OCA TRUFADO AL ARMAGNAC 190 GRS ZUBIA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>1.49</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120163</NumArticulo>
<Descripcion>ESPARRAGOS TARRO 580 6/9 ELICIAS</Descripcion>
<Comentario>El espárrago blanco, con su sabor más delicado y una textura suave, crece bajo tierra para inhibir el desarrollo de su contenido de clorofila, lo que le da su color blanco característico.Todo un manjar.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.87</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120164</NumArticulo>
<Descripcion>MEJILLON 4/6 PIEZAS CONSERVAS RUEDA</Descripcion>
<Comentario>Los mejillones proceden exclusivamente de las Rías Gallegas, y se extraen de las bateas situadas a la entrada de las mismas, en donde disponen del mejor alimento. Tras su clasificación y limpieza, se deshidratan y frien en aceite de oliva al objeto de evitar el posterior deterioro de la salsa, garantizar su textura y obtener un bouquet especial.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>2.31</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120165</NumArticulo>
<Descripcion>FILETE DE ANCHOA EN ACEITE DE OLIVA VIRGEN EXTRA 100 GRS</Descripcion>
<Comentario>Conservas RUEDA de Santoña.Selección del cantabrico. Primer Premio en la Feria de la Anchoa de Santoña. Cata 1998.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>3.34</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120166</NumArticulo>
<Descripcion>BONITO DEL NORTE EN ACEITE EL MENDAVIES 450 GRS</Descripcion>
<Comentario>Se caracteriza por su carne blanca, un sabor exquisito y una textura más suave.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>3.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120167</NumArticulo>
<Descripcion>ACEITE MUELOLIVA PICUDA 750 ML CRISTAL</Descripcion>
<Comentario>Los olivos Picudos portan en su esencia la identidad de la tierra donde se cultivan. Ideal para ensaladas, verduras, pastas...Gracias al empleo exclusivo de aceituna
 picuda, muy apreciada por sus propiedades.</Comentario>
<Familia>ACEITES, VINAGRES Y PIMENTONES</Familia>
<SubFamilia>ACEITES</SubFamilia>
<PCompra>3.35</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120168</NumArticulo>
<Descripcion>ESPARRAGOS BLANCOS 6/8 EL MENDAVIES</Descripcion>
<Comentario>El espárrago blanco, con su sabor más delicado y una textura suave, crece bajo tierra para inhibir el desarrollo de su contenido de clorofila, lo que le da su color blanco característico.Todo un manjar.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.9</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120169</NumArticulo>
<Descripcion>ANFORA DE SETAS DELICATESSEN EL MENDAVIES</Descripcion>
<Comentario>Constituyen un alimento muy especial, llama la atencion la gran variedad de formas, colores, aromas y texturas. Es la parte comestible de los hongos cultivados o silvestres.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120170</NumArticulo>
<Descripcion>PACK SELECCIÓN DE 8 LATAS DE CONSERVAS DE CAMBADOS</Descripcion>
<Comentario>2 LATAS DE BERBERECHOS DE LAS RIAS GALLEGAS AL NATURAL 30/40, 2 LATAS DE SARDINILLAS EN ACEITE DE OLIVA 16/22, 2 LATAS DE DELICIAS DE ATUN ROJO EN ACEITE DE OLIVA Y 2 LATAS DE MEJILLONES DE LAS RIAS GALLEGAS EN ESCABECHE GRANDES 8/12</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>28.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120171</NumArticulo>
<Descripcion>BONITO DEL NORTE EN ACEITE DE OLIVA VIRGEN EXTRA CONSERVAS</Descripcion>
<Comentario>Rueda de Santoña. 450 GRS en tarro de Cristal. Elaboracion Artesanal.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>4.7</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120172</NumArticulo>
<Descripcion>CAVA PARXET TITIANA VINTAGE</Descripcion>
<Comentario>Presenta un tono de color más subido característico del Chardonnay. En nariz es muy complejo, desarrollando aromas secundarios densos y variados; su sabor es amplio, estructurado y voluminoso con un toque de ligeras notas tostadas.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<PCompra>3.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120173</NumArticulo>
<Descripcion>VINO BLANCO EIDOSELA ALBARIÑO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>3.25</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120174</NumArticulo>
<Descripcion>ESTUCHE DE MADERA ENVEJECIDO JUEGO AJEDREZ CON ACCESORIOS</Descripcion>
<Comentario>ESTUCHE DE MADERA ENVEJECIDA CON JUEGO DE AJEDREZ Y 6 ACCESORIOS</Comentario>
<Familia>EMBALAJES</Familia>
<PCompra>6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120175</NumArticulo>
<Descripcion>VINO TINTO PAGO DE CARRAOVEJAS</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>22.85</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120176</NumArticulo>
<Descripcion>CAVA PARXET BRUT NATURE</Descripcion>
<Comentario>Tono muy pálido con reflejos verdes, burbuja muy fina y persistente. Nariz delicada y personalizada en la que la Pansa Blanca caracteriza su sello de Alella. En boca es fresco, ligero, equilibrado y muy seco, no siendo agresivo.</Comentario>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<PCompra>4</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120177</NumArticulo>
<Descripcion>VINO BLANCO ALBARIÑO VEIGA NAUM</Descripcion>
<Comentario>100% Albariño, procedente del Valle del Salnés.Color amarillo pajizo con reflejos dorados verdosos, brillante. Combina notas frutales y florales, con buena intensidad y carácter varietal. Sabor: frescura y frutosidad a la entrada. Con un paso amable y perfumado en el paladar. Compleja y muy agradable vía retronasal que se mantiene con persistencia y fragancia.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>3.95</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120178</NumArticulo>
<Descripcion>SURTIDO DE GALLETAS BIRBA 500 GRS</Descripcion>
<Comentario>Una variedad para cada paladar, en formato grande. 
Toda la variedad, el sabor y las múltiples texturas de la familia de galletas Birba en una misma caja. Ideal para satisfacer los paladares de los invitados o para compartir en ocasiones especiales.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>3.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120179</NumArticulo>
<Descripcion>VINO TINTO AZUEL CRIANZA D.O. RIBERA DE DUERO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>3.95</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120180</NumArticulo>
<Descripcion>TURRON JIJONA ESPECIAL BAUL MADERA 300 GRS</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.47</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120181</NumArticulo>
<Descripcion>TURRON ALICANTE ESPECIAL BAUL MADERA 300 GRS</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.47</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120182</NumArticulo>
<Descripcion>TURRON CHOCOLATE CON ALMENDRAS ESPECIAL BAUL MADERA 300 GRS</Descripcion>
<Comentario>Calidad Suprema.Excelente Turrón de Chocolate negro, con almendras marconas. Fusionados en su máxima expresión.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>4.73</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120183</NumArticulo>
<Descripcion>YEMAS DE ESPARRAGOS BLANCOS</Descripcion>
<Comentario>Para los amantes de la parte más fina y tierna de los Espárragos, le presentamos la selección de yemas de esparragos blancos extra. Disfrutalos!</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>0.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120184</NumArticulo>
<Descripcion>COCOBOOM E. MORENO 80 GRS</Descripcion>
<Comentario>Deliciosas bolitas de chocolate con leche recubiertas de ralladura de coco.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.75</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120185</NumArticulo>
<Descripcion>CREMA DE MEMBRILLO EL QUIJOTE 400 GRS ESTUCHADO</Descripcion>
<Comentario>CALIDAD EXTRA. Autentica carne de membrillo de Puente Genil como es tradicional.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.7</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120186</NumArticulo>
<Descripcion>CUBANITOS DE CHOCOLATE BIRBA 90 GRS</Descripcion>
<Comentario>Barquillo crujiente bañado en chocolate fondant  (60% de cacao) que hacen las delicias de los paladares más selectos. Una propuesta difícil de rechazar. La tentación hecha galleta. Una mezcla ideal.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.96</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120188</NumArticulo>
<Descripcion>VINO ROSADO SIERRA CANTABRIA D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>ROSADOS</SubFamilia>
<DOrigen>RIOJA</DOrigen>
<PCompra>3.06</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120189</NumArticulo>
<Descripcion>VINO BLANCO MARFIL VINO CLASICO PANSA BLANCA D.O. ALELLA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>ALELLA</DOrigen>
<PCompra>2.83</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120190</NumArticulo>
<Descripcion>LATA DE ACEITE DE OLIVA VIRGEN 3 L UNIOLIVA</Descripcion>
<Familia>ACEITES, VINAGRES Y PIMENTONES</Familia>
<SubFamilia>ACEITES</SubFamilia>
<PCompra>8.9</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120191</NumArticulo>
<Descripcion>NEULAS ARTESANAS BIRBA 25 UNIDADES</Descripcion>
<Comentario>Deliciosa oblea clasica de navidad. Elaborada artesanalmente y perfecta para acompañar el cava.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>0.862</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120193</NumArticulo>
<Descripcion>PIMIENTOS DE PIQUILLO EL MENDAVIES 410/430 GRS</Descripcion>
<Comentario>Deliciosos pimientos de piquillo en conserva, calidad extra.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.33</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120194</NumArticulo>
<Descripcion>SURTIDO DE GALLETAS BIRBA 150 GRS</Descripcion>
<Comentario>SIN COLORANTES NI CONSERVANTES.  Una variedad para cada paladar.  Toda la variedad, el sabor y las múltiples texturas de la familia de Galletas Birba en una misma caja. Ideales para satisfacer todos los paladares.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>1.4</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120197</NumArticulo>
<Descripcion>QUESO EL GRAN CARDENAL EN CAJA DE MADERA 900 GRS</Descripcion>
<Comentario>Nuestro Queso de Oveja ha vuelto a ser reconocido Internacionalmente con il primo premio por su sabor, aroma y calidad. The World Championship Cheese Contest 2010, el mayor Campeonato Mundial de Quesos que se lleva celebrando desde 1958 en EEUU. En el campeonato han participado 2.100 quesos de todo el mundo, y más de 30 jueces procedentes de 14 países, que nos han galardonado con el Oro al Mejor Queso de Oveja Semicurado del Mundo, con una puntuación de 98,80 sobre 100 puntos, volviendo a repetir el Oro conseguido en World Cheese Awards 2009.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>9.07</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120198</NumArticulo>
<Descripcion>TORTA DE CHOCOLATE CRUJIENTE 150 GRS ARTESANIA</Descripcion>
<Comentario>Torta de fino chocolate con arroz inflado. Delicioso y crujiente.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>1.06</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120199</NumArticulo>
<Descripcion>QUESO EL GRAN CARDENAL CON CAJA</Descripcion>
<Comentario>Maestros queseros desde 1951.Con  un proceso de maduración lenta en secadero de madera, el cual requiere de mayores cuidados y manipulación por su volteo a mano, pero que a cambio aporta a nuestros quesos un aroma y sabor especial.
Son elaborados siempre con leche fresca, no lleva ningún tipo de aditivo, colorante ni conservante, respetando las cualidades y beneficios de la leche</Comentario>
<Familia>QUESOS</Familia>
<PCompra>8.1</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120200</NumArticulo>
<Descripcion>FUET SECALLONA 180 GRS AULET BAUL DE LEY</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>1.1</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120201</NumArticulo>
<Descripcion>PALETA IBERICA RESERVA 4&apos;7/5&apos;4 KG</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestra paleta de jamón ibérica presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>52</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120202</NumArticulo>
<Descripcion>VERMOUTH ROJO PASCALI ARTESANO DE LA RIOJA 1 L FRASCA</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>VERMOUTH</SubFamilia>
<PCompra>6.11</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120203</NumArticulo>
<Descripcion>RON DOMINICANO BERMUDEZ 7 AÑOS AÑEJO SELECTO</Descripcion>
<Comentario>EL RON MAS VIEJO DEL NUEVO MUNDO.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>RON</SubFamilia>
<PCompra>6.07</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120204</NumArticulo>
<Descripcion>BOMBON SURTIDO 200 GRS E.MORENO</Descripcion>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>1.38</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120205</NumArticulo>
<Descripcion>SETAS DE CARDO EL MENDAVIES</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>0.67</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120206</NumArticulo>
<Descripcion>BALLANTINE&apos;S FINEST 50 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>5.368</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120207</NumArticulo>
<Descripcion>100 PIPERS 50 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>5.825</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120209</NumArticulo>
<Descripcion>LATA DE ACEITE DE OLIVA VIRGEN 1881 2,5 L</Descripcion>
<Familia>ACEITES, VINAGRES Y PIMENTONES</Familia>
<SubFamilia>ACEITES</SubFamilia>
<PCompra>7.75</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120210</NumArticulo>
<Descripcion>VINO BLANCO D.O. MONTSANT VITICULTURA ORGANICA SANTES</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>PENEDES</DOrigen>
<PCompra>1.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120211</NumArticulo>
<Descripcion>TEJAS DE TOLOSA 125 GRS CASA ECEIZA</Descripcion>
<Comentario>Son un producto de repostería creado por la casi centenaria (1924) y prestigiosa Pastelería Eceiza de Tolosa (Guipúzcoa). Su fama y prestigio actual se deben a la notoriedad adquirida al ser utilizadas como postre de referencia de restauradores a nivel internacional.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>2.71</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120212</NumArticulo>
<Descripcion>CIGARRILLOS DE TOLOSA 160 GRS CASA ECEIZA</Descripcion>
<Comentario>Son un producto de repostería creado por la casi centenaria (1924) y prestigiosa Pastelería Eceiza de Tolosa (Guipúzcoa). Su fama y prestigio actual se deben a la notoriedad adquirida al ser utilizadas como postre de referencia de restauradores a nivel internacional.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>GALLETAS</SubFamilia>
<PCompra>3.2</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120213</NumArticulo>
<Descripcion>VINO TINTO MONTE REAL MAGNUN D.O. RIOJA 1&apos;5 L RESERVA FAMILI</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>RESERVA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>7</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120214</NumArticulo>
<Descripcion>BRANDY 1866 70 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>BRANDY</SubFamilia>
<PCompra>29.778</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120215</NumArticulo>
<Descripcion>TURRON ALICANTE ALEMANY ELABORACION ARTESANAL 300 GRS</Descripcion>
<Comentario>Delicioso turrón mezcla de almendras, miel y azúcar 100% Nacional. Desde 1879.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120216</NumArticulo>
<Descripcion>TURRON JIJONA ALEMANY ELABORACION ARTESANAL 300 GRS</Descripcion>
<Comentario>Delicioso turrón de textura blanda y mezcla de almendras, miel y azúcar.100% Nacional. Desde 1879.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120217</NumArticulo>
<Descripcion>TURRON YEMA TOSTADA ALEMANY ELABORACION ARTESANAL 300 GRS</Descripcion>
<Comentario>La exquisita mezcla de la almendra y la yema de huevo logran un sabor único, que una vez tostado se convierte en un característico producto, muy apreciado por su delicado sabor y una suave textura.100% Nacional. Desde 1879.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120218</NumArticulo>
<Descripcion>TURRON CHOCOLATE CON ALMENDRAS ALEMANY ARTESANAL 300 GRS</Descripcion>
<Comentario>Excelente Turrón de Chocolate negro, con almendras marconas enteras. Fusionados en su máxima expresión.100% Nacional. Desde 1879.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>3.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120220</NumArticulo>
<Descripcion>SUPREMA DE PATO ZUBIA 130 GRS</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>1.98</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120221</NumArticulo>
<Descripcion>SOBRASADA DE MALLORCA 250 GRS INDICACION GEOGRAFICA</Descripcion>
<Comentario>La sobrasada es un embutido crudo curado, elaborado a partir de carnes seleccionadas del cerdo, condimentadas con sal, pimentón y pimienta negra. Se embute en tripa y presenta una lenta maduración</Comentario>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>2</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120222</NumArticulo>
<Descripcion>LONCHAS DE JAMON DE PATO ZUBIA 50 GRS</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>2</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120223</NumArticulo>
<Descripcion>GALON ESPARRAGOS BLANCOS &quot;COJONUDOS&quot; EL MENDAVIES 1 KG 20/30</Descripcion>
<Comentario>CAPRICHOS DE LA HUERTA</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>5.4</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120224</NumArticulo>
<Descripcion>JABUGUITOS &quot;IBELIER&quot; 350 APROXI</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<PCompra>3.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120225</NumArticulo>
<Descripcion>NUECES AL CHOCOLATE SUIZO  90 GRS CASA PONS</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>FRUTOS SECOS</SubFamilia>
<PCompra>1.55</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120226</NumArticulo>
<Descripcion>ESTUCHE DE ALMENDRAS FRITAS CON PIEL SEKITOS 75 GRS</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>FRUTOS SECOS</SubFamilia>
<PCompra>0.79</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120227</NumArticulo>
<Descripcion>MERMELADA DE CEBOLLA SELECCIÓN GOURMET 400 GRS</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>2.4</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120228</NumArticulo>
<Descripcion>BERBERECHOS AL NATURAL RIAS GALLEGAS 40/50</Descripcion>
<Comentario>CONSERVAS DE CAMBADOS</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120229</NumArticulo>
<Descripcion>PIÑA NATURAL EN SU JUGO ANDA 1 KG</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.4</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120230</NumArticulo>
<Descripcion>MELOCOTON EN ALMIBAR VARIEDAD PICUEZO PESSEGO</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>0.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120233</NumArticulo>
<Descripcion>MEJILLONES EN ESCABECHE CONSERVAS DE CAMBADOS</Descripcion>
<Comentario>Los mejillones  proceden exclusivamente de las Rías Gallegas, y se extraen de las bateas situadas a la entrada de las mismas, en donde disponen del mejor alimento. Tras su clasificación y limpieza, se deshidratan y frien en aceite de oliva al objeto de evitar el posterior deterioro de la salsa, garantizar su textura y obtener un bouquet especial.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1.85</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120234</NumArticulo>
<Descripcion>CESTA DE MIMBRE REF.154 60 CM</Descripcion>
<Familia>EMBALAJES</Familia>
<PCompra>8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120235</NumArticulo>
<Descripcion>TABLETA CHOCOLATE &quot;MASCAO&quot; PURO ORGANICO 100 GRS</Descripcion>
<Comentario>INTERMON OXFAM. Comercio Justo.Apostamos por el comercio justo, que es un movimiento que busca cambios en las formas de producir, de comercializar y de consumir, para que el mundo sea un lugar más humano y más sostenible.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>1.14</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120236</NumArticulo>
<Descripcion>BOMBONES LINDT CHAMPS ELYSEES 220 GR.</Descripcion>
<Comentario>Descubre nuestra colección de recetas Champs-Élysées en un surtido más reducido perfecto para pequeños detalles.En este formato encontrarás nuestros bombones Roc Noisettes Leche, Café Noir, Triomphe Blanc, Lindor leche, Luna, Pyramide Noir y Meringue.Contiene 21 bombones.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>3.57</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120238</NumArticulo>
<Descripcion>VINO ROSADO MARQUES DEL ALTILLO JOVEN D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>ROSADOS</SubFamilia>
<Especificacion>JOVEN</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>1.21</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120239</NumArticulo>
<Descripcion>VINO BLANCO MARQUES DEL ALTILLO JOVEN D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<DOrigen>RIOJA</DOrigen>
<PCompra>1.21</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120240</NumArticulo>
<Descripcion>BANDERILLAS EN VINAGRE 440 GRS EL MENDAVIES</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>1</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120241</NumArticulo>
<Descripcion>ESPARRAGOS BLANCOS D.O. NAVARRA FINCA RIPA 6/8 1/2 KG</Descripcion>
<Comentario>EL AUTENTICO DE NAVARRA</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>2.8</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120242</NumArticulo>
<Descripcion>TURRON ALICANTE CLASICO DURO &quot;GORROTXATEGUI&quot;  300 GRS</Descripcion>
<Comentario>Desde 1680, la leyenda del turrón.Turrón Duro, de calidad suprema mejorada, con 65% mínimo de almendra tostada marcona.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120243</NumArticulo>
<Descripcion>TURRON JIJONA  CLASICO BLANDO &quot;GORROTXATEGUI&quot; 300 GRS</Descripcion>
<Comentario>Desde 1680, la leyenda del turrón.Turrón Blando, de calidad suprema con 69% mínimo de almendra. Consistencia tierna y suave, con agradables trocitos de almendra.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120244</NumArticulo>
<Descripcion>TURRON CHOCOLATE &quot;GORROTXATEGUI&quot; 200 GRS. ALMENDRA SUPREMA</Descripcion>
<Comentario>Desde 1680, la leyenda del turrón.Turrón de chocolate con Almendras, de calidad suprema mejorada con almendra tostada marcona.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.25</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120245</NumArticulo>
<Descripcion>QUESO ETXEGARAI PURO DE OVEJA 950 GRS</Descripcion>
<Comentario>Excelente quesos de masa prensada, D.O Larraitz. Un producto para los consumidores más exigentes que apuestan por el bienestar y la salud.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>8.55</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120246</NumArticulo>
<Descripcion>ALMEJAS AL NATURAL RIAS GALLEGAS 20/30 CONSERVAS CAMBADOS</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>8.4</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120249</NumArticulo>
<Descripcion>WHISKY BALLANTINES BLUE 12 AÑOS 0,70 CL.</Descripcion>
<Comentario>BALLANTINE&apos;S FINEST es un whisky escocés de mezcla complejo, refinado y elegante. Se considera como el sabor que satisface el estilo moderno.</Comentario>
<Familia>LICORES</Familia>
<SubFamilia>WHISKY</SubFamilia>
<PCompra>11.58</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120251</NumArticulo>
<Descripcion>BOMBONES LINDT CHAMPS ELYSEES 445 GR</Descripcion>
<Comentario>El placer de regalar.Descubre nuestras 11 recetas:Roc Noissetes Noir, chocolate negro con trocitos de avellanas tostada relleno de praliné de avellana; Triomphe Blanc, bombón de chocolate blanco relleno de praliné de avellanas con trocitos de avellanas tostadas; Velours Caramel, bombón de chocolate con leche extrafino relleno de caramelo; Café Noir, bombón de chocolate negro relleno de sutiles notas de café y muchas más.Contiene 42 bombones.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>BOMBONES</SubFamilia>
<PCompra>8.29</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120252</NumArticulo>
<Descripcion>TURRON YEMA TOSTADA &quot;GORROTXATEGUI&quot; 300 GRS</Descripcion>
<Comentario>Calidad Suprema.Desde 1680, la leyenda del turrón.La exquisita mezcla de la almendra y la yema de huevo logran un sabor único, que una vez tostado se convierte en un característico producto, muy apreciado por su delicado sabor y una suave textura.</Comentario>
<Familia>TURRONES, GALLETAS Y BOMBONES</Familia>
<SubFamilia>TURRONES</SubFamilia>
<PCompra>5.25</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120253</NumArticulo>
<Descripcion>CENTRO PALETILLA DE JAMON IBERICA DE BELLOTA 2&apos;5 / 3 KG</Descripcion>
<Comentario>Deshuesda y limpia.Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota. Una garantía de satisfacción y calidad para los clientes más exigentes.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>60</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120254</NumArticulo>
<Descripcion>UNIDAD DE PALETA IBERICA RESERVA 4&apos;5/5 KG IBELIER</Descripcion>
<Comentario>Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestra paleta de jamón ibérica presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>58.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120255</NumArticulo>
<Descripcion>UNIDAD DE PALETA IBERICA BELLOTA D.O. GUIJUELO</Descripcion>
<Comentario>Peso: 4/5 kg. Curación: Más de 20 meses.Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor de la paleta de jamón ibérico de bellota. Una garantía de satisfacción y calidad para los clientes más exigentes.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>IBERICAS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>69.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120256</NumArticulo>
<Descripcion>UNIDAD DE PALETA SERRANA CURADA 4/5 KG BALLESTEROS</Descripcion>
<Comentario>Deliciosa Paleta Serrana curada de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>BLANCAS</SubFamilia>
<Especificacion>SERRANAS</Especificacion>
<PCompra>31.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120257</NumArticulo>
<Descripcion>UNIDAD DE PALETA &quot;LA PEPONA&quot; GRAN SELECCIÓN</Descripcion>
<Comentario>Peso: 5/5&apos;5 kg. Curación: Entre 16 y 20 meses. Deliciosa Paleta Serrana curada de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>PALETAS</Familia>
<SubFamilia>BLANCAS</SubFamilia>
<Especificacion>BODEGA</Especificacion>
<PCompra>32.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120258</NumArticulo>
<Descripcion>UNIDAD DE JAMON IBERICO CEBO EXTENSIVO &quot;RESERVA&quot;</Descripcion>
<Comentario>Peso: 6/7 kg. Curación: Más de 20 meses. Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestro jamón ibérico presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>88.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120259</NumArticulo>
<Descripcion>UNIDAD DE JAMON IBERICO CEBO EXTENSIVO &quot;RESERVA&quot;</Descripcion>
<Comentario>Peso: 7/8 kg. Curación: Más de 20 meses. Procedente de cerdos ibéricos alimentados y criados en libertad.Nuestro jamón ibérico presenta un extraordinario sabor y aroma, fruto de un proceso de elaboración artesanal y una curación lenta y pausada en secadero natural.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>CEBO</Especificacion>
<PCompra>103.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120260</NumArticulo>
<Descripcion>UNIDAD DE JAMON IBERICO BELLOTA D.O. GUIJUELO</Descripcion>
<Comentario>Peso: 6/7 kg. Curación: Más de 30 Meses. Pieza única e irrepetible, seleccionada y cuidada con una gran dedicación para que pueda degustar y apreciar el auténtico sabor del jamón ibérico de bellota. Una garantía de satisfacción y calidad para los clientes más exigentes.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>181.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120261</NumArticulo>
<Descripcion>UNIDAD DE JAMON BODEGA &quot;GRAN RESERVA&quot;</Descripcion>
<Comentario>Peso: 7/8 kg. Curación: Más de 20 Meses. Delicioso Jamón curado de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados.</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>BODEGA</Especificacion>
<PCompra>50</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120262</NumArticulo>
<Descripcion>UNIDAD DE JAMON CURADO BALLESTEROS</Descripcion>
<Comentario>Peso: 7/8 kg. Curación: Más de 16 meses. Delicioso Jamón Serrano curado de forma natural ,se caracteriza por una combinación ideal entre grasa y sal. Las condiciones y el proceso artesano de curación le aportan un sabor único que hará las delicias de usted y sus invitados</Comentario>
<Familia>JAMONES</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<Especificacion>SERRANOS</Especificacion>
<PCompra>49.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120264</NumArticulo>
<Descripcion>VINO TINTO MAYOR DE CASTILLA CRIANZA D.O. RIBERA DE DUERO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>2.225</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120265</NumArticulo>
<Descripcion>ACEITE DE OLIVA VIRGEN EXTRA 250 ML UNIOLIVA</Descripcion>
<Familia>ACEITES, VINAGRES Y PIMENTONES</Familia>
<SubFamilia>ACEITES</SubFamilia>
<PCompra>0.98</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120266</NumArticulo>
<Descripcion>PATE DE CAMPAGNE 130 GRS ZUBIA</Descripcion>
<Comentario>Elaboradores de Pates y productos derivados del pato y la oca de forma artesanal desde 1982.</Comentario>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>PATES</SubFamilia>
<PCompra>0.85</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120267</NumArticulo>
<Descripcion>DELANTAL JAMONERO &quot;EMBUTIDOS BALLESTEROS&quot;</Descripcion>
<Comentario>Si le gusta cocinar, nuestro delantal personalizado es perfecto.</Comentario>
<Familia>OTROS COMPONENTES</Familia>
<PCompra>0.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120268</NumArticulo>
<Descripcion>GARBANZOS DE FUENTESAUCO &quot;EL TRILLO&quot; 1 KG</Descripcion>
<Familia>CONSERVAS, PATES Y FRUTOS SECOS</Familia>
<SubFamilia>CONSERVAS</SubFamilia>
<PCompra>2.15</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120269</NumArticulo>
<Descripcion>VINO BLANCO PEÑAMONTE D.O TORO</Descripcion>
<Comentario>Color amarillo pálido con ribetes de aspecto verdoso, limpio y brillante. De aroma intenso con un toque de fruta tropical, recuerdos de piña y maracuyá sobre un fondo de cítricos. En boca es goloso, exótico y frutal.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>1.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120270</NumArticulo>
<Descripcion>VINO ROSADO PEÑAMONTE D.O. TORO</Descripcion>
<Comentario>Tinta de Toro 100%. Procedente de viñedos de 10 a 15 años de edad, cuyas uvas dotan al vino de gran juventud y frutosidad. Color rosa frambuesa de aspecto limpio y brillante, expresada su fragancia en fresas y grosellas, su paso en boca es fresco y equilibrado.</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>ROSADOS</SubFamilia>
<PCompra>1.6</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120271</NumArticulo>
<Descripcion>QUESO MEZCLA SEMICURADO 900 GRS/1 KG &quot;SAN VICENTE&quot; ESTUCHADO</Descripcion>
<Comentario> ELABORACION ARTESANAL. CON ESTUCHE.Queso mezcla de pasta prensada. 
Elaborado con leche pasteurizada de vaca, oveja y cabra. Características: Color blanco marfil, Sabor equilibrado con recuerdos lácticos, olor suave característico y Textura firme, agradable, cremoso al paladar.</Comentario>
<Familia>QUESOS</Familia>
<PCompra>5.4</PCompra>
<IVA>SR</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120272</NumArticulo>
<Descripcion>VINO TINTO TOTIUM CRIANZA D.O. RIBERA DE DUERO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>CRIANZA</Especificacion>
<DOrigen>RIBERA DE DUERO</DOrigen>
<PCompra>2</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120273</NumArticulo>
<Descripcion>VINO ESPUMOSO SIN ALCOHOL PINKY</Descripcion>
<Familia>CAVAS, CHAMPAGNES Y SIDRAS</Familia>
<SubFamilia>CAVAS</SubFamilia>
<PCompra>1.5</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120274</NumArticulo>
<Descripcion>CHORIZO CULAR SERRANO DULCE</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>7.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120275</NumArticulo>
<Descripcion>SALCHICHON CULAR SERRANO</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>BLANCOS</SubFamilia>
<PCompra>7.5</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120276</NumArticulo>
<Descripcion>LICOR DE HIERBAS RUA VIEJA 50 CL</Descripcion>
<Familia>LICORES</Familia>
<SubFamilia>AGUARDIENTES</SubFamilia>
<PCompra>3.176</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120277</NumArticulo>
<Descripcion>SERVICIO DE LONCHEADO Y ENVASADO AL VACIO</Descripcion>
<Familia>OTROS COMPONENTES</Familia>
<PCompra>30</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120278</NumArticulo>
<Descripcion>LENGUAS IBERICAS EMBUCHADAS</Descripcion>
<Familia>EMBUTIDOS</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<PCompra>3</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120279</NumArticulo>
<Descripcion>VINO TINTO SOLAR VIEJO RESERVA D.O. RIOJA</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<Especificacion>RESERVA</Especificacion>
<DOrigen>RIOJA</DOrigen>
<PCompra>8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120280</NumArticulo>
<Descripcion>VINO TINTO MAURO 2018</Descripcion>
<Comentario>Preciso y concentrado, con una limpia y encantadora expresion frutal. Predominan los frutos rojos bien maduros y delicados rasgos florales. Amplio, sedoso y con un fresco final con notas de lima</Comentario>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<PCompra>20.65</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120281</NumArticulo>
<Descripcion>VINO TINTO LIBERALIA 3 D.O. TORO</Descripcion>
<Familia>VINOS</Familia>
<SubFamilia>TINTOS</SubFamilia>
<DOrigen>TORO</DOrigen>
<PCompra>8</PCompra>
<IVA>G</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
<TabArticulos>
<NumArticulo>120282</NumArticulo>
<Descripcion>CENTRO DE JAMON IBERICO DE BELLOTA</Descripcion>
<Familia>JAMONES</Familia>
<SubFamilia>IBERICOS</SubFamilia>
<Especificacion>BELLOTA</Especificacion>
<PCompra>120</PCompra>
<IVA>R</IVA>
<Activo>1</Activo>
<Invisible>0</Invisible>
</TabArticulos>
</dataroot>
`;


const parseXmlProducts = (xmlString: string): Product[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const articulos = xmlDoc.getElementsByTagName("TabArticulos");
  const products: Product[] = [];

  const stringToVatRate = (ivaString: string | null | undefined): number => {
    switch (ivaString?.toUpperCase()) {
      case 'G': return 0.21; // General
      case 'R': return 0.10; // Reducido
      case 'SR': return 0.04; // Superreducido
      case 'E': return 0;    // Exento
      default: return 0.21; // Default to general if not specified or unknown
    }
  };

  for (let i = 0; i < articulos.length; i++) {
    const articulo = articulos[i];
    const numArticulo = articulo.getElementsByTagName("NumArticulo")[0]?.textContent || `temp-id-${i}`;
    const descripcion = articulo.getElementsByTagName("Descripcion")[0]?.textContent || '';
    const comentario = articulo.getElementsByTagName("Comentario")[0]?.textContent || '';
    const familia = articulo.getElementsByTagName("Familia")[0]?.textContent?.toUpperCase() || undefined; // Make sure it's one of PRODUCT_FAMILIES
    const pCompra = parseFloat(articulo.getElementsByTagName("PCompra")[0]?.textContent || '0');
    const iva = articulo.getElementsByTagName("IVA")[0]?.textContent;
    const activo = articulo.getElementsByTagName("Activo")[0]?.textContent === '1';

    if (!activo) continue; // Skip inactive products

    // Ensure familia is valid or set to undefined (or a default like "OTROS COMPONENTES")
    const validFamilia = PRODUCT_FAMILIES.includes(familia as string) ? familia : "OTROS COMPONENTES";


    // Simplistic weight/volume estimation (can be refined)
    let weightGrams = 1000; // Default 1kg for pieces
    let unit = 'pieza';
    if (descripcion.toLowerCase().includes(' kg')) {
      const match = descripcion.match(/(\d+([\.,]\d+)?)\s*kg/i);
      if (match && match[1]) weightGrams = parseFloat(match[1].replace(',', '.')) * 1000;
      unit = 'kg';
    } else if (descripcion.toLowerCase().includes(' grs') || descripcion.toLowerCase().includes(' g')) {
      const match = descripcion.match(/(\d+([\.,]\d+)?)\s*(grs|g)/i);
      if (match && match[1]) weightGrams = parseFloat(match[1].replace(',', '.'));
      unit = 'g';
    } else if (descripcion.toLowerCase().includes(' l')) {
       const match = descripcion.match(/(\d+([\.,]\d+)?)\s*l/i);
      if (match && match[1]) weightGrams = parseFloat(match[1].replace(',', '.')) * 1000; // Assuming 1L = 1kg for simplicity
      unit = 'L';
    } else if (descripcion.toLowerCase().includes(' cl')) {
       const match = descripcion.match(/(\d+([\.,]\d+)?)\s*cl/i);
      if (match && match[1]) weightGrams = parseFloat(match[1].replace(',', '.')) * 10; // 1cl = 10g
      unit = 'cl'; // you might want to add 'cl' to PRODUCT_UNITS
    }


    products.push({
      id: numArticulo,
      name: descripcion,
      description: comentario,
      costPrice: pCompra,
      stock: 100, // Default stock
      unit: unit,
      weightGrams: weightGrams,
      // volumeMilliliters: undefined, // Add if available
      vatRate: stringToVatRate(iva),
      // supplierId: undefined, // Add if available
      family: validFamilia,
    });
  }
  return products;
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [hampers, setHampers] = useLocalStorage<Hamper[]>('hampers', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
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


  // Initialize products from XML if localStorage is empty
  useEffect(() => {
    const storedProducts = window.localStorage.getItem('products');
    if (!storedProducts || JSON.parse(storedProducts).length === 0) {
      const initialProducts = parseXmlProducts(tabArticulosXmlData);
      setProducts(initialProducts);
    }
  }, [setProducts]);


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
  };

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
            const { calculatedTotalCostPrice, components } = hamper; // Use hamper's own components
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
                    itemVat = itemTotalBase * singleRate;
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

    return order.items.map((orderItem: OrderItem) => {
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
            detailedLine.baseAmountByVatRate[singleRate.toString()] = parseFloat(lineTotalBasePrice.toFixed(2));
            detailedLine.vatAmountByVatRate[singleRate.toString()] = parseFloat((lineTotalBasePrice * singleRate).toFixed(2));
        } else {
             detailedLine.baseAmountByVatRate["0.21"] = parseFloat(lineTotalBasePrice.toFixed(2));
             detailedLine.vatAmountByVatRate["0.21"] = parseFloat((lineTotalBasePrice * 0.21).toFixed(2));
        }
      } else {
         detailedLine.baseAmountByVatRate["0.21"] = parseFloat(lineTotalBasePrice.toFixed(2));
         detailedLine.vatAmountByVatRate["0.21"] = parseFloat((lineTotalBasePrice * 0.21).toFixed(2));
      }

      detailedLine.totalVatForLine = parseFloat(Object.values(detailedLine.vatAmountByVatRate).reduce((sum, val) => sum + val, 0).toFixed(2));
      detailedLine.totalWithVatForLine = parseFloat((detailedLine.totalBaseForLine + detailedLine.totalVatForLine).toFixed(2));
      
      return detailedLine;
    });
  }, [getHamperById, getProductById]);

  const value: DataContextType = {
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
  };

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
