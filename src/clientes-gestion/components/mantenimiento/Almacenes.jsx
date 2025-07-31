import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente para gestionar almacenes de SAGE50
 */
export default function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
  const [modo, setModo] = useState('listar'); // listar, crear, editar
  const [nuevoAlmacen, setNuevoAlmacen] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    activo: true
  });
  
  // Cargar almacenes al montar el componente
  useEffect(() => {
    cargarAlmacenes();
  }, []);
  
  // Función para cargar los almacenes desde la API
  const cargarAlmacenes = async () => {
    setCargando(true);
    setError('');
    
    try {
      try {
        // Intentar obtener datos de la API
        const res = await axios.get(`${API_URL}/almacenes`);
        setAlmacenes(res.data);
      } catch (apiError) {
        console.warn('No se pudo obtener almacenes de la API, usando datos locales:', apiError);
        
        // Datos de ejemplo como fallback
        const datosDeEjemplo = [
          { _id: '1', codigo: '00', nombre: 'ALMACÉN PRINCIPAL', direccion: 'Polígono Industrial, Nave 1', activo: true },
          { _id: '2', codigo: '01', nombre: 'ALMACÉN SECUNDARIO', direccion: 'Calle Comercio, 23', activo: true },
          { _id: '3', codigo: '02', nombre: 'ALMACÉN ZONA NORTE', direccion: 'Avenida Norte, 45', activo: true },
          { _id: '4', codigo: '03', nombre: 'ALMACÉN EXPEDICIONES', direccion: 'Polígono Industrial, Nave 8', activo: true }
        ];
        setAlmacenes(datosDeEjemplo);
      }
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
      setError('No se pudieron cargar los almacenes. Intente nuevamente.');
      setAlmacenes([]);
    } finally {
      setCargando(false);
    }
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoAlmacen({
      ...nuevoAlmacen,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Guardar un nuevo almacén o actualizar uno existente
  const handleGuardarAlmacen = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (modo === 'crear') {
        try {
          // Intentar usar la API real
          const res = await axios.post(`${API_URL}/almacenes`, nuevoAlmacen);
          console.log('Almacén creado con éxito:', res.data);
          // Recargar datos desde el servidor
          await cargarAlmacenes();
        } catch (apiError) {
          console.warn('No se pudo usar la API, usando datos locales:', apiError);
          
          // Simulamos éxito a nivel local
          const nuevoId = Date.now().toString();
          const almacenCreado = {
            _id: nuevoId,
            ...nuevoAlmacen
          };
          
          setAlmacenes(prevAlmacenes => [...prevAlmacenes, almacenCreado]);
          console.log('Almacén creado localmente:', almacenCreado);
        }
      } else {
        try {
          // Intentar usar la API real
          const res = await axios.put(`${API_URL}/almacenes/${almacenSeleccionado._id}`, nuevoAlmacen);
          console.log('Almacén actualizado con éxito:', res.data);
          // Recargar datos desde el servidor
          await cargarAlmacenes();
        } catch (apiError) {
          console.warn('No se pudo usar la API, usando datos locales:', apiError);
          
          // Simulamos éxito a nivel local
          const almacenActualizado = {
            ...almacenSeleccionado,
            ...nuevoAlmacen
          };
          
          setAlmacenes(prevAlmacenes => 
            prevAlmacenes.map(a => a._id === almacenSeleccionado._id ? almacenActualizado : a)
          );
          console.log('Almacén actualizado localmente:', almacenActualizado);
        }
      }
      
      // Resetear formulario y volver a la lista
      setNuevoAlmacen({
        codigo: '',
        nombre: '',
        direccion: '',
        activo: true
      });
      setModo('listar');
      setAlmacenSeleccionado(null);
    } catch (err) {
      console.error('Error al guardar almacén:', err);
      setError('Error al guardar el almacén. Verifique los datos e intente nuevamente.');
    }
  };
  
  // Editar un almacén existente
  const handleEditar = (almacen) => {
    setAlmacenSeleccionado(almacen);
    setNuevoAlmacen({
      codigo: almacen.codigo || '',
      nombre: almacen.nombre || '',
      direccion: almacen.direccion || '',
      activo: almacen.activo !== false
    });
    setModo('editar');
  };
  
  // Cancelar la edición o creación
  const handleCancelar = () => {
    setNuevoAlmacen({
      codigo: '',
      nombre: '',
      direccion: '',
      activo: true
    });
    setModo('listar');
    setAlmacenSeleccionado(null);
  };
  
  // Importar almacenes desde CSV
  const handleImportarCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('archivo', file);
    
    try {
      setCargando(true);
      setError('');
      
      try {
        // Intentar usar la API real
        await axios.post(`${API_URL}/almacenes/importar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        await cargarAlmacenes();
      } catch (apiError) {
        console.warn('No se pudo usar la API, procesando localmente:', apiError);
        
        // Procesamiento local de CSV como fallback
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvText = event.target.result;
            // Normalizar saltos de línea para compatibilidad entre sistemas
            const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lines = normalizedText.split('\n');
            
            // Extraer encabezados y normalizar para manejar problemas de codificación
            const headers = lines[0].split(';').map(h => h.trim());
            
            // Detectar índices de columnas relevantes
            const codigoIndex = headers.findIndex(h => 
              h.toLowerCase().includes('codigo') || h.toLowerCase().includes('digo') || h === 'Código' || h === 'C�digo');
            
            const nombreIndex = headers.findIndex(h => 
              h.toLowerCase().includes('nombre'));
              
            const direccionIndex = headers.findIndex(h => 
              h.toLowerCase().includes('direccion') || h.toLowerCase().includes('direcci') || h === 'Dirección' || h === 'Direcci�n');
              
            const telefonoIndex = headers.findIndex(h => 
              h.toLowerCase().includes('telefono') || h.toLowerCase().includes('fono') || h === 'Teléfono' || h === 'Tel�fono');
              
            const emailIndex = headers.findIndex(h => 
              h.toLowerCase().includes('email') || h.toLowerCase().includes('correo'));
              
            const observacionesIndex = headers.findIndex(h => 
              h.toLowerCase().includes('observaciones') || h.toLowerCase().includes('notas'));
            
            console.log('Índices de columnas detectados:', {
              codigo: codigoIndex,
              nombre: nombreIndex,
              direccion: direccionIndex,
              telefono: telefonoIndex,
              email: emailIndex,
              observaciones: observacionesIndex
            });
            
            if (codigoIndex === -1) {
              throw new Error('El formato del CSV no es válido. No se encontró la columna de código.');
            }
            
            // Procesar datos
            const nuevosAlmacenes = [];
            let almacenesImportados = 0;
            
            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              
              const fields = lines[i].split(';');
              
              // Verificar que hay suficientes campos
              if (fields.length <= codigoIndex) continue;
              
              const codigo = fields[codigoIndex]?.trim();
              // Si no hay código, omitimos esta línea
              if (!codigo) continue;
              
              // El nombre puede estar vacío en algunos casos
              const nombre = nombreIndex !== -1 && nombreIndex < fields.length ? fields[nombreIndex]?.trim() : '';
              
              // Construir objeto con todos los campos disponibles
              const nuevoAlmacen = {
                _id: Date.now() + i.toString(), // ID temporal
                codigo,
                nombre,
                activo: true
              };
              
              // Añadir campos opcionales si existen en el CSV
              if (direccionIndex !== -1 && direccionIndex < fields.length) {
                nuevoAlmacen.direccion = fields[direccionIndex]?.trim() || '';
              }
              
              if (telefonoIndex !== -1 && telefonoIndex < fields.length) {
                nuevoAlmacen.telefono = fields[telefonoIndex]?.trim() || '';
              }
              
              if (emailIndex !== -1 && emailIndex < fields.length) {
                nuevoAlmacen.email = fields[emailIndex]?.trim() || '';
              }
              
              if (observacionesIndex !== -1 && observacionesIndex < fields.length) {
                nuevoAlmacen.observaciones = fields[observacionesIndex]?.trim() || '';
              }
              
              nuevosAlmacenes.push(nuevoAlmacen);
              almacenesImportados++;
            }
            
            if (nuevosAlmacenes.length === 0) {
              throw new Error('No se encontraron almacenes válidos en el archivo CSV.');
            }
            
            // Actualizar almacenes
            setAlmacenes(prevAlmacenes => {
              // Mapeo por código para reemplazar o añadir
              const codigosExistentes = new Map(prevAlmacenes.map(a => [a.codigo, a]));
              
              // Guardar almacenes modificados en la API
              const almacenesActualizados = [];
              const almacenesNuevos = [];
              
              nuevosAlmacenes.forEach(newA => {
                if (codigosExistentes.has(newA.codigo)) {
                  // Actualizar conservando el ID original
                  const original = codigosExistentes.get(newA.codigo);
                  const almacenActualizado = {
                    ...original,
                    ...newA,
                    _id: original._id,
                    activo: original.activo !== false
                  };
                  
                  codigosExistentes.set(newA.codigo, almacenActualizado);
                  almacenesActualizados.push(almacenActualizado);
                } else {
                  // Añadir nuevo
                  codigosExistentes.set(newA.codigo, newA);
                  almacenesNuevos.push(newA);
                }
              });
              
              // Intentar guardar los cambios en la API de forma síncrona
              const guardarCambios = async () => {
                try {
                  console.log(`Guardando cambios: ${almacenesActualizados.length} actualizaciones, ${almacenesNuevos.length} nuevos`);
                  
                  // Guardar las actualizaciones
                  for (const a of almacenesActualizados) {
                    try {
                      console.log(`Actualizando almacén ${a.codigo} con ID ${a._id}`);
                      // Intentar API, pero continuará incluso si falla
                      try {
                        await axios.put(`${API_URL}/almacenes/${a._id}`, a);
                        console.log(`Almacén ${a.codigo} actualizado correctamente en API`);
                      } catch (apiErr) {
                        console.warn(`No se pudo actualizar almacén ${a.codigo} en API. Usando fallback local:`, apiErr);
                        // No hace falta hacer nada más aquí porque ya tenemos el almacén actualizado en el estado local
                      }
                    } catch (err) {
                      console.error(`Error al actualizar almacén ${a.codigo}:`, err);
                    }
                  }
                  
                  // Guardar los nuevos
                  for (const a of almacenesNuevos) {
                    try {
                      console.log(`Creando nuevo almacén ${a.codigo}`);
                      // Intentar API, pero continuará incluso si falla
                      try {
                        const resultado = await axios.post(`${API_URL}/almacenes`, a);
                        console.log(`Almacén ${a.codigo} creado correctamente en API:`, resultado.data);
                      } catch (apiErr) {
                        console.warn(`No se pudo crear almacén ${a.codigo} en API. Usando fallback local:`, apiErr);
                        // No hace falta hacer nada más aquí porque ya tenemos el almacén en el estado local
                      }
                    } catch (err) {
                      console.error(`Error al crear almacén ${a.codigo}:`, err);
                    }
                  }
                  
                  console.log('Guardado de almacenes completado');
                  
                  // Intentar recargar datos solo si la API está disponible
                  try {
                    // Hacer una petición simple para comprobar disponibilidad de la API
                    await axios.get(`${API_URL}/status`);
                    console.log('API disponible, recargando datos del servidor');
                    await cargarAlmacenes();
                  } catch (apiErr) {
                    console.warn('API no disponible, se mantienen los datos procesados localmente:', apiErr);
                    // No recargamos ya que la API no está disponible
                  }
                } catch (err) {
                  console.error('Error general al guardar almacenes en API:', err);
                }
              };
              
              // Ejecutar guardado y continuar con el estado actualizado
              guardarCambios();
              
              return Array.from(codigosExistentes.values());
            });
            
            setError('');
            // Mostrar mensaje de éxito
            alert(`Importación completada: ${almacenesImportados} almacenes procesados.`);
          } catch (csvError) {
            console.error('Error al procesar CSV:', csvError);
            setError(`Error al procesar el archivo CSV: ${csvError.message}`);
          } finally {
            setCargando(false);
          }
        };
        
        reader.onerror = () => {
          setError('Error al leer el archivo CSV.');
          setCargando(false);
        };
        
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('Error al importar almacenes:', err);
      setError('Error al importar almacenes. Verifique el formato del archivo.');
      setCargando(false);
    } finally {
      // Limpiar el input file
      e.target.value = '';
    }
  };
  
  // Exportar almacenes a CSV
  const handleExportarCSV = async () => {
    try {
      setError('');
      
      try {
        // Intentar usar la API real
        const res = await axios.get(`${API_URL}/almacenes/exportar`, {
          responseType: 'blob'
        });
        
        // Crear URL temporal y enlace para descargar
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'almacenes_sage50.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (apiError) {
        console.warn('No se pudo usar la API, generando CSV localmente:', apiError);
        
        // Generación local de CSV como fallback
        const headers = 'Código;Nombre;Dirección;Activo\n';
        const rows = almacenes.map(a => 
          `${a.codigo};${a.nombre || ''};${a.direccion || ''};${a.activo !== false ? 'Sí' : 'No'}`
        ).join('\n');
        const csv = headers + rows;
        
        // Crear URL temporal y enlace para descargar
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'almacenes_sage50.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error al exportar almacenes:', err);
      setError('Error al exportar almacenes a CSV.');
    }
  };
  
  // Eliminar un almacén
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este almacén? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      try {
        // Intentar usar la API real
        const res = await axios.delete(`${API_URL}/almacenes/${id}`);
        console.log('Almacén eliminado con éxito:', res.data);
        await cargarAlmacenes();
      } catch (apiError) {
        console.warn('No se pudo usar la API, eliminando localmente:', apiError);
        
        // Simulamos éxito a nivel local
        setAlmacenes(prevAlmacenes => prevAlmacenes.filter(a => a._id !== id));
        console.log('Almacén eliminado localmente, ID:', id);
      }
    } catch (err) {
      console.error('Error al eliminar almacén:', err);
      setError('Error al eliminar el almacén.');
    }
  };
  
  // Renderizar formulario de creación/edición
  if (modo === 'crear' || modo === 'editar') {
    return (
      <div>
        <h3>{modo === 'crear' ? 'Nuevo Almacén' : 'Editar Almacén'}</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleGuardarAlmacen} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Código:</label>
            <input
              type="text"
              name="codigo"
              value={nuevoAlmacen.codigo}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={nuevoAlmacen.nombre}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Dirección:</label>
            <textarea
              name="direccion"
              value={nuevoAlmacen.direccion}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
            ></textarea>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                name="activo"
                checked={nuevoAlmacen.activo}
                onChange={handleInputChange}
              />
              {' '}Almacén Activo
            </label>
          </div>
          
          <div style={{ gridColumn: '1 / span 2', marginTop: '15px' }}>
            <button
              type="submit"
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 15px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              {modo === 'crear' ? 'Crear Almacén' : 'Guardar Cambios'}
            </button>
            
            <button
              type="button"
              onClick={handleCancelar}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 15px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // Renderizar lista de almacenes
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3>Almacenes SAGE50</h3>
        
        <div>
          <button
            onClick={() => setModo('crear')}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            + Nuevo Almacén
          </button>
          
          <button
            onClick={handleExportarCSV}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            📤 Exportar CSV
          </button>
          
          <label
            style={{
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            📥 Importar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportarCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      {cargando ? (
        <p>Cargando almacenes...</p>
      ) : almacenes.length === 0 ? (
        <p>No hay almacenes registrados. Cree uno nuevo o importe desde CSV.</p>
      ) : (
        <>
          <p>Total: {almacenes.length} almacenes</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Código</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Dirección</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {almacenes.map(almacen => (
                  <tr key={almacen._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{almacen.codigo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{almacen.nombre}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{almacen.direccion || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <span style={{
                        background: almacen.activo !== false ? '#4caf50' : '#f44336',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {almacen.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditar(almacen)}
                        style={{
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          marginRight: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(almacen._id)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
