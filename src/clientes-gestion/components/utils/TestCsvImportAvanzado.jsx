import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente mejorado para testear el procesamiento CSV con más opciones
 * y detección avanzada de codificación
 */
export default function TestCsvImportAvanzado() {
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [opciones, setOpciones] = useState({
    separador: ';',
    primerLineaEsEncabezado: true,
    codificacion: 'utf-8'
  });
  const [columnasMapeadas, setColumnasMapeadas] = useState({});
  const [columnas, setColumnas] = useState([]);
  const [archivoCargado, setArchivoCargado] = useState(null);
  
  /**
   * Detecta el separador más probable del CSV basado en la primera línea
   */
  const detectarSeparador = (primeraLinea) => {
    const separadores = [';', ',', '\t', '|'];
    let mejorSeparador = ';';
    let maxColumnas = 0;
    
    for (const sep of separadores) {
      const numColumnas = primeraLinea.split(sep).length;
      if (numColumnas > maxColumnas) {
        maxColumnas = numColumnas;
        mejorSeparador = sep;
      }
    }
    
    return mejorSeparador;
  };
  
  /**
   * Detecta la probable codificación del archivo
   * Nota: Esta es una aproximación, ya que JavaScript no puede detectar
   * codificaciones de forma fiable sin bibliotecas externas
   */
  const detectarProbablesCodificacion = (texto) => {
    // Búsqueda de caracteres típicos de ISO-8859-1 mal interpretados como UTF-8
    const caracteresProblematicos = ['�', 'Ã±', 'Ã³', 'Ã©', 'Ã¡', 'Ã'];
    const tieneCaracteresISO = caracteresProblematicos.some(c => texto.includes(c));
    
    return tieneCaracteresISO ? 'iso-8859-1' : 'utf-8';
  };
  
  const cargarArchivo = (file) => {
    if (!file) return;
    
    setCargando(true);
    setError('');
    setArchivoCargado(file);
    
    try {
      // Leer el archivo
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          // Normalizar saltos de línea
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            setError('El archivo está vacío.');
            setCargando(false);
            return;
          }
          
          // Detectar separador automáticamente
          const separadorDetectado = detectarSeparador(lines[0]);
          const codificacionProbable = detectarProbablesCodificacion(csvText);
          
          setOpciones(prev => ({
            ...prev,
            separador: separadorDetectado,
            codificacion: codificacionProbable
          }));
          
          // Extraer encabezados
          const headers = lines[0].split(separadorDetectado).map(h => h.trim());
          setColumnas(headers);
          
          // Pre-mapeo de columnas comunes
          const mapeoInicial = {};
          headers.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            
            if (headerLower.includes('codigo') || headerLower.includes('digo') || 
                header === 'Código' || header === 'C�digo') {
              mapeoInicial.codigo = index;
            }
            
            if (headerLower.includes('nombre')) {
              mapeoInicial.nombre = index;
            }
            
            if (headerLower.includes('dni') || headerLower.includes('nif')) {
              mapeoInicial.dni = index;
            }
            
            if (headerLower.includes('email') || headerLower.includes('correo')) {
              mapeoInicial.email = index;
            }
            
            if (headerLower.includes('telefono') || headerLower.includes('fono') || 
                header === 'Teléfono' || header === 'Tel�fono') {
              mapeoInicial.telefono = index;
            }
            
            if (headerLower.includes('direcci') || headerLower.includes('domicilio')) {
              mapeoInicial.direccion = index;
            }
          });
          
          setColumnasMapeadas(mapeoInicial);
          
          // Mostrar mensaje de éxito de carga
          setResultado(
            `Archivo cargado con éxito.\n\n` +
            `Total de líneas: ${lines.length}\n` +
            `Separador detectado: "${separadorDetectado}"\n` +
            `Codificación probable: ${codificacionProbable}\n\n` +
            `Columnas detectadas (${headers.length}):\n${headers.join('\n')}`
          );
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
      console.error('Error en el procesamiento:', err);
      setError(`Error en el procesamiento: ${err.message}`);
      setCargando(false);
    }
  };
  
  const procesarCSV = () => {
    if (!archivoCargado) {
      setError('No hay archivo cargado para procesar.');
      return;
    }
    
    setCargando(true);
    setError('');
    
    try {
      // Re-leer con la codificación seleccionada
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          // Normalizar saltos de línea
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n').filter(line => line.trim());
          
          // Determinar la línea de inicio basada en si la primera línea es encabezado
          const startLine = opciones.primerLineaEsEncabezado ? 1 : 0;
          
          // Procesar líneas
          const entradas = [];
          for (let i = startLine; i < lines.length; i++) {
            const fields = lines[i].split(opciones.separador);
            
            // Crear objeto basado en el mapeo de columnas
            const entrada = {};
            Object.entries(columnasMapeadas).forEach(([campo, indice]) => {
              if (indice !== undefined && indice < fields.length) {
                entrada[campo] = fields[indice]?.trim() || '';
              } else {
                entrada[campo] = '';
              }
            });
            
            // Sólo agregar si tiene al menos un campo con datos
            if (Object.values(entrada).some(v => v !== '')) {
              entradas.push(entrada);
            }
          }
          
          // Mostrar resultados del procesamiento
          setResultado(
            `CSV procesado con éxito:\n\n` +
            `Total de entradas válidas: ${entradas.length}\n\n` +
            `Mapeo de columnas utilizado:\n${JSON.stringify(columnasMapeadas, null, 2)}\n\n` +
            `Primeras 5 entradas:\n${JSON.stringify(entradas.slice(0, 5), null, 2)}`
          );
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
      
      reader.readAsText(archivoCargado, opciones.codificacion);
    } catch (err) {
      console.error('Error en el procesamiento:', err);
      setError(`Error en el procesamiento: ${err.message}`);
      setCargando(false);
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      cargarArchivo(file);
    }
  };
  
  // Estilo para componentes de formulario
  const inputStyle = {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '10px',
    width: '100%'
  };
  
  const buttonStyle = {
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 15px',
    cursor: 'pointer',
    marginRight: '10px'
  };
  
  const labelStyle = {
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'block'
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Test Avanzado de Importación CSV</h2>
      
      <div style={{ marginBottom: '20px' }}>
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
          📥 Seleccionar CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {archivoCargado && (
          <span style={{ marginLeft: '10px' }}>
            Archivo: {archivoCargado.name} ({Math.round(archivoCargado.size / 1024)} KB)
          </span>
        )}
      </div>
      
      {archivoCargado && (
        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={labelStyle}>Separador:</label>
            <select 
              value={opciones.separador} 
              onChange={(e) => setOpciones({...opciones, separador: e.target.value})}
              style={inputStyle}
            >
              <option value=";">Punto y coma (;)</option>
              <option value=",">Coma (,)</option>
              <option value="\t">Tabulador</option>
              <option value="|">Barra vertical (|)</option>
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={labelStyle}>Codificación:</label>
            <select 
              value={opciones.codificacion} 
              onChange={(e) => setOpciones({...opciones, codificacion: e.target.value})}
              style={inputStyle}
            >
              <option value="utf-8">UTF-8</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={labelStyle}>Primera línea:</label>
            <div>
              <label style={{ marginRight: '10px' }}>
                <input 
                  type="radio" 
                  checked={opciones.primerLineaEsEncabezado} 
                  onChange={() => setOpciones({...opciones, primerLineaEsEncabezado: true})}
                /> Es encabezado
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={!opciones.primerLineaEsEncabezado} 
                  onChange={() => setOpciones({...opciones, primerLineaEsEncabezado: false})}
                /> Es datos
              </label>
            </div>
          </div>
        </div>
      )}
      
      {columnas.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Mapeo de Columnas</h3>
          <p>Selecciona qué columna corresponde a cada campo:</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {['codigo', 'nombre', 'dni', 'email', 'telefono', 'direccion'].map((campo) => (
              <div key={campo}>
                <label style={labelStyle}>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</label>
                <select
                  value={columnasMapeadas[campo] !== undefined ? columnasMapeadas[campo] : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setColumnasMapeadas(prev => ({
                      ...prev,
                      [campo]: value === '' ? undefined : Number(value)
                    }));
                  }}
                  style={inputStyle}
                >
                  <option value="">No mapear</option>
                  {columnas.map((col, index) => (
                    <option key={index} value={index}>
                      {index}: {col}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {archivoCargado && (
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={procesarCSV} 
            style={buttonStyle}
            disabled={cargando}
          >
            Procesar CSV
          </button>
          
          <button 
            onClick={() => {
              setArchivoCargado(null);
              setColumnas([]);
              setColumnasMapeadas({});
              setResultado('');
              setError('');
            }} 
            style={{...buttonStyle, background: '#757575'}}
          >
            Limpiar
          </button>
        </div>
      )}
      
      {cargando && (
        <div style={{ 
          background: '#e3f2fd', 
          color: '#1976d2', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Procesando...</strong> Por favor espere.
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
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          {resultado}
        </div>
      )}
    </div>
  );
}
