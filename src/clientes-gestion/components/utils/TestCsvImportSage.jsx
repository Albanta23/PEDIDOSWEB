import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente para procesar y validar la estructura de un CSV para Vendedores o Almacenes
 * y simular la importación con registro detallado
 */
export default function TestCsvImportSage() {
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [registrosActuales, setRegistrosActuales] = useState([]);
  const [tipoEntidad, setTipoEntidad] = useState('vendedores');
  const [logOperaciones, setLogOperaciones] = useState([]);
  const [stats, setStats] = useState({
    totalRegistros: 0,
    nuevos: 0,
    actualizados: 0,
    sinCambios: 0,
    errores: 0
  });
  
  // Cargar registros actuales (simulados o reales)
  useEffect(() => {
    const cargarRegistrosActuales = async () => {
      try {
        setCargando(true);
        let registros = [];
        
        // Intentar cargar desde la API
        try {
          const endpoint = tipoEntidad === 'vendedores' ? '/vendedores' : '/almacenes';
          const response = await axios.get(`${API_URL}${endpoint}`);
          registros = response.data;
          agregarLog('info', `Registros cargados desde API: ${registros.length}`);
        } catch (apiError) {
          console.warn(`No se pudieron cargar los registros desde la API: ${apiError.message}`);
          agregarLog('warning', `No se pudieron cargar los registros desde la API: ${apiError.message}`);
          
          // Usar datos de muestra si la API falla
          if (tipoEntidad === 'vendedores') {
            registros = [
              { id: 1, codigo: 'V001', nombre: 'Juan Pérez', telefono: '666111222', email: 'juan@example.com' },
              { id: 2, codigo: 'V002', nombre: 'María Gómez', telefono: '666333444', email: 'maria@example.com' },
              { id: 3, codigo: 'V003', nombre: 'Pedro Sánchez', telefono: '666555666', email: 'pedro@example.com' },
            ];
          } else {
            registros = [
              { id: 1, codigo: 'A001', nombre: 'Almacén Central', direccion: 'Calle Principal 123' },
              { id: 2, codigo: 'A002', nombre: 'Almacén Norte', direccion: 'Avenida Norte 456' },
              { id: 3, codigo: 'A003', nombre: 'Almacén Sur', direccion: 'Plaza Sur 789' },
            ];
          }
          agregarLog('info', `Usando ${registros.length} registros de muestra`);
        }
        
        setRegistrosActuales(registros);
      } catch (error) {
        console.error('Error al cargar registros:', error);
        agregarLog('error', `Error al cargar registros: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };
    
    cargarRegistrosActuales();
  }, [tipoEntidad]);
  
  const agregarLog = (tipo, mensaje) => {
    setLogOperaciones(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        tipo, 
        mensaje, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  const procesarCSV = async (file) => {
    if (!file) return;
    
    setCargando(true);
    setError('');
    setResultado('');
    setStats({
      totalRegistros: 0,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: 0
    });
    
    agregarLog('info', `Iniciando procesamiento de archivo: ${file.name}`);
    
    try {
      // Leer el archivo
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          agregarLog('info', 'Archivo leído correctamente');
          
          // Normalizar saltos de línea para compatibilidad entre sistemas
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n');
          
          // Extraer encabezados
          const headers = lines[0].split(';').map(h => h.trim());
          agregarLog('info', `Encabezados detectados: ${headers.join(', ')}`);
          
          // Detectar índices de columnas relevantes
          const codigoIndex = headers.findIndex(h => 
            h.toLowerCase().includes('codigo') || h.toLowerCase().includes('digo') || h === 'Código' || h === 'C�digo');
          
          const nombreIndex = headers.findIndex(h => 
            h.toLowerCase().includes('nombre'));
          
          // Índices específicos según tipo de entidad
          let indicesEspecificos = {};
          
          if (tipoEntidad === 'vendedores') {
            indicesEspecificos = {
              telefonoIndex: headers.findIndex(h => 
                h.toLowerCase().includes('telefono') || h.toLowerCase().includes('fono') || h === 'Teléfono' || h === 'Tel�fono'),
              emailIndex: headers.findIndex(h => 
                h.toLowerCase().includes('email') || h.toLowerCase().includes('correo'))
            };
          } else {
            indicesEspecificos = {
              direccionIndex: headers.findIndex(h => 
                h.toLowerCase().includes('direcci') || h.toLowerCase().includes('dirección') || h === 'Direcci�n')
            };
          }
          
          // Verificar columnas mínimas
          if (codigoIndex === -1 || nombreIndex === -1) {
            const mensaje = `No se encontraron las columnas obligatorias (código y nombre) en el CSV.`;
            setError(mensaje);
            agregarLog('error', mensaje);
            setCargando(false);
            return;
          }
          
          // Procesar líneas
          const registrosCSV = [];
          let nuevos = 0;
          let actualizados = 0;
          let sinCambios = 0;
          let errores = 0;
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const fields = lines[i].split(';');
            
            // Validar campos mínimos
            if (fields.length <= Math.max(codigoIndex, nombreIndex)) {
              agregarLog('warning', `Línea ${i}: insuficientes campos, se ignora`);
              errores++;
              continue;
            }
            
            const codigo = fields[codigoIndex]?.trim();
            // Si no hay código, omitimos esta línea
            if (!codigo) {
              agregarLog('warning', `Línea ${i}: sin código, se ignora`);
              errores++;
              continue;
            }
            
            const nombre = nombreIndex !== -1 && nombreIndex < fields.length ? fields[nombreIndex]?.trim() : '';
            
            // Crear objeto base común
            const registro = {
              codigo,
              nombre
            };
            
            // Agregar campos específicos según tipo
            if (tipoEntidad === 'vendedores') {
              const { telefonoIndex, emailIndex } = indicesEspecificos;
              
              if (telefonoIndex !== -1 && telefonoIndex < fields.length) {
                registro.telefono = fields[telefonoIndex]?.trim() || '';
              }
              
              if (emailIndex !== -1 && emailIndex < fields.length) {
                registro.email = fields[emailIndex]?.trim() || '';
              }
            } else {
              const { direccionIndex } = indicesEspecificos;
              
              if (direccionIndex !== -1 && direccionIndex < fields.length) {
                registro.direccion = fields[direccionIndex]?.trim() || '';
              }
            }
            
            // Verificar si ya existe
            const existente = registrosActuales.find(r => r.codigo === codigo);
            
            if (existente) {
              // Determinar si hay cambios
              let hayCambios = false;
              Object.keys(registro).forEach(key => {
                if (registro[key] !== existente[key]) {
                  hayCambios = true;
                }
              });
              
              if (hayCambios) {
                // Simular actualización
                agregarLog('info', `Línea ${i}: Actualización de registro ${codigo} (${nombre})`);
                actualizados++;
              } else {
                agregarLog('info', `Línea ${i}: Registro ${codigo} sin cambios`);
                sinCambios++;
              }
            } else {
              // Es nuevo
              agregarLog('info', `Línea ${i}: Nuevo registro ${codigo} (${nombre})`);
              nuevos++;
            }
            
            registrosCSV.push(registro);
          }
          
          // Actualizar estadísticas
          setStats({
            totalRegistros: registrosCSV.length,
            nuevos,
            actualizados,
            sinCambios,
            errores
          });
          
          // Mostrar resultados
          setResultado(
            `Procesamiento completado:\n\n` +
            `Total registros procesados: ${registrosCSV.length}\n` +
            `Nuevos registros: ${nuevos}\n` +
            `Registros actualizados: ${actualizados}\n` +
            `Registros sin cambios: ${sinCambios}\n` +
            `Errores: ${errores}\n\n` +
            `Primeros 5 registros procesados:\n${JSON.stringify(registrosCSV.slice(0, 5), null, 2)}`
          );
          
          agregarLog('success', 'Procesamiento de CSV completado con éxito');
        } catch (csvError) {
          console.error('Error al procesar CSV:', csvError);
          setError(`Error al procesar el archivo CSV: ${csvError.message}`);
          agregarLog('error', `Error al procesar CSV: ${csvError.message}`);
        } finally {
          setCargando(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error al leer el archivo CSV.');
        agregarLog('error', 'Error al leer el archivo CSV');
        setCargando(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Error en el procesamiento:', err);
      setError(`Error en el procesamiento: ${err.message}`);
      agregarLog('error', `Error general: ${err.message}`);
      setCargando(false);
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      agregarLog('info', `Archivo seleccionado: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      procesarCSV(file);
    }
  };
  
  const handleExportarActuales = () => {
    try {
      if (registrosActuales.length === 0) {
        setError('No hay registros para exportar');
        return;
      }
      
      // Generar contenido CSV
      const headers = ['Código', 'Nombre'];
      if (tipoEntidad === 'vendedores') {
        headers.push('Teléfono', 'Email');
      } else {
        headers.push('Dirección');
      }
      
      let csvContent = headers.join(';') + '\n';
      
      registrosActuales.forEach(registro => {
        const row = [
          registro.codigo || '',
          registro.nombre || ''
        ];
        
        if (tipoEntidad === 'vendedores') {
          row.push(
            registro.telefono || '',
            registro.email || ''
          );
        } else {
          row.push(registro.direccion || '');
        }
        
        csvContent += row.join(';') + '\n';
      });
      
      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${tipoEntidad}_exportados.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      agregarLog('success', `${registrosActuales.length} registros exportados a CSV`);
    } catch (error) {
      console.error('Error al exportar:', error);
      setError(`Error al exportar: ${error.message}`);
      agregarLog('error', `Error al exportar: ${error.message}`);
    }
  };
  
  // Estilos
  const containerStyle = {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  };
  
  const cardStyle = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px'
  };
  
  const buttonStyle = {
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '14px'
  };
  
  const uploadButtonStyle = {
    background: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    display: 'inline-block',
    marginRight: '10px',
    fontSize: '14px'
  };
  
  const tabStyle = {
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    display: 'inline-block',
    marginRight: '10px',
    fontWeight: 'bold'
  };
  
  const activeTabStyle = {
    ...tabStyle,
    borderBottom: '2px solid #2196f3',
    color: '#2196f3'
  };
  
  const logContainerStyle = {
    maxHeight: '200px',
    overflow: 'auto',
    border: '1px solid #eee',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa'
  };
  
  const logEntryStyle = (tipo) => {
    const baseStyle = {
      padding: '4px 8px',
      margin: '2px 0',
      borderRadius: '3px'
    };
    
    switch (tipo) {
      case 'error':
        return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fff8e1', color: '#ff8f00' };
      case 'success':
        return { ...baseStyle, backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'info':
      default:
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };
  
  return (
    <div style={containerStyle}>
      <h2>Test de Importación CSV para {tipoEntidad === 'vendedores' ? 'Vendedores' : 'Almacenes'}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div 
          style={tipoEntidad === 'vendedores' ? activeTabStyle : tabStyle}
          onClick={() => setTipoEntidad('vendedores')}
        >
          Vendedores
        </div>
        <div 
          style={tipoEntidad === 'almacenes' ? activeTabStyle : tabStyle}
          onClick={() => setTipoEntidad('almacenes')}
        >
          Almacenes
        </div>
      </div>
      
      <div style={cardStyle}>
        <h3>Datos Actuales</h3>
        <p>Registros cargados: {registrosActuales.length}</p>
        
        <button 
          onClick={handleExportarActuales} 
          style={buttonStyle}
          disabled={registrosActuales.length === 0}
        >
          Exportar CSV de Muestra
        </button>
      </div>
      
      <div style={cardStyle}>
        <h3>Importar CSV</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={uploadButtonStyle}>
            📥 Seleccionar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <span>Selecciona un archivo CSV para analizar la estructura y simular la importación</span>
        </div>
        
        {cargando && <p>Procesando archivo...</p>}
        
        {stats.totalRegistros > 0 && (
          <div style={{ 
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              flex: '1', 
              minWidth: '180px', 
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalRegistros}</div>
              <div>Total Registros</div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '180px', 
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#e8f5e9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.nuevos}</div>
              <div>Nuevos</div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '180px', 
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#fff8e1',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.actualizados}</div>
              <div>Actualizados</div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '180px', 
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#f3e5f5',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.sinCambios}</div>
              <div>Sin Cambios</div>
            </div>
            
            {stats.errores > 0 && (
              <div style={{ 
                flex: '1', 
                minWidth: '180px', 
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: '#ffebee',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.errores}</div>
                <div>Errores</div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#d32f2f', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {resultado && (
          <div style={{ 
            background: '#f1f8e9', 
            color: '#33691e', 
            padding: '15px', 
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            marginBottom: '20px'
          }}>
            {resultado}
          </div>
        )}
      </div>
      
      <div style={cardStyle}>
        <h3>Registro de Operaciones</h3>
        <div style={logContainerStyle}>
          {logOperaciones.length === 0 ? (
            <p>No hay operaciones registradas</p>
          ) : (
            logOperaciones.map(log => (
              <div key={log.id} style={logEntryStyle(log.tipo)}>
                <span style={{ opacity: 0.7, marginRight: '8px' }}>[{log.timestamp}]</span>
                {log.mensaje}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
