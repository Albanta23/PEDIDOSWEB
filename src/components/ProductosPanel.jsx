import React, { useEffect, useState } from 'react';

export default function ProductosPanel() {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', referencia: '', unidad: 'kg', familia: '', descripcion: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data);
    } catch (e) {
      setError('Error al cargar productos');
    }
    setCargando(false);
  };

  useEffect(() => { cargarProductos(); }, []);

  const crearProducto = async () => {
    setError('');
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
      if (!res.ok) throw new Error('Error al crear producto');
      setNuevo({ nombre: '', referencia: '', unidad: 'kg', familia: '', descripcion: '' });
      cargarProductos();
    } catch (e) {
      setError('No se pudo crear el producto');
    }
  };

  return (
    <div style={{maxWidth:600,margin:'32px auto',background:'#fff',borderRadius:12,padding:24,boxShadow:'0 2px 12px #007bff11'}}>
      <h2>Catálogo de Productos</h2>
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Si en el futuro hay filtros, añadirlos aquí como query string
              const url = `/api/exportar/productos`;
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `productos_export_${Date.now()}.xlsx`;
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
      <div style={{marginBottom:18}}>
        <input placeholder="Nombre" value={nuevo.nombre} onChange={e=>setNuevo(n=>({...n,nombre:e.target.value}))} style={{marginRight:8}} />
        <input placeholder="Referencia" value={nuevo.referencia} onChange={e=>setNuevo(n=>({...n,referencia:e.target.value}))} style={{marginRight:8}} />
        <input placeholder="Unidad" value={nuevo.unidad} onChange={e=>setNuevo(n=>({...n,unidad:e.target.value}))} style={{width:60,marginRight:8}} />
        <input placeholder="Familia" value={nuevo.familia} onChange={e=>setNuevo(n=>({...n,familia:e.target.value}))} style={{marginRight:8}} />
        <input placeholder="Descripción" value={nuevo.descripcion} onChange={e=>setNuevo(n=>({...n,descripcion:e.target.value}))} style={{marginRight:8}} />
        <button onClick={crearProducto} disabled={cargando || !nuevo.nombre}>Crear</button>
      </div>
      {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
      {cargando ? <div>Cargando...</div> : (
        <table style={{width:'100%',background:'#f8f9fa',borderRadius:8}}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Referencia</th>
              <th>Unidad</th>
              <th>Familia</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p._id}>
                <td>{p.nombre}</td>
                <td>{p.referencia}</td>
                <td>{p.unidad}</td>
                <td>{p.familia}</td>
                <td>{p.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
