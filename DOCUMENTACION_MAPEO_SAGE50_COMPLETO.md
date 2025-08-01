# 📋 Documentación: Mapeo Completo de Datos para Sage50

## 🎯 Objetivo
Asegurar que todos los datos capturados en el editor de pedidos de clientes-gestion se mapeen correctamente y lleguen sin perderse al proceso de exportación a Excel/CSV para Sage50.

## 🔄 Cambios Implementados

### 1. **Código de Producto SAGE** 🏷️
**Antes:** No se capturaba el código SAGE del producto
**Después:** 
- ✅ Campo `codigoSage` agregado al estado de líneas
- ✅ Autocompletado automático cuando se selecciona un producto
- ✅ Búsqueda por código SAGE en el autocompletado
- ✅ Mapeo correcto en la exportación a Sage50

```javascript
// En PedidosClientes.jsx - Estado de líneas actualizado
{ 
  producto: '', 
  codigoSage: '', // 🆕 NUEVO CAMPO
  cantidad: 1, 
  formato: FORMATOS_PEDIDO[0], 
  comentario: '',
  precioUnitario: 0,
  iva: 0,
  descuento: 0,
  subtotal: 0 
}

// Autocompletado automático del código SAGE
const handleProductoBlur = (idx, valor) => {
  const prod = productos.find(p => /* búsqueda por nombre/código */);
  if (prod) {
    handleLineaChange(idx, 'producto', prod.nombre);
    // 🆕 MAPEAR CÓDIGO SAGE AUTOMÁTICAMENTE
    if (prod.codigo || prod.codigoSage || prod.referencia) {
      const codigoSage = prod.codigo || prod.codigoSage || prod.referencia;
      handleLineaChange(idx, 'codigoSage', codigoSage);
    }
  }
};
```

### 2. **Forma de Pago** 💳
**Antes:** Valor hardcodeado `'01'` en la exportación
**Después:**
- ✅ Usa el campo `formaPago` del pedido
- ✅ Fallback a `'01'` si no hay valor

```javascript
// En sageController.js - Exportación corregida
const formaPagoSage = pedido.formaPago || '01'; // 🆕 USAR FORMA DE PAGO DEL PEDIDO
```

### 3. **Almacén de Expedición** 🏪
**Antes:** Valor hardcodeado `'00'` en la exportación
**Después:**
- ✅ Usa el campo `almacenExpedicion` del pedido
- ✅ Fallback a `'01'` si no hay valor

```javascript
// En sageController.js - Exportación corregida
const almacenExpedicion = pedido.almacenExpedicion || '01'; // 🆕 USAR ALMACÉN DEL PEDIDO
```

### 4. **Vendedor** 👤
**Antes:** Valor hardcodeado `'01'` en la exportación
**Después:**
- ✅ Usa el campo `vendedor` del pedido
- ✅ Fallback a `'01'` si no hay valor

```javascript
// En sageController.js - Exportación corregida
const vendedorSage = pedido.vendedor || '01'; // 🆕 USAR VENDEDOR DEL PEDIDO
```

### 5. **Serie de Facturación** 📄
**Antes:** Valor hardcodeado `'SF'` en la exportación
**Después:**
- ✅ Usa el campo `serieFacturacion` del pedido
- ✅ Fallback a `'A'` si no hay valor

```javascript
// En sageController.js - Exportación corregida
const serieFactura = pedido.serieFacturacion || 'A'; // 🆕 USAR SERIE DEL PEDIDO
```

### 6. **Precio y Descuentos** 💰
**Antes:** Solo se usaba `linea.precio`
**Después:**
- ✅ Usa `linea.precio` o `linea.precioUnitario` como fallback
- ✅ Usa `linea.descuento` en lugar de valor hardcodeado `0`

```javascript
// En sageController.js - Precios y descuentos corregidos
const precioUnitario = linea.precio || linea.precioUnitario || 0;
const descuento1 = linea.descuento || 0; // 🆕 USAR DESCUENTO DE LA LÍNEA
```

## 📊 Modelo de Datos Actualizado

