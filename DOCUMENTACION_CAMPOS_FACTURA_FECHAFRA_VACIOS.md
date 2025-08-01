# CORRECCIÓN CAMPOS FACTURA Y FECHAFRA VACÍOS - SAGE50

**Fecha:** Enero 2025  
**Cambio realizado:** Campos FACTURA y FECHAFRA ahora están vacíos en la exportación

## 🎯 CAMBIO IMPLEMENTADO

### ❌ **Antes:**
```javascript
factura: numeroFactura,    // Se generaba número como "FR012345"
fechafra: fechaFormateada, // Se usaba fecha del albarán
```

### ✅ **Después:**
```javascript
factura: '',  // 🔧 Campo factura vacío (según especificación)
fechafra: '', // 🔧 Campo fecha factura vacío (según especificación)
```

## 📁 ARCHIVO MODIFICADO

**Archivo:** `/gestion-pedidos-carniceria/src/sageController.js`

**Líneas modificadas:**
- Líneas de producto: campos `factura` y `fechafra` → cadena vacía `''`
- Líneas de comentario: campos `factura` y `fechafra` → cadena vacía `''`

## 📊 FORMATO SAGE50 ACTUALIZADO

| Campo | Tipo | Valor Actual | ✅ Estado |
|-------|------|--------------|----------|
| FACTURA | Alfanumérico | `""` (vacío) | ✅ Correcto |
| FECHAFRA | Fecha | `""` (vacío) | ✅ Correcto |

## 🧪 VERIFICACIÓN

El script de prueba confirma que:
- ✅ **Todas las líneas de producto** tienen FACTURA vacía
- ✅ **Todas las líneas de comentario** tienen FACTURA vacía  
- ✅ **Todas las líneas de producto** tienen FECHAFRA vacía
- ✅ **Todas las líneas de comentario** tienen FECHAFRA vacía

## 💡 PROPÓSITO

Los campos FACTURA y FECHAFRA se dejan vacíos en el albarán de venta para que posteriormente puedan ser completados cuando se genere la factura correspondiente en Sage50, manteniendo la separación entre el proceso de albarán y facturación.

**✅ Cambio implementado correctamente.**
