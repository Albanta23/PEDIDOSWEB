# Cambios en la Importación de Clientes para SAGE 50

## 1. Plantilla de Importación Actualizada
- Se ha creado y actualizado la plantilla `PLANTILLA_IMPORTACION_CLIENTES_SAGE50.csv`.
- La columna para el código de cliente SAGE 50 ahora se llama `Codigo` (antes `codigoSage`).
- Esto asegura que el backend reconozca y mapee correctamente el código SAGE 50 al importar clientes.

## 2. Revisión del Backend
- El backend (`clientesController.js`) mapea el campo `Codigo` (o `Código` o `codigo`) a `codigoSage` en la base de datos.
- Si la columna no se llama exactamente así, el código SAGE no se importa.

## 3. Proceso de Importación
- Al importar clientes desde Excel/CSV, asegúrate de que la columna del código SAGE 50 se llame `Codigo`.
- El resto de campos recomendados en la plantilla: `nombre`, `email`, `telefono`, `direccion`.

## 4. Flujo recomendado
- Importa primero todos los clientes generales con la plantilla actualizada.
- Después, si es necesario, importa los clientes de cestas de navidad para marcar correctamente los clientes especiales.

---

**Última actualización:** 19/07/2025
