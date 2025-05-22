import React, { useState } from 'react';
import Watermark from './Watermark';
import { FORMATOS_PEDIDO } from '../configFormatos';

const PedidoForm = ({ onAdd }) => {
  const [lineas, setLineas] = useState([
    { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }
  ]);
  const [mensaje, setMensaje] = useState('');

  const handleLineaChange = (idx, campo, valor) => {
    setLineas(lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };

  const handleAgregarLinea = () => {
    setLineas([...lineas, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };

  const handleEliminarLinea = (idx) => {
    setLineas(lineas.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lineasValidas = lineas.filter(l => l.producto && l.cantidad > 0);
    if (lineasValidas.length === 0) return;
    onAdd({ lineas: lineasValidas });
    setLineas([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
    setMensaje('¡Pedido enviado a fábrica!');
    setTimeout(() => setMensaje(''), 2000);
  };

  return (
    <div>
      <Watermark />
      <form onSubmit={handleSubmit} style={{ margin: '20px 0', background: '#f8f8f8', padding: 16, borderRadius: 8 }}>
        <h3>Nuevo Pedido</h3>
        {lineas.map((linea, idx) => (
          <div key={idx} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Producto"
              value={linea.producto}
              onChange={e => handleLineaChange(idx, 'producto', e.target.value)}
              style={{ padding: 8, width: 120 }}
            />
            <input
              type="number"
              min="1"
              placeholder="Cantidad"
              value={linea.cantidad}
              onChange={e => handleLineaChange(idx, 'cantidad', Number(e.target.value))}
              style={{ padding: 8, width: 60 }}
            />
            <select
              value={linea.formato}
              onChange={e => handleLineaChange(idx, 'formato', e.target.value)}
              style={{ padding: 8 }}
            >
              {FORMATOS_PEDIDO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Comentario"
              value={linea.comentario}
              onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
              style={{ padding: 8, width: 110 }}
            />
            {lineas.length > 1 && (
              <button type="button" onClick={() => handleEliminarLinea(idx)} style={{ color: '#dc3545', background: 'none', border: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            )}
          </div>
        ))}
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleAgregarLinea} style={{ padding: '6px 14px', background: '#00c6ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            Añadir línea
          </button>
          <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            Confirmar y enviar pedido
          </button>
        </div>
        {mensaje && <div style={{ color: 'green', marginTop: 8 }}>{mensaje}</div>}
      </form>
    </div>
  );
};

export default PedidoForm;