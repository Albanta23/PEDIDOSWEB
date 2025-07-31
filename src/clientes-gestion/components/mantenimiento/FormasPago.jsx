import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente para gestionar formas de pago de SAGE50
 */
export default function FormasPago() {
  const [formasPago, setFormasPago] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState(null);
  const [modo, setModo] = useState('listar'); // listar, crear, editar
  const [nuevaFormaPago, setNuevaFormaPago] = useState({
    codigo: '',
    nombre: '',
    activo: true
  });
  
  // Cargar formas de pago al montar el componente
  useEffect(() => {
    cargarFormasPago();
  }, []);
  
  // Función para cargar las formas de pago desde la API o archivo CSV
  const cargarFormasPago = async () => {
    setCargando(true);
    setError('');
    
    try {
      // En producción, esto llamaría a un endpoint de la API
      // Por ahora, simulamos cargando datos desde el archivo CSV
      const res = await axios.get(`${API_URL}/formas-pago`);
      setFormasPago(res.data);
    } catch (err) {
      console.error('Error al cargar formas de pago:', err);
      
      // Si falla la API, intentamos cargar el CSV local como fallback (simulado)
      try {
        // Simulamos datos de ejemplo basados en el CSV proporcionado
        const datosDeEjemplo = [
          { _id: '1', codigo: '81', nombre: '-1-RECIBO A 10 DIAS F/F', activo: true },
          { _id: '2', codigo: 'AD', nombre: 'ADELANTADO', activo: true },
          { _id: '3', codigo: 'BI', nombre: 'BIZUM', activo: true },
          { _id: '4', codigo: 'CO', nombre: 'CONTADO', activo: true },
          { _id: '5', codigo: 'CT', nombre: 'CONTRAREEMBOLSO', activo: true },
          { _id: '6', codigo: 'PA', nombre: 'PAGARE', activo: true },
          { _id: '7', codigo: 'PP', nombre: 'PAYPAL', activo: true },
          { _id: '8', codigo: '16', nombre: 'RECIBO 85 DIAS F/F', activo: true },
          { _id: '9', codigo: '15', nombre: 'RECIBO A 15 DIAS F/F', activo: true },
          { _id: '10', codigo: 'R2', nombre: 'RECIBO A 20 DIAS F/F', activo: true },
          { _id: '11', codigo: '30', nombre: 'RECIBO A 30 DIAS F/F', activo: true },
          { _id: '12', codigo: '45', nombre: 'RECIBO A 45 DIAS F/F', activo: true },
          { _id: '13', codigo: '60', nombre: 'RECIBO A 60 DIAS F/F', activo: true },
          { _id: '14', codigo: 'R7', nombre: 'RECIBO A 7 DIAS F/F', activo: true },
          { _id: '15', codigo: '90', nombre: 'RECIBO A 90 DIAS F/F', activo: true },
          { _id: '16', codigo: 'RV', nombre: 'RECIBO A LA VISTA', activo: true },
          { _id: '17', codigo: 'RF', nombre: 'RECIBO DIA FIJO', activo: true },
          { _id: '18', codigo: 'TA', nombre: 'TARJETA DE CREDITO', activo: true },
          { _id: '19', codigo: 'TR', nombre: 'TRANSFERENCIA', activo: true }
        ];
        setFormasPago(datosDeEjemplo);
      } catch (fallbackErr) {
        console.error('Error en fallback de formas de pago:', fallbackErr);
        setError('No se pudieron cargar las formas de pago. Intente nuevamente.');
        setFormasPago([]);
      }
    } finally {
      setCargando(false);
    }
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaFormaPago({
      ...nuevaFormaPago,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Guardar una nueva forma de pago o actualizar una existente
  const handleGuardarFormaPago = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (modo === 'crear') {
        // En producción, llamaría a un endpoint de la API
        // await axios.post(`${API_URL}/formas-pago`, nuevaFormaPago);
        
        // Simulamos éxito
        setFormasPago([
          ...formasPago,
          {
            _id: Date.now().toString(), // Simulamos un ID único
            ...nuevaFormaPago
          }
        ]);
      } else {
        // En producción, llamaría a un endpoint de la API
        // await axios.put(`${API_URL}/formas-pago/${formaPagoSeleccionada._id}`, nuevaFormaPago);
        
        // Simulamos éxito
        setFormasPago(formasPago.map(fp => 
          fp._id === formaPagoSeleccionada._id 
            ? { ...fp, ...nuevaFormaPago }
            : fp
        ));
      }
      
      // Resetear formulario y volver a la lista
      setNuevaFormaPago({
        codigo: '',
        nombre: '',
        activo: true
      });
      setModo('listar');
      setFormaPagoSeleccionada(null);
    } catch (err) {
      console.error('Error al guardar forma de pago:', err);
      setError('Error al guardar la forma de pago. Verifique los datos e intente nuevamente.');
    }
  };
  
  // Editar una forma de pago existente
  const handleEditar = (formaPago) => {
    setFormaPagoSeleccionada(formaPago);
    setNuevaFormaPago({
      codigo: formaPago.codigo || '',
      nombre: formaPago.nombre || '',
      activo: formaPago.activo !== false
    });
    setModo('editar');
  };
  
  // Cancelar la edición o creación
  const handleCancelar = () => {
    setNuevaFormaPago({
      codigo: '',
      nombre: '',
      activo: true
    });
    setModo('listar');
    setFormaPagoSeleccionada(null);
  };
  
  // Importar formas de pago desde CSV y guardar en la DB
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
          const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo'));
          const nombreIdx = headers.findIndex(h => h.includes('nombre'));
          if (codigoIdx === -1 || nombreIdx === -1) throw new Error('El CSV debe tener columnas Código y Nombre.');
          let importados = 0;
          for (let i = 1; i < lines.length; i++) {
            const fields = lines[i].split(';');
            const codigo = fields[codigoIdx]?.trim();
            const nombre = fields[nombreIdx]?.trim();
            if (!codigo || !nombre) continue;
            // Verificar si existe en la DB
            let existente = null;
            try {
              const res = await axios.get(`${API_URL}/formas-pago`);
              existente = res.data.find(fp => fp.codigo === codigo);
            } catch {}
            const payload = { codigo, nombre, activo: true };
            try {
              if (existente) {
                await axios.put(`${API_URL}/formas-pago/${existente._id}`, payload);
              } else {
                await axios.post(`${API_URL}/formas-pago`, payload);
              }
              importados++;
            } catch (err) {
              console.warn('Error al guardar forma de pago:', codigo, err);
            }
          }
          await cargarFormasPago();
          setError('');
          alert(`Importación completada: ${importados} formas de pago procesadas.`);
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
      console.error('Error al importar formas de pago:', err);
      setError('Error al importar formas de pago. Verifique el formato del archivo.');
      setCargando(false);
    } finally {
      e.target.value = '';
    }
  };
  
  // Exportar formas de pago a CSV
  const handleExportarCSV = async () => {
    try {
      // En producción, llamaría a un endpoint de la API
      // const res = await axios.get(`${API_URL}/formas-pago/exportar`, {
      //   responseType: 'blob'
      // });
      
      // Simulamos generación de CSV
      const headers = 'Código;Nombre\n';
      const rows = formasPago.map(fp => `${fp.codigo};${fp.nombre}`).join('\n');
      const csv = headers + rows;
      
      // Crear URL temporal y enlace para descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'formas_pago_sage50.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error al exportar formas de pago:', err);
      setError('Error al exportar formas de pago a CSV.');
    }
  };
  
  // Eliminar una forma de pago
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta forma de pago? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // En producción, llamaría a un endpoint de la API
      // await axios.delete(`${API_URL}/formas-pago/${id}`);
      
      // Simulamos éxito
      setFormasPago(formasPago.filter(fp => fp._id !== id));
    } catch (err) {
      console.error('Error al eliminar forma de pago:', err);
      setError('Error al eliminar la forma de pago.');
    }
  };
  
  // Renderizar formulario de creación/edición
  if (modo === 'crear' || modo === 'editar') {
    return (
      <div>
        <h3>{modo === 'crear' ? 'Nueva Forma de Pago' : 'Editar Forma de Pago'}</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleGuardarFormaPago} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Código:</label>
            <input
              type="text"
              name="codigo"
              value={nuevaFormaPago.codigo}
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
              value={nuevaFormaPago.nombre}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                name="activo"
                checked={nuevaFormaPago.activo}
                onChange={handleInputChange}
              />
              {' '}Forma de Pago Activa
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
              {modo === 'crear' ? 'Crear Forma de Pago' : 'Guardar Cambios'}
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
  
  // Renderizar lista de formas de pago
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3>Formas de Pago SAGE50</h3>
        
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
            + Nueva Forma de Pago
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
        <p>Cargando formas de pago...</p>
      ) : formasPago.length === 0 ? (
        <p>No hay formas de pago registradas. Cree una nueva o importe desde CSV.</p>
      ) : (
        <>
          <p>Total: {formasPago.length} formas de pago</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Código</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formasPago.map(formaPago => (
                  <tr key={formaPago._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formaPago.codigo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formaPago.nombre}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <span style={{
                        background: formaPago.activo !== false ? '#4caf50' : '#f44336',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {formaPago.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditar(formaPago)}
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
                        onClick={() => handleEliminar(formaPago._id)}
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
