import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PedidosClientes from './PedidosClientes';
import PedidosWoo from './PedidosWoo';
import IntegracionSage from './IntegracionSage';
import ClientesMantenimiento from './ClientesMantenimiento';
import HistorialPedidosClientes from './HistorialPedidosClientes';

const USUARIOS = [
  { nombre: 'Amaya', pin: 'Amaya' },
  { nombre: 'Raquel', pin: 'Raquel' },
  { nombre: 'Elier', pin: '1973' }, // Para gestor-cestas-navideñas-pro
];

export default function App() {
  const [tab, setTab] = useState('clientes');
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  // Obtener la(s) URL(s) de cestas desde la variable de entorno
  const cestasUrls = (import.meta.env.VITE_CESTAS_URL || '').split(',').map(u => u.trim()).filter(Boolean);
  const cestasUrl = cestasUrls[0] || 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3200.app.github.dev';

  // Lógica de login
  if (!autenticado) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f4f7fb'}}>
        <form onSubmit={e => {
          e.preventDefault();
          if (!usuario || !pin) {
            setErrorLogin('Debes introducir usuario y PIN');
            return;
          }
          const user = USUARIOS.find(u => u.nombre === usuario && u.pin === pin);
          if (user) {
            localStorage.setItem('usuarioCRM', usuario);
            setErrorLogin('');
            setAutenticado(true);
          } else {
            setErrorLogin('Usuario o PIN incorrecto');
          }
        }} style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 2px 16px #1976d222',minWidth:320}}>
          <h2 style={{marginBottom:18}}>Acceso CRM Clientes</h2>
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Usuario" style={{fontSize:22,padding:12,borderRadius:8,border:'1.5px solid #1976d2',marginBottom:12,width:180,textAlign:'center'}} autoFocus />
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" style={{fontSize:22,padding:12,borderRadius:8,border:'1.5px solid #1976d2',marginBottom:12,width:180,textAlign:'center'}} />
          {errorLogin && <div style={{color:'#d32f2f',marginBottom:10}}>{errorLogin}</div>}
          <button type="submit" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,fontWeight:700,fontSize:18,padding:'10px 32px',cursor:'pointer'}}>Entrar</button>
        </form>
      </div>
    );
  }

  // Panel principal con botón de logout
  return (
    <div style={{fontFamily:'Inter, Arial, sans-serif', minHeight:'100vh', background:'#f4f7fb'}}>
      <header style={{background:'#1976d2',color:'#fff',padding:'18px 32px',fontSize:28,fontWeight:700,letterSpacing:1,boxShadow:'0 2px 8px #1976d233'}}>CRM de Clientes y Pedidos</header>
      <div style={{position:'absolute',top:18,right:32}}>
        <button onClick={() => {
          setAutenticado(false);
          setUsuario('');
          setPin('');
          localStorage.removeItem('usuarioCRM');
        }} style={{background:'#d32f2f',color:'#fff',border:'none',borderRadius:6,padding:'8px 22px',fontWeight:700,fontSize:17,boxShadow:'0 1px 4px #d32f2f22',cursor:'pointer'}}>Cerrar sesión</button>
      </div>
      <nav style={{display:'flex',gap:16,padding:'16px 32px',background:'#e3eafc',alignItems:'center',boxShadow:'0 2px 8px #1976d211'}}>
        <button onClick={()=>setTab('clientes')} style={{padding:'8px 18px',border:'none',borderRadius:6,background:tab==='clientes'?'#1976d2':'#fff',color:tab==='clientes'?'#fff':'#1976d2',fontWeight:700,transition:'all .2s'}}>Pedidos directos</button>
        <button onClick={()=>setTab('woo')} style={{padding:'8px 18px',border:'none',borderRadius:6,background:tab==='woo'?'#1976d2':'#fff',color:tab==='woo'?'#fff':'#1976d2',fontWeight:700,transition:'all .2s'}}>Pedidos WooCommerce</button>
        <button onClick={()=>setTab('sage')} style={{padding:'8px 18px',border:'none',borderRadius:6,background:tab==='sage'?'#1976d2':'#fff',color:tab==='sage'?'#fff':'#1976d2',fontWeight:700,transition:'all .2s'}}>Integración SAGE 50</button>
        <button onClick={()=>setTab('mantenimiento')} style={{padding:'8px 18px',border:'none',borderRadius:6,background:tab==='mantenimiento'?'#1976d2':'#fff',color:tab==='mantenimiento'?'#fff':'#1976d2',fontWeight:700,transition:'all .2s'}}>Clientes</button>
        <button onClick={()=>setMostrarHistorial(m=>!m)} style={{padding:'8px 18px',border:'none',borderRadius:6,background:mostrarHistorial?'#1976d2':'#fff',color:mostrarHistorial?'#fff':'#1976d2',fontWeight:700,transition:'all .2s'}}>Historial pedidos clientes</button>
        <button 
          onClick={() => {
            // Si ya está logueado, acceso directo
            window.open(cestasUrl + '?usuario=' + encodeURIComponent(usuario), '_blank');
          }} 
          style={{
            padding:'8px 18px',
            border:'none',
            borderRadius:6,
            background:'linear-gradient(135deg, #e74c3c, #c0392b)',
            color:'#fff',
            fontWeight:700,
            transition:'all .2s',
            boxShadow:'0 2px 8px rgba(231, 76, 60, 0.3)',
            display:'flex',
            alignItems:'center',
            gap:'6px'
          }}
          title="Abrir Gestor de Cestas Navideñas"
        >
          🎄 CESTAS Y LOTES
        </button>
        <div style={{marginLeft:'auto',display:'flex',gap:10}}>
          {tab==='clientes' && !mostrarHistorial && (
            <button onClick={()=>setEditorAbierto(true)} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 22px',fontWeight:700,fontSize:17,boxShadow:'0 1px 4px #28a74522'}}>+ Crear pedido</button>
          )}
        </div>
      </nav>
      <main style={{padding:32, minHeight:'70vh'}}>
        {mostrarHistorial ? (
          <HistorialPedidosClientes />
        ) : (
          <>
            {tab==='mantenimiento' && <ClientesMantenimiento />}
            {tab!=='mantenimiento' && (
              editorAbierto ? (
                <div style={{background:'#fff',borderRadius:16,boxShadow:'0 4px 32px #0002',padding:32,maxWidth:900,margin:'0 auto',position:'relative'}}>
                  <button onClick={()=>setEditorAbierto(false)} style={{position:'absolute',top:18,right:18,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:700,cursor:'pointer'}}>Cancelar</button>
                  <PedidosClientes onPedidoCreado={()=>setEditorAbierto(false)} />
                </div>
              ) : (
                <>
                  {tab==='clientes' && <div style={{color:'#888',fontStyle:'italic'}}>Selecciona "Crear pedido" para añadir un nuevo pedido de tienda.</div>}
                  {tab==='woo' && <PedidosWoo />}
                  {tab==='sage' && <IntegracionSage />}
                </>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}
