# Documentación de Mejoras Generales

## Resumen

Se han realizado una serie de mejoras y correcciones en la aplicación para optimizar el flujo de trabajo, mejorar la gestión de datos y solucionar los problemas detectados.

## Cambios Realizados

### Editor de Pedidos en Borrador

- Se ha mejorado el editor de pedidos en borrador para que sea igual que el editor de pedidos de clientes-gestion, permitiendo una edición completa de los datos.
- Se ha añadido la posibilidad de editar el código de cliente y el NIF/CIF.

### Filtrado y Numeración de Pedidos

- Se ha corregido el filtrado de la vista de borradores para que solo muestre los pedidos de WooCommerce.
- Se ha corregido la numeración de los pedidos de WooCommerce para que se les asigne un número de pedido de la aplicación.

### Gestión de Clientes de WooCommerce

- Al sincronizar los pedidos de WooCommerce, se comprueba si el cliente ya existe en la base de datos y se le asigna el código de cliente correspondiente.
- Si el cliente no existe, se crea uno nuevo con los datos de WooCommerce.

### Preservación de Datos de Facturación

- Se ha asegurado de que todos los datos de facturación de los pedidos de WooCommerce se guardan en la base de datos y se mantienen a lo largo de todo el flujo.

### Sincronización de Productos de WooCommerce

- Se ha creado una nueva colección en la base de datos para almacenar los productos de WooCommerce.
- Se ha implementado la sincronización de productos para que se asocien correctamente a los pedidos.

### Flujo de Pedidos en Borrador

- Los pedidos en borrador no se envían a expediciones hasta que se hayan validado.
- Al validar un pedido en borrador, se mueve al historial correspondiente.

### Gestión de Devoluciones

- Se ha añadido un campo para el peso en las devoluciones parciales y totales.
- Se ha creado un historial de devoluciones separado.

### Registro de Bultos

- Se ha corregido el registro de bultos para que se guarde y se muestre correctamente en los historiales y en los documentos.

## Cómo Probar

1.  Prueba el editor de pedidos en borrador y verifica que puedes editar todos los campos necesarios.
2.  Comprueba que el filtrado de pedidos en borrador funciona correctamente.
3.  Verifica que la numeración de los pedidos de WooCommerce es correcta.
4.  Asegúrate de que la gestión de clientes de WooCommerce funciona como se espera.
5.  Comprueba que los datos de facturación se preservan a lo largo de todo el flujo.
6.  Verifica que la sincronización de productos de WooCommerce funciona correctamente.
7.  Prueba la nueva gestión de devoluciones, incluyendo el campo de peso y el historial de devoluciones.
8.  Asegúrate de que el registro de bultos funciona correctamente.
