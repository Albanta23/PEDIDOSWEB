import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovimientosStock, registrarBajaStock } from '../services/movimientosStockService';
import TransferenciasPanel from './TransferenciasPanel';

export default function AlmacenTiendaPanel({ tiendaActual }) {
  const navigate = typeof useNavigate === 'function' ? useNavigate() : null;
  const params = typeof useParams === 'function' ? useParams() : {};
  const tienda = tiendaActual || (window.tiendas ? window.tiendas.find(t => t.id === params.idTienda) : null);

  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Nueva pestaña para transferencias y devoluciones
  const [tab, setTab] = useState('stock'); // stock | bajas | transferencias
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  // Baja de producto
  const [productoBaja, setProductoBaja] = useState('');
  const [cantidadBaja, setCantidadBaja] = useState('');
  const [unidadBaja, setUnidadBaja] = useState('kg');
  const [loteBaja, setLoteBaja] = useState('');
  const [motivoBaja, setMotivoBaja] = useState('');

  useEffect(() => {
    if (!tienda) return;
    setCargando(true);
    getMovimientosStock({ tiendaId: tienda.id })
      .then(movs => {
        setMovimientos(movs);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [tienda]);

  // Refrescar stock automáticamente tras confirmar transferencia
  useEffect(() => {
    if (!tienda) return;
    setCargando(true);
    getMovimientosStock({ tiendaId: tienda.id })
      .then(movs => {
        setMovimientos(movs);
        setCargando(false);
      })
      .catch(() => setCargando(false));
    // Suscribirse a eventos de transferencias confirmadas si hay WebSocket/socket.io
    if (window.socket) {
      const handler = () => getMovimientosStock({ tiendaId: tienda.id }).then(setMovimientos);
      window.socket.on('transferencia_confirmada', handler);
      return () => window.socket.off('transferencia_confirmada', handler);
    }
  }, [tienda]);

  // Función para consultar el stock actual de un producto/lote en la tienda
  function getStockActual(producto, lote) {
    const entradaTotal = movimientos.filter(m => m.tipo === 'entrada' && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    const bajasTotal = movimientos.filter(m => m.tipo === 'baja' && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    return entradaTotal - bajasTotal;
  }

  // Baja de producto
  const registrarBaja = async (producto, cantidad, unidad, lote, motivo) => {
    if (!tienda) return;
    await registrarBajaStock({ tiendaId: tienda.id, producto, cantidad, unidad, lote, motivo });
    // Refrescar movimientos tras registrar baja
    const movs = await getMovimientosStock({ tiendaId: tienda.id });
    setMovimientos(movs);
  };

  if (!tienda) return null;

  // Filtrado de stock
  const stockFiltrado = movimientos.filter(s =>
    (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
    (!filtroLote || (s.lote && s.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
    (!filtroFechaDesde || (s.fecha && s.fecha >= filtroFechaDesde)) &&
    (!filtroFechaHasta || (s.fecha && s.fecha <= filtroFechaHasta))
  );

  return (
    <div style={{padding:32, maxWidth:900, margin:'0 auto'}}>
      <h2>Gestión de almacén de {tienda?.nombre || 'Tienda'}</h2>
      <button onClick={() => navigate ? navigate(-1) : window.history.back()} style={{position:'absolute',top:24,right:32,background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Volver</button>
      <div style={{display:'flex',gap:24,marginBottom:24}}>
        <button onClick={()=>setTab('stock')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='stock'?'#007bff':'#eee',color:tab==='stock'?'#fff':'#333',fontWeight:700}}>Stock</button>
        <button onClick={()=>setTab('bajas')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='bajas'?'#dc3545':'#eee',color:tab==='bajas'?'#fff':'#333',fontWeight:700}}>Bajas</button>
        <button onClick={()=>setTab('transferencias')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='transferencias'?'#28a745':'#eee',color:tab==='transferencias'?'#fff':'#333',fontWeight:700}}>Transferencias</button>
        <button onClick={()=>navigate(`/compras-proveedor/${tienda?.id}`)} style={{padding:'8px 24px',border:'none',borderRadius:6,background:'#ff9800',color:'#fff',fontWeight:700}}>Compras a proveedor</button>
      </div>
      {tab==='stock' && (
        <div>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <input placeholder="Filtrar producto" value={filtroProducto} onChange={e=>setFiltroProducto(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <input placeholder="Filtrar lote" value={filtroLote} onChange={e=>setFiltroLote(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Desde
              <input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Hasta
              <input type="date" value={filtroFechaHasta} onChange={e=>setFiltroFechaHasta(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
          </div>
          {cargando ? <p>Cargando stock...</p> : (
            <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse',background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11'}}>
              <thead>
                <tr style={{background:'#f8fafd'}}>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Stock actual</th>
                  <th>Unidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((s, idx) => (
                  <tr key={idx}>
                    <td>{s.producto}</td>
                    <td>{s.lote}</td>
                    <td>{getStockActual(s.producto, s.lote)}</td>
                    <td>{s.unidad}</td>
                    <td>{s.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab==='bajas' && (
        <div>
          <h3>Registrar baja de producto</h3>
          <div style={{display:'flex',gap:16,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
            <select value={productoBaja} onChange={e=>{
              setProductoBaja(e.target.value);
              // Autocompletar lote y unidad si existe
              const prod = movimientos.find(s=>s.producto===e.target.value);
              if(prod){ setUnidadBaja(prod.unidad); setLoteBaja(prod.lote); }
            }} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:120}}>
              <option value="">Selecciona producto</option>
              {movimientos.map((s,idx)=>(<option key={idx} value={s.producto}>{s.producto}</option>))}
            </select>
            <input type="number" min="0" step="any" placeholder="Cantidad" value={cantidadBaja} onChange={e=>setCantidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <select value={unidadBaja} onChange={e=>setUnidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}>
              <option value="kg">kg</option>
              <option value="ud">ud</option>
            </select>
            <input placeholder="Lote" value={loteBaja} onChange={e=>setLoteBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <input placeholder="Motivo de la baja" value={motivoBaja} onChange={e=>setMotivoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}} />
            <button
              onClick={() => {
                if(!productoBaja || !cantidadBaja || !motivoBaja){ alert('Rellena todos los campos'); return; }
                registrarBaja(productoBaja, cantidadBaja, unidadBaja, loteBaja, motivoBaja);
                setProductoBaja(''); setCantidadBaja(''); setUnidadBaja('kg'); setLoteBaja(''); setMotivoBaja('');
              }}
              style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Aceptar baja
            </button>
          </div>
          <h4>Histórico de bajas</h4>
          <ul style={{background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11',padding:'12px 18px'}}>
            {movimientos.filter(m => m.tipo === 'baja').map((b,idx)=>(
              <li key={idx}>{b.fecha}: {b.producto} - {b.cantidad} {b.unidad} (Lote: {b.lote}) [{b.motivo}]</li>
            ))}
          </ul>
        </div>
      )}
      {tab==='transferencias' && (
        <div>
          <TransferenciasPanel tiendas={window.tiendas || []} tiendaActual={tienda} modoFabrica={false} onTransferenciaConfirmada={() => getMovimientosStock({ tiendaId: tienda.id }).then(setMovimientos)} />
        </div>
      )}
    </div>
  );
}
