# CORRECCIÓN LÓGICA DE UNIDADES PARA EXPORTACIÓN SAGE50

**Fecha:** Enero 2025  
**Problema resuelto:** Mapeo incorrecto de unidades en la columna UNIDADES de Sage50

## 🎯 PROBLEMA IDENTIFICADO

La columna **UNIDADES** de Sage50 no se estaba mapeando correctamente según el tipo de producto y origen del pedido:

- **❌ Problema anterior:** Siempre se usaba `cantidadEnviada || cantidad`
- **✅ Solución:** Lógica diferenciada según origen y tipo de producto

## 📊 LÓGICA IMPLEMENTADA

### 🛒 **Pedidos WooCommerce**
```
ORIGEN: WooCommerce (tienda online)
CARACTERÍSTICAS:
- Todos los productos se venden por unidad y precio fijo
- Los datos de expediciones son solo para trazabilidad y stock
- NO se usan datos de expediciones para importar a Sage50

MAPEO DE UNIDADES:
✅ Siempre usar: linea.cantidad (cantidad original del pedido WooCommerce)
```

### 🏪 **Pedidos Normales (Carnicería)**
```
ORIGEN: Sistema interno de gestión
CARACTERÍSTICAS:
- Productos pueden venderse por peso o por unidad
- Los datos de expediciones SÍ se usan para la facturación

MAPEO DE UNIDADES:
✅ Producto por PESO (formato: kg/gramos): usar linea.peso
✅ Producto por UNIDAD (otros formatos): usar linea.cantidadEnviada || linea.cantidad
```

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Archivo: `/gestion-pedidos-carniceria/src/sageController.js`

```javascript
// 🔧 LÓGICA CORRECTA PARA UNIDADES SEGÚN ORIGEN Y TIPO DE PRODUCTO
let unidadesFinal;
const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);

if (esWooCommerce) {
  // 🛒 PEDIDOS WOOCOMMERCE: Siempre usar cantidad original (venta por unidad)
  unidadesFinal = linea.cantidad || 0;
} else {
  // 🏪 PEDIDOS NORMALES: Determinar según tipo de producto
  // Si tiene peso y se vende por peso → usar peso
  // Si no tiene peso o se vende por unidad → usar cantidadEnviada
  if (linea.peso && linea.peso > 0 && (linea.formato === 'kg' || linea.formato === 'gramos')) {
    unidadesFinal = linea.peso; // Usar peso para productos que se venden por peso
  } else {
    unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0; // Usar cantidad para productos por unidad
  }
}
```

### Identificación de Pedidos WooCommerce
```javascript
const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
```

### Observaciones Contextuales
```javascript
const observacionesCompletas = [
  linea.comentario || '',
  esWooCommerce ? 'Pedido WooCommerce' : '',
  !esWooCommerce && linea.peso ? `Peso: ${linea.peso}kg` : '',
  !esWooCommerce && linea.cantidadEnviada ? `Cant. enviada: ${linea.cantidadEnviada}` : ''
].filter(Boolean).join(' | ');
```

## 📋 EJEMPLOS DE FUNCIONAMIENTO

### Ejemplo 1: Pedido Normal - Producto por Peso
```
INPUT:
- Producto: "Jamón Ibérico"
- Cantidad: 1
- Peso: 2.5kg
- Formato: "kg"
- Cantidad enviada: 1

OUTPUT SAGE50:
- UNIDADES: 2.5 ← Se usa el PESO
- OBSERVACIONES: "Jamón de bellota | Peso: 2.5kg | Cant. enviada: 1"
```

### Ejemplo 2: Pedido Normal - Producto por Unidad
```
INPUT:
- Producto: "Lata de Conservas"
- Cantidad: 12
- Peso: 0kg
- Formato: "unidad"
- Cantidad enviada: 10

OUTPUT SAGE50:
- UNIDADES: 10 ← Se usa la CANTIDAD ENVIADA
- OBSERVACIONES: "Latas premium | Cant. enviada: 10"
```

### Ejemplo 3: Pedido WooCommerce
```
INPUT:
- Producto: "Chorizo Premium Online"
- Cantidad: 3
- Peso: 1.8kg (solo trazabilidad)
- Formato: "unidad"
- Cantidad enviada: 3

OUTPUT SAGE50:
- UNIDADES: 3 ← Se usa CANTIDAD ORIGINAL (WooCommerce)
- OBSERVACIONES: "Pedido online | Pedido WooCommerce"
```

## 📊 FORMATO DE COLUMNAS SAGE50 CUMPLIDO

| Campo | Tipo | Descripción | ✅ Estado |
|-------|------|-------------|----------|
| SERIE | Alfanumérico | Código de la serie de venta | ✅ Implementado |
| ALBARAN | Alfanumérico | Número de albarán de venta | ✅ Implementado |
| CLIENTE | Alfanumérico | Código del cliente | ✅ Implementado |
| FECHA | Fecha | Fecha operativa del albarán | ✅ Implementado |
| ALMACEN | Alfanumérico | Código del almacén | ✅ Implementado |
| FORMAPAGO | Alfanumérico | Código de la forma de pago | ✅ Implementado |
| VENDEDOR | Alfanumérico | Código del vendedor | ✅ Implementado |
| ARTICULO | Alfanumérico | Código del artículo | ✅ Implementado |
| **UNIDADES** | **Numérico** | **Unidades vendidas** | **✅ CORREGIDO** |
| PRECIO | Numérico | Precio de venta | ✅ Implementado |
| DTO1 | Numérico | Primer descuento | ✅ Implementado |
| DTO2 | Numérico | Segundo descuento | ✅ Implementado |
| OBRA | Alfanumérico | Código de la obra | ✅ Implementado (vacío) |
| DEFINICION | Alfanumérico | Definición de la línea | ✅ Implementado |
| FACTURA | Alfanumérico | Número de factura | ✅ Implementado |
| FECHAFRA | Fecha | Fecha de factura | ✅ Implementado |
| OBSERVACIONES | Alfanumérico | Observaciones generales | ✅ Implementado |

## 🚀 RESULTADO FINAL

**✅ CORRECCIÓN COMPLETA:** El mapeo de unidades ahora funciona correctamente según la lógica de negocio:

1. **Pedidos WooCommerce** → Cantidad original (venta por unidad con precio fijo)
2. **Pedidos normales por peso** → Peso de expediciones (kg/gramos)
3. **Pedidos normales por unidad** → Cantidad enviada efectiva

**🎯 Impacto:** Los datos importados en Sage50 ahora reflejan correctamente las unidades de facturación según el tipo de producto y origen del pedido, garantizando la coherencia entre el sistema de gestión y el ERP.
