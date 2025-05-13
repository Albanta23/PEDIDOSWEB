import React, { useState } from 'react';

const formatos = ['Cajas', 'Bolsas', 'Kilos', 'Unidades'];

const PedidoForm = ({ onAdd }) => {
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [formato, setFormato] = useState(formatos[0]);
  const [comentario, setComentario] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!producto || cantidad < 1) return;
    onAdd({ producto, cantidad, formato, comentario });
    setProducto('');
    setCantidad(1);
    setFormato(formatos[0]);
    setComentario('');
    setMensaje('¡Pedido enviado a fábrica!');
    setTimeout(() => setMensaje(''), 2000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px 0', background: '#f8f8f8', padding: 16, borderRadius: 8 }}>
      <h3>Nuevo Pedido</h3>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Producto"
          value={producto}
          onChange={e => setProducto(e.target.value)}
          style={{ padding: 8, width: 120, marginRight: 8 }}
        />
        <input
          type="number"
          min="1"
          placeholder="Cantidad"
          value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          style={{ padding: 8, width: 60, marginRight: 8 }}
        />
        <select
          value={formato}
          onChange={e => setFormato(e.target.value)}
          style={{ padding: 8, marginRight: 8 }}
        >
          {formatos.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Comentario"
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          style={{ padding: 8, width: 120, marginRight: 8 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Agregar</button>
      </div>
      {mensaje && <div style={{ color: 'green', marginTop: 8 }}>{mensaje}</div>}
    </form>
  );
};

export default PedidoForm;