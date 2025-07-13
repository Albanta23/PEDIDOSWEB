# Integración de Proveedores en el Panel de Gestión de Entradas

## Flujo y funcionalidad
- Los proveedores se importan desde el archivo `PROVEEDORES.html` y se convierten a un array de objetos en `/src/data/proveedores.js`.
- En el panel de gestión de entradas (`GestionEntradasFabricaPanel.jsx`), se ha añadido un selector filtrable de proveedores:
  - Input de búsqueda por código, nombre o razón comercial.
  - Al escribir, se filtra la lista y se puede seleccionar un proveedor.
  - No es necesario visualizar toda la lista, solo los resultados filtrados.
  - El proveedor seleccionado se muestra destacado.
- El sistema está accesible para ambos roles tras autenticarse.
- En el formulario avanzado de registro de entradas (`FormularioEntradaFabricaAvanzado.jsx`):
  - El input de producto de cada línea tiene autocompletado con todos los productos disponibles mediante `<datalist>`.
  - Los productos se obtienen dinámicamente del catálogo y se pueden seleccionar fácilmente.

## Cambios realizados
- Creado `/src/data/proveedores.js` con los datos extraídos del HTML.
- Modificado `GestionEntradasFabricaPanel.jsx` para integrar el selector filtrable y la selección de proveedor.
- Modificado `FormularioEntradaFabricaAvanzado.jsx` para añadir autocompletado de productos en cada línea del formulario.
- Documentación de la integración y el flujo.

## Mejoras futuras
- Ya es posible importar nuevos proveedores desde varios formatos (CSV, Excel, JSON) directamente desde el panel de gestión de proveedores, facilitando la integración y actualización masiva del catálogo.
  - El sistema acepta los siguientes encabezados para cada campo, permitiendo variantes habituales:
    - Código: `codigo`, `Código`, `Codigo`, `ID`
    - Nombre: `nombre`, `Nombre`
    - Razón comercial: `razonComercial`, `Razón comercial`, `Razon comercial`
    - CIF/NIF: `nif`, `NIF`, `CIF`, `Cif`, `cif`
    - Email: `email`, `Email`
    - Teléfono: `telefono`, `Teléfono`, `Telefono`
    - Dirección: `direccion`, `Dirección`, `Direccion`
    - Código postal: `codigoPostal`, `C.postal`, `C.Postal`
    - Población: `poblacion`, `Población`, `Poblacion`
    - Provincia: `provincia`, `Provincia`
  - Si el archivo contiene estos encabezados, los datos se registran correctamente.
- Añadir validaciones en el formulario para evitar datos incompletos y asegurar la persistencia de la selección de proveedor entre sesiones o recargas.
- Mejorar el autocompletado de productos en el formulario avanzado, permitiendo búsqueda por nombre, referencia, familia o proveedor, y añadiendo filtros dinámicos para agilizar la selección.
