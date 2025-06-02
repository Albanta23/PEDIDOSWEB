# Checklist de Validación – Exportación a Excel

Este checklist está diseñado para validar que la funcionalidad de exportación a Excel funciona correctamente en todos los paneles relevantes del sistema de control de almacén multi-tienda.

## 1. Verificación visual y de acceso
- [ ] El botón **"Exportar a Excel"** está visible y correctamente posicionado encima de cada tabla principal en los siguientes paneles:
  - Productos
  - Movimientos de stock
  - Lotes
  - Transferencias
  - Avisos
  - Fabricación
  - Stock
  - Bajas/Ajustes
  - Histórico de tienda (enviados y recibidos)
- [ ] El botón muestra feedback visual (cargando, error) si aplica.

## 2. Comportamiento y datos exportados
- [ ] Al pulsar el botón, se descarga un archivo Excel (.xlsx) sin errores.
- [ ] El archivo contiene los datos que se muestran en la tabla, respetando los filtros activos (búsqueda, tienda, fechas, etc.).
- [ ] El formato del archivo es profesional: columnas claras, datos completos, sin celdas vacías inesperadas.
- [ ] Si no hay datos, el sistema muestra un aviso o no permite exportar.

## 3. Compatibilidad y experiencia
- [ ] El archivo descargado se abre correctamente en Microsoft Excel, Google Sheets y LibreOffice.
- [ ] El nombre del archivo es descriptivo e incluye la entidad y la fecha/hora.
- [ ] Si hay muchos datos, el usuario ve un indicador de carga y la descarga no bloquea la interfaz.

## 4. Casos especiales y errores
- [ ] Si ocurre un error de red o backend, se muestra un mensaje claro al usuario.
- [ ] Si hay filtros activos, los datos exportados coinciden exactamente con lo que se ve en pantalla.
- [ ] No se exportan datos de otras tiendas o entidades si no corresponde.

## 5. Documentación
- [ ] El archivo `DOCUMENTACION_EXPORTACION_EXCEL.md` está actualizado y accesible para los usuarios.
- [ ] La documentación explica claramente el uso del botón, los filtros y las consideraciones de exportación.

---

**Validación completada por:** ____________________  
**Fecha:** ____________________
