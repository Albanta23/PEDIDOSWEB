# 🎄 Gestión de Clientes de Cestas de Navidad

## 📋 Descripción

Esta funcionalidad permite marcar específicamente qué clientes son de cestas de navidad, comparando un archivo CSV con los clientes existentes en la base de datos y marcándolos automáticamente.

## 🚀 Características

- ✅ **Importación CSV**: Importa lista de clientes de cestas de navidad desde archivo CSV
- ✅ **Comparación Inteligente**: Busca clientes por nombre, email, teléfono y NIF/CIF
- ✅ **Marcado Automático**: Marca automáticamente los clientes encontrados
- ✅ **Estadísticas**: Muestra estadísticas de cestas vs clientes normales
- ✅ **Filtros**: Permite filtrar clientes por tipo (cestas, normales, todos)
- ✅ **Gestión Individual**: Permite marcar/desmarcar clientes individualmente
- ✅ **Limpieza Masiva**: Permite limpiar todas las marcas de una vez

## 📁 Formato del Archivo CSV

### Formato Básico
El archivo CSV debe contener las siguientes columnas (orden flexible):

```csv
nombre,email,telefono,nif,direccion
Juan Pérez García,juan.perez@email.com,666123456,12345678A,Calle Mayor 123
María González López,maria.gonzalez@email.com,677987654,87654321B,Avenida Libertad 45
```

### Separadores Soportados
- `,` (coma)
- `;` (punto y coma)
- `\t` (tabulación)

### Campos Opcionales
Todos los campos son opcionales, pero se recomienda incluir al menos:
- **nombre** (campo principal de búsqueda)
- **email** o **telefono** (campos de verificación)

### Variaciones de Nombres de Columnas
El sistema reconoce automáticamente estas variaciones:

| Campo | Variaciones Aceptadas |
|-------|----------------------|
| nombre | `nombre`, `Nombre`, `NOMBRE`, `razonSocial`, `RazonSocial`, `RAZON_SOCIAL` |
| email | `email`, `Email`, `EMAIL`, `correo`, `Correo` |
| telefono | `telefono`, `Telefono`, `TELEFONO`, `tel`, `Tel` |
| nif | `nif`, `NIF`, `cif`, `CIF`, `dni`, `DNI` |
| direccion | `direccion`, `Direccion`, `DIRECCION` |

## 🔧 Uso desde la Interfaz

### 1. Acceder a la Gestión de Clientes
- Navega a la sección "Gestión de Clientes"
- La interfaz se encuentra en: `http://localhost:3000/clientes-gestion`

### 2. Importar Cestas de Navidad
1. En la parte superior, busca el botón **🎄 Importar Cestas de Navidad**
2. Selecciona tu archivo CSV
3. El sistema procesará automáticamente y mostrará los resultados

### 3. Ver Estadísticas
- Expande el panel **🎄 Gestión de Cestas de Navidad**
- Verás estadísticas en tiempo real:
  - Número de clientes con cestas de navidad
  - Número de clientes normales
  - Porcentaje de cestas

### 4. Filtrar Clientes
Usa los botones de filtro para ver:
- **👥 Todos**: Todos los clientes
- **🎄 Cestas**: Solo clientes de cestas de navidad
- **👤 Normales**: Solo clientes normales

### 5. Gestión Individual
- En la tabla de clientes, cada fila tiene una columna **🎄 Cesta Navidad**
- Click en el botón para alternar el estado individual
- El icono cambia: 🎄 (cesta) / 👤 (normal)

## 🖥️ Uso desde Línea de Comandos

### Script Automatizado
```bash
# Desde el directorio raíz del proyecto
node procesarCestasNavidad.js ruta/al/archivo.csv
```

### Ejemplo
```bash
node procesarCestasNavidad.js ejemplo-cestas-navidad.csv
```

