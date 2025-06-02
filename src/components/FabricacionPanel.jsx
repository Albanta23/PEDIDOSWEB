import React, { useEffect, useState } from 'react';

function FabricacionPanel() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ recetaId: '', productoFinal: '', cantidad: 1, unidad: 'kg', ingredientes: [], observaciones: '' });
  const [fabricando, setFabricando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  useEffect(() => {
    fetch('/api/recetas').then(r => r.json()).then(setRecetas);
    fetch('/api/productos').then(r => r.json()).then(setProductos);
  }, []);

  useEffect(() => {
    if (form.recetaId) {
      const receta = recetas.find(r => r._id === form.recetaId);
      if (receta) {
        setForm(f => ({
          ...f,
          productoFinal: receta.productoFinal._id,
          unidad: receta.ingredientes[0]?.unidad || 'kg',
          ingredientes: receta.ingredientes.map(i => ({
            producto: i.producto._id,
            cantidad: i.cantidad * f.cantidad,
            unidad: i.unidad
          }))
        }));
      }
    }
  }, [form.recetaId, form.cantidad, recetas]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleIngredienteChange = (idx, campo, valor) => {
    setForm(f => ({
      ...f,
      ingredientes: f.ingredientes.map((ing, i) => i === idx ? { ...ing, [campo]: valor } : ing)
    }));
  };

  const handleFabricar = async e => {
    e.preventDefault();
    setFabricando(true);
    setMensaje('');
    const body = { ...form };
    if (!form.recetaId) delete body.recetaId;
    try {
      const res = await fetch('/api/fabricar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje('Fabricación realizada correctamente.');
      } else {
        setMensaje('Error: ' + (data.error || 'Error desconocido.'));
      }
    } catch (err) {
      setMensaje('Error de red.');
    }
    setFabricando(false);
  };

  return (
    <div className="panel-fabricacion">
      <h2>Fabricación de Productos</h2>
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Filtros activos: recetaId, productoFinal
              let query = [];
              if (form.recetaId) query.push(`recetaId=${encodeURIComponent(form.recetaId)}`);
              if (form.productoFinal) query.push(`productoFinal=${encodeURIComponent(form.productoFinal)}`);
              const url = `/api/exportar/recetas` + (query.length ? `?${query.join('&')}` : '');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `recetas_export_${Date.now()}.xlsx`;
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (e) {
              setErrorExport('Error al exportar a Excel: ' + (e.message || e));
            }
            setExportando(false);
          }}
          style={{padding:'7px 18px',borderRadius:6,background:'#28a745',color:'#fff',fontWeight:600,fontSize:15}}
          disabled={exportando}
        >
          {exportando ? 'Exportando...' : 'Exportar a Excel'}
        </button>
        {exportando && <span style={{color:'#1976d2',fontWeight:600}}>Generando archivo...</span>}
        {errorExport && <span style={{color:'#b71c1c',fontWeight:700}}>{errorExport}</span>}
      </div>
      <form onSubmit={handleFabricar} style={{marginBottom:24,background:'#f9f9f9',padding:16,borderRadius:8}}>
        <div style={{marginBottom:12}}>
          <label>Receta:&nbsp;</label>
          <select name="recetaId" value={form.recetaId} onChange={handleChange}>
            <option value="">Fabricación libre</option>
            {recetas.map(r => (
              <option key={r._id} value={r._id}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <div style={{marginBottom:12}}>
          <label>Producto final:&nbsp;</label>
          <select name="productoFinal" value={form.productoFinal} onChange={handleChange} disabled={!!form.recetaId}>
            <option value="">Selecciona producto</option>
            {productos.map(p => (
              <option key={p._id} value={p._id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div style={{marginBottom:12}}>
          <label>Cantidad:&nbsp;</label>
          <input type="number" name="cantidad" min="1" value={form.cantidad} onChange={handleChange} style={{width:80}} />
          <span style={{marginLeft:8}}>{form.unidad}</span>
        </div>
        <div style={{marginBottom:12}}>
          <label>Ingredientes:</label>
          {form.ingredientes.length === 0 && <div style={{color:'#888'}}>Sin ingredientes (fabricación libre)</div>}
          {form.ingredientes.map((ing, idx) => (
            <div key={idx} style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
              <select value={ing.producto} onChange={e => handleIngredienteChange(idx, 'producto', e.target.value)} disabled={!!form.recetaId}>
                <option value="">Producto</option>
                {productos.map(p => (
                  <option key={p._id} value={p._id}>{p.nombre}</option>
                ))}
              </select>
              <input type="number" value={ing.cantidad} min="0.01" step="0.01" onChange={e => handleIngredienteChange(idx, 'cantidad', e.target.value)} disabled={!!form.recetaId} style={{width:70}} />
              <span>{ing.unidad}</span>
            </div>
          ))}
          {!form.recetaId && (
            <button type="button" onClick={() => setForm(f => ({...f, ingredientes: [...f.ingredientes, { producto: '', cantidad: 0, unidad: 'kg' }]}))}>Añadir ingrediente</button>
          )}
        </div>
        <div style={{marginBottom:12}}>
          <label>Observaciones:&nbsp;</label>
          <input type="text" name="observaciones" value={form.observaciones} onChange={handleChange} style={{width:300}} />
        </div>
        <button type="submit" disabled={fabricando}>{fabricando ? 'Fabricando...' : 'Fabricar'}</button>
      </form>
      {mensaje && <div style={{marginTop:12, color: mensaje.startsWith('Error') ? 'red' : 'green'}}>{mensaje}</div>}
      <h3>Recetas disponibles</h3>
      <ul>
        {recetas.map(r => (
          <li key={r._id}><b>{r.nombre}</b>: {r.ingredientes.map(i => `${i.cantidad} ${i.unidad} de ${i.producto.nombre || i.producto}`).join(', ')}</li>
        ))}
      </ul>
    </div>
  );
}

export default FabricacionPanel;
