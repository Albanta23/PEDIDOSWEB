# Sistema de Autenticación - Panel de Gestión de Entradas

## 📋 Resumen
Sistema de autenticación implementado específicamente para el panel de gestión de entradas de fábrica, con diferenciación de roles entre usuarios y administradores. El sistema utiliza un flujo de autenticación modal que se activa desde el selector principal.

## � Flujo de Navegación

### **Flujo Principal:**
```
Selector Principal → Botón "Entradas" → Modal de Login → Panel de Gestión de Entradas
```

### **Flujo Detallado:**
1. **Usuario hace click en "Entradas"** del selector principal
2. **Se abre modal de login** (`LoginEntradasPanel`)
3. **Usuario selecciona rol** (Usuario/Administrador)
4. **Usuario ingresa clave** correspondiente
5. **Sistema valida credenciales**
6. **Si es correcto**: Se cierra modal y se abre panel de gestión
7. **Si es incorrecto**: Muestra error en el modal
8. **Usuario puede cerrar** modal y volver al selector principal

## �🔐 Componentes del Sistema

### 1. **LoginEntradasPanel.jsx**
Panel de login modal con estética premium SaaS que permite el acceso autenticado al sistema.

**Características principales:**
- Modal overlay con fondo oscuro semi-transparente
- Selector visual de tipo de usuario (Usuario/Administrador)
- Campo de clave con opción de mostrar/ocultar
- Validación de credenciales en tiempo real
- Animaciones y estados de carga (800ms)
- Mensajes de error elegantes
- Responsive design
- Botón de cierre (X) en la esquina superior derecha

### 2. **GestionEntradasFabricaPanel.jsx**
Panel principal que recibe el rol del usuario y adapta la interfaz según los permisos.

**Modificaciones realizadas:**
- Recibe `userRole` como prop desde App.jsx
- Muestra badges identificativos del rol
- Ambos roles tienen acceso completo al sistema
- Diferenciación visual entre Usuario (azul) y Administrador (púrpura)

### 3. **App.jsx (Actualizaciones)**
Componente principal que maneja el estado de autenticación y navegación.

**Estados añadidos:**
- `mostrarLoginEntradas`: Controla visibilidad del modal de login
- `userRoleEntradas`: Almacena el rol del usuario autenticado
- `mostrarGestionEntradasFabrica`: Controla visibilidad del panel principal

**Funciones añadidas:**
- `handleLoginEntradas(userRole)`: Maneja login exitoso
- `handleCloseLoginEntradas()`: Cierra modal de login
- `handleCloseGestionEntradas()`: Cierra panel y resetea estado

## 🔑 Credenciales de Acceso

### Usuario Regular
- **Tipo:** Usuario
- **Clave:** `usuario`
- **Permisos:** Acceso completo al sistema

### Administrador
- **Tipo:** Administrador  
- **Clave:** `administrador`
- **Permisos:** Acceso completo + badge identificativo

## 👥 Roles y Permisos

### 📖 Usuario (Acceso Completo)
- ✅ **Consultar historial** de entradas
- ✅ **Filtrar y buscar** registros
- ✅ **Refrescar datos** del historial
- ✅ **Registrar nuevas entradas**
- ✅ **Acceso al formulario** de entrada de stock
- ✅ **Gestión completa** del sistema

### 🛡️ Administrador (Acceso Completo + Badge)
- ✅ **Consultar historial** de entradas
- ✅ **Filtrar y buscar** registros
- ✅ **Refrescar datos** del historial
- ✅ **Registrar nuevas entradas**
- ✅ **Acceso al formulario** de entrada de stock
- ✅ **Gestión completa** del sistema
- ✅ **Badge identificativo** púrpura en la interfaz

## 🎨 Diseño y UX

### Estética Premium SaaS
- **Colores diferenciados por rol:**
  - Usuario: Azul (`blue-500`, `blue-50`)
  - Administrador: Púrpura (`purple-500`, `purple-50`)
- **Iconografía específica:**
  - Usuario: `User` icon
  - Administrador: `Shield` icon
- **Animaciones suaves:** Transiciones de 200ms
- **Estados de carga:** Spinner animado durante validación (800ms)
- **Feedback visual:** Mensajes de error y éxito
- **Modal overlay:** Fondo negro semi-transparente (`bg-black bg-opacity-50`)

### Responsive Design
- **Móvil:** Layout apilado con botones grandes
- **Tablet/Desktop:** Grid de 2 columnas para selector
- **Adaptativo:** Máximo ancho 28rem (`max-w-md`)

## 🔄 Implementación Técnica

