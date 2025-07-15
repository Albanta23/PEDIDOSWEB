# Documentación de la Reubicación de los Botones de Devolución

## Resumen

Se ha mejorado la funcionalidad de gestión de devoluciones reubicando los botones de "Devolución Parcial" y "Devolución Total" a los historiales de pedidos. Este cambio proporciona una experiencia de usuario más intuitiva y eficiente.

## Cambios Realizados

- **Reubicación de los botones de devolución:**
    - Se han eliminado los botones de devolución del editor de pedidos de expedición (`src/expediciones-clientes/ExpedicionClienteEditor.jsx`).
    - Se han añadido los botones de devolución en los historiales de pedidos de los paneles de expediciones (`src/expediciones-clientes/HistorialPedidoCliente.jsx`) y de gestión de clientes (`src/clientes-gestion/HistorialPedidosClientes.jsx`).
- **Adaptación de la lógica de devolución:**
    - Se ha adaptado la lógica de las funciones de devolución para que funcionen correctamente desde los historiales.
    - Se ha asegurado de que se pasa el ID del pedido y la información de la línea correspondiente a las funciones de devolución.
- **Ajuste de la visibilidad de los botones:**
    - Los botones de devolución solo son visibles para los pedidos que ya han sido cerrados (estado "preparado" o "entregado").

## Flujo de Trabajo

1.  Un usuario accede al historial de pedidos en el panel de expediciones o de gestión de clientes.
2.  El usuario busca un pedido cerrado y hace clic en el botón de "Devolución Parcial" o "Devolución Total" de la línea de pedido correspondiente.
3.  El sistema muestra el modal de devolución (en el caso de la devolución parcial) o solicita la confirmación (en el caso de la devolución total).
4.  El usuario introduce la información requerida.
5.  El sistema procesa la devolución, actualiza el estado del pedido y ajusta el stock.

## Cómo Probar

1.  Accede a los historiales de pedidos.
2.  Busca un pedido cerrado y verifica que aparecen los botones de devolución.
3.  Prueba la devolución parcial y total desde los historiales.
4.  Verifica que el estado del pedido y el stock se actualizan correctamente.
