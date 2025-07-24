# Corrección de Visualización de Pedidos en Ficha de Cliente

## Problema Detectado

Se detectó un problema donde los pedidos de un cliente no se visualizaban correctamente en su ficha en el módulo de gestión de clientes. Específicamente, los pedidos enviados por un cliente no aparecían en su ficha individual.

## Causas Identificadas

Tras el análisis, se identificaron las siguientes causas:

1. **Filtrado impreciso por nombre de cliente en el backend**: 
   - El controlador `pedidosClientesController.js` utilizaba expresiones regulares sin anclajes (`^$`), lo que podía hacer que pedidos de clientes con nombres similares se incluyeran en los resultados.
   - Por ejemplo, buscando pedidos de "PASCUAL FERNANDEZ FERNANDEZ" también se obtenían pedidos de "TOMAS ELVIRA PASCUAL" u otros clientes que contenían "PASCUAL".

2. **Manejo inconsistente de referencias de cliente**:
   - Los pedidos podían tener diferentes formas de referenciar al cliente: 
     - Como un ID en `clienteId`
     - Como un objeto en `cliente`
     - Como una cadena de texto en `cliente`
     - Como un nombre en `clienteNombre`
   - El componente frontend no normalizaba correctamente estas diferentes estructuras.

3. **Validación insuficiente de datos**:
   - No se realizaba una validación robusta de la estructura de los datos recibidos del backend.

## Soluciones Implementadas

### 1. Backend: Mejora del filtrado exacto por cliente

En `pedidosClientesController.js` se modificó el filtrado por nombre de cliente para usar coincidencias exactas:

**Antes:**
```javascript
if (nombreCliente) {
  const nombreRegex = new RegExp(nombreCliente, 'i');
  filtro.$or.push({ clienteNombre: nombreRegex });
  filtro.$or.push({ "cliente.nombre": nombreRegex });
  filtro.$or.push({ cliente: nombreRegex });
}
```

**Después:**
```javascript
if (nombreCliente) {
  // Usar una expresión regular que coincida exactamente con el nombre, no parcialmente
  const nombreRegexExacto = new RegExp('^' + nombreCliente.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
  filtro.$or.push({ clienteNombre: nombreRegexExacto });
  filtro.$or.push({ "cliente.nombre": nombreRegexExacto });
  
  // Para el campo cliente como string, necesitamos una comparación exacta
  filtro.$or.push({ cliente: nombreRegexExacto });
}
```

La clave fue añadir los anclajes `^` y `$` para asegurar coincidencias exactas del nombre completo, y escapar caracteres especiales que pudieran estar en los nombres.

### 2. Frontend: Mejora del manejo de datos de pedidos

En `ClientesMantenimiento.jsx` se mejoró la función de carga de pedidos para normalizar los datos:

**Antes:**
```javascript
const cargarPedidosCliente = async (cliente) => {
  setCargandoPedidos(true);
  try {
    const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes`, {
      params: {
        clienteId: cliente._id,
        nombreCliente: cliente.nombre,
        enHistorialDevoluciones: false
      }
    });
    
    setPedidosCliente(res.data || []);
  } catch (error) {
    console.error('Error cargando pedidos del cliente:', error);
    setPedidosCliente([]);
  } finally {
    setCargandoPedidos(false);
  }
};
```

**Después:**
```javascript
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

Se añadió:
- Validación del objeto cliente antes de procesar
- Logs para diagnóstico
- Normalización de datos para manejar diferentes estructuras de referencia al cliente

### 3. Mejora de la función de filtrado

Se mejoró la robustez de la función `filtrarPedidosCliente` para evitar errores con datos inconsistentes:

```javascript
const filtrarPedidosCliente = (pedidos, filtroFecha, filtroProducto) => {
  console.log('DEBUG: Aplicando filtros a pedidos', { total: pedidos?.length || 0, filtroFecha, filtroProducto });
  
  // Asegurarnos que pedidos sea un array
  const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
  let pedidosFiltrados = [...pedidosArray];

  // Filtro por fecha...
  // Filtro por producto...
  
  console.log('DEBUG: Después de filtrar', { total: pedidosFiltrados.length });
  return pedidosFiltrados;
};
```

## Verificación de la Solución

Se creó un script de verificación (`verificar-solucion-pedidos-cliente.js`) para comprobar que la solución funciona correctamente:

1. Verifica que los pedidos de un cliente se obtienen correctamente por nombre exacto
2. Verifica que los pedidos se obtienen correctamente por ID de cliente
3. Comprueba que una búsqueda por nombre parcial no devuelve resultados incorrectos

## Resultado

✅ Los pedidos ahora se visualizan correctamente en la ficha de cada cliente.
✅ Se eliminó la "contaminación" de pedidos de clientes con nombres similares.
✅ El sistema es más robusto frente a inconsistencias en la estructura de datos.

## Mejoras Futuras Recomendadas

1. Normalizar los nombres de cliente en la base de datos para facilitar las búsquedas y evitar problemas de coincidencia
2. Utilizar siempre el ID del cliente como referencia principal, en lugar del nombre
3. Implementar un sistema de alertas para detectar inconsistencias de datos
4. Añadir tests automatizados para validar el correcto funcionamiento de la visualización de pedidos

## Fecha de Implementación

Julio 2025
