import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

function cargarLogoBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function generarPDFTienda(pedido, tiendaNombre) {
  const logoBase64 = await cargarLogoBase64(window.location.origin + '/logo.png');
  const doc = new jsPDF();
  doc.addImage(logoBase64, 'PNG', 15, 10, 30, 18);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Carnicería Central', 50, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Albarán de Expedición', 50, 28);
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);
  doc.setFontSize(11);
  let y = 40;
  doc.text(`Nº Pedido:`, 15, y); doc.text(String(pedido.numeroPedido || '-'), 45, y);
  y += 7;
  doc.text(`Tienda:`, 15, y); doc.text(tiendaNombre, 45, y);
  y += 7;
  doc.text(`Fecha:`, 15, y); doc.text(pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : (pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleString() : '-'), 45, y);
  y += 7;
  doc.text(`Estado:`, 15, y); doc.text(
    pedido.estado === 'enviadoTienda' ? 'Recibido de fábrica' :
    pedido.estado === 'preparado' ? 'Preparado en fábrica' :
    pedido.estado === 'enviado' ? 'Enviado a fábrica' :
    pedido.estado === 'borrador' ? 'Borrador (no enviado)' : pedido.estado, 45, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y, 180, 8, 'F');
  doc.text('Nº', 18, y + 6);
  doc.text('Producto', 28, y + 6);
  doc.text('Pedida', 80, y + 6);
  doc.text('Enviada', 100, y + 6);
  doc.text('Formato', 120, y + 6);
  doc.text('Lote', 150, y + 6);
  doc.text('Comentario', 170, y + 6);
  y += 14;
  doc.setFont('helvetica', 'normal');
  pedido.lineas.forEach((l, i) => {
    doc.text(String(i + 1), 18, y);
    doc.text(l.producto || '-', 28, y);
    doc.text(String(l.cantidad || '-'), 80, y, { align: 'right' });
    doc.text(String(l.cantidadEnviada || '-'), 100, y, { align: 'right' });
    doc.text(l.formato || '-', 120, y);
    doc.text(l.lote || '-', 150, y);
    doc.text(l.comentario ? l.comentario.substring(0, 18) : '-', 170, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 15, 285);
  doc.save(`albaran_tienda_${pedido.numeroPedido || 'sin_numero'}_${Date.now()}.pdf`);
}

const HistoricoTiendaPanel = ({ pedidos, tiendaId, tiendaNombre, onVolver }) => {
  const [modalPedido, setModalPedido] = useState(null);
  // Pedidos enviados a fábrica (solo enviados, NO borrador)
  const pedidosEnviados = pedidos.filter(p =>
    p.tiendaId === tiendaId &&
    (
      (p.lineas && p.lineas.length > 0 && p.estado === 'enviado') ||
      (p.estado === 'borrador' && p.fechaCreacion && p.numeroPedido)
    )
  ).sort((a, b) => ((b.numeroPedido || 0) - (a.numeroPedido || 0)));
  // Pedidos preparados o recibidos de fábrica
  const pedidosRecibidos = pedidos.filter(p =>
    p.tiendaId === tiendaId &&
    p.numeroPedido &&
    (
      (p.lineas && p.lineas.length > 0 && (p.estado === 'preparado' || p.estado === 'enviadoTienda')) ||
      (p.estado === 'borrador' && p.fechaCreacion && p.numeroPedido)
    )
  ).sort((a, b) => (b.numeroPedido - a.numeroPedido));

  return (
    <div style={{
      marginTop:32,
      fontFamily:'Inter, Segoe UI, Arial, sans-serif',
      fontSize:16,
      background:'#f6f8fa',
      minHeight:'100vh',
      paddingBottom:40,
      position:'relative',
      zIndex:1,
      overflow:'hidden'
    }}>
      {/* Imagen de fondo decorativa */}
      <img src="/logo.png" alt="Fondo" style={{
        position:'fixed',
        top:0,
        left:0,
        width:'100vw',
        height:'100vh',
        objectFit:'cover',
        opacity:0.07,
        zIndex:0,
        pointerEvents:'none',
        filter:'blur(2px) grayscale(0.2)'
      }} />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:24}}>
        <h2 style={{margin:0, fontWeight:800, fontSize:28, color:'#222'}}>Histórico de pedidos de <span style={{color:'#007bff'}}>{tiendaNombre}</span></h2>
        <button onClick={onVolver} style={{padding:'10px 24px',background:'linear-gradient(90deg,#007bff,#00c6ff)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700, fontSize:16, boxShadow:'0 2px 8px #007bff22', transition:'0.2s', outline:'none'}}>
          ← Volver
        </button>
      </div>
      <h3 style={{marginTop:24,marginBottom:12, fontWeight:700, color:'#333', fontSize:22}}>Pedidos enviados a fábrica</h3>
      <div style={{overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px #0001', background:'#fff'}}>
      <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
        <thead style={{background:'linear-gradient(90deg,#007bff,#00c6ff)', color:'#fff'}}>
          <tr>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>ID</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Nº Pedido</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Fecha</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Estado</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Líneas</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidosEnviados.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:'center',color:'#888', padding:24}}>No hay pedidos enviados a fábrica ni creados</td></tr>
          )}
          {pedidosEnviados.map((pedido, idx) => (
            <tr key={pedido.numeroPedido || pedido.id} style={{background: idx%2===0 ? '#fafdff':'#eaf6fb', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#d0eaff'} onMouseOut={e=>e.currentTarget.style.background=idx%2===0?'#fafdff':'#eaf6fb'}>
              <td title={pedido.id} style={{padding:'10px 8px', fontSize:14, color:'#007bff'}}>{pedido.id?.slice(0,8) || '-'}</td>
              <td style={{padding:'10px 8px', fontWeight:600}}>{pedido.numeroPedido || '-'}</td>
              <td style={{padding:'10px 8px'}} title={pedido.fechaPedido || pedido.fechaCreacion}>
                <span>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : (pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleString() : '-')}</span>
                <br/><span style={{fontSize:11, color:'#888'}}>{pedido.fechaPedido || pedido.fechaCreacion}</span>
              </td>
              <td style={{padding:'10px 8px'}}>
                <span style={{display:'inline-block',padding:'4px 14px',borderRadius:16,background:pedido.estado==='borrador'?'#e0e0e0':pedido.estado==='enviado'?'#007bff22':'#00c6ff22',color:pedido.estado==='borrador'?'#555':pedido.estado==='enviado'?'#007bff':'#00c6ff',fontWeight:700, fontSize:14, boxShadow:'0 1px 4px #007bff11'}}>{pedido.estado}</span>
              </td>
              <td style={{padding:'10px 8px'}}><span style={{background:'#f1f8ff',padding:'4px 12px',borderRadius:12, fontWeight:600}}>{pedido.lineas.length}</span></td>
              <td style={{display:'flex',gap:8, padding:'10px 8px'}}>
                <button title="Ver detalles" onClick={() => setModalPedido(pedido)} style={{background:'#fff',border:'1px solid #007bff',color:'#007bff',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',transition:'0.2s',fontSize:15,boxShadow:'0 1px 4px #007bff11'}}>
                  <span role="img" aria-label="ver">🔍</span> Ver
                </button>
                <button title="Descargar PDF" onClick={() => generarPDFTienda(pedido, tiendaNombre)} style={{background:'linear-gradient(90deg,#007bff,#00c6ff)',border:'none',color:'#fff',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',transition:'0.2s',fontSize:15,boxShadow:'0 1px 4px #007bff22'}}>
                  <span role="img" aria-label="pdf">🗎</span> PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <h3 style={{marginTop:32,marginBottom:12, fontWeight:700, color:'#333', fontSize:22}}>Pedidos preparados o recibidos de fábrica</h3>
      <div style={{overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px #0001', background:'#fff'}}>
      <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
        <thead style={{background:'linear-gradient(90deg,#007bff,#00c6ff)', color:'#fff'}}>
          <tr>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>ID</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Nº Pedido</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Fecha</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Estado</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Líneas</th>
            <th style={{padding:'14px 8px', fontWeight:700, fontSize:15}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidosRecibidos.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:'center',color:'#888', padding:24}}>No hay pedidos preparados o recibidos de fábrica</td></tr>
          )}
          {pedidosRecibidos.map((pedido, idx) => (
            <tr key={pedido.numeroPedido} style={{background: idx%2===0 ? '#fafdff':'#eaf6fb', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#d0eaff'} onMouseOut={e=>e.currentTarget.style.background=idx%2===0?'#fafdff':'#eaf6fb'}>
              <td title={pedido.id} style={{padding:'10px 8px', fontSize:14, color:'#007bff'}}>{pedido.id?.slice(0,8) || '-'}</td>
              <td style={{padding:'10px 8px', fontWeight:600}}>{pedido.numeroPedido}</td>
              <td style={{padding:'10px 8px'}} title={pedido.fechaPedido}>
                <span>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</span>
                <br/><span style={{fontSize:11, color:'#888'}}>{pedido.fechaPedido}</span>
              </td>
              <td style={{padding:'10px 8px'}}>
                <span style={{display:'inline-block',padding:'4px 14px',borderRadius:16,background:pedido.estado==='preparado'?'#ffe066':pedido.estado==='enviadoTienda'?'#b2f2bb':'#e0e0e0',color:pedido.estado==='preparado'?'#b8860b':pedido.estado==='enviadoTienda'?'#228c22':'#555',fontWeight:700, fontSize:14, boxShadow:'0 1px 4px #007bff11'}}>{pedido.estado}</span>
              </td>
              <td style={{padding:'10px 8px'}}><span style={{background:'#f1f8ff',padding:'4px 12px',borderRadius:12, fontWeight:600}}>{pedido.lineas.length}</span></td>
              <td style={{display:'flex',gap:8, padding:'10px 8px'}}>
                <button title="Ver detalles" onClick={() => setModalPedido(pedido)} style={{background:'#fff',border:'1px solid #007bff',color:'#007bff',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',transition:'0.2s',fontSize:15,boxShadow:'0 1px 4px #007bff11'}}>
                  <span role="img" aria-label="ver">🔍</span> Ver
                </button>
                <button title="Descargar PDF" onClick={() => generarPDFTienda(pedido, tiendaNombre)} style={{background:'linear-gradient(90deg,#007bff,#00c6ff)',border:'none',color:'#fff',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',transition:'0.2s',fontSize:15,boxShadow:'0 1px 4px #007bff22'}}>
                  <span role="img" aria-label="pdf">🗎</span> PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {modalPedido && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter:'blur(2px)'
        }} onClick={() => setModalPedido(null)}>
          <div style={{
            background: '#fff', borderRadius: 18, minWidth: 380, maxWidth: 600, width: '90vw',
            padding: '36px 36px 40px 36px', boxShadow: '0 8px 40px #007bff33',
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            border: '1.5px solid #e3eaff'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalPedido(null)} style={{
              position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#007bff', lineHeight: 1, fontWeight:700
            }} title="Cerrar">×</button>
            <h3 style={{marginTop:0, marginBottom: 8, textAlign:'center', fontWeight:800, fontSize:24, color:'#007bff'}}>Pedido Nº {modalPedido.numeroPedido || '-'}</h3>
            <div style={{marginBottom:8, textAlign:'center', color:'#555', fontSize:16}}>Fecha: {modalPedido.fechaPedido ? new Date(modalPedido.fechaPedido).toLocaleString() : (modalPedido.fechaCreacion ? new Date(modalPedido.fechaCreacion).toLocaleString() : '-')}</div>
            <div style={{marginBottom:18, textAlign:'center'}}>
              Estado: <b style={{
                color:
                  modalPedido.estado === 'enviadoTienda' ? '#228c22' :
                  modalPedido.estado === 'preparado' ? '#b8860b' :
                  modalPedido.estado === 'enviado' ? '#007bff' :
                  modalPedido.estado === 'borrador' ? '#555' : '#333',
                background:
                  modalPedido.estado === 'enviadoTienda' ? '#b2f2bb' :
                  modalPedido.estado === 'preparado' ? '#ffe066' :
                  modalPedido.estado === 'enviado' ? '#eaf1fa' :
                  modalPedido.estado === 'borrador' ? '#e0e0e0' : 'transparent',
                padding: '4px 16px', borderRadius: 10, fontWeight:700, fontSize:16
              }}>
                {modalPedido.estado === 'enviadoTienda' ? 'Recibido de fábrica' : modalPedido.estado === 'preparado' ? 'Preparado en fábrica' : modalPedido.estado === 'enviado' ? 'Enviado a fábrica' : 'Borrador (no enviado)'}
              </b>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', background:'#f8f9fa', borderRadius:10, marginBottom:8, borderCollapse:'collapse', boxShadow:'0 1px 8px #007bff11'}}>
                <thead style={{background:'#f1f8ff'}}>
                  <tr>
                    <th style={{padding:'8px 10px'}}>#</th>
                    <th style={{padding:'8px 10px'}}>Producto</th>
                    <th style={{padding:'8px 10px'}}>Pedida</th>
                    <th style={{padding:'8px 10px'}}>Enviada</th>
                    <th style={{padding:'8px 10px'}}>Formato</th>
                    <th style={{padding:'8px 10px'}}>Comentario</th>
                    <th style={{padding:'8px 10px'}}>Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {modalPedido.lineas.map((l, i) => (
                    <tr key={i} style={{background:i%2===0?'#fff':'#f1f8ff'}}>
                      <td style={{padding:'8px 10px', textAlign:'center'}}>{i + 1}</td>
                      <td style={{padding:'8px 10px'}}>{l.producto}</td>
                      <td style={{padding:'8px 10px', textAlign:'center'}}>{l.cantidad}</td>
                      <td style={{padding:'8px 10px', textAlign:'center'}}>{l.cantidadEnviada || '-'}</td>
                      <td style={{padding:'8px 10px'}}>{l.formato}</td>
                      <td style={{padding:'8px 10px'}}>{l.comentario || '-'}</td>
                      <td style={{padding:'8px 10px'}}>{l.lote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:18}}>
              <button onClick={() => generarPDFTienda(modalPedido, tiendaNombre)} style={{
                padding: '10px 22px', background: 'linear-gradient(90deg,#007bff,#00c6ff)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight:700, fontSize:16, boxShadow:'0 2px 8px #007bff22', transition:'0.2s', outline:'none'
              }}>
                🗎 Descargar PDF
              </button>
              <button onClick={() => {
                // Reutilizar pedido: crea un nuevo pedido en borrador con las mismas líneas
                if (!modalPedido.lineas || modalPedido.lineas.length === 0) {
                  // Mostrar aviso si no hay líneas
                  const msg = document.createElement('div');
                  msg.textContent = 'No se puede reutilizar un pedido sin líneas';
                  msg.style.position = 'fixed';
                  msg.style.top = '30px';
                  msg.style.left = '50%';
                  msg.style.transform = 'translateX(-50%)';
                  msg.style.background = '#dc3545';
                  msg.style.color = '#fff';
                  msg.style.padding = '12px 32px';
                  msg.style.borderRadius = '8px';
                  msg.style.fontWeight = 'bold';
                  msg.style.fontSize = '18px';
                  msg.style.zIndex = 3000;
                  document.body.appendChild(msg);
                  setTimeout(() => msg.remove(), 6000);
                  return;
                }
                if (typeof window !== 'undefined' && window.localStorage) {
                  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
                  const nuevo = {
                    id: 'pedido_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    tiendaId: modalPedido.tiendaId,
                    estado: 'borrador',
                    lineas: modalPedido.lineas.map(l => ({ ...l })),
                    fechaCreacion: new Date().toISOString()
                  };
                  pedidos.push(nuevo);
                  localStorage.setItem('pedidos', JSON.stringify(pedidos));
                }
                setModalPedido(null); // Cierra el modal y vuelve a la pantalla principal
                setTimeout(() => {
                  const msg = document.createElement('div');
                  msg.textContent = 'Pedido reutilizado';
                  msg.style.position = 'fixed';
                  msg.style.top = '30px';
                  msg.style.left = '50%';
                  msg.style.transform = 'translateX(-50%)';
                  msg.style.background = '#28a745';
                  msg.style.color = '#fff';
                  msg.style.padding = '12px 32px';
                  msg.style.borderRadius = '8px';
                  msg.style.fontWeight = 'bold';
                  msg.style.fontSize = '18px';
                  msg.style.zIndex = 3000;
                  document.body.appendChild(msg);
                  setTimeout(() => msg.remove(), 6000);
                }, 200);
              }} style={{
                padding: '10px 22px', background: 'linear-gradient(90deg,#28a745,#00c851)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight:700, fontSize:16, boxShadow:'0 2px 8px #28a74522', transition:'0.2s', outline:'none'
              }}>
                🔄 Reutilizar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoTiendaPanel;
