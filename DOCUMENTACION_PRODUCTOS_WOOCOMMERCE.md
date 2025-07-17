# Documentación de la Gestión de Productos de WooCommerce

## Resumen

Se ha adaptado la aplicación para que pueda gestionar los productos de WooCommerce, que pueden venderse por unidad o por peso y tener precios y IVA específicos. Esto permite una integración más completa con la tienda online y una gestión más precisa de los pedidos.

## Cambios Realizados

### Modelo de Datos (`gestion-pedidos-carniceria/src/models/PedidoCliente.js`)

- Se ha ampliado el esquema de la base de datos para incluir nuevos campos en los pedidos y en las líneas de pedido:
    - **Líneas de pedido:** `precio`, `iva`, `tipoProducto` ('simple' o 'variable') y `variaciones`.
    - **Pedidos:** `origen`, `notasCliente`, `subtotal`, `totalIva` y `total`.

### Sincronización de Pedidos (`gestion-pedidos-carniceria/src/woocommerceController.js`)

- Se ha modificado la función de sincronización para que mapee correctamente los nuevos campos de los pedidos de WooCommerce al modelo de datos de la aplicación.
- Ahora se guarda toda la información relevante de los pedidos de WooCommerce, incluyendo los detalles de los productos, los importes y las notas del cliente.

### Interfaz de Usuario

- **Panel de Gestión de Clientes (`src/clientes-gestion/PedidosClientes.jsx`):**
    - Se ha añadido una columna "Total" a la tabla de pedidos para mostrar el importe total de cada pedido.
- **Editor de Expediciones (`src/expediciones-clientes/ExpedicionClienteEditor.jsx`):**
    - Se muestra el total del pedido y las notas del cliente para los pedidos de WooCommerce.

### Exportación a SAGE50 (`src/clientes-gestion/IntegracionSage.jsx`)

- Se han adaptado las funciones de exportación a CSV y XML para que incluyan la nueva información de los pedidos de WooCommerce, como el IVA y los totales.

## Flujo de Trabajo

1.  Al sincronizar los pedidos de WooCommerce, se guarda toda la información de los productos, incluyendo si se venden por unidad o por peso, su precio y su IVA.
2.  En los paneles de la aplicación, se muestra la información completa de los pedidos de WooCommerce.
3.  La gestión de stock tiene en cuenta si un producto se vende por unidad o por peso.
4.  Al exportar los pedidos a SAGE50, se incluye toda la información relevante para la facturación.

## Cómo Probar

1.  Sincroniza los pedidos de WooCommerce.
2.  Verifica que la información de los productos se muestra correctamente en los paneles.
3.  Procesa un pedido de WooCommerce y comprueba que el stock se gestiona adecuadamente.
4.  Exporta un pedido de WooCommerce a SAGE50 y verifica que los archivos generados son correctos.
