# Standing del Proyecto: PEDIDOSWEB

**Última actualización:** 18 de julio de 2025

## Historial de Cambios Recientes

### 18 de julio de 2025: Mejora en la Diferenciación de Pedidos de Tienda Online

- Se ha añadido un campo `esTiendaOnline` al modelo de pedidos para identificar los pedidos que provienen de WooCommerce
- Se ha implementado un indicador visual en forma de badge con la etiqueta "TIENDA ONLINE" en la edición de pedidos
- Se ha añadido un filtro en la vista de pedidos en borrador para mostrar solo los pedidos de tienda online o todos los borradores
- Se ha modificado el flujo para que los pedidos de WooCommerce vayan primero a borradores y sean procesados manualmente antes de entrar al flujo normal
- Se ha creado documentación detallada sobre los cambios en:
  - `/DOCUMENTACION_DIFERENCIACION_PEDIDOS_TIENDA_ONLINE.md`
  - `/DOCUMENTACION_PEDIDOS_BORRADOR.md` (actualizado)
  - `/DOCUMENTACION_MEJORAS_GENERALES.md` (actualizado)

### Julio 2025: Mejoras en el Sistema de Cestas Navideñas

- Se implementaron mejoras para el procesamiento de cestas navideñas
- Se corrigieron problemas de CORS para el acceso desde la tienda online
- Se optimizó el proceso de actualización de clientes y cestas
- Documentación: `/DOCUMENTACION_CESTAS_NAVIDAD.md`, `/MEJORAS_CESTAS_NAVIDAD.md`

### Junio 2025: Correcciones y Mejoras Generales

- Mejoras en la sincronización con WooCommerce
- Optimización del editor de pedidos de tienda
- Actualización del sistema de autenticación
- Implementación de la gestión de devoluciones
- Documentación: `/DOCUMENTACION_CORRECCIONES_Y_MEJORAS.md`

## Estado Actual del Proyecto

El sistema actualmente incluye las siguientes funcionalidades:

1. **Gestión de Pedidos**:
   - Pedidos de cliente con flujo completo
   - Pedidos de WooCommerce con identificación clara y proceso de validación
   - Borrador de pedidos para revisión

2. **Integración con WooCommerce**:
   - Sincronización bidireccional de pedidos
   - Actualización de estados
   - Gestión de productos

3. **Gestión de Inventario**:
   - Control de stock
   - Diferenciación por proveedor
   - Registro de entradas y salidas

4. **Cestas Navideñas**:
   - Procesamiento especializado
   - Importación desde CSV
   - Configuración personalizada

5. **Exportación y Documentación**:
   - Generación de PDFs
   - Informes y listados
   - Historial de pedidos y cambios

## Próximas Mejoras Planificadas

1. Optimización de la gestión de devoluciones con mejor integración con el inventario
2. Mejora en el panel de estadísticas y reportes
3. Implementación de notificaciones automáticas por email para cambios de estado
4. Desarrollo de una aplicación móvil para seguimiento de pedidos

## Documentación Disponible

Para más información sobre el sistema y sus funcionalidades, consultar:

- `/DOCUMENTACION_MEJORAS_GENERALES.md`: Visión general de las mejoras implementadas
- `/DOCUMENTACION_SISTEMA_AUTENTICACION.md`: Sistema de autenticación y permisos
- `/DOCUMENTACION_INTEGRACION_WOOCOMMERCE.md`: Detalles de la integración con WooCommerce
- `/DOCUMENTACION_DIFERENCIACION_PEDIDOS_TIENDA_ONLINE.md`: Diferenciación de pedidos online
- `/DOCUMENTACION_PEDIDOS_BORRADOR.md`: Flujo de trabajo para pedidos en borrador
