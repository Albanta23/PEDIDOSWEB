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
    y += 6;
    doc.text(`Peso total:`, 15, y); doc.text(pedido.peso !== undefined && pedido.peso !== null ? String(pedido.peso) + ' kg' : '-', 45, y);
    
    y += 10; // Increased space before table

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setFillColor(230, 230, 230);
    doc.rect(15, y, 180, 8, 'F'); // Header background

    const headerY = y + 6; // Adjusted Y for header text
    let currentX = 16; // Start a bit to the right for padding

    // Define column widths
    const colWidths = {
      num: 8,
      producto: 45, // Increased width
      pedida: 15,
      peso: 15,
      enviada: 15,
      formato: 25, // Adjusted width
      lote: 22,
      comentario: 35 // Adjusted width
    };

    doc.text('Nº', currentX, headerY); currentX += colWidths.num;
    doc.text('Producto', currentX, headerY); currentX += colWidths.producto;
    doc.text('Pedida', currentX + colWidths.pedida / 2, headerY, { align: 'center' }); currentX += colWidths.pedida;
    doc.text('Peso(kg)', currentX + colWidths.peso / 2, headerY, { align: 'center' }); currentX += colWidths.peso;
    doc.text('Enviada', currentX + colWidths.enviada / 2, headerY, { align: 'center' }); currentX += colWidths.enviada;
    doc.text('Formato', currentX, headerY); currentX += colWidths.formato;
    doc.text('Lote', currentX + colWidths.lote / 2, headerY, { align: 'center' }); currentX += colWidths.lote;
    doc.text('Comentario', currentX, headerY);

    y += 10; // New Y after header (increased space)

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
        doc.rect(15, y, 180, 8, 'F');
        const newPageHeaderY = y + 6;
        let newPageCurrentX = 16;
        doc.text('Nº', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.num;
        doc.text('Producto', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.producto;
        doc.text('Pedida', newPageCurrentX + colWidths.pedida / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.pedida;
        doc.text('Peso(kg)', newPageCurrentX + colWidths.peso / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.peso;
        doc.text('Enviada', newPageCurrentX + colWidths.enviada / 2, newPageHeaderY, { align: 'center' }); newPageCurrentX += colWidths.enviada;
        doc.text('Formato', newPageCurrentX, newPageHeaderY); newPageCurrentX += colWidths.formato;
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

      doc.text(String(l.cantidad ?? '-') , currentX + colWidths.pedida / 2, y, { align: 'center' }); currentX += colWidths.pedida;
      doc.text(l.peso !== undefined && l.peso !== null ? String(l.peso) : '-', currentX + colWidths.peso / 2, y, { align: 'center' }); currentX += colWidths.peso;
      doc.text(String(l.cantidadEnviada ?? '-') , currentX + colWidths.enviada / 2, y, { align: 'center' }); currentX += colWidths.enviada;
      doc.text(l.formato || '-', currentX, y); currentX += colWidths.formato;
      doc.text(l.lote || '-', currentX + colWidths.lote / 2, y, { align: 'center' }); currentX += colWidths.lote;
      
      const comentarioLines = doc.splitTextToSize(l.comentario || '-', colWidths.comentario - 2);
      doc.text(comentarioLines, currentX, y);
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
  const [filtro, setFiltro] = useState('dia');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('todas');
  // Nuevo: estado para el modal sumatorio de peso
  const [modalPeso, setModalPeso] = useState({visible: false, lineaIdx: null, valores: []});

  // Función para filtrar por fecha
  const ahora = new Date();
  const filtrarPorFecha = (pedido) => {
    const fecha = new Date(pedido.fechaEnvio || pedido.fechaPedido);
    if (isNaN(fecha)) return false;
    if (filtro === 'dia') {
      return fecha.toDateString() === ahora.toDateString();
    } else if (filtro === 'semana') {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay());
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      return fecha >= inicioSemana && fecha <= finSemana;
    } else if (filtro === 'mes') {
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    } else if (filtro === 'año') {
      return fecha.getFullYear() === ahora.getFullYear();
    }
    return true; // 'todo'
  };

  // Nuevo: función para filtrar por tienda
  const filtrarPorTienda = (pedido) => {
    if (tiendaSeleccionada === 'todas') return true;
    return pedido.tiendaId === tiendaSeleccionada;
  };

  // Mostrar pedidos preparados o enviados desde fábrica filtrados
  const historico = pedidos.filter(p => p.estado === 'enviadoTienda')
    .filter(filtrarPorFecha)
    .filter(filtrarPorTienda)
    .sort((a, b) => (b.fechaPedido || 0) - (a.fechaPedido || 0));

  // Handler para abrir el modal sumatorio
  const abrirModalPeso = (lineaIdx, pesoActual, cantidad) => {
    // Solo permitir sumar pesos en el panel de fábrica
    return; // Deshabilitado en historiales
  };

  // Handler para cambiar un valor de peso
  const cambiarValorPeso = (idx, valor) => {
    // Solo permitir sumar pesos en el panel de fábrica
    return; // Deshabilitado en historiales
  };

  // Handler para aplicar la suma de pesos y guardar en backend
  const aplicarPesos = async () => {
    // Solo permitir sumar pesos en el panel de fábrica
    return; // Deshabilitado en historiales
  };

  return (
    <div style={{marginTop:32}}>
      <Watermark />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Histórico de envíos desde fábrica</h2>
        <button onClick={onVolver} style={{padding:'8px 18px',background:'#888',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:500}}>
          Volver
        </button>
      </div>
      <div style={{margin:'18px 0 0 0',display:'flex',alignItems:'center',gap:12}}>
        <label style={{fontWeight:600}}>Filtrar por:</label>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{padding:'6px 12px',borderRadius:6}}>
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
          <option value="año">Año</option>
          <option value="todo">Todo</option>
        </select>
        <label style={{fontWeight:600,marginLeft:16}}>Tienda:</label>
        <select value={tiendaSeleccionada} onChange={e=>setTiendaSeleccionada(e.target.value)} style={{padding:'6px 12px',borderRadius:6}}>
          <option value="todas">Todas</option>
          {tiendas.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
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
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            maxHeight: '90vh',
            overflowY: 'auto'
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
                    <th style={{padding:'6px 8px'}}>Peso (kg)</th> 
                    <th style={{padding:'6px 8px'}}>Enviada</th>
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
                      <td style={{padding:'6px 8px', textAlign:'center'}}>
                        {l.cantidad > 1 ? (
                          <button style={{background:'#eafaf1',border:'1px solid #28a745',borderRadius:4,padding:'2px 8px',cursor:'pointer'}} onClick={() => abrirModalPeso(i, l.peso, l.cantidad)}>
                            {l.peso ?? '-'} <span style={{fontSize:13, color:'#28a745'}}>✚</span>
                          </button>
                        ) : (
                          l.peso ?? '-'
                        )}
                      </td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.cantidadEnviada || '-'}</td>
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
      {/* Modal sumatorio de pesos */}
      {modalPeso.visible && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.35)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setModalPeso({visible:false,lineaIdx:null,valores:[]})}>
          <div style={{background:'#fff',borderRadius:12,padding:32,minWidth:320,maxWidth:400,boxShadow:'0 4px 32px #0002'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Sumar pesos para la línea</h3>
            {modalPeso.valores.map((v, idx) => (
              <div key={idx} style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:24,display:'inline-block',textAlign:'right'}}>{idx+1}:</span>
                <input type="number" step="0.01" min="0" value={v} onChange={e=>cambiarValorPeso(idx, e.target.value)} style={{width:80,padding:'4px 8px',borderRadius:4,border:'1px solid #ccc'}} />
                <span>kg</span>
              </div>
            ))}
            <div style={{margin:'12px 0',fontWeight:600}}>Suma total: {modalPeso.valores.reduce((acc,v)=>acc+(parseFloat(v)||0),0).toFixed(2)} kg</div>
            <button onClick={aplicarPesos} style={{background:'#28a745',color:'#fff',padding:'8px 18px',border:'none',borderRadius:6,fontWeight:600,marginRight:8}}>Aplicar</button>
            <button onClick={()=>setModalPeso({visible:false,lineaIdx:null,valores:[]})} style={{background:'#888',color:'#fff',padding:'8px 18px',border:'none',borderRadius:6}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoFabrica;