### Estados en App.jsx
```javascript
const [mostrarLoginEntradas, setMostrarLoginEntradas] = useState(false);
const [userRoleEntradas, setUserRoleEntradas] = useState(null);
const [mostrarGestionEntradasFabrica, setMostrarGestionEntradasFabrica] = useState(false);
```

### Funciones de Navegación
```javascript
const handleLoginEntradas = (userRole) => {
  setUserRoleEntradas(userRole);
  setMostrarLoginEntradas(false);
  setMostrarGestionEntradasFabrica(true);
};

const handleCloseLoginEntradas = () => {
  setMostrarLoginEntradas(false);
  setUserRoleEntradas(null);
};

const handleCloseGestionEntradas = () => {
  setMostrarGestionEntradasFabrica(false);
  setUserRoleEntradas(null);
};
```

### Renderizado Condicional
```javascript
// Modal de login
if (mostrarLoginEntradas) {
  return (
    <LoginEntradasPanel 
      onLogin={handleLoginEntradas} 
      onClose={handleCloseLoginEntradas}
    />
  );
}

// Panel de gestión
if (mostrarGestionEntradasFabrica) {
  return (
    <ProductosProvider>
      <GestionEntradasFabricaPanel 
        onClose={handleCloseGestionEntradas} 
        userRole={userRoleEntradas}
      />
    </ProductosProvider>
  );
}
```

### Validación de Credenciales
```javascript
const credencialesValidas = 
  (tipoUsuario === 'usuario' && clave === 'usuario') ||
  (tipoUsuario === 'administrador' && clave === 'administrador');
```

### Permisos Basados en Roles
```javascript
const esAdministrador = userRole === 'administrador';
const puedeRegistrarEntradas = true; // Tanto usuario como administrador tienen acceso completo
```

## 📁 Estructura de Archivos

```
src/components/
├── LoginEntradasPanel.jsx          # Panel de login modal
├── GestionEntradasFabricaPanel.jsx # Panel principal (actualizado)
├── SeleccionModo.jsx              # Selector principal (botón entradas)
└── ui/
    ├── Card.jsx                    # Componente Card reutilizable
    └── Button.jsx                  # Componente Button reutilizable

src/App.jsx                         # Lógica principal de navegación
```

## 🚀 Integración con SeleccionModo

### Botón de Entradas
```javascript
// En SeleccionModo.jsx
onClick={onGestionEntradasFabrica} // Abre modal de login

// En App.jsx
onGestionEntradasFabrica={() => setMostrarLoginEntradas(true)}
```

## 🎯 Casos de Uso

### 1. **Operario de Almacén**
Usuario con acceso completo que puede registrar entradas y consultar historial para operaciones diarias.

### 2. **Administrador de Almacén**
Administrador con acceso completo y badge identificativo para supervisión y gestión.

### 3. **Supervisor de Producción**
Cualquier rol puede acceder completamente, la diferencia está en la identificación visual del administrador.

## 🔧 Características Avanzadas

### Estados de Carga
- **Tiempo de validación:** 800ms simulados para dar sensación de autenticación real
- **Spinner animado:** Durante el proceso de validación
- **Botón deshabilitado:** Mientras se validan credenciales

### Gestión de Errores
- **Mensajes contextuales:** Errores específicos por tipo de falla
- **Validación en tiempo real:** Verificación inmediata de credenciales
- **Feedback visual:** Colores y iconos para estados de error

### Navegación Fluida
- **Transiciones suaves:** Entre estados de la aplicación
- **Preservación de estado:** Manejo correcto del estado de autenticación
- **Limpieza de estado:** Reset automático al cerrar paneles

## 🛠️ Mantenimiento y Extensiones

### Posibles Mejoras Futuras
- **Persistencia de sesión** con localStorage
- **Timeout de sesión** automático
- **Logs de actividad** por usuario
- **Más roles** (supervisor, auditor, etc.)
- **Integración con backend** para autenticación real
- **Recuperación de contraseñas**
- **Biometría** para dispositivos móviles

### Consideraciones de Seguridad
- Las credenciales están hardcodeadas para simplicidad
- En producción, implementar autenticación backend
- Considerar encriptación de tokens de sesión
- Implementar rate limiting para intentos de login

---

## 📚 Referencias
- **Panel de login:** `src/components/LoginEntradasPanel.jsx`
- **Panel principal:** `src/components/GestionEntradasFabricaPanel.jsx`
- **Lógica de navegación:** `src/App.jsx`
- **Documentación CORS:** `DOCUMENTACION_CORS_BACKEND.md`

---
*GitHub Copilot · Actualizado: 12/07/2025*
