# Actualización: Evitar sincronización repetida de pedidos de WooCommerce

## Fecha: 18 de Julio de 2025

## Descripción del problema

Actualmente, el sistema sincroniza todos los pedidos de WooCommerce cada vez que se ejecuta el proceso de sincronización, incluso si esos pedidos ya han sido sincronizados previamente. Esto causa:

1. Procesamiento innecesario de pedidos ya importados
2. Potencial ralentización del sistema al procesar grandes volúmenes de pedidos
3. Riesgo de duplicación o inconsistencias en casos particulares

## Solución implementada

Se ha mejorado el mecanismo de sincronización para que:

1. **Marque los pedidos como sincronizados**: Se añade un nuevo campo `yaActualizado: Boolean` al modelo `PedidoCliente` para indicar si un pedido de WooCommerce ya ha sido procesado.
2. **Omita pedidos ya sincronizados**: El proceso de sincronización ahora filtra automáticamente los pedidos que ya están marcados como sincronizados.
3. **Permita sincronización forzada**: Se ha añadido un nuevo endpoint `/api/pedidos-woo/sincronizar-forzado` para casos donde sea necesario procesar todos los pedidos nuevamente.

## Cambios realizados

### 1. Modelo de datos
Se ha añadido un nuevo campo al modelo `PedidoCliente`:
```javascript
yaActualizado: { type: Boolean, default: false } // Indica si el pedido ya fue sincronizado (para pedidos de WooCommerce)
```

### 2. Controlador de WooCommerce
Se ha modificado el método `sincronizarPedidos` para:
- Aceptar un parámetro opcional `forzar` que permite procesar todos los pedidos
- Detectar y filtrar los pedidos ya sincronizados
- Marcar los nuevos pedidos como sincronizados
- Actualizar pedidos existentes que no estuvieran marcados como sincronizados
- Proporcionar estadísticas detalladas del proceso de sincronización

### 3. Endpoints de la API
Se ha añadido un nuevo endpoint para sincronización forzada:
```javascript
app.get('/api/pedidos-woo/sincronizar-forzado', (req, res) => {
  req.query.forzar = 'true';
  return woocommerceController.sincronizarPedidos(req, res);
});
```

## Uso

### Sincronización normal (omite pedidos ya sincronizados)
```
GET /api/pedidos-woo/sincronizar
```

### Sincronización forzada (procesa todos los pedidos)
```
GET /api/pedidos-woo/sincronizar-forzado
```

## Respuesta mejorada

La respuesta de la API ahora incluye estadísticas más detalladas:
```json
{
  "message": "Sincronización completada",
  "resultados": {
    "procesados": 5,
    "nuevos": 2,
    "existentes": 3,
    "clientesCreados": 1,
    "omitidos": 20
  },
  "detalles": {
    "totalPedidosWoo": 25,
    "pedidosProcesados": 5,
    "pedidosOmitidos": 20,
    "forzadoManualmente": false
  }
}
```

## Consideraciones futuras

Para mejorar aún más este sistema, se podría considerar:

1. Implementar sincronización incremental basada en fechas
2. Añadir un proceso programado para sincronizar automáticamente los nuevos pedidos
3. Incluir un mecanismo de notificación cuando se reciben nuevos pedidos
