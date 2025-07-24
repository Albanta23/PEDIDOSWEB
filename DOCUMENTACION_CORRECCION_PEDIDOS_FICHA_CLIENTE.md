# Corrección de Visualización de Pedidos en Ficha de Cliente

## Problema

En la sección de clientes-gestión, dentro de la ficha del cliente, los pedidos enviados dejaron de mostrarse. Este problema comenzó a ocurrir cuando se implementó el historial de devoluciones en la ficha del cliente.

## Causa Raíz

Tras investigar el código, se identificó que cuando se implementó el historial de devoluciones, se introdujo un flag `enHistorialDevoluciones` en los documentos de pedidos para distinguir entre pedidos normales y devoluciones. Sin embargo, en la función `cargarPedidosCliente` del componente `ClientesMantenimiento.jsx` no se estaba filtrando adecuadamente para excluir los pedidos marcados como devoluciones.

La función hacía una solicitud a la API para obtener todos los pedidos, incluyendo las devoluciones:
```javascript
const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes`);
```

Y luego solo filtraba por el nombre del cliente, pero no excluía los pedidos marcados como devoluciones.

## Solución Implementada

Se realizaron dos cambios importantes:

1. **Filtrado en la solicitud a la API**: Se modificó la solicitud para incluir el parámetro `enHistorialDevoluciones=false`, lo que hace que la API solo devuelva los pedidos que no están marcados como devoluciones:
   ```javascript
   const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes?enHistorialDevoluciones=false`);
   ```

2. **Filtrado adicional en el cliente**: Como medida de seguridad adicional, se añadió una verificación en la función de filtrado para excluir explícitamente cualquier pedido que pudiera estar marcado como devolución:
   ```javascript
   // Asegurarse de que no es un pedido marcado como devolución
   if (pedido.enHistorialDevoluciones === true) return false;
   ```

## Cómo Verificar la Solución

Se han creado dos scripts de diagnóstico para ayudar a verificar que la solución funciona correctamente:

1. **`diagnostico-pedidos-cliente-filtrado.js`**: Este script realiza una serie de pruebas para verificar cómo se están filtrando los pedidos y si los pedidos correctos están siendo devueltos.

2. **`verificar-solucion-pedidos.js`**: Este script simula la lógica del componente después de la corrección y verifica que los resultados sean consistentes.

Para ejecutar estos scripts y verificar que la solución funciona correctamente:

```bash
node diagnostico-pedidos-cliente-filtrado.js
node verificar-solucion-pedidos.js
```

## Flujo de Trabajo Actualizado

1. Cuando un usuario accede a la ficha de un cliente, el sistema:
   - Carga los pedidos normales (no devoluciones) con `cargarPedidosCliente`
   - Carga las devoluciones con `cargarDevolucionesCliente`

2. Los pedidos normales se muestran en la sección "Historial de Pedidos" y las devoluciones se muestran en la sección "Historial de Devoluciones".

3. Esta separación asegura que los usuarios puedan ver claramente tanto los pedidos normales como las devoluciones en las secciones correspondientes, mejorando la usabilidad y evitando confusiones.

## Recomendaciones Adicionales

1. Considerar agregar logs más descriptivos en las funciones `cargarPedidosCliente` y `cargarDevolucionesCliente` para facilitar la depuración en el futuro.

2. Implementar pruebas unitarias para estas funciones para asegurar que los cambios futuros no reintroduzcan este problema.

3. Revisar si hay otras funciones en la aplicación que podrían estar afectadas por un problema similar y aplicar las mismas correcciones.
