# Mejora: Entrada manual de lotes en editores de pedidos

## Descripción del problema

En los editores de pedidos de tiendas y expediciones de clientes, los lotes solo podían seleccionarse de la lista de lotes disponibles obtenida desde el servidor. Esto dificultaba situaciones donde:

1. Era necesario ingresar un lote manualmente (por ejemplo, lotes antiguos o externos)
2. El lote deseado no aparecía en la lista de disponibles por alguna razón
3. Se necesitaba hacer pruebas o registrar datos históricos

## Solución implementada

Se ha mejorado el componente `LoteSelector` para permitir dos modos de funcionamiento:

1. **Modo de selección de lista** (predeterminado): Muestra la lista de lotes disponibles como antes
2. **Modo de entrada manual**: Permite ingresar cualquier valor de lote manualmente

### Características principales

- **Botón de alternancia**: Un botón junto al campo de entrada permite cambiar entre los dos modos
- **Indicadores visuales**: 
  - Icono ✏️ para modo manual
  - Icono 📋 para modo lista 
  - Mensaje informativo que indica el modo actual
- **Estado persistente**: El modo seleccionado se mantiene mientras se edita el pedido
- **Compatible con validación**: Sigue funcionando con la validación existente

## Archivos modificados

1. `src/components/PedidoEditorFabrica.jsx`: Componente para el editor de pedidos de fábrica
2. `src/expediciones-clientes/ExpedicionClienteEditor.jsx`: Componente para el editor de expediciones de clientes
3. `src/styles/lote-selector.css`: Nuevo archivo con estilos específicos para el selector de lotes

## Cómo usar

1. Para seleccionar de la lista de lotes disponibles:
   - Simplemente haga clic en el campo y seleccione un lote de la lista desplegable (comportamiento predeterminado)

2. Para ingresar un lote manualmente:
   - Haga clic en el botón ✏️ junto al campo de lote
   - El campo cambiará a modo manual (se mostrará con fondo azul claro)
   - Ingrese cualquier valor de lote deseado
   - Para volver al modo de lista, haga clic en el botón 📋

## Consideraciones técnicas

- Esta mejora no afecta la validación de lotes en el backend
- Los lotes ingresados manualmente no se validan contra la base de datos
- Es responsabilidad del usuario asegurarse de que los lotes manuales sean correctos
- Esta funcionalidad es especialmente útil para:
  - Corregir datos históricos
  - Registrar lotes externos
  - Situaciones donde la disponibilidad del lote no se refleja correctamente en el sistema

## Mejoras futuras

- Agregar un histórico de lotes ingresados manualmente
- Validación opcional de lotes manuales
- Indicadores visuales para distinguir lotes seleccionados de la lista vs. lotes ingresados manualmente
