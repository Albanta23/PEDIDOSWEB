/**
 * Componente de prueba para verificar las funciones de nombres de clientes
 */
import React, { useState, useEffect } from 'react';
import { obtenerNombreCompleto } from '../utils/clienteUtils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_URL_CORRECTO = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

function PruebaNombresClientes() {
  const [clientes, setClientes] = useState([]);
  const [ejemplos, setEjemplos] = useState([]);

  useEffect(() => {
    cargarEjemplosClientes();
  }, []);

  const cargarEjemplosClientes = async () => {
    try {
      const response = await axios.get(`${API_URL_CORRECTO}/clientes`);
      const todosClientes = response.data;
      
      // Tomar algunos ejemplos variados
      const clientesConApellidos = todosClientes.filter(c => c.primerApellido || c.segundoApellido).slice(0, 5);
      const clientesSinApellidos = todosClientes.filter(c => c.nombre && !c.primerApellido && !c.segundoApellido && c.nombre.trim()).slice(0, 5);
      
      setClientes(todosClientes);
      setEjemplos([...clientesConApellidos, ...clientesSinApellidos]);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Prueba de Funciones de Nombres de Clientes</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #0ea5e9' }}>
        <h3>📊 Estadísticas</h3>
        <p><strong>Total de clientes:</strong> {clientes.length}</p>
        <p><strong>Con apellidos separados:</strong> {clientes.filter(c => c.primerApellido || c.segundoApellido).length}</p>
        <p><strong>Sin apellidos separados:</strong> {clientes.filter(c => c.nombre && !c.primerApellido && !c.segundoApellido).length}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Ejemplos de Funcionamiento</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Campo 'nombre'</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Primer Apellido</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Segundo Apellido</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Resultado obtenerNombreCompleto()</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Código SAGE</th>
            </tr>
          </thead>
          <tbody>
            {ejemplos.map((cliente, index) => (
              <tr key={cliente._id || index} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <code style={{ background: '#e5e7eb', padding: '2px 4px', borderRadius: '3px' }}>
                    {cliente.nombre ? `"${cliente.nombre}"` : '(vacío)'}
                  </code>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <code style={{ background: '#e5e7eb', padding: '2px 4px', borderRadius: '3px' }}>
                    {cliente.primerApellido ? `"${cliente.primerApellido}"` : '(vacío)'}
                  </code>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <code style={{ background: '#e5e7eb', padding: '2px 4px', borderRadius: '3px' }}>
                    {cliente.segundoApellido ? `"${cliente.segundoApellido}"` : '(vacío)'}
                  </code>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <strong style={{ color: '#059669' }}>
                    "{obtenerNombreCompleto(cliente)}"
                  </strong>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {cliente.codigoSage || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px', border: '2px solid #f59e0b' }}>
        <h4>💡 Explicación del Comportamiento</h4>
        <ul>
          <li><strong>Clientes WooCommerce:</strong> Usan campos separados (nombre + primerApellido + segundoApellido)</li>
          <li><strong>Clientes SAGE50:</strong> Usan solo el campo 'nombre' con el nombre completo</li>
          <li><strong>La función obtenerNombreCompleto():</strong> Detecta automáticamente el formato y devuelve el nombre completo</li>
          <li><strong>Migración:</strong> Ya completada para la mayoría de clientes</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={cargarEjemplosClientes}
          style={{
            padding: '10px 20px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🔄 Recargar Ejemplos
        </button>
      </div>
    </div>
  );
}

export default PruebaNombresClientes;
