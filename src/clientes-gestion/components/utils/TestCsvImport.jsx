import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente de prueba para testear el procesamiento CSV
 */
export default function TestCsvImport() {
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const procesarCSV = async (file) => {
    if (!file) return;
    
    setCargando(true);
    setError('');
    
    try {
      // Leer el archivo
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          // Normalizar saltos de línea para compatibilidad entre sistemas
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n');
          
          // Extraer encabezados
          const headers = lines[0].split(';').map(h => h.trim());
          
          // Detectar índices de columnas relevantes
          const codigoIndex = headers.findIndex(h => 
            h.toLowerCase().includes('codigo') || h.toLowerCase().includes('digo') || h === 'Código' || h === 'C�digo');
          
          const nombreIndex = headers.findIndex(h => 
            h.toLowerCase().includes('nombre'));
          
          const dniIndex = headers.findIndex(h => 
            h.toLowerCase().includes('dni') || h.toLowerCase().includes('nif'));
            
          const emailIndex = headers.findIndex(h => 
            h.toLowerCase().includes('email') || h.toLowerCase().includes('correo'));
            
          const telefonoIndex = headers.findIndex(h => 
            h.toLowerCase().includes('telefono') || h.toLowerCase().includes('fono') || h === 'Teléfono' || h === 'Tel�fono');
            
          // Mostrar información de columnas detectadas
          const columnasDetectadas = {
            codigo: { index: codigoIndex, nombre: headers[codigoIndex] || 'NO ENCONTRADO' },
            nombre: { index: nombreIndex, nombre: headers[nombreIndex] || 'NO ENCONTRADO' },
            dni: { index: dniIndex, nombre: dniIndex !== -1 ? headers[dniIndex] : 'NO ENCONTRADO' },
            email: { index: emailIndex, nombre: emailIndex !== -1 ? headers[emailIndex] : 'NO ENCONTRADO' },
            telefono: { index: telefonoIndex, nombre: telefonoIndex !== -1 ? headers[telefonoIndex] : 'NO ENCONTRADO' }
          };
          
          // Procesar líneas
          const entradas = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const fields = lines[i].split(';');
            
            // Validar campos mínimos
            if (fields.length <= codigoIndex) continue;
            
            const codigo = fields[codigoIndex]?.trim();
            // Si no hay código, omitimos esta línea
            if (!codigo) continue;
            
            const nombre = nombreIndex !== -1 && nombreIndex < fields.length ? fields[nombreIndex]?.trim() : '';
            
            entradas.push({
              codigo,
              nombre,
              dni: dniIndex !== -1 && dniIndex < fields.length ? fields[dniIndex]?.trim() : '',
              email: emailIndex !== -1 && emailIndex < fields.length ? fields[emailIndex]?.trim() : '',
              telefono: telefonoIndex !== -1 && telefonoIndex < fields.length ? fields[telefonoIndex]?.trim() : ''
            });
          }
          
          // Mostrar resultados
          setResultado(
            `CSV procesado con éxito:\n\n` +
            `Columnas detectadas:\n${JSON.stringify(columnasDetectadas, null, 2)}\n\n` +
            `Total de entradas válidas: ${entradas.length}\n\n` +
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
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Error en el procesamiento:', err);
      setError(`Error en el procesamiento: ${err.message}`);
      setCargando(false);
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      procesarCSV(file);
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Test de Importación CSV</h2>
      
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
      </div>
      
      {cargando && <p>Procesando archivo...</p>}
      
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
          fontFamily: 'monospace'
        }}>
          {resultado}
        </div>
      )}
    </div>
  );
}
