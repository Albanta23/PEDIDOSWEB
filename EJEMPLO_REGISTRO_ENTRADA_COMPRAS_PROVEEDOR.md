# Ejemplo de integración: Registro de entrada de mercancía por compra a proveedor

## 1. Frontend (React/TypeScript)

```typescript
import { registrarEntradaStock } from '../../services/movimientosStockService';

async function handleRegistrarEntrada() {
  const entrada = {
    tiendaId: 'almacen_central',
    producto: productoSeleccionado,
    cantidad: cantidad,
    unidad: unidad,
    lote: lote,
    proveedorId: proveedorId,
    precioCoste: precioCoste,
    fechaEntrada: fechaEntrada,
    referenciaDocumento: referenciaDocumento,
    notas: notas,
    peso: peso
  };
  try {
    await registrarEntradaStock(entrada);
    alert('Entrada registrada correctamente');
  } catch (err) {
    alert('Error al registrar entrada: ' + err.message);
  }
}
```

## 2. Backend (Node.js/Express)

```js
// Endpoint para registrar entrada de stock
app.post('/api/movimientos-stock/entrada', async (req, res) => {
  try {
    const {
      tiendaId,
      producto,
      cantidad,
      unidad,
      lote,
      proveedorId,
      precioCoste,
      fechaEntrada,
      referenciaDocumento,
      notas,
      peso
    } = req.body;
    // Validación básica
    if (!tiendaId || !producto || !cantidad || !proveedorId) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    await registrarMovimientoStock({
      tiendaId,
      producto,
      cantidad,
      unidad,
      lote,
      proveedorId,
      precioCoste,
      fecha: fechaEntrada,
      referenciaDocumento,
      notasEntrada: notas,
      peso,
      tipo: 'entrada'
    });
    res.status(201).json({ ok: true, message: 'Entrada registrada correctamente.' });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});
```

## 3. Notas
- El proveedor debe ser el real, nunca el proveedor-fresco del email.
- El movimiento de stock se registra con todos los datos para trazabilidad.
- El inventario se actualiza automáticamente y la mercancía queda disponible para expedición.

---

Fecha: 13/07/2025
Autor: GitHub Copilot
