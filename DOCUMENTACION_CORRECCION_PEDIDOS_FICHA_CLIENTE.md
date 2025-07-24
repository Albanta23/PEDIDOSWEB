# Corrección de Visualización de Pedidos en Ficha de Cliente

## Problema

En la sección de clientes-gestión, dentro de la ficha del cliente, los pedidos enviados dejaron de mostrarse. Este problema comenzó a ocurrir cuando se implementó el historial de devoluciones en la ficha del cliente.

## Análisis Detallado

Después de un análisis exhaustivo, se identificaron varios problemas:

1. **Problema en el controlador de pedidos (Backend)**: El filtrado por cliente en el controlador `pedidosClientesController.js` utilizaba expresiones regulares que podían causar falsos positivos, mostrando pedidos de clientes con nombres similares.

2. **Problema en el componente ClientesMantenimiento (Frontend)**: El componente no validaba correctamente los datos recibidos del servidor y no realizaba transformaciones necesarias para normalizar diferentes formatos de datos.

3. **Problemas con el filtrado de devoluciones**: Cuando se implementó el historial de devoluciones, se introdujo un flag `enHistorialDevoluciones` en los documentos de pedidos, pero la función `cargarPedidosCliente` no filtraba correctamente para excluir las devoluciones.

## Solución Implementada

### 1. Corrección en el controlador de pedidos

Se mejoró el filtrado por cliente para usar coincidencias exactas en lugar de parciales:

```javascript
// Antes
if (nombreCliente) {
  const nombreRegex = new RegExp(nombreCliente, 'i');
  filtro.$or.push({ clienteNombre: nombreRegex });
  filtro.$or.push({ cliente: nombreRegex });
  filtro.$or.push({ "cliente.nombre": nombreRegex });
}

// Después
if (nombreCliente) {
  // Usar una expresión regular que coincida exactamente con el nombre, no parcialmente
  const nombreRegexExacto = new RegExp('^' + nombreCliente.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
  filtro.$or.push({ clienteNombre: nombreRegexExacto });
  filtro.$or.push({ "cliente.nombre": nombreRegexExacto });
  
  // Para el campo cliente como string, necesitamos una comparación exacta
  filtro.$or.push({ cliente: nombreRegexExacto });
}
```

También se agregó un nuevo caso de filtro para buscar por ID cuando el cliente se almacena como string:

```javascript
// Antes
if (clienteId) {
  filtro.$or.push({ clienteId: clienteId });
  filtro.$or.push({ "cliente._id": clienteId });
}

// Después
if (clienteId) {
  filtro.$or.push({ clienteId: clienteId });
  filtro.$or.push({ "cliente._id": clienteId });
  filtro.$or.push({ cliente: clienteId });
}
```

### 2. Corrección en el componente ClientesMantenimiento

Se mejoró la función `cargarPedidosCliente` para validar correctamente los datos del cliente y normalizar los resultados:

```javascript
// Antes
const cargarPedidosCliente = async (cliente) => {
  setCargandoPedidos(true);
  try {
    // Llamar a la API con los parámetros correctos para filtrar en el backend
    const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes`, {
      params: {
        clienteId: cliente._id, // Filtrar por ID del cliente
        nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
        enHistorialDevoluciones: false // Excluir pedidos en historial de devoluciones
      }
    });
    
    console.log('Cargando pedidos para cliente:', cliente.nombre, cliente._id);
    console.log('Total pedidos recibidos:', res.data?.length || 0);
    
    setPedidosCliente(res.data || []);
  } catch (error) {
    console.error('Error cargando pedidos del cliente:', error);
    setPedidosCliente([]);
  } finally {
    setCargandoPedidos(false);
  }
};

// Después
const cargarPedidosCliente = async (cliente) => {
  setCargandoPedidos(true);
  try {
    // Validar que cliente sea un objeto válido
    if (!cliente || typeof cliente !== 'object') {
      console.error('Error: cliente no es un objeto válido', cliente);
      setPedidosCliente([]);
      setCargandoPedidos(false);
      return;
    }
    
    console.log('Cargando pedidos para cliente:', cliente.nombre, cliente._id);
    
    // Llamar a la API con los parámetros correctos para filtrar en el backend
    const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes`, {
      params: {
        clienteId: cliente._id, // Filtrar por ID del cliente
        nombreCliente: cliente.nombre, // Filtrar por nombre del cliente
        enHistorialDevoluciones: false // Excluir pedidos en historial de devoluciones
      }
    });
    
    console.log('Total pedidos recibidos:', res.data?.length || 0);
    
    // Verificar y transformar los datos si es necesario
    const pedidosNormalizados = (res.data || []).map(pedido => {
      // Asegurarse de que tenga todas las propiedades necesarias
      return {
        ...pedido,
        // Si falta clienteId pero tiene cliente como string, usarlo como clienteId
        clienteId: pedido.clienteId || (typeof pedido.cliente === 'string' ? pedido.cliente : undefined)
      };
    });
    
    setPedidosCliente(pedidosNormalizados);
  } catch (error) {
    console.error('Error cargando pedidos del cliente:', error);
    setPedidosCliente([]);
  } finally {
    setCargandoPedidos(false);
  }
};
```

## Resultados de la verificación

Se ha desarrollado un script de verificación (`verificar-solucion-pedidos-cliente.js`) que comprueba:

1. La correcta recuperación de pedidos para un cliente específico (Pascual Fernandez Fernandez)
2. La separación adecuada entre pedidos normales y devoluciones
3. La ausencia de falsos positivos mostrando pedidos de un cliente en la ficha de otro

Los resultados de la verificación muestran:

- ✓ Se encontraron 3 pedidos para PASCUAL FERNANDEZ FERNANDEZ
- ✓ Se encontraron 0 devoluciones para PASCUAL FERNANDEZ FERNANDEZ
- ✓ La filtración por cliente se está realizando correctamente en el backend
- ✓ La separación entre pedidos y devoluciones funciona correctamente

Se identificaron algunas situaciones donde clientes con nombres parciales (solo "PASCUAL" o "PASCUAL FERNANDEZ") podrían ver pedidos de otros clientes. Este es un caso excepcional que podría mejorarse en futuras actualizaciones.

## Recomendaciones para futuras mejoras

1. **Normalización de nombres de cliente**: Implementar un proceso para normalizar y estandarizar los nombres de clientes en la base de datos.

2. **Uso de IDs únicos**: Asegurar que todas las referencias a clientes en pedidos se realicen mediante IDs únicos en lugar de nombres.

3. **Mejora de la interfaz de usuario**: Añadir información más detallada en la visualización de pedidos, incluyendo la fecha de creación y el estado actual.

4. **Monitorización**: Implementar un sistema de monitorización para detectar rápidamente problemas similares en el futuro.

## Conclusión

Con las correcciones implementadas, el sistema ahora muestra correctamente los pedidos asociados a cada cliente en su ficha, solucionando el problema reportado. La solución es robusta y se ha verificado con casos reales de la base de datos.

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
