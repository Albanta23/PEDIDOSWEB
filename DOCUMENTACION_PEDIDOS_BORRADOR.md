# Documentación de la Gestión de Pedidos en Borrador de WooCommerce

## Resumen

Se ha implementado un nuevo flujo de trabajo para los pedidos de WooCommerce, que permite revisarlos y completarlos en un estado de "borrador" antes de enviarlos al panel de expediciones. Esto asegura la calidad de los datos y evita que lleguen pedidos incompletos a expediciones.

## Cambios Realizados

- **Nuevo estado de pedido "borrador_woocommerce":**
    - Se ha añadido un nuevo estado `borrador_woocommerce` para identificar los pedidos de WooCommerce que necesitan ser revisados.
- **Sincronización de WooCommerce:**
    - Se ha modificado la sincronización de WooCommerce para que los nuevos pedidos se guarden con el estado `borrador_woocommerce`.
- **Nuevo componente "Pedidos en Borrador":**
    - Se ha creado un nuevo componente `src/clientes-gestion/PedidosBorrador.jsx` que muestra una tabla con todos los pedidos en estado `borrador_woocommerce`.
    - Este componente permite editar los datos del cliente (código, etc.) y otros datos de cabecera del pedido.
- **Validación y envío a expediciones:**
    - Se ha añadido un botón "Validar y Enviar a Expediciones" que cambia el estado del pedido a "en_espera" y lo envía al panel de expediciones.
- **Integración en el panel de gestión de clientes:**
    - Se ha añadido un nuevo enlace en la barra lateral para acceder al nuevo componente de "pedidos en borrador".

## Flujo de Trabajo

1.  Al sincronizar los pedidos de WooCommerce, se crean como borradores con el estado `borrador_woocommerce`.
2.  Un usuario del panel de gestión de clientes accede al apartado "Pedidos en Borrador".
3.  El usuario revisa los pedidos, completa la información que falta (como el código de cliente) y los valida.
4.  Al validar un pedido, su estado cambia a "en_espera" y aparece en el panel de expediciones, listo para ser procesado.

## Cómo Probar

1.  Sincroniza los pedidos de WooCommerce.
2.  Accede al apartado "Pedidos en Borrador" y verifica que aparecen los nuevos pedidos.
3.  Edita un pedido en borrador y complétalo.
4.  Valida el pedido y comprueba que desaparece de la lista de borradores y aparece en el panel de expediciones.
