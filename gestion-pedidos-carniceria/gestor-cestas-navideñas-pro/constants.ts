import { NavItemType, QuoteStatus, PaymentStatus, OrderStatus, PRODUCT_FAMILIES } from './types';
import { HomeIcon, CubeIcon, ArchiveBoxIcon, ShoppingBagIcon, DocumentTextIcon, UsersIcon, InformationCircleIcon, TruckIcon, DocumentMagnifyingGlassIcon, ClipboardDocumentListIcon, ArrowTopRightOnSquareIcon } from './components/icons/HeroIcons';

export const NAVIGATION_ITEMS: NavItemType[] = [
  { name: 'Dashboard', path: '/', icon: HomeIcon }, // Already 'Dashboard', universal enough
  { name: 'Productos', path: '/products', icon: CubeIcon },
  { name: 'Clientes Cestas', path: '/clientes-cestas', icon: UsersIcon },
  { name: 'Cestas', path: '/hampers', icon: ArchiveBoxIcon },
  { name: 'Inventario', path: '/inventory', icon: ShoppingBagIcon },
  { name: 'Presupuestos', path: '/quotes', icon: DocumentMagnifyingGlassIcon },
  { name: 'Pedidos', path: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'Facturas', path: '/invoices', icon: DocumentTextIcon },
  { name: 'Clientes', path: '/customers', icon: UsersIcon },
  { name: 'Proveedores', path: '/suppliers', icon: TruckIcon },
  { name: 'Info. Fiscal', path: '/tax-info', icon: InformationCircleIcon }, // Abbreviated for space
  { name: 'Gestión Clientes', path: 'external:clients', icon: ArrowTopRightOnSquareIcon }, // External link to client management
];

export const VAT_RATES = [
  { label: '0%', value: 0 },
  { label: '4%', value: 0.04 },
  { label: '10%', value: 0.10 },
  { label: '21%', value: 0.21 },
];

export const PRODUCT_UNITS = ['pieza', 'g', 'kg', 'ml', 'L', 'pack']; // Already in Spanish or universal

export const PRODUCT_FAMILY_OPTIONS = PRODUCT_FAMILIES.map(family => ({ value: family, label: family }));

export const APP_TITLE = "Cestas Pro"; // Already Spanish-friendly

// Enums in types.ts are already translated for display values, these provide the options array
export const ORDER_STATUS_OPTIONS = Object.values(OrderStatus).map(s => ({ value: s, label: s }));
export const QUOTE_STATUS_OPTIONS = Object.values(QuoteStatus).map(s => ({ value: s, label: s }));
export const PAYMENT_STATUS_OPTIONS = Object.values(PaymentStatus).map(s => ({ value: s, label: s }));

// Helper function to get color for status badges - No text to translate here

export const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.PACKAGING:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
};

export const COMPANY_DATA = {
  name: 'Embutidos Ballesteros, S.L.',
  cif: 'ES B-49143456',
  address: 'Ctra. Nacional 122, Km. 424, 49800 Toro, Zamora (España)',
  phone: '+34 980 690 604',
  website: 'www.embutidosballesteros.com',
  registryInfo: 'Zamora, Tomo 113, Folio 133, Hoja ZA 1328',
  legalText: 'Conforme a la Ley Orgánica, 15/1999 sobre Protección de Datos de carácter personal, le informamos que los datos contenidos en este impreso serán incluidos en el fichero CLIENTES bajo la responsabilidad de EMBUTIDOS BALLESTEROS, S.L., con la finalidad de llevar a cabo la gestión de marketing, comercial y administrativa.',
  logoUrl: '/EMB.jpg' // Ruta al logo en la carpeta public
};


export const getQuoteStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.DRAFT: return "bg-gray-200 text-gray-700";
      case QuoteStatus.SENT: return "bg-blue-200 text-blue-800";
      case QuoteStatus.ACCEPTED: return "bg-green-200 text-green-800";
      case QuoteStatus.REJECTED: return "bg-red-200 text-red-800";
      case QuoteStatus.CONVERTED_TO_ORDER: return "bg-teal-200 text-teal-800";
      case QuoteStatus.EXPIRED: return "bg-yellow-200 text-yellow-800";
      default: return "bg-neutral-200 text-neutral-700";
    }
};

export const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING: return "bg-yellow-200 text-yellow-800";
      case PaymentStatus.PARTIALLY_PAID: return "bg-blue-200 text-blue-800";
      case PaymentStatus.PAID: return "bg-green-200 text-green-800";
      case PaymentStatus.OVERDUE: return "bg-orange-300 text-orange-800";
      case PaymentStatus.CANCELLED: return "bg-red-200 text-red-800";
      default: return "bg-neutral-200 text-neutral-700";
    }
};
