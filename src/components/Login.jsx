import React, { useState } from 'react';

function Login({ tipo, onLogin, tiendas }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí podrías validar el usuario, contraseña y tienda
    if (tipo === 'tienda' && !tiendaSeleccionada) return;
    onLogin(usuario, tiendaSeleccionada);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login {tipo === 'fabrica' ? 'Fábrica' : 'Tienda'}</h2>
      {tipo === 'tienda' && (
        <select
          value={tiendaSeleccionada}
          onChange={e => setTiendaSeleccionada(e.target.value)}
          required
        >
          <option value="">Selecciona tu tienda</option>
          {tiendas.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      )}
      <input
        type="text"
        placeholder="Usuario"
        value={usuario}
        onChange={e => setUsuario(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">Entrar</button>
    </form>
  );
}

export default Login;