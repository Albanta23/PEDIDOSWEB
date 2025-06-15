# Sistema de Gestión de Actualizaciones

Este sistema implementa múltiples estrategias para evitar que los usuarios utilicen versiones cacheadas de la aplicación después de actualizaciones.

## Características Implementadas

### 1. **Versionado Automático**
- Cada build genera un timestamp único (`window.APP_VERSION`)
- Los archivos se nombran con hash únicos para evitar caché
- Archivo `version.js` generado automáticamente

### 2. **Service Worker Inteligente**
- Control granular del caché de recursos
- Estrategia "Network First" para HTML y recursos críticos
- Limpieza automática de cachés antiguos
- Detección de nuevas versiones

### 3. **Notificaciones de Actualización**
- Componente `UpdateNotification` que informa al usuario
- Botón manual de actualización en la interfaz
- Detección automática de actualizaciones cada 30 segundos
- Soporte para modo offline

### 4. **Meta Tags Anti-Caché**
- Headers HTTP para prevenir caché del navegador
- Configuración en Vite para desarrollo y producción

## Uso

### Para Desarrolladores

#### Comandos de Build
```bash
# Build normal con versionado
npm run build

# Build con limpieza completa
npm run build:clean

# Solo generar nueva versión
npm run build:version
```

#### Configuración de Vite
El archivo `vite.config.js` está configurado para:
- Generar nombres únicos con hash
- Crear manifest de versiones
- Prevenir caché en desarrollo

### Para Usuarios

#### Actualización Automática
- La aplicación verifica actualizaciones cada 30 segundos
- Muestra una notificación cuando hay nueva versión
- Permite actualizar inmediatamente o postponer

#### Actualización Manual
- Botón "🔄 Actualizar" en la barra superior
- Limpia todos los cachés y recarga la aplicación

## Estructura de Archivos

```
src/
├── hooks/
│   └── useAppUpdates.js          # Hook para gestión de actualizaciones
├── components/
│   ├── UpdateNotification.jsx     # Componente de notificación
│   └── UpdateNotification.css     # Estilos de notificación
public/
├── sw.js                         # Service Worker
├── version.js                    # Archivo de versión (generado)
└── manifest.json                 # Manifest de la PWA
```

## Flujo de Actualización

1. **Detección**: El sistema verifica actualizaciones cada 30 segundos
2. **Notificación**: Se muestra una notificación al usuario
3. **Confirmación**: El usuario puede actualizar o postponer
4. **Limpieza**: Se limpian todos los cachés (SW, browser, localStorage)
5. **Recarga**: La aplicación se recarga con la nueva versión

## Configuración Avanzada

### Variables de Entorno
```bash
BUILD_TIME=1640995200000  # Timestamp personalizado para build
NODE_ENV=production       # Habilita service worker solo en producción
```

### Personalización del Service Worker
Editar `public/sw.js` para ajustar:
- Estrategias de caché
- Recursos a cachear
- Tiempo de verificación de actualizaciones

### Personalización de Notificaciones
Editar `src/components/UpdateNotification.jsx` para:
- Cambiar el diseño de las notificaciones
- Modificar el comportamiento de actualización
- Añadir lógica personalizada

## Resolución de Problemas

### La aplicación no se actualiza
1. Verificar que el service worker esté registrado
2. Revisar la consola para errores
3. Limpiar manualmente el caché del navegador
4. Usar el botón de actualización manual

### Service Worker no funciona
1. Verificar que esté en modo producción
2. Comprobar que `sw.js` esté accesible
3. Revisar permisos HTTPS (requerido para SW)

### Notificaciones no aparecen
1. Verificar que `UpdateNotification` esté importado
2. Comprobar que el hook `useAppUpdates` funcione
3. Revisar la lógica de detección de versiones

## Monitoreo

### Logs de Consola
- `Service Worker registrado`: SW instalado correctamente
- `App Version: [timestamp]`: Versión actual cargada
- `Nueva versión detectada`: Actualización disponible
- `Limpiando caché`: Proceso de actualización iniciado

### Herramientas de Desarrollo
- **Application > Service Workers**: Estado del SW
- **Application > Storage**: Cachés activos
- **Network**: Verificar estrategias de caché
- **Console**: Logs de actualización

## Mejores Prácticas

1. **Siempre hacer build antes de deploy**
2. **Verificar funcionamiento en producción**
3. **Monitorear logs de actualización**
4. **Educar a usuarios sobre las notificaciones**
5. **Mantener el service worker actualizado**