### Salida del Script
```
🎄 Iniciando procesamiento de cestas de navidad...
📁 Archivo: ejemplo-cestas-navidad.csv
📄 Archivo leído: 342 caracteres
👥 Clientes de cestas detectados: 5

📋 Muestra de los primeros 3 clientes:
1. Juan Pérez García | juan.perez@email.com | 666123456
2. María González López | maria.gonzalez@email.com | 677987654
3. Antonio Martín Ruiz | antonio.martin@email.com | 688555444

❓ ¿Procesar 5 clientes de cestas de navidad? (y/N) y

🚀 Enviando datos a la API...

✅ Procesamiento completado exitosamente!
📊 Resultados:
   - Clientes marcados: 3
   - No encontrados: 2
   - Errores: 0

📄 Reporte guardado en: reporte-cestas-navidad-1672531200000.json
```

## 🔍 Algoritmo de Comparación

El sistema busca coincidencias usando los siguientes criterios (OR):

1. **Nombre** (búsqueda parcial, insensible a mayúsculas)
2. **Email** (búsqueda parcial, insensible a mayúsculas)
3. **Teléfono** (búsqueda parcial)
4. **NIF/CIF/DNI** (búsqueda parcial, insensible a mayúsculas)

### Ejemplo de Coincidencia
Si el CSV contiene:
- `nombre: "Juan Pérez"`
- `email: "juan@email.com"`

El sistema encontrará clientes con:
- Nombre que contenga "juan pérez" (cualquier capitalización)
- Email que contenga "juan@email.com"

## 📊 API Endpoints

### Marcar Clientes de Cestas
```
POST /api/clientes/marcar-cestas-navidad
Content-Type: application/json

{
  "clientesCestasNavidad": [
    {
      "nombre": "Juan Pérez",
      "email": "juan@email.com",
      "telefono": "666123456",
      "nif": "12345678A"
    }
  ]
}
```

### Obtener Estadísticas
```
GET /api/clientes/estadisticas-cestas
```

Respuesta:
```json
{
  "totalClientes": 150,
  "clientesCestasNavidad": 25,
  "clientesNormales": 125,
  "porcentajeCestas": 17
}
```

### Limpiar Todas las Marcas
```
POST /api/clientes/limpiar-cestas-navidad
```

## 🗄️ Base de Datos

### Campo Agregado al Modelo Cliente
```javascript
{
  esCestaNavidad: { type: Boolean, default: false }
}
```

### Consultas Útiles (MongoDB)
```javascript
// Obtener solo clientes de cestas de navidad
db.clientes.find({ esCestaNavidad: true })

// Contar clientes de cestas
db.clientes.countDocuments({ esCestaNavidad: true })

// Desmarcar todos los clientes
db.clientes.updateMany({}, { $set: { esCestaNavidad: false } })
```

## 🔧 Configuración

### Variables de Entorno
```bash
# URL de la API (por defecto: http://localhost:10001)
API_URL=http://localhost:10001
```

### Dependencias del Script
```bash
npm install axios
```

## 🐛 Resolución de Problemas

### CSV No Se Procesa
- ✅ Verifica que el archivo tenga al menos 2 líneas (cabecera + datos)
- ✅ Asegúrate de que hay al menos una columna reconocida
- ✅ Revisa que el separador sea coma, punto y coma o tabulación

### Clientes No Se Encuentran
- ✅ Verifica que los nombres coincidan (parcialmente)
- ✅ Revisa que emails/teléfonos estén correctos
- ✅ Los clientes deben existir previamente en la base de datos

### Error de Conexión
- ✅ Verifica que el backend esté corriendo en el puerto 10001
- ✅ Confirma la URL de la API en las variables de entorno

## 📈 Casos de Uso

### Campaña de Navidad
1. Exportar lista de clientes de cestas de navidad desde sistema externo
2. Importar lista usando esta funcionalidad
3. Filtrar clientes marcados para campaña específica
4. Generar reportes o envíos dirigidos

### Segmentación de Clientes
1. Marcar clientes de cestas de navidad
2. Usar filtros para análisis diferenciado
3. Aplicar estrategias comerciales específicas
4. Seguimiento independiente de pedidos

### Limpieza Anual
1. Al final de temporada navideña
2. Usar "Limpiar Todas las Marcas"
3. Preparar para próxima temporada

---

**Desarrollado para el Sistema de Gestión de Pedidos de Carnicería** 🥩
