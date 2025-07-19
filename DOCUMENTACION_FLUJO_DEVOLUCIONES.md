# Documentación del Flujo de Devoluciones

## Resumen

Se ha mejorado la funcionalidad de gestión de devoluciones para asegurar que los pedidos devueltos sigan el flujo correcto y se reflejen adecuadamente en el sistema. Los cambios principales se centran en asegurar que los pedidos devueltos se muevan al historial de devoluciones y no permanezcan en los historiales de pedidos pendientes o cerrados.

## Cambios Realizados

### Backend

- **`gestion-pedidos-carniceria/src/pedidosClientesController.js`**:
    - **`devolucionParcial`**:
        - Se ha añadido la línea `pedido.estado = 'devuelto_parcial';` para cambiar el estado principal del pedido.
        - Se ha añadido la línea `pedido.enHistorialDevoluciones = true;` para marcar el pedido para el historial de devoluciones.
    - **`devolucionTotal`**:
        - Se ha verificado que el estado del pedido se establece correctamente a `devuelto_total` y que el flag `enHistorialDevoluciones` se establece a `true`.
        - Se ha corregido un error en el que se pasaba un parámetro incorrecto (`pesoDevuelto` en lugar de `peso`) a la función `registrarBajaStock`.

### Frontend

- **`src/clientes-gestion/HistorialPedidosClientes.jsx`**:
    - Se ha modificado la consulta a la API para excluir los pedidos que tienen el flag `enHistorialDevoluciones` establecido a `true`. Esto se ha hecho añadiendo el parámetro `enHistorialDevoluciones=false` a la petición GET.

- **`src/expediciones-clientes/ExpedicionesClientes.jsx`**:
    - Se ha añadido un filtro para excluir los pedidos devueltos de la lista de expediciones. Los datos obtenidos de la API ahora se filtran para excluir los pedidos con `enHistorialDevoluciones === true`.

- **`src/clientes-gestion/HistorialDevoluciones.jsx`**:
    - Se ha modificado la lógica para obtener los pedidos devueltos. Ahora se utiliza el parámetro `enHistorialDevoluciones=true` en la petición a la API para obtener todos los pedidos marcados para el historial de devoluciones.
    - Se ha mejorado la interfaz de usuario para que sea más consistente con el resto de la aplicación.

- **`src/clientes-gestion/ClientesMantenimiento.jsx`**:
    - Se ha añadido una nueva sección en la vista de detalle del cliente para mostrar el historial de devoluciones.
    - Se ha añadido una nueva función `cargarDevolucionesCliente` para obtener los pedidos devueltos de un cliente específico.
    - Se ha actualizado la interfaz para mostrar los pedidos devueltos en una tabla, incluyendo el número de pedido, el estado, la fecha de la devolución y el motivo.

## Flujo de Trabajo Actualizado

1.  Un usuario accede al historial de pedidos en el panel de expediciones o de gestión de clientes.
2.  El usuario busca un pedido cerrado y hace clic en el botón de "Devolución Parcial" o "Devolución Total".
3.  El sistema muestra el modal de devolución (en el caso de la devolución parcial) o solicita la confirmación (en el caso de la devolución total).
4.  El usuario introduce la información requerida.
5.  El sistema procesa la devolución:
    - Actualiza el estado del pedido a `devuelto_parcial` o `devuelto_total`.
    - Marca el pedido con `enHistorialDevoluciones = true`.
    - Ajusta el stock, reingresando los productos si son aptos para la venta.
6.  El pedido devuelto ya no aparece en los historiales de pedidos normales.
7.  El pedido devuelto aparece en el "Historial de Devoluciones".
8.  La devolución también es visible en la ficha del cliente.
