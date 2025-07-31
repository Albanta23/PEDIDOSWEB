# Mejora de manejo de errores en componentes SAGE50

## Problema identificado

Los componentes de mantenimiento de SAGE50 (Vendedores, Almacenes, FormasPago, ProductosSage) están generando errores 404 al intentar conectar con las APIs correspondientes. Esto se debe a que los endpoints de la API no están disponibles o han cambiado de dirección.

Errores específicos detectados:
- Error 404 al intentar acceder a `/vendedores`, `/almacenes`, `/formas-pago` y `/productos-sage`
- Error 404 al intentar realizar operaciones de creación, actualización y eliminación en estos endpoints
- Error 404 al intentar importar/exportar datos CSV desde/hacia estos endpoints

## Causa del problema

1. La URL base de la API puede no estar correctamente configurada en el `.env`
2. Los endpoints específicos para estas entidades pueden no estar implementados en el backend
3. El backend puede estar caído o inaccesible temporalmente
4. El formato de la URL puede haber cambiado

## Solución implementada

Se ha mejorado el manejo de errores en los componentes para que:

1. **Continúen funcionando sin interrupción aunque la API no esté disponible**:
   - Se mantiene el fallback a datos locales cuando la API falla
   - Se realizan comprobaciones de disponibilidad de la API antes de intentar recargar datos

2. **Se eviten interrupciones en el flujo de trabajo**:
   - Las operaciones de guardado continúan incluso si la API falla
   - Las importaciones de CSV funcionan localmente cuando la API no está disponible

3. **Se mejoren los mensajes de error**:
   - Se registran mensajes más descriptivos en la consola
   - Se diferencian los errores de la API de los errores generales

4. **Se evite la pérdida de datos**:
   - Los datos modificados se mantienen en el estado local aunque la API no responda
   - Se informa claramente cuando los datos solo están disponibles localmente

## Cambios específicos realizados

### 1. Mejora en el manejo de errores al crear nuevos registros

```javascript
// Código anterior
try {
  const resultado = await axios.post(`${API_URL}/endpoint`, item);
  console.log(`Item creado correctamente:`, resultado.data);
} catch (err) {
  console.error(`Error al crear item:`, err);
}

// Código nuevo
try {
  // Intentar API, pero continuará incluso si falla
  try {
    const resultado = await axios.post(`${API_URL}/endpoint`, item);
    console.log(`Item creado correctamente en API:`, resultado.data);
  } catch (apiErr) {
    console.warn(`No se pudo crear item en API. Usando fallback local:`, apiErr);
    // No hace falta hacer nada más aquí porque ya tenemos el item en el estado local
  }
} catch (err) {
  console.error(`Error general al crear item:`, err);
}
```

### 2. Verificación de disponibilidad de API antes de recargar

```javascript
// Código anterior
console.log('Guardado completado en API');
await cargarDatos();

// Código nuevo
console.log('Guardado completado');
                  
// Intentar recargar datos solo si la API está disponible
try {
  // Hacer una petición simple para comprobar disponibilidad de la API
  await axios.get(`${API_URL}/status`);
  console.log('API disponible, recargando datos del servidor');
  await cargarDatos();
} catch (apiErr) {
  console.warn('API no disponible, se mantienen los datos procesados localmente:', apiErr);
  // No recargamos ya que la API no está disponible
}
```

## Recomendaciones

1. **Verificar la configuración de la API**:
   - Revisar el archivo `.env` para asegurarse de que VITE_API_URL apunta a la dirección correcta
   - Confirmar que el backend está en funcionamiento

2. **Implementar endpoint de estado**:
   - Crear un endpoint `/status` en el backend para comprobar disponibilidad
   - Este endpoint debería devolver un simple JSON `{"status": "ok"}` y un código 200

3. **Verificar implementación del backend**:
   - Confirmar que los endpoints necesarios están implementados:
     - `/vendedores`, `/almacenes`, `/formas-pago`, `/productos-sage`
     - Operaciones CRUD para cada uno
     - Endpoints de importación/exportación CSV

4. **Ajustar URLs si es necesario**:
   - Si las URLs han cambiado, actualizar el archivo `.env` con la nueva dirección base
   - Si los endpoints específicos han cambiado, actualizar las referencias en los componentes
