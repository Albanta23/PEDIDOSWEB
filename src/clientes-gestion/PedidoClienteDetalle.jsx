import React from 'react';
import { exportPedidoClientePDF } from './utils/exportPedidoPDF';

export default function PedidoClienteDetalle({ pedido, onClose }) {
  if (!pedido) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:12,padding:32,minWidth:400,maxWidth:600,boxShadow:'0 8px 32px #0004',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 18px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
        <h2 style={{marginTop:0}}>Detalle del pedido</h2>
        <button onClick={()=>exportPedidoClientePDF(pedido)} style={{marginBottom:16,background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'6px 18px',fontWeight:700,cursor:'pointer'}}>Exportar a PDF</button>
        <div><b>Nº Pedido:</b> {pedido.numeroPedido || pedido._id}</div>
        <div><b>Cliente:</b> {pedido.clienteNombre}</div>
        <div><b>Estado:</b> {pedido.estado?.replace('_',' ').toUpperCase()}</div>
        <div><b>Fecha pedido:</b> {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</div>
        <div><b>Dirección:</b> {pedido.direccion || '-'}</div>
        <div><b>Usuario que tramitó:</b> {pedido.usuarioTramitando || '-'}</div>
        <div><b>Nº de bultos:</b> {pedido.lineas?.filter(l=>!l.esComentario).length || 0}</div>
        <div><b>Bultos registrados:</b> {pedido.bultos !== undefined ? pedido.bultos : '-'}</div>
        <div style={{margin:'16px 0'}}>
          <b>Líneas del pedido:</b>
          <ul style={{paddingLeft:18}}>
            {pedido.lineas?.map((l,i)=>(
              <li key={i} style={{marginBottom:4}}>
                {l.esComentario ? <i style={{color:'#b8860b'}}>Comentario: {l.comentario}</i> : (
                  <>
                    <b>{l.producto}</b> - {l.cantidad} {l.formato}
                    {l.peso && <span style={{color:'#1976d2'}}> - {l.peso} kg</span>}
                    {l.lote && <span style={{color:'#ff9800'}}> - Lote: {l.lote}</span>}
                    {l.comentario && <span style={{color:'#888'}}>({l.comentario})</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <b>Historial de estados:</b>
          <ul style={{paddingLeft:18}}>
            {pedido.historialEstados?.map((h,i)=>(
              <li key={i}>
                <b>{h.estado?.replace('_',' ').toUpperCase()}</b> por <span style={{color:'#1976d2'}}>{h.usuario}</span> el {h.fecha ? new Date(h.fecha).toLocaleString() : '-'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
