# 🛠️ Solución de Problemas de CORS en el Gestor de Cestas Navideñas

## 📋 Descripción del Problema

El frontend de `gestor-cestas-navidad` está experimentando problemas de CORS (Cross-Origin Resource Sharing) al intentar enviar peticiones al endpoint `/api/clientes/importar`. Este problema impide la actualización correcta de los clientes de cestas navideñas desde la interfaz web.

## 🔍 Diagnóstico

El análisis realizado ha identificado las siguientes causas potenciales:

1. **Orden incorrecto de rutas en server.js**: Las rutas parametrizadas (con `:id`) están capturando las peticiones antes que las rutas específicas.
2. **Middleware CORS no aplicado correctamente**: El endpoint específico `/api/clientes/importar` podría no tener el middleware `cors()` aplicado.
3. **Posibles rutas duplicadas**: Existen definiciones duplicadas para la misma ruta que entran en conflicto.

## 🚀 Solución Implementada

Se han creado dos scripts para diagnosticar y solucionar el problema:

### 1. Script de Diagnóstico

El script `diagnostico-cestas-cors.sh` realiza las siguientes acciones:

- Verifica la existencia de los archivos necesarios
- Ejecuta pruebas de CORS desde Node.js
- Comprueba si el servidor está en ejecución
- Proporciona instrucciones para aplicar correcciones
- Facilita la apertura del archivo HTML de prueba

Para ejecutarlo:

```bash
./diagnostico-cestas-cors.sh
```

### 2. Script de Corrección

El script `actualizar-cors-cestas.js` implementa las siguientes correcciones:

- Agrega una ruta específica para `/api/clientes/importar` con el middleware `cors()` aplicado
- Coloca esta ruta antes de las rutas parametrizadas para evitar capturas incorrectas
- Mejora la función `corsOrigin` con logs específicos para cestas navideñas
- Elimina posibles rutas duplicadas que puedan causar conflictos

Para ejecutarlo:

```bash
node actualizar-cors-cestas.js
```

## 🧪 Herramientas de Prueba

Para verificar que la solución funciona correctamente, se han creado dos herramientas de prueba:

### 1. Página HTML de Prueba

El archivo `debug-cestas-navidad.html` permite probar:
- Estadísticas de cestas
- Marcado de clientes como cestas
- Diagnóstico de conexión y CORS

### 2. Script de Prueba de CORS

El archivo `debug-cestas-import.js` simula peticiones al endpoint desde Node.js, permitiendo verificar:
- Peticiones OPTIONS (preflight CORS)
- Peticiones POST al endpoint
- Análisis de cabeceras CORS

## 📝 Pasos para Implementar la Solución

1. Ejecuta el script de diagnóstico para identificar el problema:
   ```bash
   ./diagnostico-cestas-cors.sh
   ```

2. Aplica la corrección CORS:
   ```bash
   node actualizar-cors-cestas.js
   ```

3. Realiza commit de los cambios:
   ```bash
   git add gestion-pedidos-carniceria/src/server.js
   git commit -m "Actualiza configuración CORS para endpoint de importación de clientes de cestas navideñas"
   git push
   ```

4. Despliega los cambios en Render

5. Verifica el funcionamiento correcto usando las herramientas de prueba

## 🔄 Verificación

Para verificar que la solución funciona correctamente:

1. Abre `debug-cestas-navidad.html` en el navegador
2. Utiliza el botón "Probar CORS en /importar"
3. Confirma que la prueba de CORS es exitosa
4. Intenta marcar clientes como cestas navideñas desde la interfaz

---

Si sigues experimentando problemas después de aplicar esta solución, revisa los logs del servidor para ver los mensajes de depuración CORS o contacta al equipo de desarrollo para asistencia adicional.
