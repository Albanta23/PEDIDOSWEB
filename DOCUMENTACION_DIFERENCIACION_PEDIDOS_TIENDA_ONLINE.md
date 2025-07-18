# Documentación: Diferenciación de Pedidos de Tienda Online (WooCommerce)

**Fecha:** 18 de julio de 2025  
**Versión:** 1.0  

## Descripción General

Esta implementación permite identificar y diferenciar claramente los pedidos que provienen de la tienda online (WooCommerce) en todo el sistema, facilitando su gestión y seguimiento.

## Cambios Técnicos Implementados

### 1. Modelo de Datos

Se ha añadido un nuevo campo en el esquema de PedidoCliente para identificar los pedidos de tienda online:

```javascript
esTiendaOnline: { type: Boolean, default: false } // Indica si el pedido proviene de la tienda online
```

Este campo se establece automáticamente como `true` cuando un pedido se importa desde WooCommerce.

### 2. Controladores

#### 2.1 woocommerceController.js

Se ha modificado el controlador para marcar los pedidos importados como pedidos de tienda online:

```javascript
// Al crear el pedido desde WooCommerce
const nuevoPedido = new PedidoCliente({
  // Otros campos...
  esTiendaOnline: true // Marcar como pedido de tienda online
});
```

#### 2.2 pedidosClientesController.js

Se ha añadido un nuevo método para procesar los pedidos en borrador, asegurando que se mantiene la marca de tienda online:

```javascript
async procesarPedidoBorrador(req, res) {
  try {
    // Lógica para cambiar el estado...
    
    // Asegurarse de que esté marcado como pedido de tienda online
    pedido.esTiendaOnline = true;
    
    await pedido.save();
    // ...
  } catch (error) {
    // Manejo de errores...
  }
}
```

### 3. Interfaz de Usuario

#### 3.1 Indicador Visual en Edición de Pedidos

En el componente `PedidosClientes.jsx`, se ha añadido un badge para identificar visualmente los pedidos de tienda online:

```jsx
<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
  {pedidoId ? 'Editar Pedido Existente' : 'Crear Nuevo Pedido'}
  {(pedidoInicial?.esTiendaOnline || (pedidoInicial?.origen?.tipo === 'woocommerce')) && 
    <span style={{ 
      marginLeft: '10px', 
      background: '#ff9800', 
      color: 'white', 
      padding: '2px 8px', 
      borderRadius: '4px', 
      fontSize: '18px',
      verticalAlign: 'middle'
    }}>
      TIENDA ONLINE
    </span>
  }
</h1>
```

#### 3.2 Filtro en Lista de Borradores

En el componente `PedidosBorrador.jsx`, se ha implementado un filtro (switch) para mostrar solo los pedidos de tienda online o todos los borradores:

```jsx
// Estado para el filtro
const [filtroTiendaOnline, setFiltroTiendaOnline] = useState(true);

// Función de carga con filtro
const cargarPedidos = () => {
  setCargando(true);
  // Si el filtro está activado, solo mostramos los pedidos de la tienda online (woocommerce)
  const url = filtroTiendaOnline 
    ? `${API_URL}/pedidos-clientes?estado=borrador_woocommerce&origen.tipo=woocommerce` 
    : `${API_URL}/pedidos-clientes?estado=borrador`;
  
  axios.get(url)
    .then(res => setPedidos(res.data))
    .catch(() => setPedidos([]))
    .finally(() => setCargando(false));
};

// Switch en la interfaz
<div className="filtro-container">
  <label className="switch">
    <input 
      type="checkbox" 
      checked={filtroTiendaOnline} 
      onChange={() => setFiltroTiendaOnline(!filtroTiendaOnline)} 
    />
    <span className="slider round"></span>
  </label>
  <span className="filtro-label">
    {filtroTiendaOnline ? 'Mostrando solo pedidos de tienda online' : 'Mostrando todos los borradores'}
  </span>
</div>
```

## Beneficios para los Usuarios

- **Identificación inmediata**: Los usuarios pueden identificar rápidamente los pedidos que provienen de la tienda online gracias al badge visual.
- **Filtrado eficiente**: Los usuarios pueden filtrar fácilmente para ver solo los pedidos de la tienda online o todos los borradores.
- **Claridad en el proceso**: La diferenciación clara ayuda a mantener flujos de trabajo separados para pedidos online y manuales.
- **Mejor seguimiento**: La marca de tienda online se mantiene a lo largo de todo el ciclo de vida del pedido, facilitando la trazabilidad.

## Verificación de la Implementación

Para verificar que la implementación funciona correctamente:

1. **Importación de pedidos de WooCommerce**:
   - Sincronizar pedidos de WooCommerce
   - Verificar que los pedidos importados tienen `esTiendaOnline: true`

2. **Visualización en la interfaz**:
   - Abrir un pedido de WooCommerce en edición
   - Comprobar que muestra el badge "TIENDA ONLINE"

3. **Filtrado en vista de borradores**:
   - Acceder a la vista de pedidos en borrador
   - Activar/desactivar el switch de filtro
   - Verificar que se muestran los pedidos correspondientes

4. **Proceso completo**:
   - Importar un pedido de WooCommerce
   - Procesarlo desde la vista de borradores
   - Verificar que mantiene la marca de tienda online en el flujo normal
