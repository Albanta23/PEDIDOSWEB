# MEJORA: BOTÓN GUARDAR Y CERRAR EN EL EDITOR DE PEDIDOS DE TIENDA

## Descripción de la Mejora

Se ha añadido un nuevo botón "Guardar y Cerrar" al panel editor de pedidos de tienda. Esta mejora permite a los usuarios guardar el borrador actual en localStorage y cerrar el editor en una sola acción, facilitando el flujo de trabajo.

## Problema Anterior

Antes de esta mejora, el panel editor de tiendas solo disponía de las siguientes opciones:
- "Guardar Borrador": Guardaba el pedido en localStorage pero mantenía el editor abierto
- "Cancelar": Cerraba el editor pero pedía confirmación para descartar cambios
- "Enviar a Fábrica": Enviaba el pedido y cerraba el editor

Esta configuración no permitía guardar el borrador y cerrar el editor en una sola acción, lo que dificultaba el flujo de trabajo cuando se quería guardar un pedido para continuarlo más tarde.

## Solución Implementada

Se ha agregado un nuevo botón "Guardar y Cerrar" con las siguientes características:
1. Guarda el borrador del pedido en localStorage (igual que "Guardar Borrador")
2. Cierra automáticamente el editor sin solicitar confirmación
3. Muestra un mensaje de confirmación "Borrador guardado localmente y editor cerrado"

## Archivos Modificados

1. `/workspaces/PEDIDOSWEB/src/components/PedidoList.jsx`:
   - Añadida la función `handleGuardarYCerrar()`
   - Agregado el botón "Guardar y Cerrar" en el panel de acciones del editor

## Instrucciones de Uso

1. Acceda al panel de tienda
2. Comience a crear un nuevo pedido o edite uno existente
3. Realice los cambios necesarios
4. Para guardar el borrador y cerrar el editor en una sola acción, haga clic en "Guardar y Cerrar"
5. El pedido quedará guardado localmente y podrá retomarlo más tarde desde el panel de tienda

## Beneficios de la Mejora

- Mejora la experiencia de usuario al permitir guardar y cerrar en un solo clic
- Reduce los pasos necesarios para guardar un borrador y continuar trabajando en otras tareas
- Mantiene la funcionalidad existente intacta para los usuarios que prefieran el flujo anterior

## Compatibilidad

Esta mejora es compatible con todas las funcionalidades existentes y no afecta a ningún otro proceso del sistema. Los pedidos guardados con esta nueva función se recuperan exactamente igual que los guardados con la opción "Guardar Borrador".
