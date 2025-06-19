import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useProductos } from '../components/ProductosContext';
import { FORMATOS_PEDIDO } from '../configFormatos';

export default function PedidosClientes({ onPedidoCreado }) {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [lineas, setLineas] = useState([
    { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }
  ]);
  const [mensaje, setMensaje] = useState('');
  const { productos, cargando } = useProductos();
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState(-1);
  const [productoValido, setProductoValido] = useState([]);
  const [mensajeError, setMensajeError] = useState([]);
  const productoInputRefs = useRef([]);

  useEffect(() => {
    axios.get('/api/clientes')
      .then(res => setClientes(res.data))
      .catch(()=>setClientes([]));
  }, []);

  useEffect(() => {
    setProductoValido(lineas.map(l => {
      const val = l.producto.trim().toLowerCase();
      return !!productos.find(p => (p.referencia && p.referencia.toLowerCase() === val) || (p.nombre && p.nombre.toLowerCase() === val));
    }));
    setMensajeError(lineas.map(l => {
      const val = l.producto.trim().toLowerCase();
      if (!val) return '';
      const matches = productos.filter(p => (p.referencia && p.referencia.toLowerCase().includes(val)) || (p.nombre && p.nombre.toLowerCase().includes(val)));
      if (matches.length === 0) return 'Producto no encontrado';
      return '';
    }));
  }, [lineas, productos]);

  function handleProductoKeyDown(e, idx) {
    if (showAutocomplete !== idx || !autocompleteList.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteIndex(i => (i+1)%autocompleteList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteIndex(i => (i-1+autocompleteList.length)%autocompleteList.length);
    } else if (e.key === 'Enter') {
      if (autocompleteIndex >= 0) {
        e.preventDefault();
        seleccionarProductoAutocomplete(autocompleteList[autocompleteIndex], idx);
      }
    }
  }
  function seleccionarProductoAutocomplete(prod, idx) {
    handleLineaChange(idx, 'producto', prod.nombre);
    setShowAutocomplete(-1);
    setAutocompleteIndex(-1);
    productoInputRefs.current[idx]?.blur();
  }
  function handleProductoInput(e, idx) {
    const val = e.target.value;
    handleLineaChange(idx, 'producto', val);
    setShowAutocomplete(idx);
    const valNorm = val.trim().toLowerCase();
    const matches = productos.filter(p => (p.referencia && p.referencia.toLowerCase().includes(valNorm)) || (p.nombre && p.nombre.toLowerCase().includes(valNorm)));
    setAutocompleteList(matches.slice(0, 8));
    setAutocompleteIndex(-1);
  }
  const handleLineaChange = (idx, campo, valor) => {
    setLineas(lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };
  const handleAgregarLinea = () => {
    setLineas([...lineas, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };
  const handleEliminarLinea = (idx) => {
    setLineas(lineas.filter((_, i) => i !== idx));
  };
  const handleCrearPedido = async () => {
    if (!clienteSeleccionado || lineas.length === 0 || lineas.some((l,i)=>!productoValido[i]||!l.producto||!l.cantidad)) {
      setMensaje('Selecciona un cliente y añade al menos una línea válida.');
      return;
    }
    try {
      await axios.post('/api/pedidos', {
        cliente: clienteSeleccionado,
        lineas,
        tipo: 'cliente',
        fechaPedido: new Date().toISOString(),
        estado: 'enviado'
      });
      setMensaje('Pedido creado correctamente.');
      setLineas([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
      setClienteSeleccionado('');
      setTimeout(()=>{
        setMensaje('');
        if (onPedidoCreado) onPedidoCreado();
      }, 1200);
    } catch (e) {
      setMensaje('Error al crear pedido.');
    }
  };

  return (
    <div>
      <h2>Crear nuevo pedido de cliente</h2>
      <div style={{background:'#f8fafd',padding:16,borderRadius:8,marginBottom:24}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
          <select value={clienteSeleccionado} onChange={e=>setClienteSeleccionado(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #bbb',minWidth:180}}>
            <option value="">Selecciona cliente</option>
            {clientes.map(c=>(<option key={c._id||c.id} value={c.nombre}>{c.nombre}</option>))}
          </select>
        </div>
        {lineas.map((linea, idx) => (
          <div key={idx} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', position:'relative' }}>
            <div style={{position:'relative'}}>
              <input
                ref={el => productoInputRefs.current[idx] = el}
                type="text"
                placeholder="Producto (nombre o referencia)"
                value={linea.producto}
                onChange={e => handleProductoInput(e, idx)}
                onFocus={()=>setShowAutocomplete(idx)}
                onBlur={()=>setTimeout(()=>setShowAutocomplete(-1),150)}
                onKeyDown={e=>handleProductoKeyDown(e, idx)}
                style={{ padding: 8, width: 140, border:`2px solid ${linea.producto?(productoValido[idx]?'#4caf50':'#f44336'):'#ccc'}`, background:linea.producto?(productoValido[idx]?'#e8f5e9':'#ffebee'):'#fff' }}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showAutocomplete===idx}
                aria-activedescendant={autocompleteIndex>=0?`autocomplete-prod-${autocompleteIndex}`:undefined}
                aria-label="Producto"
                autoComplete="off"
              />
              {showAutocomplete===idx && autocompleteList.length > 0 && (
                <ul role="listbox" style={{position:'absolute',zIndex:10,top:36,left:0,minWidth:220,background:'#fff',border:'1px solid #ccc',borderRadius:4,boxShadow:'0 2px 8px #0002',maxHeight:220,overflowY:'auto',padding:0,margin:0}}>
                  {autocompleteList.map((p,i)=>(
                    <li
                      id={`autocomplete-prod-${i}`}
                      key={p.nombre}
                      role="option"
                      aria-selected={i===autocompleteIndex}
                      tabIndex={-1}
                      style={{padding:'6px 12px',background:i===autocompleteIndex?'#e3f2fd':'#fff',cursor:'pointer'}}
                      onMouseDown={()=>seleccionarProductoAutocomplete(p, idx)}
                      onMouseEnter={()=>setAutocompleteIndex(i)}
                    >
                      <b>{p.referencia}</b> - {p.nombre}
                    </li>
                  ))}
                </ul>
              )}
              {showAutocomplete===idx && autocompleteList.length===0 && linea.producto && (
                <div style={{position:'absolute',top:36,left:0,background:'#fff',border:'1px solid #ccc',borderRadius:4,padding:'6px 12px',color:'#f44336'}}>No hay coincidencias</div>
              )}
            </div>
            <input
              type="number"
              min="1"
              placeholder="Cantidad"
              value={linea.cantidad}
              onChange={e => handleLineaChange(idx, 'cantidad', Number(e.target.value))}
              style={{ padding: 8, width: 60 }}
            />
            <select
              value={linea.formato}
              onChange={e => handleLineaChange(idx, 'formato', e.target.value)}
              style={{ padding: 8 }}
            >
              {FORMATOS_PEDIDO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Comentario"
              value={linea.comentario}
              onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
              style={{ padding: 8, width: 110 }}
            />
            {lineas.length > 1 && (
              <button type="button" onClick={() => handleEliminarLinea(idx)} style={{ color: '#dc3545', background: 'none', border: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            )}
            {mensajeError[idx] && <span style={{color:'#f44336',marginLeft:8,fontWeight:500}}>{mensajeError[idx]}</span>}
          </div>
        ))}
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleAgregarLinea} style={{ padding: '6px 14px', background: '#00c6ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            Añadir línea
          </button>
          <button onClick={handleCrearPedido} style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            disabled={lineas.some((l,i)=>!productoValido[i]||!l.producto||!l.cantidad)}
            aria-disabled={lineas.some((l,i)=>!productoValido[i]||!l.producto||!l.cantidad)}
          >
            Confirmar y enviar pedido
          </button>
        </div>
        {mensaje && <div style={{marginTop:10,color:mensaje.includes('Error')?'#dc3545':'#388e3c',fontWeight:700}}>{mensaje}</div>}
      </div>
    </div>
  );
}
