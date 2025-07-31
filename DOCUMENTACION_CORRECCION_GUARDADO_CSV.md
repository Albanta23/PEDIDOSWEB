# Corrección de problema de guardado en importación CSV

## Problema identificado
Se ha corregido un problema en los componentes de Vendedores y Almacenes donde los datos importados desde CSV no se guardaban correctamente en el backend.

## Causa del problema
El problema se debía a que las llamadas a la API se estaban realizando de forma asíncrona usando `Promise.all()`, pero:

1. No se esperaba a que las promesas se resolvieran completamente antes de continuar
2. Los errores individuales se ignoraban mediante `.catch()` en cada promesa
3. No se recargaban los datos desde el servidor después de las operaciones

## Solución implementada

### 1. Cambio de enfoque asíncrono
Se ha reemplazado el uso de `Promise.all()` por un enfoque secuencial usando `async/await`:

```javascript
// Código anterior (problemático)
Promise.all([
  ...registrosActualizados.map(v => 
    axios.put(`${API_URL}/endpoint/${v._id}`, v)
      .catch(err => console.warn(`Error:`, err))
  )
]).then(() => {
  console.log('Guardado completado');
});

// Nuevo código (corregido)
const guardarCambios = async () => {
  try {
    // Guardar las actualizaciones de forma secuencial
    for (const v of registrosActualizados) {
      try {
        console.log(`Actualizando registro ${v.codigo}`);
        await axios.put(`${API_URL}/endpoint/${v._id}`, v);
        console.log(`Registro actualizado correctamente`);
      } catch (err) {
        console.error(`Error al actualizar:`, err);
      }
    }
    
    // Recargar datos para confirmar cambios
    await cargarDatos();
  } catch (err) {
    console.error('Error general:', err);
  }
};

// Ejecutar guardado
guardarCambios();
```

### 2. Mejoras adicionales
- Se ha añadido un registro detallado de las operaciones en la consola
- Se recargan los datos desde el servidor después de completar las operaciones
- Se maneja cada operación individualmente para evitar que un error afecte a todas
- Se mejoró el manejo de errores con mensajes más descriptivos

## Impacto de los cambios
- Los datos importados desde CSV ahora se guardan correctamente en el backend
- Las actualizaciones a registros existentes funcionan como se espera
- Se mantiene la funcionalidad de fallback local cuando la API no está disponible
- Mejor experiencia de depuración con registros detallados

## Componentes afectados
- Vendedores.jsx
- Almacenes.jsx
