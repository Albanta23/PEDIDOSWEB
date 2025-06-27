import React, { useState } from 'react';

const USUARIOS = [
  { nombre: 'Maria', pin: '1694' },
  { nombre: 'Javier', pin: '1973' },
  { nombre: 'Alicia', pin: '1975' },
  { nombre: 'Bea', pin: '1995' }
];

export default function ExpedicionesClientesLogin({ onLogin }) {
  const [usuario, setUsuario] = useState('Maria');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const user = USUARIOS.find(u => u.nombre === usuario && u.pin === pin);
    if (user) {
      setError('');
      onLogin(user.nombre);
    } else {
      setError('Usuario o PIN incorrecto');
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '80px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #bbb', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Acceso Expediciones Clientes</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label>Usuario:</label>
          <select value={usuario} onChange={e => setUsuario(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
            {USUARIOS.map(u => <option key={u.nombre} value={u.nombre}>{u.nombre}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>PIN:</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
