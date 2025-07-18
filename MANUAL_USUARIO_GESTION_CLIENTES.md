# 🛠️ Manual de Usuario - Sistema de Gestión de Clientes

## 📋 Información General

**Manual para:** Usuarios finales del sistema de gestión de clientes  
**Versión:** 1.0.0  
**Fecha:** 18 de Julio de 2025  
**Funcionalidades:** Importar, borrar y gestionar clientes

---

## 🎯 Acceso al Sistema

### **URLs de Acceso:**
- **Frontend Principal:** `http://localhost:3000`
- **Gestión de Clientes:** `http://localhost:3100`
- **Backend API:** `http://localhost:10001`

### **Requisitos del Sistema:**
- ✅ Navegador web moderno (Chrome, Firefox, Safari, Edge)
- ✅ JavaScript habilitado
- ✅ Conexión a internet estable

---

## 📂 Gestión de Clientes

### **1. Acceder a la Gestión de Clientes**

1. Abrir navegador web
2. Ir a `http://localhost:3100`
3. Hacer clic en **"Gestión de Clientes"**
4. Seleccionar **"Importar Clientes"**

```
┌─────────────────────────────────────────┐
│        Gestión de Clientes              │
├─────────────────────────────────────────┤
│                                         │
│  [📂 Importar Clientes]                │
│                                         │
│  [👥 Ver Clientes]                     │
│                                         │
│  [📊 Estadísticas]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🗑️ Borrar Todos los Clientes

> ⚠️ **ADVERTENCIA:** Esta operación eliminará TODOS los clientes de la base de datos y NO se puede deshacer.

### **Cuándo usar esta función:**
- ✅ Cuando hay clientes duplicados en el sistema
- ✅ Para limpiar la base de datos antes de una importación nueva
- ✅ En casos de datos corruptos o inconsistentes
- ❌ **NUNCA** usar en producción sin backup

### **Pasos para borrar clientes:**

#### **Paso 1: Acceder al botón de borrado**
1. Ir a **Gestión de Clientes** → **Importar Clientes**
2. En la esquina superior derecha, verás el botón rojo:

```
┌─────────────────────────────────────────────────┐
│ Paso 1: Seleccionar archivo  [🗑️ Borrar Todos] │
└─────────────────────────────────────────────────┘
```

#### **Paso 2: Confirmar la operación**
3. Hacer clic en **"🗑️ Borrar Todos los Clientes"**
4. Aparecerá un modal de confirmación:

```
┌─────────────────────────────────────────┐
│                   ⚠️                    │
│                                         │
│           ¿Estás seguro?                │
│                                         │
│  Esta acción eliminará TODOS los        │
│  clientes de la base de datos.          │
│                                         │
│  Esta operación NO se puede deshacer.   │
│                                         │
│  [Cancelar]  [🗑️ Sí, Borrar Todo]      │
└─────────────────────────────────────────┘
```

#### **Paso 3: Ejecutar el borrado**
5. Leer cuidadosamente la advertencia
6. Si estás seguro, hacer clic en **"🗑️ Sí, Borrar Todo"**
7. El sistema mostrará un indicador de progreso:

```
┌─────────────────────────────────────────┐
│  [⟳ Borrando...]                       │
│                                         │
│  Por favor espera...                    │
└─────────────────────────────────────────┘
```

#### **Paso 4: Confirmación del resultado**
8. Cuando termine, verás un mensaje de confirmación:

```
┌─────────────────────────────────────────┐
│ ✅ Se han eliminado 30,195 clientes     │
│    exitosamente                         │
└─────────────────────────────────────────┘
```

---

## 📥 Importar Clientes

### **Formatos de Archivo Soportados:**
- ✅ **Excel:** `.xlsx`, `.xls`
- ✅ **CSV:** `.csv`
- ✅ **Texto:** `.txt` (separado por comas/punto y coma)
- ✅ **JSON:** `.json`

### **Campos Requeridos en el Archivo:**
| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| Nombre | ✅ Sí | Nombre del cliente |
| Email | ❌ No | Correo electrónico |
| Teléfono | ❌ No | Número de teléfono |
| Dirección | ❌ No | Dirección completa |
| NIF/CIF | ❌ No | Documento de identidad |

### **Pasos para importar:**

#### **Paso 1: Seleccionar archivo**
1. En la pantalla de importación, hacer clic en **"Seleccionar Archivo"**

```
┌─────────────────────────────────────────┐
│  🗂️ Selecciona un archivo CSV, Excel   │
│     o JSON con los datos de clientes    │
│                                         │
│       [Seleccionar Archivo]             │
│                                         │
│  Formatos soportados: .csv, .txt,      │
│  .xlsx, .xls, .json                    │
└─────────────────────────────────────────┘
```

2. Buscar y seleccionar tu archivo
3. El sistema mostrará una previsualización

#### **Paso 2: Mapear campos**
4. El sistema detectará automáticamente las columnas
5. Verificar que los campos estén correctamente mapeados:

```
┌─────────────────────────────────────────┐
│ Mapeo de Campos                         │
├─────────────────────────────────────────┤
│ Columna Excel    →    Campo Sistema     │
│ "Nombre"         →    Nombre ✅         │
│ "Email"          →    Email ✅          │
│ "Telefono"       →    Teléfono ✅       │
│ "Direccion"      →    Dirección ✅      │
└─────────────────────────────────────────┘
```

6. Ajustar mapeos si es necesario
7. Hacer clic en **"Continuar"**

#### **Paso 3: Importar datos**
8. Revisar la configuración
9. Hacer clic en **"Importar Clientes"**
10. El sistema mostrará el progreso:

```
┌─────────────────────────────────────────┐
│ 🔄 Procesando...                       │
│                                         │
│ Importando clientes: 150/500           │
│ ████████░░░░ 30%                       │
└─────────────────────────────────────────┘
```

#### **Paso 4: Revisar resultados**
11. Al finalizar, verás un resumen:

```
┌─────────────────────────────────────────┐
│ ✅ Importación Completada               │
├─────────────────────────────────────────┤
│ • Total procesados: 500                 │
│ • Clientes creados: 485                 │
│ • Clientes actualizados: 15             │
│ • Errores: 0                           │
└─────────────────────────────────────────┘
```

---

## 🔍 Verificar Estado de Clientes

### **Opción 1: Desde la Interfaz**
1. Ir a **"Ver Clientes"** en el menú principal
2. El sistema mostrará la lista actual de clientes
3. Usar filtros y búsqueda según necesidad

### **Opción 2: Página de Prueba**
1. Abrir en el navegador: `file:///workspaces/PEDIDOSWEB/test-borrar-clientes.html`
2. Hacer clic en **"📈 Verificar Número de Clientes"**
3. Ver el resultado en tiempo real

