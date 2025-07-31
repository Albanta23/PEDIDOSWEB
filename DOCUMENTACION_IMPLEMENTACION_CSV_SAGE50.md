# Implementación de procesamiento CSV para productos y vendedores SAGE50

## Descripción

Este documento describe la implementación de la funcionalidad de importación y exportación de archivos CSV para los productos y vendedores de SAGE50 en el sistema de gestión de clientes.

## Componentes actualizados

### 1. ProductosSage.jsx
Se ha mejorado el componente de gestión de productos SAGE50 con las siguientes características:

- **Importación de CSV**: 
  - Se conecta a la API real en `/productos-sage/importar`
  - Incluye una implementación de fallback para procesar los CSV directamente en el navegador cuando la API no está disponible
  - Analiza correctamente encabezados para identificar columnas de código, nombre, descripción, precio y estado
  - Convierte automáticamente tipos de datos (texto a número para precios, texto a booleano para estado)

- **Exportación de CSV**:
  - Utiliza el endpoint `/productos-sage/exportar` para obtener los datos desde el backend
  - Ya implementada correctamente en el componente original

### 2. Vendedores.jsx
Se ha implementado por completo la funcionalidad CSV para el componente de vendedores:

- **Importación de CSV**:
  - Se conecta a la API real en `/vendedores/importar`
  - Incluye procesamiento local de CSV como fallback
  - Detecta automáticamente la posición de las columnas en el archivo CSV
  - Actualiza vendedores existentes o añade nuevos según el código

- **Exportación de CSV**:
  - Implementada la exportación a través de la API en `/vendedores/exportar`
  - Implementado el procesamiento local como fallback
  - Genera un archivo CSV con formato adecuado para su posterior importación

- **Operaciones CRUD**:
  - Se han actualizado las operaciones de crear, editar y eliminar para intentar usar la API real
  - Se han implementado métodos de fallback para trabajar con datos locales cuando la API no está disponible

## Archivos adicionales

Se ha creado un script de prueba `test-csv-import-export.js` que permite:

1. Generar archivos CSV de prueba para productos y vendedores
2. Probar la importación de estos archivos a través de la API
3. Verificar el funcionamiento correcto de la importación/exportación

## Formato de CSV

### Productos
El formato esperado para los archivos CSV de productos es:
```
Código;Código SAGE;Nombre;Descripción;Precio;Activo
S001;S001;Producto SAGE 1;Descripción de prueba 1;19.99;Sí
```

### Vendedores
El formato esperado para los archivos CSV de vendedores es:
```
Código;Nombre;Email;Teléfono;Activo
V001;Vendedor SAGE 1;vendedor1@empresa.com;600111222;Sí
```

## Notas importantes

1. Ambos componentes intentan primero conectarse con la API real, y si falla, utilizan un procesamiento local como fallback.
2. Para la exportación, si la API no está disponible, se genera el CSV directamente desde los datos mostrados en la interfaz.
3. El script de prueba genera archivos CSV válidos que pueden ser utilizados para probar la importación manual a través de la interfaz.

## Próximos pasos

1. Implementar validación más robusta de los datos importados desde CSV
2. Añadir soporte para diferentes formatos de CSV (separados por comas, tabulaciones)
3. Permitir seleccionar qué columnas importar/exportar
