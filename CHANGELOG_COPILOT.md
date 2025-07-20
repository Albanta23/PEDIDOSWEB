# Cambios recientes en el workspace

## 20/07/2025

- Se corrigió el arranque del frontend clientes-gestion envolviendo el árbol de la app en `<BrowserRouter>` en `src/clientes-gestion/index.jsx` para habilitar React Router y evitar errores con `useNavigate`.
- Se añadieron los imports de `React`, `createRoot`, `App` y `ProductosProvider` en `src/clientes-gestion/index.jsx` para evitar errores de referencia y asegurar el correcto arranque de la aplicación.

Estos cambios permiten que la navegación y el contexto funcionen correctamente en el frontend de gestión de clientes.

---
GitHub Copilot · 20/07/2025
