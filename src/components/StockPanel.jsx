import React, { useEffect, useState } from 'react';

export default function StockPanel() {
  const [stock, setStock] = useState([]);
  const [ubicacion, setUbicacion] = useState('FABRICA');
  const [ubicaciones, setUbicaciones] = useState(['FABRICA']);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  // Cargar ubicaciones posibles (puedes mejorar esto con un endpoint específico)
  useEffect(() => {
    // Ejemplo: puedes obtener ubicaciones de lotes o stock
    fetch('/api/lotes')
      .then(res => res.json())
      .then(lotes => {
        const unicas = Array.from(new Set(lotes.map(l => l.ubicacion).filter(Boolean)));
        setUbicaciones(['FABRICA', ...unicas.filter(u => u !== 'FABRICA')]);
      });
  }, []);

  const cargarStock = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/stock?tiendaId=${encodeURIComponent(ubicacion)}`);
      const data = await res.json();
      setStock(data);
    } catch (e) {
      setError('Error al cargar stock');
    }
    setCargando(false);
  };

  useEffect(() => { cargarStock(); }, [ubicacion]);

  return (
    <div style={{maxWidth:700,margin:'32px auto',background:'#fff',borderRadius:12,padding:24,boxShadow:'0 2px 12px #007bff11'}}>
      <h2>Stock actual por ubicación</h2>
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Filtro activo: ubicación
              let query = [];
              if (ubicacion) query.push(`tiendaId=${encodeURIComponent(ubicacion)}`);
              const url = `/api/exportar/stock` + (query.length ? `?${query.join('&')}` : '');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `stock_export_${Date.now()}.xlsx`;
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
        <label>Ubicación: </label>
        <select value={ubicacion} onChange={e=>setUbicacion(e.target.value)}>
          {ubicaciones.map(u=>(<option key={u} value={u}>{u}</option>))}
        </select>
      </div>
      {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
      {cargando ? <div>Cargando...</div> : (
        <table style={{width:'100%',background:'#f8f9fa',borderRadius:8}}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(s => (
              <tr key={s._id}>
                <td>{s.producto}</td>
                <td>{s.cantidad}</td>
                <td>{s.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
