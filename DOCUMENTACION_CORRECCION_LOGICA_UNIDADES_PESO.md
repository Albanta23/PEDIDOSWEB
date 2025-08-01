# CORRECCIÓN LÓGICA UNIDADES SAGE50 BASADA EN PESO

**Fecha:** 1 de Agosto de 2025  
**Problema identificado:** La columna UNIDADES en las exportaciones a Sage50 no mapeaba correctamente según el valor del campo peso en el editor  
**Archivos modificados:** `gestion-pedidos-carniceria/src/sageController.js`

## 🎯 PROBLEMA DETECTADO

En las pruebas de importación a Sage50, se detectó que:
- El sistema siempre usaba `cantidadEnviada` para la columna UNIDADES
- No se consideraba el valor del campo `peso` del editor de pedidos
- Esto causaba importaciones incorrectas para productos que se venden por peso

## 📋 ESPECIFICACIÓN REQUERIDA

El usuario especificó que la lógica debe ser:
- **SI peso > 0**: Usar el valor del campo `peso` para la columna UNIDADES en Sage50
- **SI peso = 0**: Usar el valor del campo `cantidadEnviada` para la columna UNIDADES en Sage50

## 🔧 SOLUCIÓN IMPLEMENTADA

### Cambios en el Código

**Archivo:** `gestion-pedidos-carniceria/src/sageController.js`

#### 1. Función `exportarPedidos` (Excel)
```javascript
// ANTES (lógica compleja basada en formato)
if (linea.peso && linea.peso > 0 && (linea.formato === 'kg' || linea.formato === 'gramos')) {
  unidadesFinal = linea.peso;
} else {
  unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0;
}

// DESPUÉS (lógica simplificada basada en valor de peso)
if (linea.peso && linea.peso > 0) {
  unidadesFinal = linea.peso; // 🔧 PESO > 0: Usar peso
} else {
  unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0; // 🔧 PESO = 0: Usar cantidad enviada
}
```

#### 2. Función auxiliar CSV
Se aplicó la misma lógica en la función de generación de CSV para mantener consistencia.

### Lógica Final Implementada

```javascript
let unidadesFinal;
const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);

if (esWooCommerce) {
  // 🛒 PEDIDOS WOOCOMMERCE: Siempre usar cantidad original (venta por unidad)
  unidadesFinal = linea.cantidad || 0;
} else {
  // 🏪 PEDIDOS NORMALES: Lógica basada en el valor del peso
  // SI peso > 0 → usar PESO para UNIDADES
  // SI peso = 0 → usar CANTIDAD ENVIADA para UNIDADES
  if (linea.peso && linea.peso > 0) {
    unidadesFinal = linea.peso; // 🔧 PESO > 0: Usar peso
  } else {
    unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0; // 🔧 PESO = 0: Usar cantidad enviada
  }
}
```

## ✅ VERIFICACIÓN

Se creó el script `verificacion-logica-unidades-peso.js` que prueba:

1. **Producto con peso > 0**: ✅ Usa peso (2.5 → UNIDADES: 2.5)
2. **Producto con peso = 0**: ✅ Usa cantidadEnviada (peso: 0 → UNIDADES: 3)
3. **Producto sin peso**: ✅ Usa cantidadEnviada (peso: undefined → UNIDADES: 2)
4. **Pedido WooCommerce**: ✅ Usa cantidad original (UNIDADES: 5)
5. **Peso decimal**: ✅ Usa peso (1.25 → UNIDADES: 1.25)

**Resultado:** ✅ Todos los casos funcionan correctamente

## 🚀 IMPACTO DE LA CORRECCIÓN

### Antes de la Corrección
- Los productos por peso siempre exportaban `cantidadEnviada`
- No se respetaba el valor real del peso introducido en el editor
- Importaciones incorrectas en Sage50 para productos por peso

### Después de la Corrección
- ✅ Los productos con peso > 0 exportan el valor correcto del peso
- ✅ Los productos por unidad (peso = 0) exportan la cantidad enviada
- ✅ Se mantiene la lógica especial para pedidos WooCommerce
- ✅ Las importaciones a Sage50 reflejan correctamente las unidades

## 📝 CASOS DE USO

### Caso 1: Jamón por peso
- **Editor:** peso: 2.5 kg, cantidadEnviada: 1
- **Sage50:** UNIDADES: 2.5 (usa peso porque peso > 0)

### Caso 2: Chorizo por unidad
- **Editor:** peso: 0, cantidadEnviada: 3
- **Sage50:** UNIDADES: 3 (usa cantidadEnviada porque peso = 0)

### Caso 3: Pedido WooCommerce
- **Editor:** peso: 1.8, cantidad: 5, cantidadEnviada: 4
- **Sage50:** UNIDADES: 5 (siempre usa cantidad original en WooCommerce)

## 🔄 COMPATIBILIDAD

La corrección mantiene:
- ✅ Compatibilidad con pedidos WooCommerce existentes
- ✅ Compatibilidad con productos por unidad (peso = 0)
- ✅ Funcionamiento correcto para productos por peso (peso > 0)
- ✅ Consistencia entre exportaciones Excel y CSV

## 📊 ESTADO FINAL

**Estado:** ✅ COMPLETADO Y VERIFICADO  
**Lógica:** Simplificada y basada en valor de peso  
**Compatibilidad:** Mantiene funcionamiento para todos los tipos de pedido  
**Verificación:** 5/5 casos de prueba exitosos

La corrección garantiza que las importaciones a Sage50 reflejen correctamente las unidades según el contexto del producto (peso vs cantidad).
