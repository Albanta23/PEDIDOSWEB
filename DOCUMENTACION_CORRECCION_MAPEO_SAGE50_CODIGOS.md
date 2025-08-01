# CORRECCIÓN COMPLETA DEL MAPEO DE DATOS SAGE50

**Fecha:** Enero 2025  
**Problema resuelto:** El mapeo de almacén, vendedor, forma de pago y peso no funcionaba correctamente en las exportaciones a Sage50

## 🎯 PROBLEMAS IDENTIFICADOS Y SOLUCIONADOS

### 1. **Almacén y Vendedor - Uso de Descripciones en lugar de Códigos**
- **❌ Problema:** Los selectores enviaban `nombre` en lugar de `codigo`
- **✅ Solución:** Modificados los selectores para enviar códigos numéricos

### 2. **Forma de Pago - Mapeo Inconsistente**
- **❌ Problema:** No se manejaban correctamente los objetos de forma de pago
- **✅ Solución:** Añadida lógica para extraer el código tanto de strings como de objetos

### 3. **Peso - No se Mapeaba en la Exportación**
- **❌ Problema:** El peso capturado en expediciones no aparecía en Sage50
- **✅ Solución:** Peso incluido en el campo observaciones de cada línea

## 📁 ARCHIVOS MODIFICADOS

### 1. `/src/clientes-gestion/components/FormaPagoFormulario.jsx`

**Cambios realizados:**
- **Línea ~357:** Selector de vendedores ahora usa `v.codigo` en lugar de `v.nombre`
- **Línea ~465:** Selector de almacenes ahora usa `a.codigo` en lugar de `a.nombre`

```jsx
// ANTES (❌ INCORRECTO)
<option key={v._id} value={v.nombre}>
  {v.nombre} (Código: {v.codigo})
</option>

// DESPUÉS (✅ CORRECTO)
<option key={v._id} value={v.codigo}>
  {v.nombre} (Código: {v.codigo})
</option>
```

### 2. `/gestion-pedidos-carniceria/src/sageController.js`

**Cambios realizados:**

#### A. Mapeo de Códigos Corregido
```javascript
// ANTES (❌ INCORRECTO)
const almacenExpedicion = pedido.almacenExpedicion || '01';
const formaPagoSage = pedido.formaPago || '01';
const vendedorSage = pedido.vendedor || '01';

// DESPUÉS (✅ CORRECTO)
const almacenExpedicion = pedido.almacenExpedicion || '01';
const formaPagoSage = (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01';
const vendedorSage = pedido.vendedor || '01';
```

#### B. Inclusión del Peso en Observaciones
```javascript
// 🆕 NUEVO: Incluir peso en observaciones
const observacionesCompletas = [
  linea.comentario || '',
  linea.peso ? `Peso: ${linea.peso}kg` : ''
].filter(Boolean).join(' | ');
```

## 🔍 VERIFICACIÓN DE LA CORRECCIÓN

El script de prueba `test-mapeo-sage-codigos.js` confirma que:

- ✅ **Almacén usa código numérico:** SÍ
- ✅ **Vendedor usa código numérico:** SÍ  
- ✅ **Forma de pago usa código numérico:** SÍ
- ✅ **Peso se incluye en observaciones:** SÍ

## 📊 FLUJO DE DATOS CORREGIDO

### Entrada de Datos (Frontend)
```
Editor PedidosClientes.jsx
├── Selector Almacén → CÓDIGO (ej: "01")
├── Selector Vendedor → CÓDIGO (ej: "02") 
├── Selector Forma Pago → CÓDIGO (ej: "03")
└── Campo Peso → VALOR (ej: 2.5)
```

### Almacenamiento (Base de Datos)
```
PedidoCliente
├── almacenExpedicion: "01"
├── vendedor: "02"
├── formaPago: "03" (o objeto con codigo)
└── lineas[].peso: 2.5
```

### Exportación (Sage50)
```
Excel/CSV Export
├── almacen: "01" ← CÓDIGO NUMÉRICO ✅
├── vendedor: "02" ← CÓDIGO NUMÉRICO ✅
├── formapago: "03" ← CÓDIGO NUMÉRICO ✅
└── observaciones: "Comentario | Peso: 2.5kg" ← PESO INCLUIDO ✅
```

## 🚀 RESULTADO FINAL

**✅ CORRECCIÓN COMPLETA:** Todos los datos capturados en el editor de clientes-gestión ahora se mapean correctamente a las exportaciones de Sage50:

1. **Códigos en lugar de descripciones** - Los identificadores numéricos se envían correctamente
2. **Mapeo de forma de pago consistente** - Maneja tanto strings como objetos
3. **Peso incluido en exportación** - El peso aparece en las observaciones de cada línea
4. **Compatibilidad total con Sage50** - Formato correcto para importación

El sistema ahora garantiza que **NO se pierden datos** entre la captura en el editor y la exportación final a Sage50.
