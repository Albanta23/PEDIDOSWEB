# Cambios recientes en el workspace

## 20/07/2025

- Se corrigió el arranque del frontend clientes-gestion envolviendo el árbol de la app en `<BrowserRouter>` en `src/clientes-gestion/index.jsx` para habilitar React Router y evitar errores con `useNavigate`.
- Se añadieron los imports de `React`, `createRoot`, `App` y `ProductosProvider` en `src/clientes-gestion/index.jsx` para evitar errores de referencia y asegurar el correcto arranque de la aplicación.
- Mejora en el formulario de entrada de fábrica (`FormularioEntradaFabricaAvanzado.jsx`):
  - Ahora el proveedor solo se considera seleccionado si el usuario lo elige explícitamente de la lista.
  - Si el usuario edita el input manualmente, se limpia la selección previa y se obliga a seleccionar de la lista.
  - Se muestra un aviso si no hay coincidencias en la búsqueda de proveedores.
  - Esto evita que se registren entradas con el proveedor anterior por error de selección o por no hacer clic en la lista.

Estos cambios permiten que la navegación y el contexto funcionen correctamente en el frontend de gestión de clientes.

---
GitHub Copilot · 20/07/2025
