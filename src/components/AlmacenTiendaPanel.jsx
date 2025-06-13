import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovimientosStock, registrarBajaStock } from '../services/movimientosStockService';
import TransferenciasPanel from './TransferenciasPanel';
import { useProductos } from './ProductosContext';

export default function AlmacenTiendaPanel({ tiendaActual }) {
  const navigate = typeof useNavigate === 'function' ? useNavigate() : null;
  const params = typeof useParams === 'function' ? useParams() : {};
  const tienda = tiendaActual || (window.tiendas ? window.tiendas.find(t => t.id === params.idTienda) : null);

  const { productos } = useProductos();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Nueva pestaña para transferencias y devoluciones
  const [tab, setTab] = useState('stock'); // stock | bajas | transferencias
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');
  // Baja de producto
  const [productoBaja, setProductoBaja] = useState('');
  const [cantidadBaja, setCantidadBaja] = useState('');
  const [unidadBaja, setUnidadBaja] = useState('kg');
  const [loteBaja, setLoteBaja] = useState('');
  const [motivoBaja, setMotivoBaja] = useState('');

  // Forzar que el id de la tienda clientes sea siempre 'PEDIDOS_CLIENTES' (usando useMemo para evitar bucles)
  const tiendaForzada = useMemo(() => {
    if (tienda && typeof tienda.id === 'string' && tienda.id.trim().toLowerCase() === 'clientes') {
      return { ...tienda, id: 'PEDIDOS_CLIENTES', nombre: tienda.nombre || 'Clientes' };
    }
    return tienda;
  }, [tienda]);

  // DEBUG: Mostrar tienda y movimientos
  console.log('[DEBUG] tiendaForzada:', tiendaForzada);
  useEffect(() => {
    if (!tiendaForzada) return;
    setCargando(true);
    let tiendaIdStock = tiendaForzada.id;
    getMovimientosStock({ tiendaId: tiendaIdStock })
      .then(movs => {
        console.log('[DEBUG] Movimientos recibidos:', movs);
        setMovimientos(movs);
        setCargando(false);
      })
      .catch((e) => { console.log('[DEBUG] Error al cargar movimientos:', e); setCargando(false); });
  }, [tiendaForzada]);

  // Refrescar stock automáticamente tras confirmar transferencia
  useEffect(() => {
    if (!tiendaForzada) return;
    setCargando(true);
    let tiendaIdStock = tiendaForzada.id;
    getMovimientosStock({ tiendaId: tiendaIdStock })
      .then(movs => {
        setMovimientos(movs);
        setCargando(false);
      })
      .catch(() => setCargando(false));
    // Suscribirse a eventos de transferencias confirmadas si hay WebSocket/socket.io
    if (window.socket) {
      const handler = () => getMovimientosStock({ tiendaId: tiendaIdStock }).then(setMovimientos);
      window.socket.on('transferencia_confirmada', handler);
      return () => window.socket.off('transferencia_confirmada', handler);
    }
  }, [tiendaForzada]);

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

  if (!tiendaForzada) return null;

  // Obtener familias únicas con número y nombre, usando nombreFamilia si familia no existe
  const familias = useMemo(() => {
    const map = new Map();
    productos.forEach(p => {
      // Usar familia si existe, si no nombreFamilia
      const num = p.familia ? String(p.familia).trim() : (p.nombreFamilia ? String(p.nombreFamilia).trim() : '');
      const nombre = p.nombreFamilia ? String(p.nombreFamilia).trim() : (p.familia ? String(p.familia).trim() : '');
      if (num && nombre && !map.has(num)) {
        map.set(num, nombre);
      }
    });
    return Array.from(map.entries()); // [[numero, nombre], ...]
  }, [productos]);

  // Filtrado de stock
  const stockFiltrado = movimientos.filter(s => {
    // Buscar la familia del producto (normalizando nombre)
    const prod = productos.find(p => p.nombre.trim().toLowerCase() === (s.producto || '').trim().toLowerCase());
    // Usar familia o nombreFamilia para filtrar
    const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
    // Si hay filtro de familia y el producto no existe en la lista de productos, no mostrarlo
    if (filtroFamilia && (!prod || familia !== filtroFamilia)) return false;
    return (
      (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
      (!filtroLote || (s.lote && s.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
      (!filtroFechaDesde || (s.fecha && s.fecha >= filtroFechaDesde)) &&
      (!filtroFechaHasta || (s.fecha && s.fecha <= filtroFechaHasta))
    );
  });

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
          {/* Formulario para añadir stock manualmente */}
          <div style={{background:'#f8fafd',padding:16,borderRadius:8,marginBottom:18,boxShadow:'0 2px 8px #007bff11',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <b style={{color:'#007bff'}}>Añadir stock manualmente</b>
            <input placeholder="Producto" value={productoBaja} onChange={e=>setProductoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:120}} />
            <input type="number" min="0" step="any" placeholder="Cantidad" value={cantidadBaja} onChange={e=>setCantidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <select value={unidadBaja} onChange={e=>setUnidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}>
              <option value="kg">kg</option>
              <option value="ud">ud</option>
            </select>
            <input placeholder="Lote" value={loteBaja} onChange={e=>setLoteBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <input placeholder="Motivo" value={motivoBaja} onChange={e=>setMotivoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:120}} />
            <button
              onClick={async ()=>{
                if(!productoBaja || !cantidadBaja || !motivoBaja){ alert('Rellena todos los campos'); return; }
                const { registrarEntradaStock } = await import('../services/movimientosStockService');
                await registrarEntradaStock({ tiendaId: tienda.id, producto: productoBaja, cantidad: cantidadBaja, unidad: unidadBaja, lote: loteBaja, motivo: motivoBaja });
                setProductoBaja(''); setCantidadBaja(''); setUnidadBaja('kg'); setLoteBaja(''); setMotivoBaja('');
                // Refrescar movimientos tras registrar entrada
                const movs = await getMovimientosStock({ tiendaId: tienda.id });
                setMovimientos(movs);
              }}
              style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Añadir stock
            </button>
          </div>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <input placeholder="Filtrar producto" value={filtroProducto} onChange={e=>setFiltroProducto(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <input placeholder="Filtrar lote" value={filtroLote} onChange={e=>setFiltroLote(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <select value={filtroFamilia} onChange={e=>setFiltroFamilia(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}>
              <option value="">Todas las familias</option>
              {familias.map(([num, nombre], idx) => (
                <option key={idx} value={num}>{num} - {nombre}</option>
              ))}
            </select>
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
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Cantidad (ud)</th>
                  <th>Peso (kg)</th>
                  <th>Unidad</th>
                  <th>Formato</th>
                  <th>Familia</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Agrupar movimientos por producto, lote y formato
                  const agrupado = {};
                  movimientos.forEach(mov => {
                    // Calcular cantidad y peso por separado
                    let cantidad = mov.cantidadEnviada ?? mov.cantidad ?? 0;
                    let peso = mov.peso ?? 0;
                    const key = mov.producto + '||' + (mov.lote || '') + '||' + (mov.formato || mov.unidad || '');
                    if (!agrupado[key]) agrupado[key] = { producto: mov.producto, lote: mov.lote, formato: mov.formato || mov.unidad, entradas: 0, bajas: 0, fecha: mov.fecha, cantidadTotal: 0, pesoTotal: 0 };
                    if (mov.tipo === 'entrada' || mov.tipo === 'transferencia_entrada' || mov.tipo === 'devolucion_entrada') {
                      agrupado[key].cantidadTotal += Number(cantidad) || 0;
                      agrupado[key].pesoTotal += Number(peso) || 0;
                    }
                    if (mov.tipo === 'baja' || mov.tipo === 'transferencia_salida' || mov.tipo === 'devolucion_salida') {
                      agrupado[key].cantidadTotal -= Number(cantidad) || 0;
                      agrupado[key].pesoTotal -= Number(peso) || 0;
                    }
                    // Guardar la fecha más reciente
                    if (!agrupado[key].fecha || new Date(mov.fecha) > new Date(agrupado[key].fecha)) {
                      agrupado[key].fecha = mov.fecha;
                    }
                  });
                  // Filtrar y mostrar solo los que tengan stock o movimientos
                  return Object.values(agrupado)
                    .filter(s => {
                      // Mostrar si cantidad o peso es distinto de 0
                      return (
                        (s.cantidadTotal !== 0 || s.pesoTotal !== 0) &&
                        (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
                        (!filtroLote || (s.lote && s.lote.toLowerCase().includes(filtroLote.toLowerCase()))));
                    })
                    .map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.fecha ? new Date(s.fecha).toLocaleDateString() : '-'}</td>
                        <td>{s.fecha ? new Date(s.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{s.producto}</td>
                        <td>{s.lote}</td>
                        <td>{s.cantidadTotal !== undefined ? s.cantidadTotal.toFixed(2) : '-'}</td>
                        <td>{s.pesoTotal !== undefined ? s.pesoTotal.toFixed(2) : '-'}</td>
                        <td>{s.formato || '-'}</td>
                        <td>{s.formato || '-'}</td>
                        <td>{(() => {
                          const prod = productos.find(p => p.nombre.trim().toLowerCase() === (s.producto || '').trim().toLowerCase());
                          if (!prod) return '-';
                          if (prod.familia && prod.nombreFamilia) return prod.familia + ' - ' + prod.nombreFamilia;
                          if (prod.familia) return prod.familia;
                          return '-';
                        })()}</td>
                      </tr>
                    ));
                })()}
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
              {[...new Set(movimientos.map(s=>s.producto))].map((prod,idx)=>(
                <option key={idx} value={prod}>{prod}</option>
              ))}
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
