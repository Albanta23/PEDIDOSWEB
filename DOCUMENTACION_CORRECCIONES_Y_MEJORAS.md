# Documentación de Correcciones y Mejoras

## Resumen

Se han realizado varias correcciones y mejoras en la aplicación para solucionar los problemas detectados y mejorar la experiencia de usuario.

## Cambios Realizados

- **Corrección de la visibilidad de los botones de devolución:**
    - Se ha corregido un error que provocaba que los botones de devolución no se mostraran en los historiales de pedidos.
    - Ahora, los botones son visibles en todos los pedidos de los historiales, independientemente de su estado.
- **Filtrado de pedidos en la vista de borradores:**
    - Se ha modificado la consulta a la API en la vista de borradores para que solo se muestren los pedidos de WooCommerce que necesitan ser revisados.
- **Ampliación de la edición de pedidos en borrador:**
    - Se ha ampliado la edición de pedidos en borrador para que se puedan modificar tanto el código de cliente como el NIF/CIF.
    - Se ha añadido el campo NIF/CIF al modelo de datos de los pedidos.

## Flujo de Trabajo

1.  Los botones de devolución ahora son siempre visibles en los historiales de pedidos.
2.  La vista de "Pedidos en Borrador" solo muestra los pedidos de WooCommerce que necesitan ser revisados.
3.  En la vista de "Pedidos en Borrador", se pueden editar el código de cliente y el NIF/CIF de los pedidos.

## Cómo Probar

1.  Accede a los historiales de pedidos y verifica que los botones de devolución son visibles.
2.  Sincroniza los pedidos de WooCommerce y comprueba que solo aparecen en la vista de "Pedidos en Borrador".
3.  Edita un pedido en borrador, completando el código de cliente y el NIF/CIF.
4.  Valida el pedido y verifica que se envía correctamente a expediciones.
