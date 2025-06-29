import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProductos } from '../components/ProductosContext';
import { FORMATOS_PEDIDO } from '../configFormatos';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function PedidosClientes({ onPedidoCreado }) {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [lineas, setLineas] = useState([
    { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }
  ]);
  const [mensaje, setMensaje] = useState('');
  const { productos, cargando } = useProductos();
  const [productoValido, setProductoValido] = useState([]);
  const [mensajeError, setMensajeError] = useState([]);
  const [testBackendMsg, setTestBackendMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/clientes`)
      .then(res => setClientes(res.data))
      .catch(()=>setClientes([]));
  }, []);

  useEffect(() => {
    setProductoValido(lineas.map(l => !!l.producto));
    setMensajeError(lineas.map(() => ''));
  }, [lineas, productos]);

  const handleLineaChange = (idx, campo, valor) => {
    setLineas(lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };
  const handleAgregarLinea = () => {
    setLineas([...lineas, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };
  const handleAgregarComentario = () => {
    setLineas([...lineas, { esComentario: true, comentario: '' }]);
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
      await axios.post(`${API_URL}/api/pedidos-clientes`, {
        clienteId: clienteSeleccionado._id || clienteSeleccionado.id || clienteSeleccionado.codigo,
        clienteNombre: clienteSeleccionado.nombre,
        direccion: clienteSeleccionado.direccion,
        lineas,
        tipo: 'cliente',
        fechaPedido: new Date().toISOString(),
        estado: 'enviado'
      });
      setMensaje('Pedido creado correctamente.');
      setLineas([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
      setClienteSeleccionado(null);
      setTimeout(()=> {
        setMensaje('');
        if (onPedidoCreado) onPedidoCreado();
      }, 1200);
    } catch (e) {
      setMensaje('Error al crear pedido.');
    }
  };

  // Autocompletar producto por referencia
  const handleProductoBlur = (idx, valor) => {
    const valNorm = valor.trim().toLowerCase();
    const prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === valNorm);
    if (prod) {
      handleLineaChange(idx, 'producto', prod.nombre);
    }
  };

  const handleClienteChange = (e) => {
    const nombre = e.target.value;
    const cliente = clientes.find(c => c.nombre === nombre);
    setClienteSeleccionado(cliente || null);
  };

  return (
    <div>
      <h2>Crear nuevo pedido de cliente</h2>
      <div style={{background:'#f8fafd',padding:16,borderRadius:8,marginBottom:24}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
          <select value={clienteSeleccionado?.nombre || ''} onChange={handleClienteChange} style={{padding:8,borderRadius:6,border:'1px solid #bbb',minWidth:180}}>
            <option value="">Selecciona cliente</option>
            {clientes.map(c=>(<option key={c._id||c.id||c.codigo} value={c.nombre}>{c.nombre}</option>))}
          </select>
        </div>
        {lineas.map((linea, idx) => (
          linea.esComentario ? (
            <div key={idx} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', background:'#fffbe6', border:'1px dashed #ffe58f', borderRadius:6, padding:'8px 12px' }}>
              <span style={{ fontSize: 20, color: '#b8860b' }}>📝</span>
              <input
                type="text"
                value={linea.comentario || ''}
                onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                placeholder="Comentario..."
                style={{ flexGrow: 1, border: '1px dashed #b8860b', borderRadius: 6, padding: '8px 12px', background: '#fffdf7', fontStyle: 'italic', fontSize: 15, color: '#b8860b' }}
              />
              <button type="button" onClick={() => handleEliminarLinea(idx)} style={{ color: '#dc3545', background: 'none', border: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
          ) : (
            <div key={idx} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', position:'relative' }}>
              <div style={{position:'relative'}}>
                <input
                  list="productos-lista-global"
                  value={linea.producto}
                  onChange={e => handleLineaChange(idx, 'producto', e.target.value)}
                  onBlur={e => handleProductoBlur(idx, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      handleProductoBlur(idx, e.target.value);
                    }
                  }}
                  placeholder="Producto"
                  style={{ padding: 8, width: 260, border:'1px solid #ccc', borderRadius:6, background:'#fff' }}
                />
                <datalist id="productos-lista-global">
                  {productos.map(prod => (
                    <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                      {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                    </option>
                  ))}
                </datalist>
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
          )
        ))}
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleAgregarLinea} style={{ padding: '6px 14px', background: '#00c6ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            Añadir línea
          </button>
          <button type="button" onClick={handleAgregarComentario} style={{ padding: '6px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            Añadir comentario
          </button>
          <button onClick={handleCrearPedido} style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            disabled={lineas.some((l,i)=>!l.esComentario && (!productoValido[i]||!l.producto||!l.cantidad))}
            aria-disabled={lineas.some((l,i)=>!l.esComentario && (!productoValido[i]||!l.producto||!l.cantidad))}
          >
            Confirmar y enviar pedido
          </button>
        </div>
        {mensaje && <div style={{marginTop:10,color:mensaje.includes('Error')?'#dc3545':'#388e3c',fontWeight:700}}>{mensaje}</div>}
      </div>
    </div>
  );
}
