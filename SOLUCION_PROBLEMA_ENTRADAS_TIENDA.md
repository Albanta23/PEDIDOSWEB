# Solución Problema Entradas en Tiendas al Cerrar Pedidos

## Problema Identificado

Después de las últimas implementaciones sobre la lógica del stock y lotes, se ha detectado que cuando se cierra un pedido en el panel de fábrica, el sistema correctamente descuenta el stock del almacén central, pero no está registrando la entrada correspondiente en el almacén de la tienda que hizo el pedido.

## Diagnóstico

Tras analizar el código, se ha identificado que:

1. En `pedidosTiendaController.js`, la función `actualizar` maneja el cambio de estado a 'enviadoTienda'.
2. Cuando un pedido cambia a estado 'enviadoTienda', el controlador solo registra la baja de stock en almacén central utilizando `registrarBajaStock`.
3. No hay una llamada para registrar la entrada correspondiente en el almacén de la tienda, causando que las tiendas no vean los productos en su inventario.

## Solución Implementada

Se ha modificado el `pedidosTiendaController.js` para que cuando un pedido cambie a estado 'enviadoTienda', además de registrar la baja en el almacén central, también registre la entrada en el almacén de la tienda correspondiente.

Principales cambios:

1. Se importa la función `registrarMovimientoStock` además de `registrarBajaStock`.
2. Para cada línea del pedido, además de registrar la baja en almacén central, ahora se registra la entrada en la tienda destino utilizando `registrarMovimientoStock` con tipo 'entrada'.
3. Se han añadido logs adicionales para facilitar el seguimiento y depuración.

## Implementación

Para aplicar la solución:

1. Reemplazar la función `actualizar` en el archivo `gestion-pedidos-carniceria/src/pedidosTiendaController.js` con la versión corregida que incluye ambos registros de movimientos.
2. Reiniciar el servidor para que los cambios surtan efecto.

## Verificación

Para verificar que el problema se ha solucionado:

1. Crear y enviar un nuevo pedido desde el panel de fábrica a una tienda.
2. Confirmar que el pedido cambia a estado 'enviadoTienda'.
3. Verificar en el panel de almacén de la tienda que aparecen los productos recibidos.
4. Comprobar que los movimientos de stock se registran correctamente en ambos almacenes (central y tienda).

## Mejoras Futuras Recomendadas

1. Implementar mecanismos de validación adicionales para asegurar que siempre se registren tanto la salida como la entrada en cualquier operación de transferencia de stock.
2. Considerar la creación de una función específica `registrarTransferenciaStock` que maneje ambos movimientos como una transacción atómica.
3. Añadir notificaciones a las tiendas cuando reciben nuevas entradas de stock.
