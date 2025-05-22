import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import Watermark from './Watermark';
import { DATOS_EMPRESA } from '../configDatosEmpresa';
import logo from '../assets/logo1.png';
import { listarAvisos, marcarAvisoVisto } from '../services/avisosService';
import { FORMATOS_PEDIDO } from '../configFormatos';

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
  const logoBase64 = await cargarLogoBase64(window.location.origin + '/logo1.png');
  const doc = new jsPDF();
  doc.addImage(logoBase64, 'PNG', 15, 10, 30, 18);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMBUTIDOS BALLESTEROS SL', 50, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Albarán de Expedición', 50, 28);
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);

  doc.setFontSize(10);
  let y = 40;
  doc.text(`Nº Pedido:`, 15, y); doc.text(String(pedido.numeroPedido || '-'), 45, y);
  y += 6;
  doc.text(`Tienda:`, 15, y); doc.text(tiendaNombre, 45, y);
  y += 6;
  doc.text(`Fecha:`, 15, y); doc.text(pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString() : (pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleDateString() : '-'), 45, y);
  y += 6;
  doc.text(`Estado:`, 15, y); doc.text(
    pedido.estado === 'enviadoTienda' ? 'Recibido de fábrica' :
    pedido.estado === 'preparado' ? 'Preparado en fábrica' :
    pedido.estado === 'enviado' ? 'Enviado a fábrica' :
    pedido.estado === 'borrador' ? 'Borrador (no enviado)' : pedido.estado, 45, y);
  y += 6;
  doc.text(`Peso total:`, 15, y); doc.text(pedido.peso !== undefined && pedido.peso !== null ? String(pedido.peso) + ' kg' : '-', 45, y);

  y += 10; // Increased space before the table

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y, 180, 8, 'F'); // Header background

  const headerY = y + 6; // Adjusted Y for header text
  let currentX = 16; // Start a bit to the right for padding

  // Define column widths
  const colWidths = {
    num: 8,
    producto: 45, // Increased width for producto
    formato: 25,
    pedida: 15,
    peso: 15,
    enviada: 15,
    lote: 22,
    comentario: 35 // Adjusted for remaining space
  };

  doc.text('Nº', currentX, headerY); currentX += colWidths.num;
  doc.text('Producto', currentX, headerY); currentX += colWidths.producto;
  doc.text('Formato', currentX, headerY); currentX += colWidths.formato;
  doc.text('Pedida', currentX + colWidths.pedida / 2, headerY, { align: 'center' }); currentX += colWidths.pedida;
  doc.text('Peso(kg)', currentX + colWidths.peso / 2, headerY, { align: 'center' }); currentX += colWidths.peso;
  doc.text('Enviada', currentX + colWidths.enviada / 2, headerY, { align: 'center' }); currentX += colWidths.enviada;
  doc.text('Lote', currentX + colWidths.lote / 2, headerY, { align: 'center' }); currentX += colWidths.lote;
  doc.text('Comentario', currentX, headerY);

  y += 10; // New Y after header (increased space)

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); // Slightly smaller font for table data

  pedido.lineas.forEach((l, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      // Optionally re-draw header on new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setFillColor(230, 230, 230);
      doc.rect(15, y, 180, 8, 'F');
      const newPageHeaderY = y + 6;
      let newPageCurrentX = 16;
      doc.text('Nº', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.num;
      doc.text('Producto', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.producto;
      doc.text('Formato', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.formato;
      doc.text('Pedida', newPageCurrentX + colWidths.pedida / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.pedida;
      doc.text('Peso(kg)', newPageCurrentX + colWidths.peso / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.peso;
      doc.text('Enviada', newPageCurrentX + colWidths.enviada / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.enviada;
      doc.text('Lote', newPageCurrentX + colWidths.lote / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.lote;
      doc.text('Comentario', newPageCurrentX, newPageHeaderY);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    currentX = 16;
    doc.text(String(i + 1), currentX + colWidths.num / 2, y, {align: 'center'}); currentX += colWidths.num;
    
    // Handle potential multi-line for producto
    const productoLines = doc.splitTextToSize(l.producto || '-', colWidths.producto - 2); // -2 for padding
    doc.text(productoLines, currentX, y);
    let productoLineHeight = productoLines.length * 4; // Approximate height based on font size 8

    currentX += colWidths.producto;
    doc.text(FORMATOS_PEDIDO.includes(l.formato) ? l.formato : '-', currentX, y); currentX += colWidths.formato;
    doc.text(String(l.cantidad || '-'), currentX + colWidths.pedida / 2, y, { align: 'center' }); currentX += colWidths.pedida;
    doc.text(l.peso !== undefined && l.peso !== null ? String(l.peso) : '-', currentX + colWidths.peso / 2, y, { align: 'center' }); currentX += colWidths.peso;
    doc.text(String(l.cantidadEnviada || '-'), currentX + colWidths.enviada / 2, y, { align: 'center' }); currentX += colWidths.enviada;
    doc.text(l.lote || '-', currentX + colWidths.lote / 2, y, { align: 'center' }); currentX += colWidths.lote;
    
    // Handle potential multi-line for comentario
    const comentarioLines = doc.splitTextToSize(l.comentario || '-', colWidths.comentario -2);
    doc.text(comentarioLines, currentX, y);
    let comentarioLineHeight = comentarioLines.length * 4;

    y += Math.max(productoLineHeight, comentarioLineHeight, 6); // Adjust y based on max line height or default
  });

  doc.setFontSize(9);
  // Datos corporativos en la parte inferior
  let yFooter = 278;
  doc.text(`${DATOS_EMPRESA.nombre} - CIF: ${DATOS_EMPRESA.cif}`, 15, yFooter);
  yFooter += 4;
  doc.text(`${DATOS_EMPRESA.direccion} | Tel: ${DATOS_EMPRESA.telefono} | ${DATOS_EMPRESA.email} | ${DATOS_EMPRESA.web}`, 15, yFooter);
  yFooter += 4;
  doc.text(`Generado: ${new Date().toLocaleString()}`, 15, yFooter);
  // --- FIX COMPATIBILIDAD PDF ---
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } else {
    doc.save(`albaran_tienda_${pedido.numeroPedido || 'sin_numero'}_${Date.now()}.pdf`);
  }
}

const HistoricoTiendaPanel = ({ pedidos, tiendaId, tiendaNombre, onVolver, onModificarPedido, onAvisoVisto }) => {
  const [modalPedido, setModalPedido] = useState(null);
  const [editandoLineas, setEditandoLineas] = useState(null); // Si no es null, es el array de líneas editables
  const [avisos, setAvisos] = useState([]);
  const [vistos, setVistos] = useState([]);

  useEffect(() => {
    async function fetchAvisos() {
      const avisosBD = await listarAvisos(tiendaId);
      setAvisos(avisosBD);
      setVistos(avisosBD.filter(a => a.vistoPor.includes(tiendaId)).map(a => a.referenciaId));
    }
    if (tiendaId) fetchAvisos();
  }, [tiendaId]);

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
      {/* Botón de volver solo si NO hay modal de pedido abierto (refuerzo: ocultar y deshabilitar si modalPedido) */}
      <button
        style={{
          position:'fixed',top:24,left:24,background:'#007bff',color:'#fff',border:'none',borderRadius:8,padding:'10px 26px',fontWeight:700,fontSize:18,cursor:!modalPedido?'pointer':'not-allowed',zIndex:2100,boxShadow:'0 2px 8px #007bff33',
          opacity:!modalPedido?1:0, pointerEvents:!modalPedido?'auto':'none', transition:'opacity 0.2s',
          visibility:!modalPedido?'visible':'hidden'
        }}
        onClick={onVolver}
        tabIndex={modalPedido ? -1 : 0}
        aria-hidden={modalPedido ? 'true' : 'false'}
        disabled={!!modalPedido}
      >
        ← Volver
      </button>
      <Watermark />
      <h2 style={{margin:0, fontWeight:800, fontSize:28, color:'#222', marginBottom:8}}>Histórico de pedidos de <span style={{color:'#007bff'}}>{tiendaNombre}</span></h2>
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
            <tr key={`enviado-${pedido.id || pedido._id || `${pedido.numeroPedido}-${pedido.tiendaId}-${idx}`}`} style={{background: idx%2===0 ? '#fafdff':'#eaf6fb', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#d0eaff'} onMouseOut={e=>e.currentTarget.style.background=idx%2===0?'#fafdff':'#eaf6fb'}>
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
          {pedidosRecibidos.map((pedido, idx) => {
            const pendienteAviso = !vistos.includes(pedido.id || pedido._id);
            return (
              <tr key={`${pedido.numeroPedido}-${pedido.tiendaId}-${pedido.id || pedido._id || idx}`} style={{background: idx%2===0 ? '#fafdff':'#eaf6fb', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#d0eaff'} onMouseOut={e=>e.currentTarget.style.background=idx%2===0?'#fafdff':'#eaf6fb'}>
                <td title={pedido.id} style={{padding:'10px 8px', fontSize:14, color:'#007bff'}}>{pedido.id?.slice(0,8) || '-'}</td>
                <td style={{padding:'10px 8px', fontWeight:600}}>{pedido.numeroPedido}</td>
                <td style={{padding:'10px 8px'}} title={pedido.fechaPedido || pedido.fechaCreacion}>
                  <span>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : (pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleString() : '-')}</span>
                  <br/><span style={{fontSize:11, color:'#888'}}>{pedido.fechaPedido || pedido.fechaCreacion}</span>
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
                  {pendienteAviso ? (
                    <button
                      style={{background:'#fff',color:'#dc3545',border:'1.5px solid #dc3545',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer',fontSize:15}}
                      onClick={async () => {
                        const aviso = avisos.find(a => a.referenciaId === (pedido.id || pedido._id));
                        if (aviso) {
                          await marcarAvisoVisto(aviso._id, tiendaId);
                          setVistos(prev => [...prev, pedido.id || pedido._id]);
                          if (onAvisoVisto) onAvisoVisto(pedido.id || pedido._id);
                        }
                      }}
                    >
                      Visto
                    </button>
                  ) : (
                    <span style={{background:'#28a745',color:'#fff',borderRadius:6,padding:'6px 16px',fontWeight:700,display:'inline-flex',alignItems:'center',gap:6}}>
                      <span role="img" aria-label="ok">✔️</span> OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
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
                    <th style={{padding:'8px 10px'}}>Formato</th>
                    <th style={{padding:'8px 10px'}}>Pedida</th>
                    <th style={{padding:'8px 10px'}}>Peso (kg)</th>
                    <th style={{padding:'8px 10px'}}>Enviada</th>
                    <th style={{padding:'8px 10px'}}>Lote</th>
                    <th style={{padding:'8px 10px'}}>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalPedido.estado === 'borrador' ? (editandoLineas || modalPedido.lineas) : modalPedido.lineas).map((l, i) => (
                    <tr key={`linea-${l.id || l._id || `${l.producto}-${l.formato}-${i}`}`} style={{background:i%2===0?'#fff':'#f1f8ff'}}>
                      <td style={{padding:'8px 10px', textAlign:'center'}}>{i + 1}</td>
                      {modalPedido.estado === 'borrador' ? (
                        editandoLineas ? (
                          <>
                            <td style={{padding:'8px 10px'}}>
                              <input value={l.producto} onChange={e => setEditandoLineas(editandoLineas.map((li,ix)=>ix===i?{...li,producto:e.target.value}:li))} style={{width:100}} />
                            </td>
                            <td style={{padding:'8px 10px'}}>
                              <input value={l.formato} onChange={e => setEditandoLineas(editandoLineas.map((li,ix)=>ix===i?{...li,formato:e.target.value}:li))} style={{width:80}} />
                            </td>
                            <td style={{padding:'8px 10px'}}>
                              <input type="number" min="1" value={l.cantidad} onChange={e => setEditandoLineas(editandoLineas.map((li,ix)=>ix===i?{...li,cantidad:Number(e.target.value)}:li))} style={{width:60}} />
                            </td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}>
                              <input value={l.comentario||''} onChange={e => setEditandoLineas(editandoLineas.map((li,ix)=>ix===i?{...li,comentario:e.target.value}:li))} style={{width:120}} />
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{padding:'8px 10px'}}>{l.producto}</td>
                            <td style={{padding:'8px 10px'}}>{l.formato}</td>
                            <td style={{padding:'8px 10px', textAlign:'center'}}>{l.cantidad}</td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}></td>
                            <td style={{padding:'8px 10px'}}>{l.comentario || '-'}</td>
                          </>
                        )
                      ) : (
                        <>
                          <td style={{padding:'8px 10px'}}>{l.producto}</td>
                          <td style={{padding:'8px 10px'}}>{l.formato}</td>
                          <td style={{padding:'8px 10px', textAlign:'center'}}>{l.cantidad}</td>
                          <td style={{padding:'8px 10px', textAlign:'center'}}>{l.peso ?? '-'}</td>
                          <td style={{padding:'8px 10px', textAlign:'center'}}>{l.cantidadEnviada ?? '-'}</td>
                          <td style={{padding:'8px 10px'}}>{l.lote ?? '-'}</td>
                          <td style={{padding:'8px 10px'}}>{l.comentario || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {modalPedido.estado === 'borrador' && (
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  {editandoLineas ? (
                    <>
                      <button onClick={() => {
                        onModificarPedido({ ...modalPedido, lineas: editandoLineas });
                        setModalPedido({ ...modalPedido, lineas: editandoLineas });
                        setEditandoLineas(null);
                      }} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Guardar cambios</button>
                      <button onClick={() => setEditandoLineas(null)} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditandoLineas(modalPedido.lineas.map(l=>({...l})))} style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Editar líneas</button>
                      <button onClick={() => setEditandoLineas([...(modalPedido.lineas||[]),{producto:'',cantidad:1,formato:'',comentario:''}])} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Añadir línea</button>
                    </>
                  )}
                </div>
              )}
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
