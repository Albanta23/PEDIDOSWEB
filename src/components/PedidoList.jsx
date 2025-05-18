import React, { useState } from "react";
import Watermark from './Watermark';
import TransferenciasPanel from './TransferenciasPanel';

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual }) {
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [lineasEdit, setLineasEdit] = useState([]);
  const [mostrarTransferencias, setMostrarTransferencias] = useState(false);

  const handleEditarLineas = (pedido, idx) => {
    setEditandoIdx(idx);
    setLineasEdit(pedido.lineas.map(l => ({ ...l })));
  };

  const handleGuardar = (idx) => {
    onModificar(idx, { lineas: lineasEdit });
    setEditandoIdx(null);
    setLineasEdit([]);
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

  return (
    <>
      <Watermark />
      {modo === 'tienda' && (
        <div style={{marginBottom:16}}>
          <button onClick={()=>setMostrarTransferencias(true)} style={{background:'#00b894',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Traspasos y devoluciones</button>
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
        {pedidos.filter(p => p.estado === 'borrador').map((pedido, idx) => (
          <div key={pedido.id + '-' + idx} style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
            <div>
              <b>Pedido #{pedido.numeroPedido || pedido.id}</b>
              {modo === "tienda" && pedido.estado === "borrador" && editandoIdx === idx ? (
                <>
                  <ul style={{padding:0, margin:0, listStyle:'none'}}>
                    {lineasEdit.map((linea, i) => (
                      <li key={i} style={{marginBottom:4, display:'flex', gap:8, alignItems:'center'}}>
                        <input value={linea.producto} onChange={e => handleLineaChange(i, 'producto', e.target.value)} placeholder="Producto" style={{width:90}} />
                        <input type="number" min="1" value={linea.cantidad} onChange={e => handleLineaChange(i, 'cantidad', Number(e.target.value))} style={{width:50}} />
                        <input value={linea.formato} onChange={e => handleLineaChange(i, 'formato', e.target.value)} placeholder="Formato" style={{width:70}} />
                        <input value={linea.comentario||''} onChange={e => handleLineaChange(i, 'comentario', e.target.value)} placeholder="Comentario" style={{width:110}} />
                        <button onClick={() => handleEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer'}}>🗑</button>
                      </li>
                    ))}
                  </ul>
                  <div style={{display:'flex', gap:8, marginTop:4}}>
                    <button onClick={handleAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Añadir línea</button>
                    <button onClick={() => handleGuardar(idx)} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Guardar</button>
                    <button onClick={handleCancelar} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Cancelar</button>
                  </div>
                </>
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