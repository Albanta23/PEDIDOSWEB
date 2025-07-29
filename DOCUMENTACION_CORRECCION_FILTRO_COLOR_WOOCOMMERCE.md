# Corrección de Filtro de Color para Pedidos WooCommerce

## Problema Identificado
El filtro de color aplicado a los pedidos de WooCommerce estaba implementado incorrectamente en el componente `ExpedicionesClientes.jsx`. El filtro se basaba en el **estado** del pedido (`borrador_woocommerce`) en lugar del **origen** del pedido (`woocommerce`).

## Ubicación del Error
- **Archivo**: `src/expediciones-clientes/ExpedicionesClientes.jsx`
- **Línea**: 119
- **Código Problemático**:
```jsx
background: p.estado === 'borrador_woocommerce' ? '#ffeb3b' : 'transparent'
```

## Solución Implementada
Se cambió la condición para que el filtro se base correctamente en el origen del pedido:

```jsx
background: p.origen?.tipo === 'woocommerce' ? '#ffeb3b' : 'transparent'
```

## Justificación del Cambio
1. **Consistencia Lógica**: Los pedidos deben resaltarse por su **origen** (de dónde vienen), no por su **estado** (en qué fase del proceso están).
2. **Flexibilidad**: Un pedido de WooCommerce puede tener diferentes estados (borrador, en preparación, enviado, etc.) pero siempre mantendrá su origen como `woocommerce`.
3. **Estabilidad**: Evita problemas si cambian los nombres de los estados en el futuro.

## Color Aplicado
- **Color de fondo**: `#ffeb3b` (amarillo)
- **Condición**: Cuando `p.origen?.tipo === 'woocommerce'`
- **Fallback**: `transparent` para pedidos de otros orígenes

## Verificación
Se realizó una búsqueda exhaustiva en todo el proyecto para confirmar que:
- ✅ Este era el único lugar donde se aplicaba el filtro problemático
- ✅ No existen otros componentes con la misma implementación incorrecta
- ✅ El resto de estilos de background son genéricos y no específicos para WooCommerce

## Resultado
Ahora todos los pedidos de WooCommerce se destacarán correctamente con fondo amarillo, independientemente de su estado actual, proporcionando una identificación visual consistente y confiable.

---
**Fecha de corrección**: 2025-01-06  
**Desarrollador**: GitHub Copilot  
**Verificado**: Búsqueda exhaustiva confirmó que es la única instancia del problema
