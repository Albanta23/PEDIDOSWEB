# 🔌 Conexión de Datos Reales al Dashboard

## 📋 ESTADO ACTUAL

El Dashboard Premium está **limpio y listo** para conectar datos reales. Todos los ejemplos han sido eliminados y reemplazados por estados vacíos profesionales.

## 🎯 ÁREAS A CONECTAR

### 1. **Métricas Principales** (Cards superiores)
```typescript
// TODO: Conectar con API
const metrics = [
  {
    title: "Ventas Totales",
    value: "€0.00", // ← Conectar con: GET /api/statistics/sales
    change: 0,      // ← Conectar con: cálculo vs mes anterior
  },
  {
    title: "Pedidos Activos", 
    value: "0",     // ← Conectar con: GET /api/orders?status=active
    change: 0,
  },
  {
    title: "Clientes",
    value: "0",     // ← Conectar con: GET /api/customers/count
    change: 0,
  },
  {
    title: "Cestas Creadas",
    value: "0",     // ← Conectar con: GET /api/hampers/count
    change: 0,
  }
];
```

### 2. **Pedidos Recientes** (Tabla)
```typescript
// TODO: Cargar desde backend
const recentOrders = []; // ← Conectar con: GET /api/orders/recent
```

### 3. **Productos Populares** (Sidebar)
```typescript
// TODO: Cargar desde backend
const topProducts = []; // ← Conectar con: GET /api/products/top-selling
```

### 4. **Gráfico de Ventas**
```typescript
// TODO: Integrar librería de gráficos
// Opciones: Chart.js, Recharts, ApexCharts
const salesData = []; // ← Conectar con: GET /api/statistics/sales-chart
```

## 🔧 IMPLEMENTACIÓN SUGERIDA

### Paso 1: Crear Hooks de Datos
```typescript
// hooks/useStatistics.ts
export const useStatistics = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    // Fetch desde tu backend existente
    fetch('/api/statistics')
      .then(res => res.json())
      .then(setStats);
  }, []);
  
  return stats;
};
```

### Paso 2: Actualizar el Dashboard
```typescript
// DashboardPage-Premium.tsx
const DashboardPage: React.FC = () => {
  const statistics = useStatistics();
  const recentOrders = useRecentOrders();
  const topProducts = useTopProducts();
  
  if (!statistics) {
    return <LoadingSpinner />; // Componente de carga
  }
  
  // Usar datos reales...
};
```

## 🌐 ENDPOINTS NECESARIOS

### Backend APIs a crear/conectar:
```
GET /api/statistics/overview
├── sales_total: number
├── sales_change: number
├── orders_active: number
├── orders_change: number
├── customers_total: number
├── customers_change: number
└── hampers_created: number

GET /api/orders/recent?limit=5
├── id: string
├── customer: string
├── amount: number
├── status: 'pending' | 'completed' | 'processing'
└── date: string

GET /api/products/top-selling?limit=5
├── name: string
├── sales: number
└── trend: 'up' | 'down'

GET /api/statistics/sales-chart?period=6months
└── data: Array<{month: string, sales: number}>
```

## 🎨 COMPONENTES PREMIUM LISTOS

### ✅ **Estados Vacíos Profesionales**
- Cards con métricas en 0
- Mensaje "No hay pedidos aún" con CTA
- Gráfico placeholder con botón configurar
- Productos populares con estado vacío

### ✅ **Diseño Responsive**
- Grid adaptativo para métricas
- Tabla responsive para pedidos
- Layout móvil optimizado

### ✅ **Componentes Reutilizables**
- `MetricCard` para estadísticas
- `Badge` para estados
- `Button` con variantes premium
- `Card` con efectos glass/gradient

## 🚀 PRÓXIMOS PASOS

1. **Crear servicios de datos** (`services/statisticsService.ts`)
2. **Implementar hooks personalizados** (`hooks/useStatistics.ts`)
3. **Conectar APIs** existentes del backend
4. **Añadir estados de carga** (`components/LoadingSpinner.tsx`)
5. **Implementar gráficos** (Chart.js/Recharts)

## 📊 RESULTADO ESPERADO

Una vez conectado, tendrás:
- ✅ **Métricas reales** actualizándose en tiempo real
- ✅ **Pedidos reales** de tu sistema
- ✅ **Productos populares** basados en ventas reales
- ✅ **Gráficos dinámicos** con datos históricos
- ✅ **Dashboard completamente funcional** para producción

---

**Status**: 🧹 **LIMPIO** | **Ready for**: 🔌 **CONEXIÓN DE DATOS**
