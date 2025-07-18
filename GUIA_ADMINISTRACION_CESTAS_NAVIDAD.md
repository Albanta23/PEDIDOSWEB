# 📝 Guía de Administración: Gestor de Cestas Navideñas

## 📅 Fecha: 18 de Julio, 2025

## 📋 Descripción General

El Gestor de Cestas Navideñas es un módulo integrado en el Sistema de Gestión de Pedidos que permite marcar específicamente qué clientes son de cestas navideñas, comparando un archivo CSV con los clientes existentes en la base de datos y marcándolos automáticamente.

Esta guía explica cómo utilizar las nuevas herramientas de diagnóstico y cómo verificar que el sistema funciona correctamente tras las recientes correcciones CORS.

## 🛠️ Herramientas de Diagnóstico

### 1. Página de Diagnóstico HTML (`debug-cestas-navidad.html`)

Esta página permite probar todas las funcionalidades del gestor de cestas navideñas:

- **Estadísticas**: Visualizar el total de clientes, cestas navideñas, clientes normales y porcentaje
- **Marcado de Clientes**: Probar el marcado de clientes como cestas navideñas
- **Diagnóstico de Conexión**: Verificar la comunicación con el servidor
- **Prueba de CORS**: Comprobar que no hay problemas de CORS en el endpoint de importación

#### Instrucciones de Uso:

1. Abra el archivo en un navegador web: `debug-cestas-navidad.html`
2. Verifique que la URL de la API es correcta (se detecta automáticamente en GitHub Codespaces)
3. Use los diferentes botones para probar cada funcionalidad
4. Revise los resultados y mensajes de error si aparecen

### 2. Script de Diagnóstico (`diagnostico-cestas-cors.sh`)

Este script automatiza el proceso de diagnóstico y corrección:

- Verifica la existencia de los archivos necesarios
- Ejecuta pruebas de CORS desde Node.js
- Comprueba si el servidor está en ejecución
- Guía paso a paso para aplicar correcciones

#### Instrucciones de Uso:

```bash
# Ejecutar el script
./diagnostico-cestas-cors.sh

# Seguir las instrucciones interactivas
```

### 3. Script de Prueba de Importación (`debug-cestas-import.js`)

Este script se enfoca específicamente en probar el endpoint de importación:

- Simula peticiones OPTIONS (preflight CORS)
- Prueba peticiones POST al endpoint
- Analiza cabeceras CORS y respuestas

#### Instrucciones de Uso:

```bash
# Ejecutar el script
node debug-cestas-import.js
```

## ✅ Verificación de Funcionamiento

Para verificar que el sistema funciona correctamente:

### 1. Verificación del Servidor

```bash
# Comprobar que el servidor está en ejecución
curl http://localhost:10001

# Verificar logs del servidor (en producción)
# Acceder al dashboard de Render > Logs
# Buscar mensajes [CORS DEBUG] y [CORS-CESTAS]
```

### 2. Verificación del Cliente

1. Abra `debug-cestas-navidad.html` en su navegador
2. Haga clic en "Probar Conexión" para verificar comunicación básica
3. Haga clic en "Probar CORS en /importar" para verificar específicamente este endpoint
4. Haga clic en "Cargar Estadísticas" para comprobar acceso a datos
5. Pruebe "Marcar Clientes como Cestas" para verificar operaciones de escritura

## 🔄 Procesos Comunes

### Importación de Clientes de Cestas

1. **Desde la línea de comandos**:

   ```bash
   # Procesamiento automatizado de archivo CSV
   ./procesar-cestas.sh ruta/al/archivo.csv
   ```

2. **Desde la interfaz web**:

   - Acceda a `http://localhost:3000/clientes-gestion`
   - Haga clic en "🎄 Importar Cestas de Navidad"
   - Seleccione su archivo CSV
   - Revise los resultados

### Formato del Archivo CSV

```csv
nombre,email,telefono,nif,direccion
Juan Pérez García,juan.perez@email.com,666123456,12345678A,Calle Mayor 123
María González López,maria.gonzalez@email.com,677987654,87654321B,Avenida Libertad 45
```

Separadores soportados: `,` (coma), `;` (punto y coma), `\t` (tabulación)

## 📊 Interpretación de Errores

| Mensaje | Posible Causa | Solución |
|---------|---------------|----------|
| "Error CORS en petición POST" | Origen no permitido | Verificar que el dominio está en la lista de `allowedOrigins` |
| "Error HTTP: 400" | Formato de datos incorrecto | Revisar estructura del JSON enviado |
| "Error HTTP: 500" | Error interno del servidor | Revisar logs del servidor para más detalles |
| "No se encontró coincidencia" | Cliente no existe en BD | Crear manualmente el cliente o verificar datos |

## 🔍 Solución de Problemas

### Problema: No se pueden ver estadísticas

1. Verificar conexión al servidor (botón "Probar Conexión")
2. Comprobar URL de la API
3. Revisar logs del servidor para errores

### Problema: No se pueden marcar clientes

1. Verificar formato del JSON (debe tener estructura correcta)
2. Usar botón "Probar CORS en /importar" para verificar comunicación
3. Revisar logs del servidor para errores de validación

### Problema: Error CORS persistente

1. Ejecutar `./diagnostico-cestas-cors.sh` para diagnóstico
2. Ejecutar `node actualizar-cors-cestas.js` para aplicar correcciones
3. Reiniciar el servidor
4. Desplegar cambios en producción

## 📞 Soporte

Si persisten los problemas, contacte al equipo de desarrollo proporcionando:

1. Captura de pantalla del error
2. Logs del servidor (si están disponibles)
3. Fecha y hora exacta del error
4. Pasos para reproducir el problema

---

**Documento elaborado por el Equipo de Desarrollo - Sistema de Gestión de Pedidos**
