import React, { useState, useEffect } from 'react';
import { useProductos } from './ProductosContext';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001/api';
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/?$/, '/api');
}
const ALMACEN_CENTRAL_ID = 'almacen_central';
const TIENDAS = [
  { id: ALMACEN_CENTRAL_ID, nombre: 'Almacén Central' },
  ...(window.tiendas || [
    { id: 'tienda1', nombre: 'TIENDA BUS' },
    { id: 'tienda2', nombre: 'TIENDA SALAMANCA 1' },
    { id: 'tienda3', nombre: 'TIENDA SALAMANCA 2' },
    { id: 'tienda4', nombre: 'TIENDA PINILLA' },
    { id: 'tienda5', nombre: 'TIENDA TRES CRUCES' },
    { id: 'tienda6', nombre: 'TIENDA PLAZA DE ALEMANIA' },
    { id: 'tienda7', nombre: 'TIENDA AVDA GALICIA' },
    { id: 'tienda8', nombre: 'TIENDA MORADAS' },
    { id: 'tienda9', nombre: 'TIENDA FABRICA' },
    { id: 'tienda10', nombre: 'TIENDA HAM&WINE' },
    { id: 'clientes', nombre: 'PEDIDOS CLIENTES' },
    { id: 'tiendaPruebas', nombre: 'TIENDA PRUEBAS' }
  ])
];

