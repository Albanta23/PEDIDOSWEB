import React, { useEffect, useState } from 'react';

function MovimientosStockPanel() {
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState({ producto: '', lote: '', tipo: '' });
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({ fechaDesde: '', fechaHasta: '', ubicacion: '' });
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    setLoading(true);
    let query = [];
    if (filtro.producto) query.push(`producto=${filtro.producto}`);
    if (filtro.lote) query.push(`lote=${filtro.lote}`);
    if (filtro.tipo) query.push(`tipo=${filtro.tipo}`);
    if (filtrosAvanzados.fechaDesde) query.push(`fechaDesde=${filtrosAvanzados.fechaDesde}`);
    if (filtrosAvanzados.fechaHasta) query.push(`fechaHasta=${filtrosAvanzados.fechaHasta}`);
    if (filtrosAvanzados.ubicacion) query.push(`ubicacion=${filtrosAvanzados.ubicacion}`);
    const url = '/api/movimientos' + (query.length ? '?' + query.join('&') : '');
    const res = await fetch(url);
    const data = await res.json();
    setMovimientos(data);
    setLoading(false);
  };

  const handleFiltroChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const handleFiltroAvanzadoChange = (e) => {
    setFiltrosAvanzados({ ...filtrosAvanzados, [e.target.name]: e.target.value });
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    fetchMovimientos();
  };

  return (
    <div className="panel-movimientos-stock">
      <h2>Movimientos de Stock</h2>
      {/* Botón Exportar a Excel */}
      <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:12}}>
        <button
          onClick={async () => {
            setExportando(true);
            setErrorExport("");
            try {
              // Construir query string con los filtros activos
              let query = [];
              if (filtro.producto) query.push(`producto=${encodeURIComponent(filtro.producto)}`);
              if (filtro.lote) query.push(`lote=${encodeURIComponent(filtro.lote)}`);
              if (filtro.tipo) query.push(`tipo=${encodeURIComponent(filtro.tipo)}`);
              if (filtrosAvanzados.fechaDesde) query.push(`fechaDesde=${encodeURIComponent(filtrosAvanzados.fechaDesde)}`);
              if (filtrosAvanzados.fechaHasta) query.push(`fechaHasta=${encodeURIComponent(filtrosAvanzados.fechaHasta)}`);
              if (filtrosAvanzados.ubicacion) query.push(`ubicacion=${encodeURIComponent(filtrosAvanzados.ubicacion)}`);
              const url = `/api/exportar/movimientos` + (query.length ? `?${query.join('&')}` : '');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('Error al exportar: ' + res.statusText);
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `movimientos_stock_${new Date().toISOString().slice(0,10)}.xlsx`;
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
      <form onSubmit={handleBuscar} style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input
          type="text"
          name="producto"
          placeholder="Producto"
          value={filtro.producto}
          onChange={handleFiltroChange}
        />
        <input
          type="text"
          name="lote"
          placeholder="Lote"
          value={filtro.lote}
          onChange={handleFiltroChange}
        />
        <select name="tipo" value={filtro.tipo} onChange={handleFiltroChange}>
          <option value="">Todos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
          <option value="fabricacion">Fabricación</option>
          <option value="ajuste">Ajuste</option>
          <option value="transferencia">Transferencia</option>
        </select>
        {/* Filtros avanzados */}
        <input
          type="date"
          name="fechaDesde"
          placeholder="Desde"
          value={filtrosAvanzados.fechaDesde}
          onChange={handleFiltroAvanzadoChange}
        />
        <input
          type="date"
          name="fechaHasta"
          placeholder="Hasta"
          value={filtrosAvanzados.fechaHasta}
          onChange={handleFiltroAvanzadoChange}
        />
        <input
          type="text"
          name="ubicacion"
          placeholder="Ubicación"
          value={filtrosAvanzados.ubicacion}
          onChange={handleFiltroAvanzadoChange}
        />
        <button type="submit">Buscar</button>
      </form>
      {loading ? (
        <div>Cargando movimientos...</div>
      ) : (
        <table className="tabla-movimientos-stock">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr><td colSpan="7">No hay movimientos</td></tr>
            ) : (
              movimientos.map((m) => (
                <tr key={m._id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{m.productoNombre || m.producto}</td>
                  <td>{m.lote || '-'}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.tipo}</td>
                  <td>{m.ubicacion || '-'}</td>
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

export default MovimientosStockPanel;
