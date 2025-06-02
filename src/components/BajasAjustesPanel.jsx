import React, { useEffect, useState } from 'react';

function BajasAjustesPanel() {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ producto: '', lote: '', cantidad: '', tipo: 'baja', motivo: '', observaciones: '' });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/productos').then(r => r.json()).then(setProductos);
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    setLoading(true);
    const res = await fetch('/api/movimientos?tipo=baja,ajuste');
    const data = await res.json();
    setMovimientos(data);
    setLoading(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    if (!form.producto || !form.cantidad || isNaN(Number(form.cantidad))) {
      setMensaje('Producto y cantidad obligatorios.');
      return;
    }
    const body = { ...form, cantidad: Number(form.cantidad) };
    try {
      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setMensaje('Movimiento registrado.');
        setForm({ producto: '', lote: '', cantidad: '', tipo: 'baja', motivo: '', observaciones: '' });
        fetchMovimientos();
      } else {
        const data = await res.json();
        setMensaje('Error: ' + (data.error || 'Error desconocido.'));
      }
    } catch (err) {
      setMensaje('Error de red.');
    }
  };

  // --- INICIO: Exportar a Excel ---
  function exportarBajasAjustesExcel() {
    const url = '/api/exportar/movimientos?tipo=baja,ajuste';
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.textContent = 'Descargar Excel';
    link.download = `bajas_ajustes_${new Date().toISOString().slice(0,10)}.xlsx`;
    link.href = url;
    link.click();
    setTimeout(() => document.body.removeChild(link), 2000);
  }
  // --- FIN: Exportar a Excel ---

  return (
    <div className="panel-bajas-ajustes">
      <h2>Bajas y Ajustes de Stock</h2>
      <form onSubmit={handleSubmit} style={{marginBottom:24,background:'#f9f9f9',padding:16,borderRadius:8}}>
        <div style={{marginBottom:12}}>
          <label>Producto:&nbsp;</label>
          <select name="producto" value={form.producto} onChange={handleChange} required>
            <option value="">Selecciona producto</option>
            {productos.map(p => (
              <option key={p._id} value={p._id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div style={{marginBottom:12}}>
          <label>Cantidad:&nbsp;</label>
          <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min="0.01" step="0.01" required style={{width:80}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Tipo:&nbsp;</label>
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="baja">Baja</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </div>
        <div style={{marginBottom:12}}>
          <label>Motivo:&nbsp;</label>
          <input type="text" name="motivo" value={form.motivo} onChange={handleChange} style={{width:200}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Observaciones:&nbsp;</label>
          <input type="text" name="observaciones" value={form.observaciones} onChange={handleChange} style={{width:300}} />
        </div>
        <button type="submit">Registrar</button>
      </form>
      {mensaje && <div style={{marginBottom:16, color: mensaje.startsWith('Error') ? 'red' : 'green'}}>{mensaje}</div>}
      <h3>Histórico de bajas y ajustes</h3>
      {/* Botón Exportar a Excel */}
      <button
        onClick={exportarBajasAjustesExcel}
        style={{marginBottom:12, background:'#1e88e5', color:'#fff', border:'none', borderRadius:8, padding:'8px 22px', fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 1px 4px #007bff22', display:'inline-block'}}>
        📥 Exportar a Excel
      </button>
      {loading ? <div>Cargando...</div> : (
        <table className="tabla-bajas-ajustes" style={{width:'100%',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #eee'}}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr><td colSpan="6">No hay movimientos</td></tr>
            ) : (
              movimientos.map((m) => (
                <tr key={m._id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{m.productoNombre || m.producto}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.tipo}</td>
                  <td>{m.motivo || ''}</td>
                  <td>{m.observaciones || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BajasAjustesPanel;
