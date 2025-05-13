import React, { useState } from 'react';
import ErrorLogger from './components/ErrorLogger';

function ErrorTest() {
  const [mostrarErrores, setMostrarErrores] = useState(false);
  
  const generarError = () => {
    console.error('Error de prueba desde ErrorTest');
    console.warn('Advertencia de prueba desde ErrorTest');
    try {
      const obj = null;
      obj.metodo(); // Esto generará un error
    } catch (error) {
      console.error('Error capturado:', error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <ErrorLogger />
      <h1>Página de Prueba de Errores</h1>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMostrarErrores(!mostrarErrores)}
          style={{ 
            background: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          {mostrarErrores ? 'Ocultar' : 'Mostrar'} ErrorLogger (no afecta ahora)
        </button>
        <button 
          onClick={generarError}
          style={{ 
            background: '#dc3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Generar Error
        </button>
      </div>
      <div style={{ marginTop: '40px' }}>
        <h3>Información de depuración:</h3>
        <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
          {`
ErrorLogger montado: SIEMPRE
React versión: ${React.version}
          `}
        </pre>
        <div style={{ marginTop: '20px' }}>
          <h4>Errores manuales:</h4>
          <button 
            onClick={() => console.error('Error manual 1')}
            style={{ marginRight: '10px', background: '#6c757d', color: 'white', border: 'none', padding: '5px 10px' }}
          >
            console.error()
          </button>
          <button 
            onClick={() => console.warn('Advertencia manual 1')}
            style={{ marginRight: '10px', background: '#ffc107', color: 'black', border: 'none', padding: '5px 10px' }}
          >
            console.warn()
          </button>
          <button 
            onClick={() => setTimeout(() => { throw new Error('Error no capturado'); }, 100)}
            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px' }}
          >
            Error no capturado
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorTest;
