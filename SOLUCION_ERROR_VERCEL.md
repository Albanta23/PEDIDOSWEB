# Solución al Error de Compilación en Vercel

## Fecha: 17 de Julio de 2025

### Problema Identificado
Durante el despliegue en Vercel, se presentó un error de compilación relacionado con un URI malformado en el archivo `index.html`. El error específico era:

```
[vite:build-html] URI malformed
file: /vercel/path0/index.html
error during build:
URIError: URI malformed
    at decodeURI (<anonymous>)
```

Además, el servidor de desarrollo local también mostraba el mismo error:

```
[vite] Internal server error: URI malformed
      at decodeURI (<anonymous>)
```

### Causa del Problema
Se identificaron dos problemas principales:

1. El archivo `index.html` contenía referencias incompatibles con Vite:
   - Referencias a `%PUBLIC_URL%` que son específicas de Create React App, no de Vite
   - Múltiples referencias duplicadas al favicon que causaban conflictos
   - Ruta incorrecta al archivo `env.js` (se usaba `/public/env.js` en lugar de `/env.js`)

2. El componente `PedidosClientes.jsx` contenía un error de sintaxis JavaScript:
   - Propiedades duplicadas `color` en el mismo objeto de estilo CSS en línea
   - Esto causaba una advertencia en el compilador: `Duplicate key "color" in object literal`

### Solución Implementada
Se realizaron las siguientes correcciones:

1. En el archivo `index.html`:
   - Eliminación de las referencias a `%PUBLIC_URL%`
   - Consolidación de las referencias al favicon en una sola línea correcta
   - Corrección de la ruta al archivo `env.js` de `/public/env.js` a `/env.js`

2. En el archivo `PedidosClientes.jsx`:
   - Eliminación de la propiedad duplicada `color: '#0f172a'` en el objeto de estilo
   - Se mantuvo solo la propiedad `color: '#fff'` que era la intención del diseño

### Cambios Realizados
En el archivo `index.html`:
```html
<!-- Antes -->
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
<link rel="icon" href="/favicon.ico" />
<link rel="icon" href="favicon.ico" />
<script src="%PUBLIC_URL%/env.js"></script>

<!-- Después -->
<link rel="icon" href="/favicon.ico" />
<script src="/env.js"></script>
```

En el archivo `PedidosClientes.jsx`:
```jsx
<!-- Antes -->
<span style={{ 
  color: '#0f172a', 
  fontWeight: '700', 
  fontSize: '17px',
  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  padding: '8px 16px',
  borderRadius: '8px',
  color: '#fff'
}}>

<!-- Después -->
<span style={{ 
  fontWeight: '700', 
  fontSize: '17px',
  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  padding: '8px 16px',
  borderRadius: '8px',
  color: '#fff'
}}>
```

### Impacto de los Cambios
- El build de Vite ahora puede completarse sin errores
- La aplicación se despliega correctamente en Vercel
- Se mantiene la funcionalidad de las variables de entorno a través de `env.js`
- Se corrige la visualización de estilos en el componente de pedidos de clientes

### Notas Adicionales
1. Esta corrección ilustra una diferencia importante entre la configuración de Create React App y Vite. En Vite, las referencias a archivos estáticos deben usar rutas absolutas desde la raíz (comenzando con `/`) o rutas relativas, pero no la variable `%PUBLIC_URL%`.

2. Es importante recordar que en JavaScript, los objetos no pueden tener propiedades duplicadas. En el caso de estilos en línea en React, cada propiedad CSS debe aparecer una sola vez en el objeto de estilo.
