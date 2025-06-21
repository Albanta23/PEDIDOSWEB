import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovimientosStock, registrarBajaStock } from '../services/movimientosStockService';
import TransferenciasPanel from './TransferenciasPanel';
import { useProductos } from './ProductosContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState('');
  // Baja de producto
  const [productoBaja, setProductoBaja] = useState('');
  const [cantidadBaja, setCantidadBaja] = useState('');
  const [unidadBaja, setUnidadBaja] = useState('kg');
  const [loteBaja, setLoteBaja] = useState('');
  const [motivoBaja, setMotivoBaja] = useState('');
  const [pesoBaja, setPesoBaja] = useState('');

  // Estado para selección múltiple en bajas
  const [busquedaMulti, setBusquedaMulti] = useState('');
  const [seleccionMulti, setSeleccionMulti] = useState([]);

  // Forzar que el id de la tienda clientes sea siempre 'PEDIDOS_CLIENTES' (usando useMemo para evitar bucles)
  const tiendaForzada = useMemo(() => {
    if (tienda && typeof tienda.id === 'string' && tienda.id.trim().toLowerCase() === 'clientes') {
      return { ...tienda, id: 'PEDIDOS_CLIENTES', nombre: tienda.nombre || 'Clientes' };
    }
    return tienda;
  }, [tienda]);

  // Función reutilizable para refrescar movimientos de stock
  const refrescarMovimientos = async () => {
    if (!tiendaForzada) return;
    setCargando(true);
    const movs = await getMovimientosStock({ tiendaId: tiendaForzada.id });
    setMovimientos(movs);
    setCargando(false);
  };

  // DEBUG: Mostrar tienda y movimientos
  console.log('[DEBUG] tiendaForzada:', tiendaForzada);
  useEffect(() => {
    refrescarMovimientos();
  }, [tiendaForzada]);

  // Refrescar stock automáticamente tras confirmar transferencia
  useEffect(() => {
    refrescarMovimientos();
    // Suscribirse a eventos de transferencias confirmadas si hay WebSocket/socket.io
    if (window.socket) {
      const handler = refrescarMovimientos;
      window.socket.on('transferencia_confirmada', handler);
      return () => window.socket.off('transferencia_confirmada', handler);
    }
  }, [tiendaForzada]);

  // Función para consultar el stock actual de un producto/lote en la tienda
  function getStockActual(producto, lote) {
    // Sumar entradas y transferencias recibidas
    const entradas = movimientos.filter(m => ["entrada","transferencia_entrada","devolucion_entrada"].includes(m.tipo) && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    // Restar bajas y transferencias enviadas
    const salidas = movimientos.filter(m => ["baja","transferencia_salida","devolucion_salida"].includes(m.tipo) && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    return entradas - salidas;
  }

  // Baja de producto
  const registrarBaja = async (producto, cantidad, unidad, lote, motivo, peso) => {
    if (!tienda) return;
    await registrarBajaStock({ tiendaId: tienda.id, producto, cantidad, unidad, lote, motivo, peso });
    await refrescarMovimientos();
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

  // Autocompletar producto por referencia o nombre (robusto, tolerante a parciales)
  function autocompletarProducto(valor) {
    if (!valor) return valor;
    const normalizado = String(valor).trim().toLowerCase();
    // Coincidencia exacta por referencia
    let prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === normalizado);
    if (prod) return prod.nombre;
    // Coincidencia exacta por nombre
    prod = productos.find(p => p.nombre && String(p.nombre).toLowerCase() === normalizado);
    if (prod) return prod.nombre;
    // Coincidencia parcial por referencia
    prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase().startsWith(normalizado));
    if (prod) return prod.nombre;
    // Coincidencia parcial por nombre
    prod = productos.find(p => p.nombre && String(p.nombre).toLowerCase().startsWith(normalizado));
    if (prod) return prod.nombre;
    // Si no se reconoce, devolver el valor original (y se puede mostrar feedback visual en el input)
    return valor;
  }

  // --- Lógica de filtrado y orden para la tabla de movimientos ---
  const movimientosFiltradosOrdenados = useMemo(() => {
    return movimientos.filter(mov => {
      const prod = productos.find(p => p.nombre.trim().toLowerCase() === (mov.producto || '').trim().toLowerCase());
      const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
      return (
        (!filtroProducto || mov.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
        (!filtroLote || (mov.lote && mov.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
        (!filtroFamilia || familia === filtroFamilia) &&
        (!filtroTipoMovimiento || mov.tipo === filtroTipoMovimiento) &&
        (!filtroFechaDesde || (mov.fecha && mov.fecha >= filtroFechaDesde)) &&
        (!filtroFechaHasta || (mov.fecha && mov.fecha <= filtroFechaHasta))
      );
    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [movimientos, productos, filtroProducto, filtroLote, filtroFamilia, filtroTipoMovimiento, filtroFechaDesde, filtroFechaHasta]);

  // Exportar diario de movimientos a Excel
  const exportarMovimientosExcel = () => {
    if (!movimientosFiltradosOrdenados || movimientosFiltradosOrdenados.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }
    let pesoAcumulado = 0;
    const rows = movimientosFiltradosOrdenados.map(mov => {
      const peso = Number(mov.peso) || 0;
      if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
        pesoAcumulado += peso;
      } else if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
        pesoAcumulado -= peso;
      }
      return {
        Fecha: mov.fecha ? mov.fecha.split('T')[0] : (mov.fecha ? new Date(mov.fecha).toLocaleDateString() : ''),
        Hora: mov.fecha ? (mov.fecha.split('T')[1]?.substring(0,5) || new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '',
        Producto: mov.producto || '',
        Lote: mov.lote || '',
        Cantidad: mov.cantidad ?? '',
        'Peso (kg)': mov.peso ?? '',
        'PESO TOTAL (kg)': pesoAcumulado.toFixed(2),
        Tipo: mov.tipo || '',
        Motivo: mov.motivo || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'diario_movimientos.xlsx');
  };

  // Mejorar exportación PDF: asegurar que los datos se exportan correctamente
  const exportarMovimientosPDF = () => {
    if (!movimientosFiltradosOrdenados || movimientosFiltradosOrdenados.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }
    let pesoAcumulado = 0;
    const rows = movimientosFiltradosOrdenados.map(mov => {
      const peso = Number(mov.peso) || 0;
      if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
        pesoAcumulado += peso;
      } else if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
        pesoAcumulado -= peso;
      }
      return [
        mov.fecha ? mov.fecha.split('T')[0] : (mov.fecha ? new Date(mov.fecha).toLocaleDateString() : ''),
        mov.fecha ? (mov.fecha.split('T')[1]?.substring(0,5) || new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '',
        mov.producto || '',
        mov.lote || '',
        mov.cantidad ?? '',
        mov.peso ?? '',
        pesoAcumulado.toFixed(2),
        mov.tipo || '',
        mov.motivo || ''
      ];
    });
    // Construir descripción de filtros activos
    let filtros = [];
    if (filtroProducto) filtros.push(`producto: ${filtroProducto}`);
    if (filtroLote) filtros.push(`lote: ${filtroLote}`);
    if (filtroFamilia) filtros.push(`familia: ${filtroFamilia}`);
    if (filtroTipoMovimiento) filtros.push(`tipo: ${filtroTipoMovimiento}`);
    if (filtroFechaDesde) filtros.push(`desde: ${filtroFechaDesde}`);
    if (filtroFechaHasta) filtros.push(`hasta: ${filtroFechaHasta}`);
    const filtrosTexto = filtros.length > 0 ? `por ${filtros.join(', ')}` : 'global';
    const nombreTienda = tiendaForzada?.nombre || tiendaForzada?.id || 'Tienda';
    const cabecera = `Movimientos de productos ${filtrosTexto} de la tienda ${nombreTienda}`;

    const doc = new jsPDF();
    doc.text(cabecera, 14, 14);
    autoTable(doc, {
      head: [[
        'Fecha', 'Hora', 'Producto', 'Lote', 'Cantidad', 'Peso (kg)', 'PESO TOTAL (kg)', 'Tipo', 'Motivo'
      ]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [103, 58, 183] },
      margin: { top: 20 }
    });
    doc.save('diario_movimientos.pdf');
  };

  return (
    <div style={{padding:32, maxWidth:900, margin:'0 auto'}}>
      <h2>Gestión de almacén de {tienda?.nombre || 'Tienda'}</h2>
      <button onClick={() => navigate ? navigate(-1) : window.history.back()} style={{position:'absolute',top:24,right:32,background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Volver</button>
      <div style={{display:'flex',gap:24,marginBottom:24}}>
        <button onClick={()=>setTab('stock')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='stock'?'#007bff':'#eee',color:tab==='stock'?'#fff':'#333',fontWeight:700}}>Stock</button>
        <button onClick={()=>setTab('movimientos')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='movimientos'?'#673ab7':'#eee',color:tab==='movimientos'?'#fff':'#333',fontWeight:700}}>Diario de movimientos</button>
        <button onClick={()=>setTab('bajas')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='bajas'?'#dc3545':'#eee',color:tab==='bajas'?'#fff':'#333',fontWeight:700}}>Bajas</button>
        <button onClick={()=>setTab('transferencias')} style={{padding:'8px 24px',border:'none',borderRadius:6,background:tab==='transferencias'?'#28a745':'#eee',color:tab==='transferencias'?'#fff':'#333',fontWeight:700}}>Transferencias</button>
        <button onClick={()=>navigate(`/compras-proveedor/${tienda?.id}`)} style={{padding:'8px 24px',border:'none',borderRadius:6,background:'#ff9800',color:'#fff',fontWeight:700}}>Compras a proveedor</button>
      </div>
      {tab==='stock' && (
        <div>
          {/* Formulario para añadir stock manualmente */}
          <div style={{background:'#f8fafd',padding:16,borderRadius:8,marginBottom:18,boxShadow:'0 2px 8px #007bff11',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <b style={{color:'#007bff'}}>Añadir stock manualmente</b>
            <input
              list="productos-alta-stock"
              placeholder="Producto"
              value={productoBaja}
              onChange={e => setProductoBaja(autocompletarProducto(e.target.value))}
              style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}
            />
            <datalist id="productos-alta-stock">
              {productos.map((p,i) => (
                <option key={i} value={p.nombre}>{p.referencia ? `${p.referencia} - ${p.nombre}` : p.nombre}</option>
              ))}
            </datalist>
            <input type="number" min="0" step="any" placeholder="Cantidad" value={cantidadBaja} onChange={e=>setCantidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <select value={unidadBaja} onChange={e=>setUnidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}>
              <option value="kg">kg</option>
              <option value="ud">ud</option>
            </select>
            <input placeholder="Lote" value={loteBaja} onChange={e=>setLoteBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <input placeholder="Motivo" value={motivoBaja} onChange={e=>setMotivoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:120}} />
            <input type="number" min="0" step="any" placeholder="Peso (kg)" value={pesoBaja} onChange={e=>setPesoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <button
              onClick={async ()=>{
                if(!productoBaja || !cantidadBaja || !motivoBaja){ alert('Rellena todos los campos'); return; }
                const { registrarEntradaStock } = await import('../services/movimientosStockService');
                await registrarEntradaStock({ tiendaId: tienda.id, producto: productoBaja, cantidad: cantidadBaja, unidad: unidadBaja, lote: loteBaja, motivo: motivoBaja, peso: pesoBaja });
                setProductoBaja(''); setCantidadBaja(''); setUnidadBaja('kg'); setLoteBaja(''); setMotivoBaja(''); setPesoBaja('');
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
                  {/* Eliminadas columnas Fecha y Hora, y Formato. Unidad entre Cantidad y Peso */}
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Cantidad (ud)</th>
                  <th>Unidad</th>
                  <th>Peso (kg)</th>
                  <th>Familia</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Agrupar movimientos por producto, lote y formato
                  const agrupado = {};
                  movimientos.forEach(mov => {
                    let cantidad = mov.cantidadEnviada ?? mov.cantidad ?? 0;
                    let peso = mov.peso ?? 0;
                    // Usar unidad en la clave en vez de formato
                    const key = mov.producto + '||' + (mov.lote || '') + '||' + (mov.unidad || mov.formato || '');
                    if (!agrupado[key]) agrupado[key] = { producto: mov.producto, lote: mov.lote, unidad: mov.unidad || mov.formato, entradas: 0, bajas: 0, fecha: mov.fecha, cantidadTotal: 0, pesoTotal: 0 };
                    if (mov.tipo === 'entrada' || mov.tipo === 'transferencia_entrada' || mov.tipo === 'devolucion_entrada') {
                      agrupado[key].cantidadTotal += Number(cantidad) || 0;
                      agrupado[key].pesoTotal += Number(peso) || 0;
                    }
                    if (mov.tipo === 'baja' || mov.tipo === 'transferencia_salida' || mov.tipo === 'devolucion_salida') {
                      agrupado[key].cantidadTotal -= Number(cantidad) || 0;
                      agrupado[key].pesoTotal -= Number(peso) || 0;
                    }
                    if (!agrupado[key].fecha || new Date(mov.fecha) > new Date(agrupado[key].fecha)) {
                      agrupado[key].fecha = mov.fecha;
                    }
                  });
                  return Object.values(agrupado)
                    .filter(s => {
                      return (
                        (s.cantidadTotal !== 0 || s.pesoTotal !== 0) &&
                        (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
                        (!filtroLote || (s.lote && s.lote.toLowerCase().includes(filtroLote.toLowerCase()))));
                    })
                    .map((s, idx) => (
                      <tr key={idx}>
                        {/* Sin fecha ni hora */}
                        <td>{s.producto}</td>
                        <td>{s.lote}</td>
                        <td>{s.cantidadTotal !== undefined ? s.cantidadTotal.toFixed(2) : '-'}</td>
                        <td>{s.unidad || '-'}</td>
                        <td>{s.pesoTotal !== undefined ? s.pesoTotal.toFixed(2) : '-'}</td>
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
      {tab==='movimientos' && (
        <div>
          <h3 style={{color:'#673ab7'}}>Diario de movimientos de almacén</h3>
          <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
            <input placeholder="Filtrar producto" value={filtroProducto} onChange={e=>setFiltroProducto(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <input placeholder="Filtrar lote" value={filtroLote} onChange={e=>setFiltroLote(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <select value={filtroFamilia} onChange={e=>setFiltroFamilia(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}>
              <option value="">Todas las familias</option>
              {familias.map(([num, nombre], idx) => (
                <option key={idx} value={num}>{num} - {nombre}</option>
              ))}
            </select>
            <select value={filtroTipoMovimiento||''} onChange={e=>setFiltroTipoMovimiento(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:140}}>
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="baja">Baja</option>
              <option value="transferencia_entrada">Transferencia entrada</option>
              <option value="transferencia_salida">Transferencia salida</option>
              <option value="devolucion_entrada">Devolución entrada</option>
              <option value="devolucion_salida">Devolución salida</option>
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
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}>
            <button onClick={exportarMovimientosPDF} style={{background:'#673ab7',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Exportar PDF
            </button>
            <button onClick={exportarMovimientosExcel} style={{background:'#388e3c',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Exportar Excel
            </button>
          </div>
          <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse',background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11'}}>
            <thead>
              <tr style={{background:'#ede7f6'}}>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Peso (kg)</th>
                <th>PESO TOTAL (kg)</th>
                <th>Lote</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Mostrar absolutamente todos los movimientos recibidos, sin filtrar por producto conocido ni por tipo
                const movsFiltrados = movimientos.filter(mov => {
                  // Solo aplicar los filtros activos del usuario
                  return (
                    (!filtroProducto || (mov.producto && mov.producto.toLowerCase().includes(filtroProducto.toLowerCase()))) &&
                    (!filtroLote || (mov.lote && mov.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
                    (!filtroFamilia || (() => {
                      const prod = productos.find(p => p.nombre && mov.producto && p.nombre.trim().toLowerCase() === mov.producto.trim().toLowerCase());
                      const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
                      return familia === filtroFamilia;
                    })()) &&
                    (!filtroTipoMovimiento || mov.tipo === filtroTipoMovimiento) &&
                    (!filtroFechaDesde || (mov.fecha && mov.fecha >= filtroFechaDesde)) &&
                    (!filtroFechaHasta || (mov.fecha && mov.fecha <= filtroFechaHasta))
                  );
                }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                let saldoPeso = 0;
                return movsFiltrados.map((mov, idx) => {
                  const peso = Number(mov.peso) || 0;
                  const esBaja = ["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo);
                  const esTransferenciaEntrada = mov.tipo === "transferencia_entrada";
                  const esTransferenciaSalida = mov.tipo === "transferencia_salida";
                  const esDevolucionEntrada = mov.tipo === "devolucion_entrada";
                  const esDevolucionSalida = mov.tipo === "devolucion_salida";
                  if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
                    saldoPeso += peso;
                  } else if (esBaja) {
                    saldoPeso -= peso;
                  }
                  let style = {};
                  if (esTransferenciaSalida) {
                    // transferencia_salida: morado
                    style = {color:'#8e24aa',background:'#ede7f6',fontWeight:600};
                  } else if (esDevolucionSalida) {
                    // devolucion_salida: naranja
                    style = {color:'#f57c00',background:'#fff3e0',fontWeight:600};
                  } else if (esBaja) {
                    // baja: rojo
                    style = {color:'#b71c1c',background:'#ffebee',fontWeight:600};
                  } else if (esTransferenciaEntrada) {
                    // transferencia_entrada: azul
                    style = {color:'#1565c0',background:'#e3f2fd',fontWeight:600};
                  } else if (esDevolucionEntrada) {
                    style = {color:'#00695c',background:'#e0f2f1',fontWeight:600};
                  }
                  return (
                    <tr key={idx} style={style}>
                      <td>{mov.fecha ? new Date(mov.fecha).toLocaleString() : '-'}</td>
                      <td>{mov.tipo}</td>
                      <td>{mov.producto}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.unidad}</td>
                      <td>{peso.toFixed(2)}</td>
                      <td>{saldoPeso.toFixed(2)}</td>
                      <td>{mov.lote}</td>
                      <td>{mov.motivo}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
      {tab==='bajas' && (
        <div>
          <h3>Registrar baja de producto</h3>
          {/* Formulario individual clásico (ahora permite productos antiguos/no registrados) */}
          <div style={{display:'flex',gap:16,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
            <input
              list="productos-baja-stock"
              placeholder="Producto (puedes escribir uno antiguo)"
              value={productoBaja}
              onChange={e=>setProductoBaja(e.target.value)}
              style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}
            />
            <datalist id="productos-baja-stock">
              {[...new Set(movimientos.map(s=>s.producto).filter(Boolean))].map((prod,idx)=>(
                <option key={idx} value={prod}>{prod}</option>
              ))}
              {productos.map((p,i) => (
                <option key={i+1000} value={p.nombre}>{p.referencia ? `${p.referencia} - ${p.nombre}` : p.nombre}</option>
              ))}
            </datalist>
            <input type="number" min="0" step="any" placeholder="Cantidad" value={cantidadBaja} onChange={e=>setCantidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <select value={unidadBaja} onChange={e=>setUnidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}>
              <option value="kg">kg</option>
              <option value="ud">ud</option>
            </select>
            <input placeholder="Lote" value={loteBaja} onChange={e=>setLoteBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <input placeholder="Motivo de la baja" value={motivoBaja} onChange={e=>setMotivoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}} />
            <input type="number" min="0" step="any" placeholder="Peso (kg)" value={pesoBaja} onChange={e=>setPesoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <button
              onClick={() => {
                if(!productoBaja || (!cantidadBaja && !pesoBaja) || !motivoBaja){ alert('Rellena todos los campos y al menos cantidad o peso.'); return; }
                registrarBaja(productoBaja, cantidadBaja || 0, unidadBaja, loteBaja, motivoBaja, pesoBaja || 0);
                setProductoBaja(''); setCantidadBaja(''); setUnidadBaja('kg'); setLoteBaja(''); setMotivoBaja(''); setPesoBaja('');
              }}
              style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Aceptar baja
            </button>
          </div>
          <h4>Histórico de bajas</h4>
          <ul style={{background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11',padding:'12px 18px'}}>
            {movimientos.filter(m => m.tipo === 'baja').map((b,idx)=>(
              <li key={idx}>{b.fecha}: {b.producto} - {b.cantidad} {b.unidad} {(b.peso ? `(${b.peso} kg)` : '')} (Lote: {b.lote}) [{b.motivo}]</li>
            ))}
          </ul>
        </div>
      )}
      {tab==='transferencias' && (
        <div>
          <TransferenciasPanel tiendas={window.tiendas || []} tiendaActual={tienda} modoFabrica={false} onTransferenciaConfirmada={refrescarMovimientos} />
        </div>
      )}
    </div>
  );
}
