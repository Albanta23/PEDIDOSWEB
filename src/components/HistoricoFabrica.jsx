import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import Watermark from './Watermark';
import { DATOS_EMPRESA } from '../configDatosEmpresa';

// Utilidad para cargar imagen como base64 y devolver una promesa
function cargarLogoBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      let msg = 'No se pudo cargar el logo para el PDF.';
      if (e && e.message) msg += ' ' + e.message;
      reject(new Error(msg));
    };
    img.src = url;
  });
}

async function generarPDFEnvio(pedido, tiendas) {
  try {
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
    doc.setFontSize(10); // Reducido para datos generales
    let y = 40;
    doc.text(`Nº Pedido:`, 15, y); doc.text(String(pedido.numeroPedido || '-'), 45, y);
    y += 6;
    doc.text(`Tienda:`, 15, y); doc.text(tiendas.find(t => t.id === pedido.tiendaId)?.nombre || pedido.tiendaId || '-', 45, y);
    y += 6;
    doc.text(`Fecha:`, 15, y); doc.text(pedido.fechaEnvio ? new Date(pedido.fechaEnvio).toLocaleDateString() : (pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString() : '-'), 45, y);
    y += 6;
    doc.text(`Estado:`, 15, y); doc.text(
      pedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' :
      pedido.estado === 'preparado' ? 'Preparado en fábrica' : (pedido.estado || '-'), 45, y);
    
    y += 10; // Increased space before table

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setFillColor(230, 230, 230);
    doc.rect(15, y, 180, 12, 'F'); // Aumentar altura de cabecera
    const headerY = y + 6;
    let currentX = 16;

    // Define column widths (sin peso, con unidadesEnviadas)
    const colWidths = {
      num: 8,
      producto: 45,
      formato: 25,
      pedida: 22,
      enviada: 22,
      unidades: 22,
      lote: 22,
      comentario: 35
    };

    doc.text('Nº', currentX, headerY); currentX += colWidths.num;
    doc.text('Producto', currentX, headerY); currentX += colWidths.producto;
    doc.text('Formato', currentX, headerY); currentX += colWidths.formato;
    doc.text(['Cantidad', 'pedida'], currentX + colWidths.pedida / 2, headerY - 2, { align: 'center' }); currentX += colWidths.pedida;
    doc.text(['Kilos', 'enviados'], currentX + colWidths.enviada / 2, headerY - 2, { align: 'center' }); currentX += colWidths.enviada;
    doc.text(['Unidades', 'enviadas'], currentX + colWidths.unidades / 2, headerY - 2, { align: 'center' }); currentX += colWidths.unidades;
    doc.text('Lote', currentX + colWidths.lote / 2, headerY, { align: 'center' }); currentX += colWidths.lote;
    doc.text('Comentario', currentX, headerY);

    y += 16; // Más espacio tras la cabecera

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // Slightly smaller font for table data

    (Array.isArray(pedido.lineas) ? pedido.lineas : []).forEach((l, i) => {
      if (y > 270) { // Page break
        doc.addPage();
        y = 20;
        // Optionally re-draw header on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setFillColor(230, 230, 230);
        doc.rect(15, y, 180, 12, 'F');
        const newPageHeaderY = y + 6;
        let newPageCurrentX = 16;
        doc.text('Nº', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.num;
        doc.text('Producto', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.producto;
        doc.text('Formato', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.formato;
        doc.text(['Cantidad', 'pedida'], newPageCurrentX + colWidths.pedida / 2, newPageHeaderY - 2, { align: 'center' }); newPageCurrentX += colWidths.pedida;
        doc.text(['Kilos', 'enviados'], newPageCurrentX + colWidths.enviada / 2, newPageHeaderY - 2, { align: 'center' }); newPageCurrentX += colWidths.enviada;
        doc.text(['Unidades', 'enviadas'], newPageCurrentX + colWidths.unidades / 2, newPageHeaderY - 2, { align: 'center' }); newPageCurrentX += colWidths.unidades;
        doc.text('Lote', newPageCurrentX + colWidths.lote / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.lote;
        doc.text('Comentario', newPageCurrentX, newPageHeaderY);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      currentX = 16;
      doc.text(String(i + 1), currentX + colWidths.num / 2, y, {align: 'center'}); currentX += colWidths.num;
      
      const productoLines = doc.splitTextToSize(l.producto || '-', colWidths.producto - 2);
      doc.text(productoLines, currentX, y);
      let productoLineHeight = productoLines.length * 4;
      currentX += colWidths.producto;

      doc.text(l.formato || '-', currentX, y); currentX += colWidths.formato;

      doc.text(String(l.cantidad ?? '-') , currentX + colWidths.pedida / 2, y, { align: 'center' }); currentX += colWidths.pedida;
      doc.text(String(l.cantidadEnviada ?? '-') , currentX + colWidths.enviada / 2, y, { align: 'center' }); currentX += colWidths.enviada;
      doc.text(l.unidadesEnviadas !== undefined && l.unidadesEnviadas !== null ? String(l.unidadesEnviadas) : '-', currentX + colWidths.unidades / 2, y, { align: 'center' }); currentX += colWidths.unidades;
      doc.text(l.lote || '-', currentX + colWidths.lote / 2, y, { align: 'center' }); currentX += colWidths.lote;
      
      const comentarioLines = doc.splitTextToSize(l.comentario || '-', colWidths.comentario - 2);
      // Comentario en rojo
      doc.setTextColor(220, 38, 38); // Rojo
      doc.text(comentarioLines, currentX, y);
      doc.setTextColor(0, 0, 0); // Restaurar a negro
      let comentarioLineHeight = comentarioLines.length * 4;

      y += Math.max(productoLineHeight, comentarioLineHeight, 6); // Adjust y based on max line height or default
    });
    doc.setFontSize(9);
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
      doc.save(`albaran_envio_fabrica_${pedido.numeroPedido || 'sin_numero'}_${Date.now()}.pdf`);
    }
  } catch (err) {
    let msg = 'Error al generar el PDF: ';
    if (err instanceof Error) msg += err.message;
    else if (typeof err === 'string') msg += err;
    else if (err && err.type === 'error' && err.target && err.target.src) msg += 'No se pudo cargar la imagen: ' + err.target.src;
    else msg += JSON.stringify(err);
    alert(msg);
  }
}

const HistoricoFabrica = ({ pedidos, tiendas, onVolver }) => {
  const [modalPedido, setModalPedido] = useState(null);
  // Mostrar pedidos preparados o enviados desde fábrica
  const historico = pedidos.filter(p => p.estado === 'preparado' || p.estado === 'enviadoTienda')
    .sort((a, b) => (b.fechaPedido || 0) - (a.fechaPedido || 0));

  return (
    <div style={{marginTop:32}}>
      <Watermark />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Histórico de envíos desde fábrica</h2>
        <button onClick={onVolver} style={{padding:'8px 18px',background:'#888',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:500}}>
          Volver
        </button>
      </div>
      <table style={{marginTop:24,width:'100%'}}>
        <thead>
          <tr>
            <th>Nº Pedido</th>
            <th>Tienda</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Líneas</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {historico.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>No hay envíos preparados ni enviados desde fábrica</td></tr>
          )}
          {historico.map((pedido, idx) => (
            <tr key={pedido.numeroPedido ? `${pedido.numeroPedido}-${pedido.tiendaId}` : `${pedido.id || idx}`}>
              <td>{pedido.numeroPedido}</td>
              <td>{tiendas.find(t => t.id === pedido.tiendaId)?.nombre || pedido.tiendaId}</td>
              <td>{pedido.fechaEnvio ? new Date(pedido.fechaEnvio).toLocaleString() : (pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-')}</td>
              <td>{pedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' : 'Preparado en fábrica'}</td>
              <td>{pedido.lineas.length}</td>
              <td style={{display:'flex',gap:8}}>
                <button onClick={() => setModalPedido(pedido)}>
                  Ver
                </button>
                <button onClick={() => generarPDFEnvio(pedido, tiendas)}>
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modalPedido && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setModalPedido(null)}>
          <div style={{
            background: '#fff', borderRadius: 14, minWidth: 380, maxWidth: 600, width: '90vw',
            padding: '28px 28px 32px 28px', boxShadow: '0 4px 32px #0002',
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'stretch'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalPedido(null)} style={{
              position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', lineHeight: 1
            }} title="Cerrar">×</button>
            <h3 style={{marginTop:0, marginBottom: 8, textAlign:'center'}}>Pedido Nº {modalPedido.numeroPedido}</h3>
            <div style={{marginBottom:8, textAlign:'center'}}>Tienda: {tiendas.find(t => t.id === modalPedido.tiendaId)?.nombre || modalPedido.tiendaId}</div>
            <div style={{marginBottom:8, textAlign:'center'}}>Fecha: {modalPedido.fechaEnvio ? new Date(modalPedido.fechaEnvio).toLocaleString() : (modalPedido.fechaPedido ? new Date(modalPedido.fechaPedido).toLocaleString() : '-')}</div>
            <div style={{marginBottom:18, textAlign:'center'}}>
              Estado: <b style={{
                color:
                  modalPedido.estado === 'enviadoTienda' ? '#28a745' :
                  modalPedido.estado === 'preparado' ? '#ffc107' : '#333',
                background:
                  modalPedido.estado === 'enviadoTienda' ? '#eafaf1' :
                  modalPedido.estado === 'preparado' ? '#fffbe6' : 'transparent',
                padding: '2px 10px', borderRadius: 6
              }}>
                {modalPedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' : modalPedido.estado === 'preparado' ? 'Preparado en fábrica' : modalPedido.estado}
              </b>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', background:'#f8f9fa', borderRadius:8, marginBottom:8, borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{padding:'6px 8px'}}>#</th>
                    <th style={{padding:'6px 8px'}}>Producto</th>
                    <th style={{padding:'6px 8px'}}>Pedida</th>
                    <th style={{padding:'6px 8px'}}>Kilos enviados</th>
                    <th style={{padding:'6px 8px'}}>Unidades enviadas</th>
                    <th style={{padding:'6px 8px'}}>Formato</th>
                    <th style={{padding:'6px 8px'}}>Comentario</th>
                    <th style={{padding:'6px 8px'}}>Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {modalPedido.lineas.map((l, i) => (
                    <tr key={l.lote ? `${modalPedido.numeroPedido}-${l.lote}-${i}` : `${modalPedido.numeroPedido}-${l.producto}-${i}`}>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{i + 1}</td>
                      <td style={{padding:'6px 8px'}}>{l.producto}</td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.cantidad}</td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.cantidadEnviada ?? '-'}</td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.unidadesEnviadas ?? '-'}</td>
                      <td style={{padding:'6px 8px'}}>{l.formato}</td>
                      <td style={{padding:'6px 8px'}}>{l.comentario || '-'}</td>
                      <td style={{padding:'6px 8px'}}>{l.lote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => generarPDFEnvio(modalPedido, tiendas)} style={{
              marginTop: 12, padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'
            }}>
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoFabrica;
