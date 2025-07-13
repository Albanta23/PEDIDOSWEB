# Documentación técnica: Diferenciación entre lógica de envíos a proveedor y lógica de stock/entradas

## 1. Envíos a proveedor (Mailjet, historial global)
- El sistema de envío de listas de productos frescos por email utiliza un proveedor fijo (por variable de entorno, ej. `proveedor-fresco`).
- El historial global de envíos solo registra la comunicación y el PDF enviado, NO afecta el stock ni la gestión de inventario.
- El campo `proveedor` en este sistema es solo documental y no debe usarse para registrar movimientos de stock ni compras reales.

## 2. Lógica de stock y entradas por compras
- Las entradas de mercancía y productos por compras a proveedores se gestionan por los endpoints de movimientos de stock (`/api/movimientos-stock/entrada`, etc.).
- El campo `proveedorId` debe ser el proveedor real que suministra el producto, seleccionado en el formulario de entrada.
- Si el proveedor-fresco está ocupado o no corresponde, se debe seleccionar otro proveedor real para registrar la entrada correctamente.
- Los movimientos de stock afectan el inventario y la disponibilidad para expedición y ventas.

## 3. Buenas prácticas y advertencias
- **No mezclar sistemas:** El envío de listas por email y el historial global son independientes de la lógica de stock.
- **Proveedor real:** Para registrar compras y entradas de mercancía, siempre usar el proveedor real, no el proveedor-fresco del email.
- **Trazabilidad:** Mantener la trazabilidad de las compras y entradas usando los datos reales del proveedor.
- **Documentar:** Registrar en la documentación cualquier cambio de proveedor o lógica especial para evitar errores futuros.

## 4. Ejemplo de flujo correcto
1. El usuario registra una entrada de mercancía por compra a proveedor real (no proveedor-fresco).
2. El sistema crea el movimiento de stock con el proveedor seleccionado.
3. El inventario se actualiza y la mercancía queda disponible para expedición y ventas.
4. Si se envía una lista de productos frescos por email, se usa el sistema de Mailjet y el historial global, sin afectar el stock.

---

**Esta diferenciación es fundamental para evitar errores y mantener la integridad del sistema.**

---

Fecha: 13/07/2025
Autor: GitHub Copilot
