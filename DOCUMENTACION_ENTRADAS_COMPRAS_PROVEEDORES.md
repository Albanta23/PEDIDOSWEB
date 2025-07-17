# Guía técnica: Registro de entradas de mercancía y productos por compras a proveedores

## 1. Flujo recomendado para registrar una entrada de mercancía

1. El usuario accede al formulario de entrada de stock (panel de fábrica, tienda, almacén, etc.).
2. Selecciona el proveedor real que suministra la mercancía (no usar proveedor-fresco del email).
3. Completa los datos de la entrada:
   - Producto
   - Cantidad
   - Unidad
   - Lote (si aplica)
   - Precio de coste (opcional)
   - Fecha de entrada
   - Referencia de documento (albarán, factura, etc.)
   - Notas (opcional)
   - Peso (si aplica)
4. Envía el formulario, que llama al endpoint `/api/movimientos-stock/entrada`.
5. El backend registra el movimiento de stock con todos los datos y actualiza el inventario.
6. La mercancía queda disponible para expedición y ventas en los paneles correspondientes.

## 2. Campos obligatorios y buenas prácticas
- **ProveedorId:** Debe ser el proveedor real, seleccionado del catálogo.
- **Producto, cantidad, unidad:** Siempre obligatorios.
- **Lote:** Recomendado para trazabilidad, obligatorio si el producto lo requiere.
- **Peso:** Obligatorio para productos que se gestionan por peso.
- **Referencia de documento:** Añadir siempre que se disponga de albarán o factura.
- **Notas:** Útil para observaciones especiales.

## 3. Ejemplo de uso del servicio
```js
await registrarEntradaStock({
  tiendaId: 'almacen_central',
  producto: 'Jamón Ibérico',
  cantidad: 10,
  unidad: 'kg',
  lote: 'L20250713',
  proveedorId: '400000003',
  precioCoste: 120.00,
  fechaEntrada: '2025-07-13',
  referenciaDocumento: 'ALB-20250713-001',
  notas: 'Compra especial campaña',
  peso: 10
});
```

## 4. Consideraciones para trazabilidad y expedición
- Cada entrada debe asociarse correctamente al lote y proveedor para garantizar la trazabilidad.
- El stock disponible para expedición debe reflejar la cantidad y peso registrados en la entrada.
- Los movimientos de stock deben ser consultables por producto, lote y proveedor.
- En caso de incidencias, la trazabilidad permite identificar el origen de la mercancía.

## 5. Advertencias
- No registrar entradas con proveedores genéricos o de email, siempre usar el proveedor real.
- Verificar que los datos sean correctos antes de confirmar la entrada.
- Documentar cualquier excepción o caso especial en las notas de la entrada.

---

**Esta guía debe seguirse para mantener la integridad del inventario y la trazabilidad de las compras.**

---

Fecha: 13/07/2025
Autor: GitHub Copilot
