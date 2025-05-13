import React, { useState } from 'react';

// Pines por tienda (id: pin)
const PINES_TIENDAS = {
  tienda1: '1111',
  tienda2: '2222',
  tienda3: '3333',
  tienda4: '4444',
  tienda5: '5555',
  tienda6: '6666',
  tienda7: '7777',
  tienda8: '8888',
  tienda9: '9999',
  tienda10: '1010',
  clientes: '0000',
  fabrica: 'fabrica' // Si quieres un pin para fábrica
};

const Login = ({ tipo, onLogin, tiendas }) => {
  const [usuario, setUsuario] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tipo === 'tienda') {
      if (!tiendaId) {
        setError('Selecciona una tienda');
        return;
      }
      if (pin !== PINES_TIENDAS[tiendaId]) {
        setError('PIN incorrecto');
        return;
      }
      setError('');
      onLogin(usuario, tiendaId);
    } else if (tipo === 'fabrica') {
      if (pin !== PINES_TIENDAS['fabrica']) {
        setError('PIN de fábrica incorrecto');
        return;
      }
      setError('');
      onLogin(usuario, null);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 340, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Acceso {tipo === 'fabrica' ? 'Fábrica' : 'Tienda'}</h2>
      {tipo === 'tienda' && (
        <div style={{ marginBottom: 18 }}>
          <label>Selecciona tienda:</label>
          <select value={tiendaId} onChange={e => setTiendaId(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }}>
            <option value="">-- Elige una tienda --</option>
            {tiendas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      )}
      <div style={{ marginBottom: 18 }}>
        <label>PIN de acceso:</label>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 6 }}
          autoComplete="off"
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16 }}>Entrar</button>
    </form>
  );
};

export default Login;