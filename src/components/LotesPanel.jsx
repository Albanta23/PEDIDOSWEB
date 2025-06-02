import React, { useEffect, useState } from 'react';

export default function LotesPanel() {
  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ producto: '', codigo: '', cantidadInicial: '', fechaCaducidad: '', ubicacion: 'FABRICA', observaciones: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  const cargarLotes = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/lotes');
      const data = await res.json();
      setLotes(data);
    } catch (e) {
      setError('Error al cargar lotes');
    }
    setCargando(false);
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data);
    } catch (e) {}
  };

  useEffect(() => { cargarLotes(); cargarProductos(); }, []);

  const crearLote = async () => {
    setError('');
    try {
      const res = await fetch('/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevo,
          cantidadInicial: parseFloat(nuevo.cantidadInicial),
          cantidadActual: parseFloat(nuevo.cantidadInicial)
        })
      });
      if (!res.ok) throw new Error('Error al crear lote');
      setNuevo({ producto: '', codigo: '', cantidadInicial: '', fechaCaducidad: '', ubicacion: 'FABRICA', observaciones: '' });
      cargarLotes();
    } catch (e) {
      setError('No se pudo crear el lote');
    }
  };

  return (
    <div style={{maxWidth:700,margin:'32px auto',background:'#fff',borderRadius:12,padding:24,boxShadow:'0 2px 12px #007bff11'}}>
      <h2>Lotes y Trazabilidad</h2>
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Filtros activos: producto, ubicación
              let query = [];
              if (nuevo.producto) query.push(`producto=${encodeURIComponent(nuevo.producto)}`);
              if (nuevo.ubicacion) query.push(`ubicacion=${encodeURIComponent(nuevo.ubicacion)}`);
              const url = `/api/exportar/lotes` + (query.length ? `?${query.join('&')}` : '');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `lotes_export_${Date.now()}.xlsx`;
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
      <div style={{marginBottom:18,display:'flex',gap:8,flexWrap:'wrap'}}>
        <select value={nuevo.producto} onChange={e=>setNuevo(n=>({...n,producto:e.target.value}))}>
          <option value=''>Producto</option>
          {productos.map(p=>(<option key={p._id} value={p._id}>{p.nombre}</option>))}
        </select>
        <input placeholder="Código/Lote" value={nuevo.codigo} onChange={e=>setNuevo(n=>({...n,codigo:e.target.value}))} />
        <input type="number" placeholder="Cantidad" value={nuevo.cantidadInicial} onChange={e=>setNuevo(n=>({...n,cantidadInicial:e.target.value}))} style={{width:90}} />
        <input type="date" value={nuevo.fechaCaducidad} onChange={e=>setNuevo(n=>({...n,fechaCaducidad:e.target.value}))} />
        <input placeholder="Ubicación" value={nuevo.ubicacion} onChange={e=>setNuevo(n=>({...n,ubicacion:e.target.value}))} />
        <input placeholder="Observaciones" value={nuevo.observaciones} onChange={e=>setNuevo(n=>({...n,observaciones:e.target.value}))} />
        <button onClick={crearLote} disabled={cargando || !nuevo.producto || !nuevo.codigo || !nuevo.cantidadInicial}>Crear lote</button>
      </div>
      {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
      {cargando ? <div>Cargando...</div> : (
        <table style={{width:'100%',background:'#f8f9fa',borderRadius:8}}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Cantidad inicial</th>
              <th>Cantidad actual</th>
              <th>Ubicación</th>
              <th>Caducidad</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map(l => (
              <tr key={l._id}>
                <td>{l.producto?.nombre || l.producto}</td>
                <td>{l.codigo}</td>
                <td>{l.cantidadInicial}</td>
                <td>{l.cantidadActual}</td>
                <td>{l.ubicacion}</td>
                <td>{l.fechaCaducidad ? new Date(l.fechaCaducidad).toLocaleDateString() : ''}</td>
                <td>{l.estado}</td>
                <td>{l.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
