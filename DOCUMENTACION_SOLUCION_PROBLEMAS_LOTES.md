# Documentación: Solución a problemas con lotes en pedidos y expediciones

## Problema detectado

Se identificaron varios problemas relacionados con la visibilidad y gestión de lotes en los editores de pedidos y expediciones de clientes:

1. Error 400 al actualizar pedidos desde el editor de fábrica, relacionado con validaciones de peso negativo en MovimientoStock
2. Lotes no visibles en los selectores de lotes en editores de pedidos y expediciones de clientes
3. Problemas con la normalización de datos en PedidoEditorFabrica.jsx

## Soluciones implementadas

### 1. Corrección de validaciones de peso negativo

Se modificó el archivo `utils/stock.js` para garantizar que los valores de peso sean siempre positivos en los movimientos de stock:

```javascript
// Antes
if (lote.cantidadDisponible < cantidad) {
    cantidadRestante = cantidad - lote.cantidadDisponible;
    // Problema: No consideraba correctamente los pesos
    await actualizarLote(lote._id, { cantidadDisponible: 0 });
    lotesUsados.push({ loteId: lote._id, cantidad: lote.cantidadDisponible });
} else {
    // Problema: Podía generar valores negativos en peso
    await actualizarLote(lote._id, { cantidadDisponible: lote.cantidadDisponible - cantidad });
    lotesUsados.push({ loteId: lote._id, cantidad });
    cantidadRestante = 0;
}

// Después
if (lote.cantidadDisponible < cantidad) {
    cantidadRestante = cantidad - lote.cantidadDisponible;
    // Se calcula el peso proporcionalmente
    const pesoARestar = lote.pesoDisponible || 0;
    await actualizarLote(lote._id, { 
        cantidadDisponible: 0,
        pesoDisponible: 0 
    });
    lotesUsados.push({ 
        loteId: lote._id, 
        cantidad: lote.cantidadDisponible,
        peso: pesoARestar
    });
} else {
    // Se calcula el peso de manera proporcional
    const proporcion = cantidad / lote.cantidadDisponible;
    const pesoARestar = lote.pesoDisponible ? Math.min(lote.pesoDisponible, lote.pesoDisponible * proporcion) : 0;
    
    await actualizarLote(lote._id, { 
        cantidadDisponible: lote.cantidadDisponible - cantidad,
        pesoDisponible: Math.max(0, lote.pesoDisponible - pesoARestar)
    });
    
    lotesUsados.push({ 
        loteId: lote._id, 
        cantidad,
        peso: pesoARestar
    });
    cantidadRestante = 0;
}
```

### 2. Mejora en el endpoint de lotes disponibles

Se modificó el endpoint `/api/lotes/:productoId` en `server.js` para mostrar todos los lotes que tengan cantidad o peso disponible:

```javascript
// Antes
const query = { 
    producto: productoId, 
    cantidadDisponible: { $gt: 0 } 
};

// Después
const query = { 
    producto: productoId, 
    $or: [
        { cantidadDisponible: { $gt: 0 } },
        { pesoDisponible: { $gt: 0 } }
    ]
};
```

### 3. Mejora en componentes de selección de lotes

Se mejoró el componente `LoteSelector` para manejar mejor los casos en que no hay lotes disponibles:

```jsx
// Antes
{lotes.length === 0 && !loading && (
    <span className="no-lotes">No hay lotes disponibles</span>
)}

// Después
{lotes.length === 0 && !loading && productoId && (
    <div className="no-lotes-warning">
        No hay lotes disponibles para este producto.
        <small>Compruebe el stock o registre una entrada de producto.</small>
    </div>
)}
```

### 4. Herramientas de diagnóstico y corrección

Se crearon las siguientes herramientas para diagnosticar y corregir problemas con lotes:

1. `diagnostico-lotes-disponibles.js`: Script para revisar todos los lotes disponibles en la base de datos
2. `regenerar-lotes-prueba.js`: Script para crear lotes de prueba en caso necesario
3. `debug-lotes-disponibles-v2.html`: Interfaz web para probar la selección de lotes y el funcionamiento del endpoint

## Guía de uso

### Diagnosticar problemas con lotes

Para verificar los lotes disponibles en la base de datos:

```bash
node diagnostico-lotes-disponibles.js
```

Este script mostrará todos los productos y sus lotes disponibles, incluyendo cantidades y pesos.

### Regenerar lotes de prueba

Si es necesario crear lotes de prueba para realizar pruebas:

```bash
node regenerar-lotes-prueba.js
```

Este script creará entre 1 y 3 lotes aleatorios para cada producto en la base de datos.

### Probar la selección de lotes en el navegador

1. Abra la página `debug-lotes-disponibles-v2.html` en su navegador
2. Seleccione un producto para ver sus lotes disponibles
3. Pruebe el selector de lotes para verificar que funciona correctamente
4. Utilice las diferentes pestañas para probar el endpoint directamente o simular el componente React

## Recomendaciones

1. Asegúrese de que todas las operaciones de stock calculen correctamente los pesos
2. Utilice siempre valores positivos o cero para cantidades y pesos
3. Verifique que los selectores de lotes muestren feedback cuando no hay lotes disponibles
4. Considere añadir validaciones adicionales en el frontend para evitar enviar datos incorrectos

## Próximos pasos

1. Implementar un sistema de alerta cuando los lotes estén por agotarse
2. Mejorar la interfaz de usuario para mostrar más información sobre los lotes disponibles
3. Añadir filtros adicionales para buscar lotes por proveedor o fecha
4. Desarrollar un panel de administración específico para la gestión de lotes
