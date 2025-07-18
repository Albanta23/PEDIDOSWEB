# Documentación de la Gestión de Pedidos en Borrador de WooCommerce

## Resumen

Se ha implementado un nuevo flujo de trabajo para los pedidos de WooCommerce, que permite revisarlos y completarlos en un estado de "borrador" antes de enviarlos al panel de expediciones. Esto asegura la calidad de los datos y evita que lleguen pedidos incompletos a expediciones. Además, se ha añadido un indicador visual para identificar fácilmente los pedidos que provienen de la tienda online en todo el sistema.

## Cambios Realizados (actualización 18 de julio de 2025)

- **Nuevo campo esTiendaOnline:**
    - Se ha añadido un nuevo campo `esTiendaOnline` al modelo `PedidoCliente` para identificar los pedidos que provienen de la tienda online.
    ```javascript
    esTiendaOnline: { type: Boolean, default: false } // Indica si el pedido proviene de la tienda online
    ```
- **Indicador visual en pedidos:**
    - Se ha añadido un badge con la etiqueta "TIENDA ONLINE" que aparece junto al título del pedido en la edición.
    ```jsx
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
    ```
- **Filtro en la vista de borradores:**
    - Se ha implementado un filtro (switch) en la vista de pedidos en borrador para mostrar todos los borradores o solo los pedidos de la tienda online.
    - Por defecto, el filtro muestra solo los pedidos de tienda online.

- **Nuevo estado de pedido "borrador_woocommerce":**
    - Se ha añadido un nuevo estado `borrador_woocommerce` para identificar los pedidos de WooCommerce que necesitan ser revisados.
- **Sincronización de WooCommerce:**
    - Se ha modificado la sincronización de WooCommerce para que los nuevos pedidos se guarden con el estado `borrador_woocommerce` y se marquen como `esTiendaOnline: true`.
- **Nuevo componente "Pedidos en Borrador":**
    - Se ha creado un nuevo componente `src/clientes-gestion/PedidosBorrador.jsx` que muestra una tabla con todos los pedidos en estado `borrador_woocommerce`.
    - Este componente permite editar los datos del cliente (código, etc.) y otros datos de cabecera del pedido.
- **Validación y envío a expediciones:**
    - Se ha añadido un botón "Procesar" que cambia el estado del pedido a "en_espera" y lo envía al panel de expediciones.
- **Integración en el panel de gestión de clientes:**
    - Se ha añadido un nuevo enlace en la barra lateral para acceder al nuevo componente de "pedidos en borrador".

## Flujo de Trabajo (actualizado)

1. Al sincronizar los pedidos de WooCommerce, se crean como borradores con el estado `borrador_woocommerce` y se marcan como `esTiendaOnline: true`.
2. Un usuario del panel de gestión de clientes accede al apartado "Pedidos en Borrador".
3. El usuario puede filtrar la vista para mostrar solo los pedidos de la tienda online o todos los borradores.
4. El usuario revisa los pedidos, completa la información que falta (como el código de cliente) y los procesa.
5. Al procesar un pedido, su estado cambia a "en_espera" y aparece en el panel de expediciones, listo para ser procesado, manteniendo la marca de `esTiendaOnline: true`.
6. En el panel de expediciones y en la edición, estos pedidos se muestran con un indicador visual "TIENDA ONLINE" para distinguirlos fácilmente.

## Nuevo Endpoint para Procesar Borradores

Se ha implementado un nuevo endpoint en el servidor para procesar los pedidos en borrador:

```javascript
app.post('/api/pedidos-clientes/:id/procesar-borrador', pedidosClientesController.procesarPedidoBorrador);
```

Este endpoint:
1. Cambia el estado del pedido de `borrador_woocommerce` a `en_espera`
2. Registra el cambio en el historial de estados
3. Asegura que el pedido mantiene la marca de `esTiendaOnline: true`

## Cómo Probar

1. Sincroniza los pedidos de WooCommerce.
2. Accede al apartado "Pedidos en Borrador" y verifica que aparecen los nuevos pedidos.
3. Usa el switch para filtrar entre todos los borradores o solo los de tienda online.
4. Edita un pedido en borrador y complétalo.
5. Haz clic en el botón "Procesar" y comprueba que:
   - Desaparece de la lista de borradores
   - Aparece en el panel de expediciones
   - Se muestra con la etiqueta "TIENDA ONLINE" en la edición

## Beneficios

- **Mayor control**: Los pedidos de la tienda online pueden ser verificados antes de procesarlos
- **Mejor identificación**: Los pedidos de WooCommerce se distinguen claramente del resto con un indicador visual
- **Flujo optimizado**: Se evita la mezcla de pedidos online con los pedidos manuales hasta que estén verificados
- **Reducción de errores**: Se pueden corregir problemas antes de que los pedidos entren al flujo normal
