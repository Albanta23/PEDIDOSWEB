# Documentación: Adaptación Editor de Pedidos - Direcciones de Envío y Forma de Pago

## Resumen de la Implementación

Se ha completado la adaptación del editor de pedidos clientes-gestion para mostrar y gestionar:
- **Direcciones de envío alternativas** (diferentes a la facturación)
- **Forma de pago** (con códigos para SAGE50)
- **Información de vendedor**

Esta implementación complementa el sistema backend ya desarrollado para la importación desde WooCommerce.

## Archivos Creados/Modificados

### 1. Extensión de Utilidades - `src/clientes-gestion/utils/formatDireccion.js`

**Nuevas funciones añadidas:**
- `obtenerDireccionEnvio(pedido)`: Determina si usar dirección de envío alternativa o facturación
- `formatearFormaPago(formaPago)`: Formatea información de forma de pago para visualización
- `obtenerCodigoFormaPago(formaPago)`: Obtiene código SAGE50 para forma de pago

### 2. Componente de Dirección de Envío - `src/clientes-gestion/components/DireccionEnvioInfo.jsx`

**Características:**
- Detección automática de direcciones de envío alternativas
- Indicador visual cuando la dirección de envío es diferente a la de facturación
- Formato completo con nombre, empresa, dirección, teléfono
- Alerta destacada para envíos alternativos

**Props:**
- `pedido`: Objeto pedido con datos de dirección
- `showTitle`: Mostrar título del componente (default: true)
- `compact`: Modo compacto para espacios reducidos (default: false)

### 3. Componente de Forma de Pago - `src/clientes-gestion/components/FormaPagoInfo.jsx`

**Características:**
- Visualización de forma de pago con formato mejorado
- Código SAGE50 para integración
- Información de vendedor
- Soporte para formatos objeto y string

**Props:**
- `pedido`: Objeto pedido con datos de forma de pago
- `showTitle`: Mostrar título del componente (default: true)
- `showSageCode`: Mostrar código SAGE50 (default: true)

### 4. Estilos CSS - `src/clientes-gestion/components/DireccionEnvio.css`

**Características:**
- Estilos consistentes con el diseño existente
- Gradientes y badges para diferenciar tipos de información
- Responsive y accesible
- Utilidades tipo Bootstrap incluidas

### 5. Editor Principal Modificado - `src/clientes-gestion/PedidoClienteDetalle.jsx`

**Cambios realizados:**
- Imports de nuevos componentes
- Integración de `DireccionEnvioInfo` después de información básica
- Integración condicional de `FormaPagoInfo` cuando hay datos disponibles
- Mantiene estructura y diseño existente

## Estructura de Datos Esperada

### Dirección de Envío Alternativa (datosEnvioWoo)
```javascript
{
  esEnvioAlternativo: true,
  nombre: "María González López",
  empresa: "Oficinas Central SA",
  direccion1: "Avenida de la Paz 456",
  direccion2: "Oficina 301",
  codigoPostal: "28080",
  ciudad: "Madrid",
  provincia: "Madrid",
  telefono: "917654321",
  pais: "ES"
}
```

### Forma de Pago (formaPago)
```javascript
// Formato objeto (preferido)
{
  titulo: "Transferencia Bancaria",
  codigo: "01",
  metodo: "bacs"
}

// Formato string (compatible)
"Contra reembolso"
```

### Vendedor (vendedor)
```javascript
"Vendedor Online"
```

## Lógica de Visualización

### Dirección de Envío
1. **Si existe `datosEnvioWoo.esEnvioAlternativo = true`:**
   - Muestra dirección de envío alternativa
   - Badge amarillo "📦 Envío Alternativo"
   - Alerta de advertencia sobre diferencia con facturación

2. **Si NO hay envío alternativo:**
   - Muestra dirección de facturación normal
   - Badge azul "📦 Envío a Facturación"
   - Sin alertas adicionales

### Forma de Pago
1. **Si hay datos de forma de pago:**
   - Muestra forma de pago formateada
   - Código SAGE50 entre paréntesis
   - Información del vendedor si está disponible

2. **Si NO hay datos:**
   - El componente no se renderiza (condicional en JSX)

## Códigos SAGE50 Implementados

| Forma de Pago | Código SAGE50 |
|---------------|---------------|
| Con código específico | Usa el código del objeto |
| Sin código específico | '99' (Otro) |
| Valor nulo/undefined | '99' (Otro) |

## Casos de Uso Principales

### 1. Pedido WooCommerce con Envío Alternativo
```javascript
// El editor mostrará:
// - Información básica del pedido
// - Dirección de envío alternativa destacada
// - Forma de pago con código SAGE50
// - Vendedor de la tienda online
```

### 2. Pedido Normal (Sin Envío Alternativo)
```javascript
// El editor mostrará:
// - Información básica del pedido
// - Dirección de facturación normal
// - Forma de pago si está disponible
```

### 3. Pedido Legacy (Sin Datos WooCommerce)
```javascript
// El editor mostrará:
// - Información básica del pedido
// - Dirección de facturación normal
// - Sin secciones adicionales
```

## Integración con SAGE50

Los nuevos campos proporcionan la información necesaria para la exportación a SAGE50:

- **Código Forma de Pago**: `obtenerCodigoFormaPago(formaPago)`
- **Vendedor**: `pedido.vendedor || pedido.datosWooCommerce?.vendedor`
- **Dirección de Envío**: Para etiquetas y albaranes

## Pruebas Realizadas

✅ **Función obtenerDireccionEnvio**: Detecta correctamente envíos alternativos
✅ **Función formatearFormaPago**: Maneja objetos y strings  
✅ **Función obtenerCodigoFormaPago**: Proporciona códigos para SAGE50
✅ **Componentes React**: Renderizado correcto con datos de prueba
✅ **Integración Editor**: Modificaciones funcionan sin romper funcionalidad existente

## Beneficios de la Implementación

1. **Visibilidad Completa**: Los operarios ven toda la información relevante del pedido
2. **Prevención de Errores**: Alertas claras cuando hay direcciones de envío diferentes
3. **Integración SAGE50**: Códigos y datos listos para exportación
4. **Retrocompatibilidad**: Funciona con pedidos existentes sin datos WooCommerce
5. **Mantenibilidad**: Componentes modulares y reutilizables

## Próximos Pasos Recomendados

1. **Prueba en Navegador**: Verificar visualización con datos reales
2. **Validación UX**: Comprobar usabilidad con operarios
3. **Test SAGE50**: Validar exportación con nuevos campos
4. **Optimización**: Ajustes de rendimiento si es necesario

## Compatibilidad

- ✅ **Pedidos WooCommerce**: Soporte completo para direcciones alternativas y forma de pago
- ✅ **Pedidos Legacy**: Funciona sin datos adicionales
- ✅ **React**: Compatible con versión actual del proyecto
- ✅ **CSS**: Estilos integrados sin conflictos

---

*Implementación completada el 2025-01-07 - Sistema completo end-to-end WooCommerce → Editor → SAGE50*
