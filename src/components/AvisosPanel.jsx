import React, { useEffect, useState, useRef } from 'react';

function useAvisosRealtime(fetchAvisos) {
  // Hook para polling de avisos nuevos
  const lastAvisoId = useRef(null);
  const [notificacion, setNotificacion] = useState(null);
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/avisos');
      const data = await res.json();
      if (data.length > 0 && data[0]._id !== lastAvisoId.current) {
        if (lastAvisoId.current) {
          setNotificacion({
            titulo: data[0].titulo,
            mensaje: data[0].mensaje,
            tipo: data[0].tipo
          });
        }
        lastAvisoId.current = data[0]._id;
        fetchAvisos();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchAvisos]);
  return [notificacion, setNotificacion];
}

function AvisosPanel() {
  const [avisos, setAvisos] = useState([]);
  const [nuevoAviso, setNuevoAviso] = useState({ titulo: '', mensaje: '', tipo: 'info' });
  const [mensaje, setMensaje] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  // Definir fetchAvisos con useCallback para evitar recreación innecesaria
  const fetchAvisos = React.useCallback(async () => {
    const res = await fetch('/api/avisos');
    const data = await res.json();
    setAvisos(data);
  }, []);

  const [notificacion, setNotificacion] = useAvisosRealtime(fetchAvisos);

  useEffect(() => {
    fetchAvisos();
  }, [fetchAvisos]);

  const handleChange = e => {
    setNuevoAviso({ ...nuevoAviso, [e.target.name]: e.target.value });
  };

  // Selector de tiendas (multi-selección)
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState([]);
  const tiendas = window.tiendas || [];

  const handleTiendasChange = e => {
    const options = Array.from(e.target.options);
    const seleccionadas = options.filter(o => o.selected).map(o => o.value);
    setTiendasSeleccionadas(seleccionadas);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    if (!nuevoAviso.titulo || !nuevoAviso.mensaje) {
      setMensaje('Título y mensaje obligatorios.');
      return;
    }
    // Si se selecciona "Todas las tiendas", enviar a todas
    let tiendasDestino = tiendasSeleccionadas.includes('ALL') ? tiendas.map(t => t.id) : tiendasSeleccionadas;
    if (tiendasDestino.length === 0) {
      setMensaje('Selecciona al menos una tienda.');
      return;
    }
    let ok = true;
    for (const tiendaId of tiendasDestino) {
      const aviso = { ...nuevoAviso, tiendaId };
      const res = await fetch('/api/avisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aviso)
      });
      if (!res.ok) ok = false;
    }
    if (ok) {
      setMensaje('Aviso creado.');
      setNuevoAviso({ titulo: '', mensaje: '', tipo: 'info' });
      setTiendasSeleccionadas([]);
      fetchAvisos();
    } else {
      setMensaje('Error al crear aviso.');
    }
  };

  // Obtener rol del usuario desde window (simulación, en producción usar contexto global o auth)
  const rolUsuario = window.rolUsuario || 'usuario';

  return (
    <div className="panel-avisos">
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Filtros activos: tienda, tipo
              let query = [];
              if (tiendasSeleccionadas.length === 1) query.push(`tiendaId=${encodeURIComponent(tiendasSeleccionadas[0])}`);
              if (nuevoAviso.tipo) query.push(`tipo=${encodeURIComponent(nuevoAviso.tipo)}`);
              const url = `/api/exportar/avisos` + (query.length ? `?${query.join('&')}` : '');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `avisos_export_${Date.now()}.xlsx`;
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
      {/* Notificación emergente */}
      {notificacion && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: notificacion.tipo === 'error' ? '#d32f2f' : notificacion.tipo === 'warning' ? '#fbc02d' : '#1976d2',
          color: '#fff', padding: '18px 32px', borderRadius: 12, boxShadow: '0 2px 16px #0002', fontWeight: 600, fontSize: 18
        }}
        onClick={() => setNotificacion(null)}
        >
          <b style={{marginRight:12}}>{notificacion.titulo}</b> {notificacion.mensaje}
        </div>
      )}
      <h2>Avisos y Notificaciones</h2>
      <form onSubmit={handleSubmit} style={{marginBottom:24,background:'#f9f9f9',padding:16,borderRadius:8}}>
        {['admin','supervisor','fabrica'].includes(rolUsuario) ? (
          <>
            <div style={{marginBottom:12}}>
              <label>Tienda(s):&nbsp;</label>
              <select name="tiendas" multiple value={tiendasSeleccionadas} onChange={handleTiendasChange} style={{width:300, height:48}}>
                <option value="ALL">Todas las tiendas</option>
                {tiendas.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <label>Título:&nbsp;</label>
              <input type="text" name="titulo" value={nuevoAviso.titulo} onChange={handleChange} style={{width:200}} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Mensaje:&nbsp;</label>
              <input type="text" name="mensaje" value={nuevoAviso.mensaje} onChange={handleChange} style={{width:400}} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Tipo:&nbsp;</label>
              <select name="tipo" value={nuevoAviso.tipo} onChange={handleChange}>
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button type="submit">Crear aviso</button>
          </>
        ) : (
          <div style={{marginBottom:16, color:'#888'}}>No tienes permisos para crear avisos.</div>
        )}
      </form>
      {mensaje && <div style={{marginBottom:16, color: mensaje.startsWith('Error') ? 'red' : 'green'}}>{mensaje}</div>}
      <h3>Histórico de avisos</h3>
      <div style={{marginBottom:16}}>
        <label>Filtrar por tienda:&nbsp;</label>
        <select
          value={tiendasSeleccionadas.length === 1 ? tiendasSeleccionadas[0] : ''}
          onChange={e => setTiendasSeleccionadas(e.target.value ? [e.target.value] : [])}
          style={{width:220}}
        >
          <option value="">Todas</option>
          {tiendas.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>
      <table style={{width:'100%',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #eee'}}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tienda</th>
            <th>Título</th>
            <th>Mensaje</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {avisos.filter(a =>
            tiendasSeleccionadas.length === 0 || tiendasSeleccionadas.includes(a.tiendaId)
          ).length === 0 ? (
            <tr><td colSpan="5">No hay avisos</td></tr>
          ) : (
            avisos.filter(a =>
              tiendasSeleccionadas.length === 0 || tiendasSeleccionadas.includes(a.tiendaId)
            ).map((a) => (
              <tr key={a._id}>
                <td>{a.fecha ? new Date(a.fecha).toLocaleString() : '-'}</td>
                <td>{tiendas.find(t => t.id === a.tiendaId)?.nombre || a.tiendaId || '-'}</td>
                <td>{a.titulo}</td>
                <td>{a.mensaje}</td>
                <td>{a.tipo}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AvisosPanel;
