// Configuración de API para el frontend premium
// Usar variables de entorno para máxima flexibilidad en diferentes despliegues

const getApiBaseUrl = () => {
  // 1. Prioridad: Variable de entorno explícita
  if (import.meta.env.VITE_API_URL) {
    // Si ya está definida, usarla tal como está (sin agregar /api)
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Detección automática basada en hostname (solo si no hay variable de entorno)
  const hostname = window.location.hostname;
  
  // GitHub Codespaces
  if (hostname.includes('app.github.dev')) {
    const codespaceId = hostname.split('.')[0];
    return `https://${codespaceId}-10001.app.github.dev`;
  }
  
  // Vercel deployment
  if (hostname.includes('vercel.app')) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-url.vercel.app/api';
  }
  
  // Render deployment
  if (hostname.includes('onrender.com')) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com/api';
  }
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:10001/api';
  }
  
  // Fallback
  return import.meta.env.VITE_API_URL || 'http://localhost:10001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log para debugging (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log(`🔧 API Base URL configurada: ${API_BASE_URL}`);
  console.log(`🌍 Entorno: ${import.meta.env.MODE}`);
  console.log(`🔑 Variable VITE_API_URL: ${import.meta.env.VITE_API_URL || 'No definida'}`);
}

export const API_ENDPOINTS = {
  // Clientes
  clientes: {
    getAll: `${API_BASE_URL}/clientes`,
    getCestasNavidad: `${API_BASE_URL}/clientes/cestas-navidad`,
    getEstadisticas: `${API_BASE_URL}/clientes/estadisticas-cestas`,
    marcarCestasNavidad: `${API_BASE_URL}/clientes/marcar-cestas-navidad`,
    limpiarCestasNavidad: `${API_BASE_URL}/clientes/limpiar-cestas-navidad`,
    importar: `${API_BASE_URL}/clientes/importar`,
    create: `${API_BASE_URL}/clientes`, // Añadido endpoint para crear cliente
  },
  
  // Productos
  productos: {
    getAll: `${API_BASE_URL}/productos`,
    importar: `${API_BASE_URL}/productos/importar`,
    actualizarMasivo: `${API_BASE_URL}/productos/actualizar-masivo`,
    crear: `${API_BASE_URL}/productos`,
    eliminar: (id: string) => `${API_BASE_URL}/productos/${id}`,
  },
  
  // Pedidos
  pedidos: {
    tienda: `${API_BASE_URL}/pedidos-tienda`,
    clientes: `${API_BASE_URL}/pedidos-clientes`,
  },
  
  // Transferencias
  transferencias: {
    getAll: `${API_BASE_URL}/api/transferencias`,
    crear: `${API_BASE_URL}/api/transferencias`,
    actualizar: (id: string) => `${API_BASE_URL}/api/transferencias/${id}`,
    confirmar: (id: string) => `${API_BASE_URL}/api/transferencias/${id}/confirmar`,
  },
  
  // Movimientos de stock
  movimientosStock: {
    getAll: `${API_BASE_URL}/movimientos-stock`,
    registrarBaja: `${API_BASE_URL}/movimientos-stock/baja`,
  },
  
  // Historial proveedor
  historialProveedor: {
    getAll: `${API_BASE_URL}/historial-proveedor`,
    crear: `${API_BASE_URL}/historial-proveedor`,
  },
  
  // Avisos
  avisos: {
    getAll: `${API_BASE_URL}/avisos`,
    crear: `${API_BASE_URL}/avisos`,
    marcarVisto: (id: string) => `${API_BASE_URL}/avisos/${id}/visto`,
  }
};

// Helper para manejar errores de API
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Error de respuesta del servidor
    return {
      message: error.response.data?.error || 'Error del servidor',
      status: error.response.status
    };
  } else if (error.request) {
    // Error de red
    return {
      message: 'Error de conexión con el servidor',
      status: 0
    };
  } else {
    // Error de configuración
    return {
      message: error.message || 'Error desconocido',
      status: -1
    };
  }
};

// Helper para headers comunes
export const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export default API_ENDPOINTS;
