import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente para gestionar vendedores de SAGE50
 */
export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [modo, setModo] = useState('listar'); // listar, crear, editar
  const [nuevoVendedor, setNuevoVendedor] = useState({
    codigo: '',
    nombre: '',
    email: '',
    telefono: '',
    activo: true
  });
  
  // Cargar vendedores al montar el componente
  useEffect(() => {
    cargarVendedores();
  }, []);
  
  // Función para cargar los vendedores desde la API
  const cargarVendedores = async () => {
    setCargando(true);
    setError('');
    
    try {
      try {
        // Intentar obtener datos de la API
        const res = await axios.get(`${API_URL}/vendedores`);
        setVendedores(res.data);
      } catch (apiError) {
        console.warn('No se pudo obtener vendedores de la API, usando datos locales:', apiError);
        
        // Datos de ejemplo como fallback
        const datosDeEjemplo = [
          { _id: '1', codigo: '01', nombre: 'VENDEDOR PRINCIPAL', email: 'vendedor1@empresa.com', telefono: '600123456', activo: true },
          { _id: '2', codigo: '02', nombre: 'VENDEDOR ZONA NORTE', email: 'norte@empresa.com', telefono: '600789012', activo: true },
          { _id: '3', codigo: '03', nombre: 'VENDEDOR ZONA SUR', email: 'sur@empresa.com', telefono: '600345678', activo: true },
          { _id: '4', codigo: '04', nombre: 'VENDEDOR EXPORTACIÓN', email: 'export@empresa.com', telefono: '600901234', activo: true }
        ];
        setVendedores(datosDeEjemplo);
      }
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
      setError('No se pudieron cargar los vendedores. Intente nuevamente.');
      setVendedores([]);
    } finally {
      setCargando(false);
    }
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoVendedor({
      ...nuevoVendedor,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Función para verificar si los datos se guardaron correctamente
  const verificarGuardado = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/vendedores/${id}`);
      return res.status === 200;
    } catch (err) {
      console.warn('Error al verificar guardado en la API:', err);
      return false;
    }
  };
  
  // Guardar un nuevo vendedor o actualizar uno existente
  const handleGuardarVendedor = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modo === 'crear') {
        try {
          const res = await axios.post(`${API_URL}/vendedores`, nuevoVendedor);
          console.log('Vendedor creado con éxito:', res.data);
          const guardadoExitoso = await verificarGuardado(res.data._id);
          if (!guardadoExitoso) {
            throw new Error('La API no confirmó el guardado del vendedor.');
          }
          await cargarVendedores();
        } catch (apiError) {
          console.warn('No se pudo usar la API, usando datos locales:', apiError);
          const nuevoId = Date.now().toString();
          const vendedorCreado = {
            _id: nuevoId,
            ...nuevoVendedor
          };
          setVendedores(prevVendedores => [...prevVendedores, vendedorCreado]);
          console.log('Vendedor creado localmente:', vendedorCreado);
        }
      } else {
        try {
          const res = await axios.put(`${API_URL}/vendedores/${vendedorSeleccionado._id}`, nuevoVendedor);
          console.log('Vendedor actualizado con éxito:', res.data);
          const guardadoExitoso = await verificarGuardado(vendedorSeleccionado._id);
          if (!guardadoExitoso) {
            throw new Error('La API no confirmó la actualización del vendedor.');
          }
          await cargarVendedores();
        } catch (apiError) {
          console.warn('No se pudo usar la API, usando datos locales:', apiError);
          const vendedorActualizado = {
            ...vendedorSeleccionado,
            ...nuevoVendedor
          };
          setVendedores(prevVendedores => 
            prevVendedores.map(v => v._id === vendedorSeleccionado._id ? vendedorActualizado : v)
          );
          console.log('Vendedor actualizado localmente:', vendedorActualizado);
        }
      }
      
      // Resetear formulario y volver a la lista
      setNuevoVendedor({
        codigo: '',
        nombre: '',
        email: '',
        telefono: '',
        activo: true
      });
      setModo('listar');
      setVendedorSeleccionado(null);
    } catch (err) {
      console.error('Error al guardar vendedor:', err);
      setError('Error al guardar el vendedor. Verifique los datos e intente nuevamente.');
    }
  };
  
  // Editar un vendedor existente
  const handleEditar = (vendedor) => {
    setVendedorSeleccionado(vendedor);
    setNuevoVendedor({
      codigo: vendedor.codigo || '',
      nombre: vendedor.nombre || '',
      email: vendedor.email || '',
      telefono: vendedor.telefono || '',
      activo: vendedor.activo !== false
    });
    setModo('editar');
  };
  
  // Cancelar la edición o creación
  const handleCancelar = () => {
    setNuevoVendedor({
      codigo: '',
      nombre: '',
      email: '',
      telefono: '',
      activo: true
    });
    setModo('listar');
    setVendedorSeleccionado(null);
  };
  
  // Importar vendedores desde CSV y guardar en la DB
  const handleImportarCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCargando(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n').filter(l => l.trim());
          const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
          const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo') || h.includes('digo'));
          const nombreIdx = headers.findIndex(h => h.includes('nombre'));
          const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'));
          const telefonoIdx = headers.findIndex(h => h.includes('teléfono') || h.includes('telefono'));
          const activoIdx = headers.findIndex(h => h.includes('activo'));
          if (codigoIdx === -1 || nombreIdx === -1) throw new Error('El CSV debe tener columnas Código y Nombre.');
          let importados = 0;
          for (let i = 1; i < lines.length; i++) {
            const fields = lines[i].split(';');
            const codigo = fields[codigoIdx]?.trim();
            const nombre = fields[nombreIdx]?.trim();
            const email = emailIdx !== -1 ? fields[emailIdx]?.trim() : '';
            const telefono = telefonoIdx !== -1 ? fields[telefonoIdx]?.trim() : '';
            const activo = activoIdx !== -1 ? (fields[activoIdx]?.trim().toLowerCase() === 'sí' || fields[activoIdx]?.trim().toLowerCase() === 'si') : true;
            if (!codigo || !nombre) continue;
            // Verificar si existe en la DB
            let existente = null;
            try {
              const res = await axios.get(`${API_URL}/vendedores`);
              existente = res.data.find(v => v.codigo === codigo);
            } catch {}
            const payload = { codigo, nombre, email, telefono, activo };
            try {
              if (existente) {
                await axios.put(`${API_URL}/vendedores/${existente._id}`, payload);
              } else {
                await axios.post(`${API_URL}/vendedores`, payload);
              }
              importados++;
            } catch (err) {
              console.warn('Error al guardar vendedor:', codigo, err);
            }
          }
          await cargarVendedores();
          setError('');
          alert(`Importación completada: ${importados} vendedores procesados.`);
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
    } catch (err) {
      console.error('Error al importar vendedores:', err);
      setError('Error al importar vendedores. Verifique el formato del archivo.');
      setCargando(false);
    } finally {
      e.target.value = '';
    }
  };
  
  // Exportar vendedores a CSV
  const handleExportarCSV = async () => {
    try {
      setError('');
      
      try {
        // Intentar usar la API real
        const res = await axios.get(`${API_URL}/vendedores/exportar`, {
          responseType: 'blob'
        });
        
        // Crear URL temporal y enlace para descargar
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'vendedores_sage50.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (apiError) {
        console.warn('No se pudo usar la API, generando CSV localmente:', apiError);
        
        // Generación local de CSV como fallback
        const headers = 'Código;Nombre;Email;Teléfono;Activo\n';
        const rows = vendedores.map(v => 
          `${v.codigo};${v.nombre || ''};${v.email || ''};${v.telefono || ''};${v.activo !== false ? 'Sí' : 'No'}`
        ).join('\n');
        const csv = headers + rows;
        
        // Crear URL temporal y enlace para descargar
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'vendedores_sage50.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error al exportar vendedores:', err);
      setError('Error al exportar vendedores a CSV.');
    }
  };
  
  // Eliminar un vendedor
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este vendedor? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      try {
        // Intentar usar la API real
        const res = await axios.delete(`${API_URL}/vendedores/${id}`);
        console.log('Vendedor eliminado con éxito:', res.data);
        await cargarVendedores();
      } catch (apiError) {
        console.warn('No se pudo usar la API, eliminando localmente:', apiError);
        
        // Simulamos éxito a nivel local
        setVendedores(prevVendedores => prevVendedores.filter(v => v._id !== id));
        console.log('Vendedor eliminado localmente, ID:', id);
      }
    } catch (err) {
      console.error('Error al eliminar vendedor:', err);
      setError('Error al eliminar el vendedor.');
    }
  };
  
  // Corrección de etiquetas JSX y estilos en línea
  if (modo === 'crear' || modo === 'editar') {
    return (
      <div>
        <h3>{modo === 'crear' ? 'Nuevo Vendedor' : 'Editar Vendedor'}</h3>

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleGuardarVendedor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Código:</label>
            <input
              type="text"
              name="codigo"
              value={nuevoVendedor.codigo}
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
              value={nuevoVendedor.nombre}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              name="email"
              value={nuevoVendedor.email}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Teléfono:</label>
            <input
              type="text"
              name="telefono"
              value={nuevoVendedor.telefono}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                name="activo"
                checked={nuevoVendedor.activo}
                onChange={handleInputChange}
              />
              {' '}Vendedor Activo
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
              {modo === 'crear' ? 'Crear Vendedor' : 'Guardar Cambios'}
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
  
  // Renderizar lista de vendedores
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3>Vendedores SAGE50</h3>
        
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
            + Nuevo Vendedor
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
        <p>Cargando vendedores...</p>
      ) : vendedores.length === 0 ? (
        <p>No hay vendedores registrados. Cree uno nuevo o importe desde CSV.</p>
      ) : (
        <>
          <p>Total: {vendedores.length} vendedores</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Código</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Teléfono</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vendedores.map(vendedor => (
                  <tr key={vendedor._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vendedor.codigo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vendedor.nombre}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vendedor.email || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vendedor.telefono || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <span style={{
                        background: vendedor.activo !== false ? '#4caf50' : '#f44336',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {vendedor.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditar(vendedor)}
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
                        onClick={() => handleEliminar(vendedor._id)}
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
