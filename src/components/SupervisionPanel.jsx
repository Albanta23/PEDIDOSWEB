import React, { useState } from "react";
import HistoricoFabrica from "./HistoricoFabrica";
import HistoricoTiendaPanel from "./HistoricoTiendaPanel";
import Watermark from "./Watermark";

export default function SupervisionPanel({ pedidos, tiendas, onClose }) {
  const [tab, setTab] = useState("fabrica");
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',padding:32,borderRadius:18,boxShadow:'0 8px 40px #007bff33',minWidth:400,maxWidth:1100,maxHeight:'95vh',overflowY:'auto',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:20,background:'#dc3545',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Cerrar</button>
        <Watermark />
        <div style={{display:'flex',gap:16,marginBottom:24}}>
          <button onClick={()=>setTab('fabrica')} style={{background:tab==='fabrica'?'#007bff':'#eee',color:tab==='fabrica'?'#fff':'#333',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Fábrica</button>
          <button onClick={()=>setTab('tiendas')} style={{background:tab==='tiendas'?'#007bff':'#eee',color:tab==='tiendas'?'#fff':'#333',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Tiendas</button>
        </div>
        {tab==="fabrica" ? (
          <HistoricoFabrica pedidos={pedidos} tiendas={tiendas} />
        ) : (
          tiendas.filter(t=>t.id!=="clientes").map(t=>(
            <div key={t.id} style={{marginBottom:32}}>
              <HistoricoTiendaPanel pedidos={pedidos} tiendaId={t.id} tiendaNombre={t.nombre} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
