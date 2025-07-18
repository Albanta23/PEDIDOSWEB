# Actualizaciones de CORS para Backend en Render y Frontend en Vercel

## Fecha: Julio 2025

## Contexto

Después de desplegar la aplicación en Vercel (frontend) y Render (backend), se han detectado problemas de CORS (Cross-Origin Resource Sharing) que impiden la comunicación entre ambos servicios. Este documento explica el problema y proporciona instrucciones para solucionarlo.

## Problema

El frontend desplegado en el dominio `pedidosweb-x158.vercel.app` no puede comunicarse con el backend desplegado en `pedidos-backend-0e1s.onrender.com` debido a restricciones de CORS. Aunque la configuración actual del servidor incluye reglas para permitir dominios de Vercel, el dominio específico no está siendo reconocido correctamente.

## Solución

Se ha creado un script para automatizar la actualización de la configuración CORS en el servidor:

1. **Añadir explícitamente el dominio** `pedidosweb-x158.vercel.app` a la lista de orígenes permitidos
2. **Mejorar la función de validación CORS** con logs adicionales para depuración
3. **Asegurar consistencia** en la configuración de Socket.IO

## Instrucciones de Implementación

### 1. Ejecutar el Script Automático

```bash
node actualizar-cors.js
```

Este script realizará las siguientes acciones:
- Añadir el dominio `pedidosweb-x158.vercel.app` a la lista de orígenes permitidos
- Mejorar la función `corsOrigin` con logs de depuración
- Actualizar la configuración CORS de Socket.IO para usar la misma función `corsOrigin`

### 2. Verificar los Cambios

```bash
git diff gestion-pedidos-carniceria/src/server.js
```

### 3. Hacer Commit y Push de los Cambios

```bash
git add gestion-pedidos-carniceria/src/server.js
git commit -m "Actualiza configuración CORS para permitir el dominio pedidosweb-x158.vercel.app"
git push
```

### 4. Desplegar los Cambios en Render

Inicie sesión en Render y vaya al panel de control de su servicio:
1. Acceda a su dashboard en [dashboard.render.com](https://dashboard.render.com)
2. Seleccione el servicio de backend `pedidos-backend`
3. Haga clic en "Manual Deploy" > "Deploy latest commit"
4. Espere a que el despliegue se complete (esto puede tomar unos minutos)

## Verificación

Después de implementar los cambios:

1. Acceda al frontend desde `pedidosweb-x158.vercel.app`
2. Abra las herramientas de desarrollo del navegador (F12) y vaya a la pestaña "Console"
3. Verifique que no hay errores CORS
4. Compruebe que las funcionalidades que requieren comunicación con el backend funcionan correctamente:
   - Inicio de sesión
   - Carga de pedidos
   - Creación/edición de pedidos
   - Conexión en tiempo real (Socket.IO)

## Logs de Depuración

Si persisten los problemas, revise los logs en Render para ver los mensajes de depuración CORS añadidos:

1. Acceda a su dashboard en [dashboard.render.com](https://dashboard.render.com)
2. Seleccione el servicio de backend `pedidos-backend`
3. Vaya a la pestaña "Logs"
4. Busque los mensajes que comienzan con `[CORS DEBUG]`

Estos logs le ayudarán a entender cómo se está evaluando el origen de las solicitudes y por qué podrían estar siendo rechazadas.

## Solución Alternativa Manual

Si el script automático no funciona como se esperaba, puede realizar los cambios manualmente siguiendo las instrucciones detalladas en el documento `SOLUCION_CORS_VERCEL.md`.

---

Si después de seguir estas instrucciones sigue experimentando problemas, por favor contacte al equipo de desarrollo para obtener asistencia adicional.
