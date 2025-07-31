import React, { useState } from 'react';
import ProductosSage from './components/mantenimiento/ProductosSage';
import FormasPago from './components/mantenimiento/FormasPago';
import Vendedores from './components/mantenimiento/Vendedores';
import Almacenes from './components/mantenimiento/Almacenes';

/**
 * Componente principal para el mantenimiento de datos maestros de SAGE50
 * Incluye gestión de productos, formas de pago, vendedores y almacenes
 */
export default function MantenimientoSage() {
  const [seccionActiva, setSeccionActiva] = useState('productos');

  return (
    <div style={{ padding: '20px' }}>
      <h2>🛠️ Mantenimiento SAGE50</h2>
      
      {/* Navegación entre secciones */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '10px',
        background: '#f4f7fb',
        borderRadius: '8px',
        border: '1px solid #e0e8f0'
      }}>
        <button 
          onClick={() => setSeccionActiva('productos')} 
          style={{
            background: seccionActiva === 'productos' ? '#1976d2' : '#fff',
            color: seccionActiva === 'productos' ? '#fff' : '#1976d2',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📦 Productos
        </button>
        <button 
          onClick={() => setSeccionActiva('formaspago')} 
          style={{
            background: seccionActiva === 'formaspago' ? '#1976d2' : '#fff',
            color: seccionActiva === 'formaspago' ? '#fff' : '#1976d2',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          💰 Formas de Pago
        </button>
        <button 
          onClick={() => setSeccionActiva('vendedores')} 
          style={{
            background: seccionActiva === 'vendedores' ? '#1976d2' : '#fff',
            color: seccionActiva === 'vendedores' ? '#fff' : '#1976d2',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          👤 Vendedores
        </button>
        <button 
          onClick={() => setSeccionActiva('almacenes')} 
          style={{
            background: seccionActiva === 'almacenes' ? '#1976d2' : '#fff',
            color: seccionActiva === 'almacenes' ? '#fff' : '#1976d2',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🏭 Almacenes
        </button>
      </div>
      
      {/* Componente activo según la sección seleccionada */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        {seccionActiva === 'productos' && <ProductosSage />}
        {seccionActiva === 'formaspago' && <FormasPago />}
        {seccionActiva === 'vendedores' && <Vendedores />}
        {seccionActiva === 'almacenes' && <Almacenes />}
      </div>
    </div>
  );
}
