import React, { useEffect, useState } from 'react';
import { listarTransferencias, crearTransferencia, actualizarTransferencia, confirmarTransferencia } from '../services/transferenciasService';
import { useProductos } from './ProductosContext';

const estados = {
  pendiente: 'Pendiente',
  enviada: 'Enviada',
  recibida: 'Recibida',
  cancelada: 'Cancelada'
};

export default function TransferenciasPanel({ tiendas, tiendaActual, modoFabrica, filtroTienda, filtroFechaDesde, filtroFechaHasta, filtrarTransferencias, onTransferenciaConfirmada }) {
  const { productos } = useProductos();
  const [transferencias, setTransferencias] = useState([]);
  const [form, setForm] = useState({
    origen: '',
    destino: '',
    productos: [{ producto: '', cantidad: 1, peso: 0, lote: '', comentario: '' }],
    observaciones: ''
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarTransferencias();
  }, []);

  // Autocompletar y bloquear el origen en modo tienda
  useEffect(() => {
    if (!modoFabrica && tiendaActual?.nombre) {
      setForm(f => ({ ...f, origen: tiendaActual.nombre }));
    }
  }, [modoFabrica, tiendaActual]);

  const cargarTransferencias = async () => {
    setCargando(true);
    const { data } = await listarTransferencias();
    setTransferencias(data);
    setCargando(false);
  };

  const handleFormChange = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
  };

  const handleProductoChange = (idx, campo, valor) => {
    setForm(f => ({
      ...f,
      productos: f.productos.map((p, i) => i === idx ? { ...p, [campo]: valor } : p)
    }));
  };

  const agregarProducto = () => {
    const [cargando, setCargando] = useState(false); // Loading state for transferencias
  };

  const quitarProducto = (idx) => {
    setForm(f => ({ ...f, productos: f.productos.filter((_, i) => i !== idx) }));
  };

  const enviarTransferencia = async () => {
    if (!form.origen || !form.destino || form.productos.length === 0) return;
    // Buscar los IDs reales de las tiendas
    const origenObj = tiendas.find(t => t.nombre === form.origen);
    const destinoObj = tiendas.find(t => t.nombre === form.destino);
    // Normalizar el campo peso: convertir a número o undefined
    const productosNormalizados = form.productos.map(p => ({
      ...p,
      peso: p.peso === '' || typeof p.peso === 'undefined' ? undefined : Number(p.peso)
    }));
    await crearTransferencia({
      ...form,
      productos: productosNormalizados,
      usuario: tiendaActual?.nombre || 'TIENDA FABRICA',
      origenId: origenObj ? origenObj.id : undefined,
      destinoId: destinoObj ? destinoObj.id : undefined
    });
    setForm({ origen: '', destino: '', productos: [{ producto: '', cantidad: 1, peso: 0, lote: '', comentario: '' }], observaciones: '' });
    cargarTransferencias();
  };

  // Filtrar transferencias según el contexto
  let transferenciasFiltradas = transferencias.filter(t =>
    modoFabrica
      ? t.destino === 'TIENDA FABRICA' // Solo devoluciones de tiendas a fábrica
      : t.origen === tiendaActual?.nombre || t.destino === tiendaActual?.nombre
  );

  // Si hay función de filtrado (desde supervisión), aplicar filtro extra
  if (filtrarTransferencias && modoFabrica) {
    transferenciasFiltradas = filtrarTransferencias(transferenciasFiltradas);
  }

  // Tiendas para el selector (evitar que origen y destino sean iguales, y mostrar Fábrica solo si aplica)
  const opcionesTiendas = modoFabrica
    ? tiendas.filter(t => t.nombre !== 'TIENDA FABRICA')
    : [{ nombre: 'TIENDA FABRICA', label: 'Devoluciones a Fábrica' }, ...tiendas.filter(t => t.nombre !== 'TIENDA FABRICA').map(t => ({ ...t, label: t.nombre }))];

  return (
    <div style={{marginTop:24}}>
      <h2>{modoFabrica ? 'Devoluciones de tiendas a fábrica' : 'Traspasos y devoluciones entre tiendas/fábrica'}</h2>
      {!modoFabrica && (
        <div style={{marginBottom:24,background:'#f9f9f9',padding:16,borderRadius:8}}>
          <h4>Crear nuevo traspaso o devolución</h4>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
            <select value={form.origen} onChange={e => handleFormChange('origen', e.target.value)} disabled={!modoFabrica && !!tiendaActual?.nombre}>
              <option value=''>Origen</option>
              {opcionesTiendas.map(t => <option key={t.nombre} value={t.nombre}>{t.label || t.nombre}</option>)}
            </select>
            <select value={form.destino} onChange={e => handleFormChange('destino', e.target.value)}>
              <option value=''>Destino</option>
              {opcionesTiendas
                .filter(t => t.nombre !== form.origen)
                .map(t => <option key={t.nombre} value={t.nombre}>{t.label || t.nombre}</option>)}
            </select>
            <input type='text' placeholder='Observaciones' value={form.observaciones} onChange={e => handleFormChange('observaciones', e.target.value)} style={{width:180}} />
          </div>
          {form.productos.map((p, idx) => (
            <React.Fragment key={idx}>
              <ProductoAutocomplete
                idx={idx}
                p={p}
                handleProductoChange={handleProductoChange}
              />
              <input type='number' min={1} placeholder='Cantidad' value={p.cantidad} onChange={e => handleProductoChange(idx, 'cantidad', e.target.value)} style={{width:70}} />
              <input type='number' min={0} step={0.01} placeholder='Peso (kg)' value={p.peso || ''} onChange={e => handleProductoChange(idx, 'peso', e.target.value)} style={{width:90}} />
              <input type='text' placeholder='Lote' value={p.lote} onChange={e => handleProductoChange(idx, 'lote', e.target.value)} style={{width:80}} />
              <input type='text' placeholder='Comentario' value={p.comentario} onChange={e => handleProductoChange(idx, 'comentario', e.target.value)} style={{width:120}} />
              <button onClick={() => quitarProducto(idx)} disabled={form.productos.length === 1}>-</button>
              {idx === form.productos.length - 1 && <button onClick={agregarProducto}>+</button>}
            </React.Fragment>
          ))}
          <button onClick={enviarTransferencia} style={{marginTop:12,background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Enviar traspaso/devolución</button>
        </div>
      )}
      <h4>{modoFabrica ? 'Histórico de devoluciones' : 'Historial de traspasos y devoluciones'}</h4>
      {cargando ? <div>Cargando...</div> : (
        <table style={{width:'100%',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #eee'}}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {transferenciasFiltradas.map(t => (
              <tr key={t._id}>
                <td>{new Date(t.fecha).toLocaleString()}</td>
                <td>{t.origen}</td>
                <td>{t.destino === 'TIENDA FABRICA' ? 'Devoluciones a Fábrica' : t.destino}</td>
                <td>
                  <ul style={{margin:0,paddingLeft:16}}>
                    {t.productos.map((p,i) => (
                      <li key={i}>
                        {p.producto} (Cantidad: {p.cantidad}{(typeof p.peso === 'number' && !isNaN(p.peso)) ? `, Peso: ${p.peso} kg` : ''}) {p.lote && `[Lote: ${p.lote}]`}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{estados[t.estado] || t.estado}
                  {modoFabrica && t.destino === 'TIENDA FABRICA' && (t.estado === 'pendiente' || t.estado === 'enviada') && (
                    <button
                      style={{marginLeft:8,background:'#28a745',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                      onClick={async () => {
                        await confirmarTransferencia(t._id, {});
                        cargarTransferencias();
                        if (typeof onTransferenciaConfirmada === 'function') onTransferenciaConfirmada();
                      }}
                    >
                      Confirmar recibido
                    </button>
                  )}
                  {!modoFabrica && t.destino === tiendaActual?.nombre && (t.estado === 'pendiente' || t.estado === 'enviada') && (
                    <button
                      style={{marginLeft:8,background:'#28a745',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                      onClick={async () => {
                        await confirmarTransferencia(t._id, {});
                        cargarTransferencias();
                        if (typeof onTransferenciaConfirmada === 'function') onTransferenciaConfirmada();
                      }}
                    >
                      Marcar como recibida
                    </button>
                  )}
                </td>
                <td>{t.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Componente separado para el autocompletado de productos
function ProductoAutocomplete({ idx, p, handleProductoChange }) {
  const { buscarProductos } = useProductos();
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [inputValue, setInputValue] = useState(p.producto || '');

  useEffect(() => {
    setInputValue(p.producto || '');
    // eslint-disable-next-line
  }, [p.producto]);

  useEffect(() => {
    if (!inputValue || inputValue.length < 2) {
      setSugerencias([]);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    buscarProductos(inputValue).then(res => {
      if (!cancelado) setSugerencias(res);
    }).finally(() => { if (!cancelado) setBuscando(false); });
    return () => { cancelado = true; };
  }, [inputValue, buscarProductos]);

  return (
    <div style={{ position: 'relative', width: 120 }}>
      <input
        type="text"
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          handleProductoChange(idx, 'producto', e.target.value);
        }}
        placeholder="Producto"
        style={{ width: 120 }}
        autoComplete="off"
        onFocus={e => {
          if (inputValue && inputValue.length >= 2) {
            buscarProductos(inputValue).then(setSugerencias);
          }
        }}
      />
      {buscando && <div style={{ position: 'absolute', top: 22, left: 0, background: '#fff', zIndex: 10, fontSize: 12 }}>Buscando...</div>}
      {sugerencias.length > 0 && (
        <ul className="sugerencias-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', zIndex: 30, maxHeight: 180, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
          {sugerencias.map(prod => (
            <li
              key={prod._id || prod.referencia || prod.nombre}
              style={{ padding: '6px 12px', cursor: 'pointer' }}
              onMouseDown={() => {
                setInputValue(prod.nombre);
                handleProductoChange(idx, 'producto', prod.nombre);
                setSugerencias([]);
              }}
            >
              {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