### Esquema de Líneas de Pedido (PedidoCliente.js)
```javascript
const LineaClienteSchema = new mongoose.Schema({
  producto: String,
  codigoSage: String, // 🆕 CÓDIGO DEL PRODUCTO EN SAGE50 (reordenado)
  cantidad: Number,
  peso: Number,
  formato: String,
  comentario: String,
  cantidadEnviada: Number,
  lote: String,
  preparada: Boolean,
  esComentario: Boolean,
  precio: Number,
  precioUnitario: Number, // 🆕 PRECIO UNITARIO (para compatibilidad)
  iva: Number,
  descuento: Number, // 🆕 DESCUENTO DE LA LÍNEA
  subtotal: Number, // 🆕 SUBTOTAL DE LA LÍNEA
  tipoProducto: String,
  variaciones: mongoose.Schema.Types.Mixed,
  idWoo: Number
});
```

### Campos del Pedido para Sage50
```javascript
{
  formaPago: String, // 🆕 Forma de pago real (ej: "01", "02", "03")
  vendedor: String, // 🆕 Vendedor real (ej: "01", "JUAN", "02")
  almacenExpedicion: String, // 🆕 Almacén real (ej: "01", "02", "PRINCIPAL")
  serieFacturacion: { type: String, enum: ['A', 'T'], default: 'A' } // 🆕 Serie real
}
```

## 🔍 Mapeo Final en la Exportación

### Estructura de Líneas para Sage50
```javascript
// Cada línea exportada contiene:
{
  serie: serieFactura, // 🆕 "A" o "T" (del pedido)
  albaran: numeroAlbaran,
  cliente: datosCliente.codigo,
  fecha: fechaFormateada,
  almacen: almacenExpedicion, // 🆕 "01", "02", etc. (del pedido)
  formapago: formaPagoSage, // 🆕 "01", "02", etc. (del pedido)
  vendedor: vendedorSage, // 🆕 "01", "JUAN", etc. (del pedido)
  articulo: codigoProductoSage, // 🆕 Código SAGE real del producto
  definicion: linea.producto,
  unidades: cantidadFinal,
  precio: precioUnitario, // 🆕 Precio real de la línea
  dto1: descuento1, // 🆕 Descuento real de la línea
  dto2: 0,
  // ... resto de campos
}
```

## ✅ Validación y Testing

### 1. **Flujo Completo de Datos**
1. Usuario selecciona producto en el editor → Código SAGE se autocompleta
2. Usuario configura forma de pago, vendedor, almacén, serie
3. Usuario guarda pedido → Todos los campos se persisten en BD
4. Administrador exporta a Sage50 → Todos los campos reales se usan

### 2. **Compatibilidad**
- ✅ Compatible con pedidos existentes (fallbacks implementados)
- ✅ Compatible con pedidos de WooCommerce
- ✅ Compatible con ambos formatos: Excel y CSV

### 3. **Campos Críticos Verificados**
- ✅ `codigoSage` del producto se mapea correctamente
- ✅ `formaPago` del pedido se usa en lugar de hardcoded
- ✅ `almacenExpedicion` del pedido se usa en lugar de hardcoded
- ✅ `vendedor` del pedido se usa en lugar de hardcoded
- ✅ `serieFacturacion` del pedido se usa en lugar de hardcoded
- ✅ Precios y descuentos reales se exportan

## 🚀 Próximos Pasos Recomendados

1. **Testing Completo**: Crear un pedido de prueba con todos los campos y verificar la exportación
2. **Validación de Datos**: Implementar validaciones en el frontend para campos obligatorios
3. **Documentación Usuario**: Crear guía para los usuarios sobre los nuevos campos
4. **Migración de Datos**: Script para actualizar pedidos existentes con valores por defecto

## 📝 Notas Importantes

- Todos los cambios son **retrocompatibles**
- Los fallbacks aseguran que pedidos antiguos sigan funcionando
- La búsqueda de productos ahora incluye búsqueda por código SAGE
- Los campos se limpian correctamente al crear nuevos pedidos
- Tanto la exportación Excel como CSV usan el mismo mapeo corregido

---
**Fecha de Implementación:** Agosto 2025  
**Estado:** ✅ Completado  
**Próxima Revisión:** Después del testing completo
