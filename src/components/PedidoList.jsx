import React, { useState } from "react";
import TransferenciasPanel from './TransferenciasPanel';
import { crearPedido, actualizarPedido, obtenerPedidos } from '../services/pedidosService';

// Formatos disponibles (puedes ajustar la lista si lo necesitas)
const formatos = ["Bandeja", "Granel", "Pieza", "Vacío", "Otro"];

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual, onVerHistoricoPedidos }) {
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [lineasEdit, setLineasEdit] = useState([]);
  const [mostrarTransferencias, setMostrarTransferencias] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  const handleEditarLineas = (pedido, idx) => {
    setEditandoIdx(idx);
    setLineasEdit(pedido.lineas.map(l => ({ ...l })));
  };

  const handleGuardar = async (idx) => {
    // Validación: no permitir guardar si alguna línea tiene formato vacío
    if (lineasEdit.some(l => !l.formato)) {
      alert('Todas las líneas deben tener un formato seleccionado.');
      return;
    }
    const pedido = pedidos[idx];
    let pedidoGuardado = null;
    try {
      if (!pedido.id && !pedido._id) {
        // Pedido nuevo: crear en backend
        const nuevo = await crearPedido({
          ...pedido,
          lineas: lineasEdit,
          estado: 'borrador',
          tiendaId: tiendaActual?.id || pedido.tiendaId,
          fechaCreacion: pedido.fechaCreacion || new Date().toISOString(),
        });
        pedidoGuardado = nuevo;
      } else {
        // Pedido existente: actualizar en backend
        await actualizarPedido(pedido._id || pedido.id, { ...pedido, lineas: lineasEdit });
        // Obtener el actualizado para reflejar cambios
        const actualizados = await obtenerPedidos();
        pedidoGuardado = actualizados.find(p => (p.id === pedido.id || p._id === pedido._id));
      }
      // Refrescar lista local (si tienes onModificar, úsalo; si no, recarga pedidos)
      if (onModificar) {
        onModificar(idx, { ...pedidoGuardado });
      }
    } catch (e) {
      alert('Error al guardar el pedido. Intenta de nuevo.');
    }
    setEditandoIdx(null);
    setLineasEdit([]);
  };

  const handleGuardarNuevo = async () => {
    // Validación: no permitir guardar si alguna línea tiene formato vacío
    if (lineasEdit.some(l => !l.formato)) {
      alert('Todas las líneas deben tener un formato seleccionado.');
      return;
    }
    try {
      const nuevo = await crearPedido({
        lineas: lineasEdit,
        estado: 'borrador',
        tiendaId: tiendaActual?.id,
        fechaCreacion: new Date().toISOString(),
      });
      if (onModificar) onModificar(0, { ...nuevo });
      setLineasEdit([]);
      setCreandoNuevo(false);
    } catch (e) {
      alert('Error al guardar el pedido. Intenta de nuevo.');
    }
  };

  const handleCancelar = () => {
    setEditandoIdx(null);
    setLineasEdit([]);
  };

  const handleLineaChange = (i, campo, valor) => {
    setLineasEdit(lineasEdit.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));
  };

  const handleEliminarLinea = (i) => {
    setLineasEdit(lineasEdit.filter((_, idx) => idx !== i));
  };

  const handleAgregarLinea = () => {
    setLineasEdit([...lineasEdit, { producto: '', cantidad: 1, formato: '', comentario: '' }]);
  };

  // Si no hay pedidos en borrador, NO mostrar bloque de creación adicional
  const pedidosBorrador = pedidos.filter(p => p.estado === 'borrador');

  // Si hay pedidos en borrador y ninguno está en edición, mostrar el primero en modo edición automáticamente
  React.useEffect(() => {
    if (modo === 'tienda' && pedidosBorrador.length > 0 && editandoIdx === null) {
      setEditandoIdx(0);
      setLineasEdit(pedidosBorrador[0].lineas.map(l => ({ ...l })));
    }
    // Solo la primera vez que hay pedidos en borrador y no hay edición activa
    // eslint-disable-next-line
  }, [modo, pedidosBorrador.length]);

  return (
    <>
      {modo === 'tienda' && (
        <div style={{marginBottom:16, display:'flex', gap:12}}>
          <button onClick={()=>setMostrarTransferencias(true)} style={{background:'#00b894',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Traspasos y devoluciones</button>
          <button onClick={() => { setCreandoNuevo(true); setLineasEdit([]); setEditandoIdx(null); }} style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700}}>+ Crear pedido</button>
        </div>
      )}
      {mostrarTransferencias && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:400,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarTransferencias(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0}}>Traspasos y devoluciones</h2>
            <TransferenciasPanel tiendas={tiendaActual ? [tiendaActual, ...((window.tiendas || []).filter(t => t.nombre !== tiendaActual.nombre))] : (window.tiendas || [])} tiendaActual={tiendaActual} modoFabrica={false} />
          </div>
        </div>
      )}
      <div>
        {creandoNuevo && (
          <div style={{ border: "2px dashed #007bff", margin: 8, padding: 16, background: '#fafdff', borderRadius: 10 }}>
            <b>Nuevo pedido (borrador)</b>
            <div style={{background:'#f8f9fa',padding:12,borderRadius:8,margin:'8px 0'}}>
              <ul style={{padding:0, margin:0, listStyle:'none'}}>
                {lineasEdit.length === 0 && (
                  <li style={{color:'#888',fontStyle:'italic',marginBottom:8}}>No hay líneas. Añade una para comenzar.</li>
                )}
                {lineasEdit.map((linea, i) => (
                  <li key={i} style={{marginBottom:4, display:'flex', gap:8, alignItems:'center'}}>
                    <input value={linea.producto} onChange={e => handleLineaChange(i, 'producto', e.target.value)} placeholder="Producto" style={{width:90}} />
                    <input type="number" min="1" value={linea.cantidad} onChange={e => handleLineaChange(i, 'cantidad', Number(e.target.value))} placeholder="Cantidad" style={{width:50}} />
                    <select value={linea.formato || ''} onChange={e => handleLineaChange(i, 'formato', e.target.value)} style={{width:90}}>
                      <option value="">Formato</option>
                      {formatos.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <input value={linea.comentario||''} onChange={e => handleLineaChange(i, 'comentario', e.target.value)} placeholder="Comentario" style={{width:110}} />
                    <button onClick={() => handleEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer'}}>🗑</button>
                  </li>
                ))}
              </ul>
              <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
                <button onClick={handleAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>Añadir línea</button>
                <button onClick={handleGuardarNuevo} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 22px',fontWeight:800,boxShadow:'0 2px 8px #28a74544',fontSize:16,letterSpacing:1}}>💾 Guardar</button>
                <button onClick={() => { setCreandoNuevo(false); setLineasEdit([]); }} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {pedidosBorrador.map((pedido, idx) => (
          <div key={pedido.id + '-' + idx} style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
            <div>
              <b>Pedido #{pedido.numeroPedido || pedido.id}</b>
              {modo === "tienda" && pedido.estado === "borrador" && editandoIdx === idx ? (
                <div style={{background:'#f8f9fa',padding:12,borderRadius:8,margin:'8px 0'}}>
                  <ul style={{padding:0, margin:0, listStyle:'none'}}>
                    {lineasEdit.length === 0 && (
                      <li style={{color:'#888',fontStyle:'italic',marginBottom:8}}>No hay líneas. Añade una para comenzar.</li>
                    )}
                    {lineasEdit.map((linea, i) => (
                      <li key={i} style={{marginBottom:4, display:'flex', gap:8, alignItems:'center'}}>
                        <input value={linea.producto} onChange={e => handleLineaChange(i, 'producto', e.target.value)} placeholder="Producto" style={{width:90}} />
                        <input type="number" min="1" value={linea.cantidad} onChange={e => handleLineaChange(i, 'cantidad', Number(e.target.value))} placeholder="Cantidad" style={{width:50}} />
                        <select value={linea.formato || ''} onChange={e => handleLineaChange(i, 'formato', e.target.value)} style={{width:90}}>
                          <option value="">Formato</option>
                          {formatos.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input value={linea.comentario||''} onChange={e => handleLineaChange(i, 'comentario', e.target.value)} placeholder="Comentario" style={{width:110}} />
                        <button onClick={() => handleEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer'}}>🗑</button>
                      </li>
                    ))}
                  </ul>
                  <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
                    <button onClick={handleAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>Añadir línea</button>
                    <button onClick={() => handleGuardar(idx)} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 22px',fontWeight:800,boxShadow:'0 2px 8px #28a74544',fontSize:16,letterSpacing:1}}>💾 Guardar</button>
                    <button onClick={handleCancelar} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <ul>
                  {pedido.lineas.map((linea, i) => (
                    <li key={linea.producto + '-' + linea.formato + '-' + i}>
                      {linea.producto} - {linea.cantidad} {linea.formato}
                      {linea.comentario && <> ({linea.comentario})</>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {modo === "tienda" && pedido.estado === "borrador" && (
              <div>
                {editandoIdx === idx ? null : (
                  <>
                    <button onClick={() => handleEditarLineas(pedido, idx)}>Editar líneas</button>
                    <button onClick={() => onBorrar(pedidos.findIndex(p => p.id === pedido.id))}>Borrar</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}