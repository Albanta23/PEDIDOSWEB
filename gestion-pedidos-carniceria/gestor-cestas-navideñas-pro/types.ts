import type * as React from 'react';

export interface Product {
  id: string;
  name: string;
  description: string;
  costPrice: number; // Cost from supplier
  stock: number;
  unit: string; // e.g., 'pieza', 'g', 'ml', 'kg', 'L'
  weightGrams: number; // Weight of one unit in grams
  volumeMilliliters?: number; // Volume of one unit in mL, optional
  vatRate: number; // e.g., 0.21 for 21%
  supplierId?: string;
  family?: string; // New field for product family/category
}

export interface HamperComponent {
  productId: string;
  quantity: number;
}

export interface Hamper {
  id: string;
  name: string;
  description: string;
  components: HamperComponent[];
  sellingPrice: number; // Manually set selling price for the hamper
  family?: string;
  // Calculated values (for display/reference, not necessarily stored if always derived)
  calculatedTotalCostPrice?: number;
  calculatedTotalWeightGrams?: number;
  calculatedTotalVolumeMilliliters?: number;
  calculatedTotalInputVat?: number;
  calculatedProfit?: number;
  calculatedProfitPercentage?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cifNif?: string;
  cif?: string; // Alias para cifNif para compatibilidad
  // Campos para filtrado avanzado y cestas navidad:
  esCestaNavidad?: boolean;
  poblacion?: string;
  provincia?: string;
  nif?: string;
}

export enum OrderStatus {
  DRAFT = "Borrador",
  PENDING_PAYMENT = "Pendiente de Pago",
  PROCESSING = "Procesando",
  PACKAGING = "En Preparación",
  SHIPPED = "Enviado",
  DELIVERED = "Entregado",
  CANCELLED = "Cancelado",
}

export interface OrderItem {
  hamperId: string;
  quantity: number;
  unitPrice: number; // Selling price of the hamper at the time of order (BASE PRICE, EXCLUDING VAT)
  hamperName: string; // For display purposes on invoice/order
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number
  customerId: string;
  items: OrderItem[];
  orderDate: string; // ISO date string
  status: OrderStatus;
  totalAmount: number; // Sum of (item.unitPrice * item.quantity) -> THIS IS THE TOTAL BASE AMOUNT (SUBTOTAL)
  totalVatAmount: number; // Calculated VAT on the order
  shippingAddress: string;
  notes?: string;
  paymentMethod: string; // Código de forma de pago (FPago)
}

export enum PaymentStatus {
    PENDING = "Pendiente",
    PARTIALLY_PAID = "Pagado Parcialmente",
    PAID = "Pagado",
    OVERDUE = "Vencido",
    CANCELLED = "Anulada" // If an invoice needs to be cancelled/voided
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Human-readable invoice number
  orderId: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  paymentStatus: PaymentStatus;
  customerName: string; // Denormalized for quick display
  customerAddress?: string; // Denormalized
  customerCifNif?: string; // Denormalized
  totalAmount: number; // Same as order totalAmount (subtotal before VAT)
  totalVatAmount: number; // Same as order totalVatAmount
  grandTotal: number; // totalAmount + totalVatAmount
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Company {
  name: string;
  address: string;
  cif: string;
  phone: string;
  website: string;
  legalText: string;
  registryInfo: string;
}

export enum QuoteStatus {
  DRAFT = "Borrador",
  SENT = "Enviado",
  ACCEPTED = "Aceptado",
  REJECTED = "Rechazado",
  CONVERTED_TO_ORDER = "Convertido a Pedido",
  EXPIRED = "Expirado"
}

export interface QuoteItem {
  hamperId: string;
  quantity: number;
  unitPrice: number; // Selling price of the hamper at the time of quote
  hamperName: string; // For display purposes on quote
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  items: QuoteItem[];
  quoteDate: string; // ISO date string
  expiryDate?: string; // ISO date string
  status: QuoteStatus;
  totalAmount: number; // Sum of (item.unitPrice * item.quantity)
  totalVatAmount: number; // Calculated VAT on the quote
  shippingAddress?: string; // Optional, might be confirmed later
  notes?: string;
  relatedOrderId?: string; // If converted to order
}


export type NavItemType = {
  name: string;
  path: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>; // Changed type
};

// Utility type for functions that manage lists with search
export interface SearchableListManager<T> {
  items: T[];
  searchFilterText: string;
  setSearchFilterText: (text: string) => void;
  filteredItems: T[];
}

// For activity log on dashboard (simplified)
export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO date string
  message: string;
  type: 'order' | 'quote' | 'invoice' | 'product_stock';
  relatedId?: string; // ID of the order, quote, etc.
}

// New interface for detailed invoice line items
export interface DetailedInvoiceLineItem {
  hamperId: string;
  hamperName: string;
  hamperQuantity: number; // Quantity of this hamper in the order
  hamperUnitPriceBase: number; // Selling price of one hamper (base, ex-VAT)

  // Breakdown of this line's total base amount by VAT rate
  // Key is VAT rate (e.g., 0.21), value is the portion of (hamperUnitPriceBase * hamperQuantity) subject to this rate
  baseAmountByVatRate: { [rate: string]: number };
  
  // Breakdown of this line's total VAT amount by VAT rate
  // Key is VAT rate (e.g., 0.21), value is the VAT amount for that rate on this line
  vatAmountByVatRate: { [rate: string]: number };

  totalBaseForLine: number; // Sum of all values in baseAmountByVatRate for this line item
  totalVatForLine: number;  // Sum of all values in vatAmountByVatRate for this line item
  totalWithVatForLine: number; // totalBaseForLine + totalVatForLine

  // For displaying constituent products (informational)
  componentsDisplay: { name: string, quantityPerHamper: number, unit: string }[];
}

export const VAT_TYPES = [0.21, 0.10, 0.04, 0]; // Standard VAT rates used for breakdown

export const PRODUCT_FAMILIES = [
  "ACEITES, VINAGRES Y PIMENTONES",
  "CAVAS, CHAMPAGNES Y SIDRAS",
  "COMERCIO JUSTO",
  "CONSERVAS, PATES Y FRUTOS SECOS",
  "EMBALAJES",
  "EMBUTIDOS",
  "JAMONES",
  "LICORES",
  "OTROS COMPONENTES",
  "PALETAS",
  "QUESOS",
  "TURRONES, GALLETAS Y BOMBONES",
  "VINOS"
];
