import React, { useState } from "react";
import Watermark from './Watermark';

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo }) {
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [lineasEdit, setLineasEdit] = useState([]);

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