// Panel principal para gestión del almacén central
export default function AlmacenCentralPanel() {
  const [isLogged, setIsLogged] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { productos } = useProductos();

  // Estado para entradas
  const [entrada, setEntrada] = useState({ producto: '', cantidad: '', unidad: 'kg', lote: '', motivo: 'Compra proveedor', peso: '' });
  const [mensajeEntrada, setMensajeEntrada] = useState('');

  // Estado para bajas
  const [baja, setBaja] = useState({ producto: '', cantidad: '', unidad: 'kg', lote: '', motivo: 'Baja manual', peso: '' });
  const [mensajeBaja, setMensajeBaja] = useState('');

  // Estado para stock y movimientos
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [cargandoMovs, setCargandoMovs] = useState(false);
  // Cambiar filtroProducto a selección múltiple
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [almacenesSeleccionados, setAlmacenesSeleccionados] = useState([ALMACEN_CENTRAL_ID]);
  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estado para pestaña activa
  const [tab, setTab] = useState('entradas'); // entradas | bajas | stock | movimientos

  // --- NUEVO: Filtro de producto con autocompletado (datalist) ---
  const productosUnicos = productos.map(p => p.nombre);

  // --- NUEVO: Selector múltiple de almacenes también para stock ---
  // Cargar stock agrupado (por producto y almacén) de todos los almacenes seleccionados
  const cargarStock = async () => {
    setCargandoStock(true);
    try {
      let stockMap = {};
      let pesoMap = {};
      let porAlmacen = {};
      for (const tiendaId of almacenesSeleccionados) {
        let url = `${API_URL}/movimientos-stock?tiendaId=${tiendaId}`;
        const res = await fetch(url);
        let movs = await res.json();
        // Filtrar por fecha si aplica
        if (fechaDesde) movs = movs.filter(m => m.fecha && new Date(m.fecha) >= new Date(fechaDesde));
        if (fechaHasta) movs = movs.filter(m => m.fecha && new Date(m.fecha) <= new Date(fechaHasta+'T23:59:59'));
        for (const mov of movs) {
          if (!stockMap[mov.producto]) stockMap[mov.producto] = 0;
          if (!pesoMap[mov.producto]) pesoMap[mov.producto] = 0;
          if (!porAlmacen[mov.producto]) porAlmacen[mov.producto] = {};
          if (!porAlmacen[mov.producto][tiendaId]) porAlmacen[mov.producto][tiendaId] = { cantidad: 0, peso: 0 };
          const cantidad = Number(mov.cantidad) || 0;
          const peso = Number(mov.peso) || 0;
          if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
            stockMap[mov.producto] += cantidad;
            pesoMap[mov.producto] += peso;
            porAlmacen[mov.producto][tiendaId].cantidad += cantidad;
            porAlmacen[mov.producto][tiendaId].peso += peso;
          } else if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
            stockMap[mov.producto] -= cantidad;
            pesoMap[mov.producto] -= peso;
            porAlmacen[mov.producto][tiendaId].cantidad -= cantidad;
            porAlmacen[mov.producto][tiendaId].peso -= peso;
          }
        }
      }
      setStock(Object.entries(stockMap).map(([producto, cantidad]) => ({
        producto,
        cantidad,
        peso: pesoMap[producto],
        porAlmacen: porAlmacen[producto]
      })));
    } catch {
      setStock([]);
    }
    setCargandoStock(false);
  };

  // Login simple con pin fijo
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1810') {
      setIsLogged(true);
      setError('');
    } else {
      setError('PIN incorrecto');
    }
  };

  // Entradas de stock
  const handleEntradaChange = (campo, valor) => setEntrada(e => ({ ...e, [campo]: valor }));
  const registrarEntrada = async (e) => {
    e.preventDefault();
    if (!entrada.producto || !entrada.cantidad) {
      setMensajeEntrada('Producto y cantidad obligatorios');
      return;
    }
    try {
      await fetch(`${API_URL}/movimientos-stock/entrada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entrada, tiendaId: ALMACEN_CENTRAL_ID })
      });
      setMensajeEntrada('Entrada registrada');
      setEntrada({ producto: '', cantidad: '', unidad: 'kg', lote: '', motivo: 'Compra proveedor', peso: '' });
      cargarStock();
      cargarMovimientos();
    } catch {
      setMensajeEntrada('Error al registrar entrada');
    }
  };

  // Bajas de stock
  const handleBajaChange = (campo, valor) => setBaja(e => ({ ...e, [campo]: valor }));
  const registrarBaja = async (e) => {
    e.preventDefault();
    if (!baja.producto || !baja.cantidad) {
      setMensajeBaja('Producto y cantidad obligatorios');
      return;
    }
    try {
      await fetch(`${API_URL}/movimientos-stock/baja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baja, tiendaId: ALMACEN_CENTRAL_ID })
      });
      setMensajeBaja('Baja registrada');
      setBaja({ producto: '', cantidad: '', unidad: 'kg', lote: '', motivo: 'Baja manual', peso: '' });
      cargarStock();
      cargarMovimientos();
    } catch {
      setMensajeBaja('Error al registrar baja');
    }
  };

  // Cargar movimientos de los almacenes seleccionados
  const cargarMovimientos = async () => {
    setCargandoMovs(true);
    try {
      let movimientosTotales = [];
      for (const tiendaId of almacenesSeleccionados) {
        let url = `${API_URL}/movimientos-stock?tiendaId=${tiendaId}`;
        const res = await fetch(url);
        let movs = await res.json();
        // Filtrar por fecha si aplica
        if (fechaDesde) movs = movs.filter(m => m.fecha && new Date(m.fecha) >= new Date(fechaDesde));
        if (fechaHasta) movs = movs.filter(m => m.fecha && new Date(m.fecha) <= new Date(fechaHasta+'T23:59:59'));
        movimientosTotales = movimientosTotales.concat(movs.map(m => ({ ...m, tiendaId })));
      }
      // Ordenar por fecha descendente
      movimientosTotales.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setMovimientos(movimientosTotales);
    } catch {
      setMovimientos([]);
    }
    setCargandoMovs(false);
  };

  useEffect(() => {
    if (isLogged) {
      cargarStock();
      cargarMovimientos();
    }
  }, [isLogged, almacenesSeleccionados, fechaDesde, fechaHasta]);

  // Estado para mostrar/ocultar columnas de cantidad y peso en stock
  const [mostrarCantidad, setMostrarCantidad] = useState(true);
  const [mostrarPeso, setMostrarPeso] = useState(true);

  if (!isLogged) {
    return (
      <div style={{maxWidth:340,margin:'60px auto',padding:32,background:'#f8fafd',borderRadius:12,boxShadow:'0 2px 12px #007bff22'}}>
        <h2 style={{textAlign:'center',color:'#1976d2'}}>Acceso Almacén Central</h2>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:16}}>
          <input type="password" placeholder="PIN administrador" value={pin} onChange={e=>setPin(e.target.value)} style={{padding:10,fontSize:18,borderRadius:8,border:'1px solid #bbb'}} autoFocus />
          <button type="submit" style={{background:'#1976d2',color:'#fff',fontWeight:700,padding:12,border:'none',borderRadius:8,fontSize:18}}>Entrar</button>
          {error && <div style={{color:'#b71c1c',fontWeight:600}}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',overflow:'auto',background:'#fff',zIndex:10000}}>
      <div style={{maxWidth:1400,minHeight:'100vh',margin:'0 auto',padding:32,background:'#fff',borderRadius:0,boxShadow:'none'}}>
        <h1 style={{color:'#1976d2',marginBottom:24}}>Almacén Central</h1>
        <div style={{display:'flex',gap:24,marginBottom:24}}>
          <button onClick={()=>setTab('entradas')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='entradas'?'#1976d2':'#eee',color:tab==='entradas'?'#fff':'#333',fontWeight:700}}>Entradas por compras</button>
          <button onClick={()=>setTab('bajas')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='bajas'?'#b71c1c':'#eee',color:tab==='bajas'?'#fff':'#333',fontWeight:700}}>Bajas y ajustes</button>
          <button onClick={()=>setTab('stock')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='stock'?'#388e3c':'#eee',color:tab==='stock'?'#fff':'#333',fontWeight:700}}>Stock</button>
          <button onClick={()=>setTab('movimientos')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='movimientos'?'#673ab7':'#eee',color:tab==='movimientos'?'#fff':'#333',fontWeight:700}}>Diario de movimientos</button>
        </div>
        {tab==='entradas' && (
          <div style={{flex:1,minWidth:320}}>
            <h2>Entradas por compras a proveedor</h2>
            <form onSubmit={registrarEntrada} style={{background:'#f8fafd',padding:18,borderRadius:10,marginBottom:18,display:'flex',flexDirection:'column',gap:10}}>
              <select value={entrada.producto} onChange={e=>handleEntradaChange('producto',e.target.value)} style={{padding:8,borderRadius:6}} required>
                <option value="">Selecciona producto</option>
                {productos.map(p=>(<option key={p._id||p.nombre} value={p.nombre}>{p.nombre}</option>))}
              </select>
              <input type="number" min="0.01" step="any" value={entrada.cantidad} onChange={e=>handleEntradaChange('cantidad',e.target.value)} placeholder="Cantidad" style={{padding:8,borderRadius:6}} required />
              <input type="text" value={entrada.unidad} onChange={e=>handleEntradaChange('unidad',e.target.value)} placeholder="Unidad" style={{padding:8,borderRadius:6}} />
              <input type="text" value={entrada.lote} onChange={e=>handleEntradaChange('lote',e.target.value)} placeholder="Lote" style={{padding:8,borderRadius:6}} />
              <input type="text" value={entrada.motivo} onChange={e=>handleEntradaChange('motivo',e.target.value)} placeholder="Motivo" style={{padding:8,borderRadius:6}} />
              <input type="number" min="0" step="any" value={entrada.peso} onChange={e=>handleEntradaChange('peso',e.target.value)} placeholder="Peso (opcional)" style={{padding:8,borderRadius:6}} />
              <button type="submit" style={{background:'#1976d2',color:'#fff',fontWeight:700,padding:10,border:'none',borderRadius:8}}>Registrar entrada</button>
              {mensajeEntrada && <div style={{color:mensajeEntrada.includes('Error')?'#b71c1c':'#388e3c',fontWeight:600}}>{mensajeEntrada}</div>}
            </form>
          </div>
        )}
        {tab==='bajas' && (
          <div style={{flex:1,minWidth:320}}>
            <h2>Bajas y ajustes</h2>
            <form onSubmit={registrarBaja} style={{background:'#f8fafd',padding:18,borderRadius:10,marginBottom:18,display:'flex',flexDirection:'column',gap:10}}>
              <select value={baja.producto} onChange={e=>handleBajaChange('producto',e.target.value)} style={{padding:8,borderRadius:6}} required>
                <option value="">Selecciona producto</option>
                {productos.map(p=>(<option key={p._id||p.nombre} value={p.nombre}>{p.nombre}</option>))}
              </select>
              <input type="number" min="0.01" step="any" value={baja.cantidad} onChange={e=>handleBajaChange('cantidad',e.target.value)} placeholder="Cantidad" style={{padding:8,borderRadius:6}} required />
              <input type="text" value={baja.unidad} onChange={e=>handleBajaChange('unidad',e.target.value)} placeholder="Unidad" style={{padding:8,borderRadius:6}} />
              <input type="text" value={baja.lote} onChange={e=>handleBajaChange('lote',e.target.value)} placeholder="Lote" style={{padding:8,borderRadius:6}} />
              <input type="text" value={baja.motivo} onChange={e=>handleBajaChange('motivo',e.target.value)} placeholder="Motivo" style={{padding:8,borderRadius:6}} />
              <input type="number" min="0" step="any" value={baja.peso} onChange={e=>handleBajaChange('peso',e.target.value)} placeholder="Peso (opcional)" style={{padding:8,borderRadius:6}} />
              <button type="submit" style={{background:'#b71c1c',color:'#fff',fontWeight:700,padding:10,border:'none',borderRadius:8}}>Registrar baja</button>
              {mensajeBaja && <div style={{color:mensajeBaja.includes('Error')?'#b71c1c':'#388e3c',fontWeight:600}}>{mensajeBaja}</div>}
            </form>
          </div>
        )}
        {tab==='stock' && (
          <div style={{marginTop:16}}>
            <h2>Stock actual ({almacenesSeleccionados.length > 1 ? 'Varios almacenes' : almacenesSeleccionados[0] === ALMACEN_CENTRAL_ID ? 'Almacén Central' : TIENDAS.find(t=>t.id===almacenesSeleccionados[0])?.nombre || ''})</h2>
            <div style={{marginBottom:10,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
              <select multiple value={productosSeleccionados} onChange={e=>{
                const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                setProductosSeleccionados(opts);
              }} style={{padding:8,borderRadius:6,minWidth:220,maxWidth:400}} size={Math.min(8,productosUnicos.length+1)}>
                {productosUnicos.map((p,i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
              <span style={{fontSize:13,color:'#888'}}>Selecciona uno o varios productos</span>
              <select multiple value={almacenesSeleccionados} onChange={e=>{
                const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                setAlmacenesSeleccionados(opts.length?opts:[ALMACEN_CENTRAL_ID]);
              }} style={{padding:8,borderRadius:6,minWidth:220,maxWidth:400}} size={Math.min(8,TIENDAS.length+1)}>
                {TIENDAS.map(t=>(<option key={t.id} value={t.id}>{t.nombre}</option>))}
              </select>
              <span style={{fontSize:13,color:'#888'}}>Selecciona uno o varios almacenes</span>
              <label style={{fontSize:14}}>
                <input type="checkbox" checked={mostrarCantidad} onChange={e=>setMostrarCantidad(e.target.checked)} /> Mostrar cantidad
              </label>
              <label style={{fontSize:14}}>
                <input type="checkbox" checked={mostrarPeso} onChange={e=>setMostrarPeso(e.target.checked)} /> Mostrar peso
              </label>
              <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} style={{padding:8,borderRadius:6}} />
              <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} style={{padding:8,borderRadius:6}} />
            </div>
            {cargandoStock ? <div>Cargando stock...</div> : (
              <table style={{width:'100%',marginTop:10,background:'#f8fafd',borderRadius:10}}>
                <thead>
                  <tr style={{background:'#eaf4ff'}}>
                    <th style={{padding:8}}>Producto</th>
                    {mostrarCantidad && <th style={{padding:8}}>Cantidad total</th>}
                    {mostrarPeso && <th style={{padding:8}}>Peso total (kg)</th>}
                    {almacenesSeleccionados.length > 1 && mostrarCantidad && almacenesSeleccionados.map(aid => (
                      <th key={aid} style={{padding:8}}>{TIENDAS.find(t=>t.id===aid)?.nombre||aid} (Cant.)</th>
                    ))}
                    {almacenesSeleccionados.length > 1 && mostrarPeso && almacenesSeleccionados.map(aid => (
                      <th key={aid+"peso"} style={{padding:8}}>{TIENDAS.find(t=>t.id===aid)?.nombre||aid} (Peso)</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stock.filter(s=>productosSeleccionados.length===0||productosSeleccionados.includes(s.producto)).length === 0 && <tr><td colSpan={1+(mostrarCantidad?1:0)+(mostrarPeso?1:0)+((almacenesSeleccionados.length>1)?(almacenesSeleccionados.length*(mostrarCantidad?1:0)+almacenesSeleccionados.length*(mostrarPeso?1:0)):0)} style={{color:'#888',padding:10}}>Sin stock registrado</td></tr>}
                  {stock.filter(s=>productosSeleccionados.length===0||productosSeleccionados.includes(s.producto)).map(s=>(
                    <tr key={s.producto}>
                      <td style={{padding:8}}>{s.producto}</td>
                      {mostrarCantidad && <td style={{padding:8}}>{s.cantidad}</td>}
                      {mostrarPeso && <td style={{padding:8}}>{Number(s.peso).toFixed(2)}</td>}
                      {almacenesSeleccionados.length > 1 && mostrarCantidad && almacenesSeleccionados.map(aid => (
                        <td key={aid} style={{padding:8}}>{s.porAlmacen?.[aid]?.cantidad ?? 0}</td>
                      ))}
                      {almacenesSeleccionados.length > 1 && mostrarPeso && almacenesSeleccionados.map(aid => (
                        <td key={aid+"peso"} style={{padding:8}}>{Number(s.porAlmacen?.[aid]?.peso ?? 0).toFixed(2)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {tab==='movimientos' && (
          <div style={{marginTop:16}}>
            <h2>Diario de movimientos ({almacenesSeleccionados.length > 1 ? 'Varios almacenes' : almacenesSeleccionados[0] === ALMACEN_CENTRAL_ID ? 'Almacén Central' : TIENDAS.find(t=>t.id===almacenesSeleccionados[0])?.nombre || ''})</h2>
            <div style={{marginBottom:10,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
              <select multiple value={productosSeleccionados} onChange={e=>{
                const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                setProductosSeleccionados(opts);
              }} style={{padding:8,borderRadius:6,minWidth:220,maxWidth:400}} size={Math.min(8,productosUnicos.length+1)}>
                {productosUnicos.map((p,i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
              <span style={{fontSize:13,color:'#888'}}>Selecciona uno o varios productos</span>
              <select multiple value={almacenesSeleccionados} onChange={e=>{
                const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                setAlmacenesSeleccionados(opts.length?opts:[ALMACEN_CENTRAL_ID]);
              }} style={{padding:8,borderRadius:6,minWidth:220,maxWidth:400}} size={Math.min(8,TIENDAS.length+1)}>
                {TIENDAS.map(t=>(<option key={t.id} value={t.id}>{t.nombre}</option>))}
              </select>
              <span style={{fontSize:13,color:'#888'}}>Selecciona uno o varios almacenes</span>
              <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} style={{padding:8,borderRadius:6}} />
              <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} style={{padding:8,borderRadius:6}} />
            </div>
            {cargandoMovs ? <div>Cargando movimientos...</div> : (
              <table style={{width:'100%',marginTop:10,background:'#f8fafd',borderRadius:10}}>
                <thead>
                  <tr style={{background:'#eaf4ff'}}>
                    <th style={{padding:8}}>Fecha</th>
                    <th style={{padding:8}}>Tipo</th>
                    <th style={{padding:8}}>Producto</th>
                    <th style={{padding:8}}>Cantidad</th>
                    <th style={{padding:8}}>Unidad</th>
                    <th style={{padding:8}}>Peso (kg)</th>
                    {productosSeleccionados.length===1 && <th style={{padding:8}}>PESO TOTAL (kg)</th>}
                    <th style={{padding:8}}>Lote</th>
                    {almacenesSeleccionados.length > 1 && <th style={{padding:8}}>Almacén/Tienda</th>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let saldoPeso = 0;
                    // Ordenar de más antiguo a más nuevo
                    const movsFiltrados = movimientos
                      .filter(m=>productosSeleccionados.length===0||productosSeleccionados.includes(m.producto))
                      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                    if(movsFiltrados.length === 0) return <tr><td colSpan={almacenesSeleccionados.length>1?9:8} style={{color:'#888',padding:10}}>Sin movimientos</td></tr>;
                    return movsFiltrados.map((m,idx)=>{
                      const peso = Number(m.peso)||0;
                      let rowColor = '';
                      if (["entrada","transferencia_entrada","devolucion_entrada"].includes(m.tipo)) {
                        rowColor = '#e8f5e9';
                        saldoPeso += peso;
                      } else if (m.tipo === "baja") {
                        rowColor = '#ff5252';
                        saldoPeso -= peso;
                      } else if (["transferencia_salida","devolucion_salida"].includes(m.tipo)) {
                        rowColor = '#ffebee';
                        saldoPeso -= peso;
                      } else {
                        rowColor = '#f5f5f5';
                      }
                      // Extraer dirección del movimiento (siempre mostrar, incluso si solo está marcado almacén central)
                      let direccion = '';
                      if (m.tipo === 'transferencia_entrada' && m.tiendaDestino && m.tiendaId) {
                        const origen = TIENDAS.find(t=>t.id===m.tiendaId)?.nombre || m.tiendaId;
                        const destino = TIENDAS.find(t=>t.id===m.tiendaDestino)?.nombre || m.tiendaDestino;
                        direccion = `${origen} → ${destino}`;
                      } else if (m.tipo === 'transferencia_salida' && m.tiendaDestino && m.tiendaId) {
                        const origen = TIENDAS.find(t=>t.id===m.tiendaId)?.nombre || m.tiendaId;
                        const destino = TIENDAS.find(t=>t.id===m.tiendaDestino)?.nombre || m.tiendaDestino;
                        direccion = `${origen} → ${destino}`;
                      } else if (m.tipo === 'entrada') {
                        direccion = `→ ${TIENDAS.find(t=>t.id===m.tiendaId)?.nombre || (m.tiendaId === ALMACEN_CENTRAL_ID ? 'Almacén Central' : m.tiendaId)}`;
                      } else if (m.tipo === 'baja') {
                        direccion = `${TIENDAS.find(t=>t.id===m.tiendaId)?.nombre || (m.tiendaId === ALMACEN_CENTRAL_ID ? 'Almacén Central' : m.tiendaId)} →`;
                      } else {
                        direccion = '';
                      }
                      return (
                        <tr key={idx} style={{background: rowColor}}>
                          <td style={{padding:8}}>{m.fecha ? new Date(m.fecha).toLocaleString() : '-'}</td>
                          <td style={{padding:8}}>{direccion}</td>
                          <td style={{padding:8}}>{m.producto}</td>
                          <td style={{padding:8}}>{m.cantidad}</td>
                          <td style={{padding:8}}>{m.unidad}</td>
                          <td style={{padding:8}}>{peso.toFixed(2)}</td>
                          {productosSeleccionados.length===1 && <td style={{padding:8}}>{saldoPeso.toFixed(2)}</td>}
                          <td style={{padding:8}}>{m.lote}</td>
                          {almacenesSeleccionados.length > 1 && <td style={{padding:8}}>{direccion}</td>}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Utilidad para filtrar stock por fecha (dummy, requiere lógica real si se quiere filtrar stock histórico)
function stockMovimientosIncluyeFecha(producto, desde, hasta, almacenes) {
  // Por simplicidad, siempre true (el stock es actual, no histórico)
  return true;
}