```
┌─────────────────────────────────────────┐
│ 📊 Clientes encontrados: 1,250          │
└─────────────────────────────────────────┘
```

---

## 👁️ Identificar Pedidos de Tienda Online

### **Indicadores Visuales:**
Los pedidos que provienen de la tienda online (WooCommerce) se identifican con:

```
┌─────────────────────────────────────────┐
│ Pedido #1234                            │
│ Cliente: Juan Pérez    [🛒 TIENDA ONLINE]│
│ Estado: En preparación                  │
└─────────────────────────────────────────┘
```

### **Filtros Disponibles:**
- **Todos los pedidos:** Muestra todos sin filtro
- **Solo tienda online:** Muestra únicamente pedidos web
- **Solo tienda física:** Muestra pedidos tradicionales

---

## 🚨 Resolución de Problemas

### **Problema: No se puede acceder al sistema**
**Solución:**
1. Verificar que las URLs sean correctas
2. Comprobar que el servidor esté ejecutándose
3. Intentar refrescar la página (F5)

### **Problema: Error al importar archivo**
**Posibles causas y soluciones:**

| Error | Causa | Solución |
|-------|-------|----------|
| "Archivo no válido" | Formato no soportado | Usar .xlsx, .csv, .txt o .json |
| "Campos requeridos faltantes" | Falta columna "Nombre" | Agregar columna con nombres |
| "Error de conexión" | Servidor no disponible | Contactar soporte técnico |

### **Problema: Proceso de borrado falla**
**Pasos para resolver:**
1. Refrescar la página e intentar nuevamente
2. Verificar conexión a internet
3. Contactar administrador del sistema

### **Problema: Importación muy lenta**
**Consejos para optimizar:**
- ✅ Usar archivos de menos de 10,000 registros
- ✅ Cerrar otras pestañas del navegador
- ✅ Esperar pacientemente (no cerrar la pestaña)

---

## 📞 Soporte y Contacto

### **Para Soporte Técnico:**
- **Email:** [correo del administrador]
- **Teléfono:** [número de soporte]
- **Horario:** Lunes a Viernes, 9:00 - 18:00

### **Información del Sistema:**
- **Versión:** 1.0.0
- **Última actualización:** 18 de Julio de 2025
- **Navegadores soportados:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### **Enlaces Útiles:**
- **Manual técnico:** Ver documentación técnica
- **Changelog:** Ver registro de cambios
- **FAQ:** Preguntas frecuentes

---

## 📚 Consejos y Mejores Prácticas

### **Antes de Borrar Clientes:**
- ✅ **Hacer backup** de la base de datos
- ✅ **Avisar al equipo** de la operación
- ✅ **Verificar** que es realmente necesario
- ✅ **Tener listos** los archivos de importación

### **Para Importaciones Exitosas:**
- ✅ **Revisar formato** del archivo antes de subir
- ✅ **Limpiar datos** duplicados en Excel
- ✅ **Usar nombres consistentes** en las columnas
- ✅ **Probar con archivo pequeño** primero

### **Mantenimiento Regular:**
- 📅 **Semanalmente:** Revisar clientes duplicados
- 📅 **Mensualmente:** Verificar integridad de datos
- 📅 **Trimestralmente:** Limpiar registros obsoletos

---

*Este manual debe consultarse antes de realizar operaciones importantes en el sistema.*
