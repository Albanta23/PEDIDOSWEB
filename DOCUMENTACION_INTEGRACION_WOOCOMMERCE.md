# Documentación de la Integración con WooCommerce

## Resumen

Se ha implementado una integración completa con WooCommerce para sincronizar los pedidos de la tienda online con la aplicación de gestión de pedidos. Esto permite centralizar la gestión de todos los pedidos, independientemente de su origen.

## Cambios Realizados

### Backend (`gestion-pedidos-carniceria`)

- **Conexión con la API de WooCommerce:**
    - Se ha instalado la librería `@woocommerce/woocommerce-rest-api`.
    - Se ha creado un nuevo servicio en `src/services/woocommerceService.js` que inicializa la conexión con la API de WooCommerce.
    - Se han añadido las variables de entorno `WC_URL`, `WC_CONSUMER_KEY` y `WC_CONSUMER_SECRET` al archivo `.env` para almacenar las credenciales de la API.
- **Sincronización de pedidos:**
    - Se ha creado un nuevo controlador `src/woocommerceController.js` con una función `sincronizarPedidos` que obtiene los pedidos de WooCommerce y los guarda en la base de datos local.
    - Los pedidos de WooCommerce se guardan con un campo `origen` que indica que provienen de WooCommerce.
    - Se ha añadido una nueva ruta `/api/pedidos-woo/sincronizar` en `server.js` para ejecutar la sincronización.

### Frontend

- **Sincronización manual:**
    - En el panel de gestión de clientes (`src/clientes-gestion/PedidosClientes.jsx`), se ha añadido un botón "Sincronizar con WooCommerce".
    - Al hacer clic en este botón, se llama al endpoint del backend para iniciar la sincronización.
    - Una vez completada la sincronización, la lista de pedidos se actualiza automáticamente.
- **Integración en los paneles:**
    - Los pedidos de WooCommerce se muestran en los paneles de expediciones (`src/expediciones-clientes/ExpedicionesClientes.jsx`) y de gestión de clientes (`src/clientes-gestion/PedidosClientes.jsx`).
    - Se ha añadido una columna "Origen" en las tablas de ambos paneles para diferenciar fácilmente los pedidos de WooCommerce de los pedidos manuales.
- **Compatibilidad con funcionalidades existentes:**
    - La lógica de gestión de stock, devoluciones y exportación a SAGE50 es totalmente compatible con los pedidos de WooCommerce, ya que se guardan en la misma estructura de datos que los pedidos manuales.

## Flujo de Trabajo

1.  Un usuario del panel de gestión de clientes hace clic en el botón "Sincronizar con WooCommerce".
2.  El frontend llama al endpoint de sincronización del backend.
3.  El backend se conecta a la API de WooCommerce, obtiene los pedidos y los guarda en la base de datos local.
4.  La lista de pedidos en el frontend se actualiza para mostrar los nuevos pedidos de WooCommerce.
5.  Los pedidos de WooCommerce pueden ser procesados (cerrados, devueltos, etc.) y exportados a SAGE50 de la misma forma que los pedidos manuales.

## Cómo Probar

1.  Accede al panel de gestión de clientes.
2.  Haz clic en el botón "Sincronizar con WooCommerce".
3.  Verifica que los pedidos de la tienda online aparecen en la lista de pedidos.
4.  Procesa un pedido de WooCommerce: ciérralo, gestiona una devolución y expórtalo a SAGE50 para asegurar que todas las funcionalidades son compatibles.
