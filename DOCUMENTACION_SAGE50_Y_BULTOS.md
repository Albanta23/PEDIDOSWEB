# Documentación de Integración con SAGE50 y Corrección de Bultos

## Resumen

Se han realizado dos mejoras principales en la aplicación: la implementación de la exportación de datos a SAGE50 y la corrección de la funcionalidad de registro de bultos en el panel de expediciones de clientes.

## Integración con SAGE50

Se ha implementado un sistema para la exportación de pedidos a formatos compatibles con SAGE50, facilitando la importación de datos de forma offline.

### Cambios Realizados

- **Panel de Integración con SAGE50 (`src/clientes-gestion/IntegracionSage.jsx`):**
    - Se ha desarrollado una interfaz que muestra una lista de todos los pedidos.
    - Los usuarios pueden seleccionar los pedidos que desean exportar.
    - Se han añadido botones para descargar los pedidos seleccionados en formatos Excel, CSV y XML.
    - La generación de archivos CSV y XML se ha adaptado a la estructura de datos requerida por SAGE50.

### Cómo Probar

1.  Accede al apartado "Integración con SAGE50" en el panel de gestión de clientes.
2.  Selecciona uno o varios pedidos de la lista.
3.  Haz clic en los botones de exportación para descargar los archivos en los diferentes formatos.
4.  Verifica que los archivos generados (especialmente CSV y XML) tienen la estructura correcta para ser importados en SAGE50.

## Corrección del Registro de Bultos

Se ha corregido un error en el panel de expediciones de clientes que impedía que el número de bultos se guardara correctamente al cerrar un pedido.

### Cambios Realizados

- **Editor de Expediciones de Clientes (`src/expediciones-clientes/ExpedicionClienteEditor.jsx`):**
    - Se ha modificado la función `handleCerrar` para que envíe el número de bultos al backend al cerrar un pedido.
    - Ahora, el número de bultos se guarda correctamente tanto al guardar los cambios como al cerrar el pedido.

### Cómo Probar

1.  Abre un pedido en el panel de expediciones de clientes.
2.  Modifica el número de bultos.
3.  Haz clic en "Cerrar pedido".
4.  Vuelve a abrir el mismo pedido y verifica que el número de bultos se ha guardado correctamente.
