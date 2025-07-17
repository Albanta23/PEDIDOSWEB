# Documentación de la Gestión de Devoluciones

## Resumen

Se ha implementado un sistema completo para la gestión de devoluciones de clientes, tanto totales como parciales. Esta nueva funcionalidad permite un control exhaustivo de los productos devueltos, su impacto en el stock y su visibilidad en los diferentes paneles de la aplicación.

## Cambios Realizados

### Panel de Expedición de Clientes (`src/expediciones-clientes`)

- **Nuevos botones de devolución:** En el editor de pedidos de expedición (`ExpedicionClienteEditor.jsx`), se han añadido dos nuevos botones: "Devolución Parcial" y "Devolución Total". Estos botones solo son visibles para pedidos que ya han sido cerrados (estado "preparado" o "entregado").
- **Modal de devolución parcial:** Al hacer clic en "Devolución Parcial", se abre un modal (`ModalDevolucion.jsx`) que permite al usuario:
    - Seleccionar las líneas de producto a devolver.
    - Especificar la cantidad devuelta para cada producto.
    - Indicar si el producto es apto para la venta o no.
    - Añadir un motivo general para la devolución.
- **Lógica de devolución total:** Al hacer clic en "Devolución Total", se solicita al usuario que introduzca un motivo para la devolución y que confirme si los productos son aptos para la venta.
- **Comunicación con el backend:** Se han añadido nuevas funciones en el servicio `pedidosClientesExpedicionService.js` para enviar la información de las devoluciones al backend.

### Panel de Gestión de Clientes (`src/clientes-gestion`)

- **Historial de pedidos mejorado:** En el panel de gestión de clientes (`PedidosClientes.jsx`), se ha añadido una tabla con el historial de pedidos.
- **Indicadores de devolución:** En esta tabla, los pedidos que tienen devoluciones asociadas se muestran con un indicador visual para que el personal de gestión pueda identificarlos fácilmente y tramitar los abonos correspondientes.

### Backend (`gestion-pedidos-carniceria`)

- **Nuevos controladores:** Se han añadido nuevos controladores en `pedidosClientesController.js` para gestionar las devoluciones parciales y totales.
- **Gestión de stock:** La lógica del backend se encarga de actualizar el stock de forma automática cuando se procesa una devolución:
    - Si un producto devuelto es **apto para la venta**, se reingresa en el stock del almacén central.
    - Si un producto devuelto **no es apto para la venta**, se registra como una baja en el almacén central.
- **Nuevas rutas:** Se han registrado las nuevas rutas de la API en `server.js` para que el frontend pueda comunicarse con los nuevos controladores.

## Flujo de Trabajo

1.  Un usuario del panel de expediciones abre un pedido cerrado.
2.  El usuario hace clic en "Devolución Parcial" o "Devolución Total".
3.  El usuario introduce la información requerida (productos, cantidades, motivo, etc.).
4.  La información se envía al backend.
5.  El backend actualiza el estado del pedido, registra la devolución y ajusta el stock.
6.  En el panel de gestión de clientes, el pedido aparece con un indicador de devolución, listo para que se tramite el abono.

## Cómo Probar

1.  Crea un pedido y ciérralo.
2.  Prueba la devolución parcial, marcando al menos un producto como no apto para la venta.
3.  Prueba la devolución total.
4.  Verifica en el panel de gestión de clientes que los pedidos con devoluciones se muestran correctamente.
5.  (Opcional) Verifica en la base de datos que los movimientos de stock se han registrado correctamente.
