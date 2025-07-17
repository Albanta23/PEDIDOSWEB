# Documentación de la Gestión de Productos de WooCommerce

## Resumen

Se ha implementado una nueva funcionalidad en el panel de gestión de productos que permite sincronizar y gestionar los productos de WooCommerce de forma centralizada.

## Cambios Realizados

- **Nueva pestaña para productos de WooCommerce:**
    - Se ha añadido una nueva pestaña "Productos WooCommerce" en el panel de gestión de productos.
- **Nuevo componente para productos de WooCommerce:**
    - Se ha creado un nuevo componente `src/components/ProductosWooPanel.jsx` que muestra la lista de productos de WooCommerce en una tabla separada.
- **Sincronización de productos:**
    - En el nuevo componente, se ha añadido un botón "Sincronizar Productos de WooCommerce" que llama al endpoint del backend para obtener los productos de la tienda online.
- **Edición de productos de WooCommerce:**
    - Se ha habilitado la edición de los productos de WooCommerce directamente en la tabla.
    - Se ha añadido un botón "Editar Productos" para activar el modo de edición y un botón "Guardar Cambios" para enviar las modificaciones al backend.

## Flujo de Trabajo

1.  Un usuario accede a la pestaña "Productos WooCommerce" en el panel de gestión de productos.
2.  El usuario hace clic en el botón "Sincronizar Productos de WooCommerce" para obtener los productos de la tienda online.
3.  La tabla se actualiza con los productos de WooCommerce.
4.  El usuario puede editar los productos directamente en la tabla y guardar los cambios.

## Cómo Probar

1.  Accede a la pestaña "Productos WooCommerce".
2.  Sincroniza los productos y comprueba que aparecen en la tabla.
3.  Activa el modo de edición y modifica algunos productos.
4.  Guarda los cambios y verifica que se han actualizado correctamente.
