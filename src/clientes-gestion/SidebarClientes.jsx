import React from 'react';

export default function SidebarClientes({ onSelect, selected }) {
  return (
    <div style={{
      width: 220,
      background: '#f4f6fa',
      borderRight: '1px solid #e0e0e0',
      minHeight: '100vh',
      paddingTop: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <button
        style={{
          background: selected === 'mantenimiento' ? '#1976d2' : '#fff',
          color: selected === 'mantenimiento' ? '#fff' : '#1976d2',
          border: 'none',
          borderRadius: 8,
          padding: '12px 18px',
          fontWeight: 600,
          fontSize: 17,
          margin: '0 12px',
          cursor: 'pointer',
          boxShadow: selected === 'mantenimiento' ? '0 2px 8px #1976d233' : 'none',
          transition: 'all 0.2s'
        }}
        onClick={() => onSelect('mantenimiento')}
      >
        Mantenimiento
      </button>
      {/* Aquí puedes añadir más botones en el futuro */}
    </div>
  );
}
