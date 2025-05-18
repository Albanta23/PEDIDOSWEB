import React, { useState } from "react";
import HistoricoFabrica from "./HistoricoFabrica";
import HistoricoTiendaPanel from "./HistoricoTiendaPanel";
import Watermark from "./Watermark";
import TransferenciasPanel from "./TransferenciasPanel";

export default function SupervisionPanel({ pedidos, tiendas, onClose }) {
  const [tab, setTab] = useState("fabrica");
  const [logueado, setLogueado] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  // PIN hardcodeado para supervisor (puedes cambiarlo o hacerlo configurable)
  const PIN_SUPERVISOR = "supervisor";

  // Filtros para la pestaña transferencias
  const [filtroTienda, setFiltroTienda] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Función para filtrar transferencias por tienda y fechas
  const filtrarTransferencias = (transferencias) => {
    return transferencias.filter(t => {
      const tiendaMatch = !filtroTienda || t.origen === filtroTienda || t.destino === filtroTienda;
      const fecha = t.fecha ? new Date(t.fecha) : null;
      const desde = filtroFechaDesde ? new Date(filtroFechaDesde) : null;
      const hasta = filtroFechaHasta ? new Date(filtroFechaHasta) : null;
      const fechaMatch = (!desde || (fecha && fecha >= desde)) && (!hasta || (fecha && fecha <= hasta));
      return tiendaMatch && fechaMatch;
    });
  };

  if (!logueado) {
    return (
      <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#fff',padding:32,borderRadius:18,boxShadow:'0 8px 40px #007bff33',minWidth:340,maxWidth:400,maxHeight:'95vh',overflowY:'auto',position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:16,right:20,background:'#dc3545',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Cerrar</button>
          <Watermark />
          <form onSubmit={e => { e.preventDefault(); }}>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Acceso Supervisor</h2>
            <div style={{ marginBottom: 18 }}>
              <label>PIN de acceso:</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 6 }}
                autoComplete="off"
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <button type="button" onClick={() => {
              if (pin !== PIN_SUPERVISOR) {
                setError('PIN de supervisor incorrecto');
                return;
              }
              setError('');
              setLogueado(true);
            }} style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16 }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',padding:32,borderRadius:18,boxShadow:'0 8px 40px #007bff33',minWidth:400,maxWidth:1100,maxHeight:'95vh',overflowY:'auto',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:20,background:'#dc3545',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Cerrar</button>
        <Watermark />
        <div style={{display:'flex',gap:16,marginBottom:24}}>
          <button onClick={()=>setTab('fabrica')} style={{background:tab==='fabrica'?'#007bff':'#eee',color:tab==='fabrica'?'#fff':'#333',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Fábrica</button>
          <button onClick={()=>setTab('tiendas')} style={{background:tab==='tiendas'?'#007bff':'#eee',color:tab==='tiendas'?'#fff':'#333',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Tiendas</button>
          <button onClick={()=>setTab('transferencias')} style={{background:tab==='transferencias'?'#007bff':'#eee',color:tab==='transferencias'?'#fff':'#333',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:18,cursor:'pointer'}}>Traspasos/Devoluciones</button>
        </div>
        {tab==="fabrica" ? (
          <HistoricoFabrica pedidos={pedidos} tiendas={tiendas} />
        ) : tab==="tiendas" ? (
          <>
            {tiendas.filter(t=>t.id!=="clientes").map(t=>(
              <div key={t.id} style={{marginBottom:32}}>
                <HistoricoTiendaPanel pedidos={pedidos} tiendaId={t.id} tiendaNombre={t.nombre} />
                <div style={{marginTop:12,marginBottom:32}}>
                  <TransferenciasPanel tiendas={tiendas} tiendaActual={t} modoFabrica={false} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{display:'flex',gap:16,marginBottom:18,alignItems:'center'}}>
              <select value={filtroTienda} onChange={e=>setFiltroTienda(e.target.value)} style={{padding:6,borderRadius:6}}>
                <option value=''>Todas las tiendas</option>
                {tiendas.filter(t=>t.id!=="clientes").map(t=>(
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
              <label>Desde: <input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={{padding:6,borderRadius:6}} /></label>
              <label>Hasta: <input type="date" value={filtroFechaHasta} onChange={e=>setFiltroFechaHasta(e.target.value)} style={{padding:6,borderRadius:6}} /></label>
              <button onClick={()=>{setFiltroTienda('');setFiltroFechaDesde('');setFiltroFechaHasta('');}} style={{padding:'6px 14px',borderRadius:6,background:'#eee',border:'none',fontWeight:600}}>Limpiar</button>
            </div>
            <TransferenciasPanel tiendas={tiendas} modoFabrica={true} filtroTienda={filtroTienda} filtroFechaDesde={filtroFechaDesde} filtroFechaHasta={filtroFechaHasta} filtrarTransferencias={filtrarTransferencias} />
          </>
        )}
      </div>
    </div>
  );
}
