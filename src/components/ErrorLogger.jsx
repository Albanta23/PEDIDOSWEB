import React, { useState, useEffect } from 'react';

function ErrorLogger() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      setErrors(prevErrors => [
        ...prevErrors,
        {
          type: 'error',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
          timestamp: new Date().toISOString()
        }
      ]);
    };
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      setErrors(prevErrors => [
        ...prevErrors,
        {
          type: 'warning',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
          timestamp: new Date().toISOString()
        }
      ]);
    };
    const handleWindowError = (event) => {
      setErrors(prevErrors => [
        ...prevErrors,
        {
          type: 'uncaught',
          message: `${event.error?.message || 'Error desconocido'} en ${event.filename}:${event.lineno}:${event.colno}`,
          timestamp: new Date().toISOString()
        }
      ]);
    };
    const handleUnhandledRejection = (event) => {
      setErrors(prevErrors => [
        ...prevErrors,
        {
          type: 'promise',
          message: `Promesa rechazada: ${event.reason}`,
          timestamp: new Date().toISOString()
        }
      ]);
    };
    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearErrors = () => setErrors([]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      right: '10px',
      maxHeight: '200px',
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '5px',
      border: '2px solid red',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#ff6b6b' }}>Log de Errores ({errors.length})</h3>
        <button onClick={clearErrors} style={{ background: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer', padding: '5px 10px' }}>
          Limpiar
        </button>
      </div>
      <div>
        {errors.map((error, index) => (
          <div key={index} style={{
            padding: '5px',
            borderBottom: '1px solid #444',
            color: error.type === 'error' || error.type === 'uncaught' ? '#ff6b6b' : error.type === 'warning' ? '#feca57' : '#fff'
          }}>
            <span style={{ color: '#aaa', marginRight: '10px' }}>{new Date(error.timestamp).toLocaleTimeString()}</span>
            <span style={{ fontWeight: 'bold', marginRight: '10px' }}>[{error.type}]</span>
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ErrorLogger;
