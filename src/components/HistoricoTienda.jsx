import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import Watermark from './Watermark';
import { DATOS_EMPRESA } from '../configDatosEmpresa';
import { cabeceraPDF, piePDF } from '../utils/exportPDFBase';

async function generarPDFAlbaran(pedido) {
  const doc = new jsPDF();
  await cabeceraPDF(doc);
  let y = 40;
  doc.setFontSize(11);
  doc.text(`Nº Pedido:`, 15, y); doc.text(String(pedido.numeroPedido), 45, y);
  y += 7;
  doc.text(`Fecha:`, 15, y); doc.text(pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-', 45, y);
  y += 7;
  doc.text(`Estado:`, 15, y); doc.text(
    pedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' :
    pedido.estado === 'preparado' ? 'Preparado en fábrica' :
    pedido.estado === 'enviado' ? 'Pendiente de preparación' : pedido.estado, 45, y);
  y += 10;

  // Tabla de líneas
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
  y += 10;
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
  // Pie de página profesional
  piePDF(doc);
  doc.save(`albaran_pedido_${pedido.numeroPedido}_${Date.now()}.pdf`);
}

const HistoricoTienda = ({ pedidos, tiendaId }) => {
  const [modalPedido, setModalPedido] = useState(null);
  const [periodo, setPeriodo] = useState('semana');
  const [agrupadosFiltrados, setAgrupadosFiltrados] = useState([]);

  // Filtrado por periodo
  React.useEffect(() => {
    const ahora = new Date();
    let fechaInicio;
    if (periodo === 'mes') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else if (periodo === 'año') {
      fechaInicio = new Date(ahora.getFullYear(), 0, 1);
    } else if (periodo === 'semana') {
      const diaSemana = ahora.getDay() || 7;
      fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - diaSemana + 1);
      fechaInicio.setHours(0,0,0,0);
    } else {
      fechaInicio = null; // todo
    }
    function filtrarPorPeriodo(p) {
      if (!fechaInicio) return true;
      const fecha = new Date(p.fechaPedido || p.fechaCreacion);
      return fecha >= fechaInicio;
    }
    setAgrupadosFiltrados(
      pedidos
        .filter(p => p.tiendaId === tiendaId && p.numeroPedido && p.lineas && p.lineas.length > 0)
        .filter(filtrarPorPeriodo)
        .sort((a, b) => (a.numeroPedido - b.numeroPedido))
    );
  }, [pedidos, tiendaId, periodo]);

  // Pedidos enviados a fábrica (aún no recibidos de fábrica)
  const pedidosEnviados = agrupadosFiltrados.filter(p => p.estado === 'enviado');
  // Pedidos recibidos de fábrica (preparado o enviadoTienda)
  const pedidosRecibidos = agrupadosFiltrados.filter(p => p.estado === 'preparado' || p.estado === 'enviadoTienda');

  console.log('[DEBUG HistoricoTienda] pedidos recibidos:', pedidos);
  console.log('[DEBUG HistoricoTienda] tiendaId:', tiendaId);

  return (
    <div>
      <Watermark />
      <h2>Histórico de Pedidos</h2>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:8}}>
        <label style={{fontWeight:600}}>Periodo:</label>
        <select value={periodo} onChange={e=>setPeriodo(e.target.value)} style={{padding:'6px 12px',borderRadius:6}}>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
          <option value="año">Año</option>
          <option value="todo">Todo</option>
        </select>
      </div>
      <h3 style={{marginTop:24, marginBottom:8}}>Pedidos enviados a fábrica</h3>
      <table>
        <thead>
          <tr>
            <th>Nº Pedido</th>
            <th>Fecha pedido</th>
            <th>Líneas</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {pedidosEnviados.length === 0 && (
            <tr><td colSpan={4} style={{textAlign:'center',color:'#888'}}>No hay pedidos enviados a fábrica pendientes de preparación</td></tr>
          )}
          {pedidosEnviados.map((pedido) => (
            <tr key={pedido.numeroPedido}>
              <td>{pedido.numeroPedido}</td>
              <td>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</td>
              <td>{pedido.lineas.length}</td>
              <td style={{display:'flex',gap:8}}>
                <button onClick={() => setModalPedido(pedido)}>
                  Ver
                </button>
                <button onClick={() => generarPDFAlbaran(pedido)}>
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:32, marginBottom:8}}>Pedidos recibidos de fábrica</h3>
      <table>
        <thead>
          <tr>
            <th>Nº Pedido</th>
            <th>Fecha pedido</th>
            <th>Estado</th>
            <th>Líneas</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {pedidosRecibidos.length === 0 && (
            <tr><td colSpan={5} style={{textAlign:'center',color:'#888'}}>No hay pedidos recibidos de fábrica</td></tr>
          )}
          {pedidosRecibidos.map((pedido) => (
            <tr key={pedido.numeroPedido}>
              <td>{pedido.numeroPedido}</td>
              <td>{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</td>
              <td>{pedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' : 'Preparado en fábrica'}</td>
              <td>{pedido.lineas.length}</td>
              <td style={{display:'flex',gap:8}}>
                <button onClick={() => setModalPedido(pedido)}>
                  Ver
                </button>
                <button onClick={() => generarPDFAlbaran(pedido)}>
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
            <div style={{marginBottom:8, textAlign:'center'}}>Fecha: {modalPedido.fechaPedido ? new Date(modalPedido.fechaPedido).toLocaleString() : '-'}</div>
            <div style={{marginBottom:18, textAlign:'center'}}>
              Estado: <b style={{
                color:
                  modalPedido.estado === 'enviadoTienda' ? '#28a745' :
                  modalPedido.estado === 'preparado' ? '#ffc107' :
                  modalPedido.estado === 'enviado' ? '#007bff' : '#333',
                background:
                  modalPedido.estado === 'enviadoTienda' ? '#eafaf1' :
                  modalPedido.estado === 'preparado' ? '#fffbe6' :
                  modalPedido.estado === 'enviado' ? '#eaf1fa' : 'transparent',
                padding: '2px 10px', borderRadius: 6
              }}>
                {modalPedido.estado === 'enviadoTienda' ? 'Enviado desde fábrica' : modalPedido.estado === 'preparado' ? 'Preparado en fábrica' : modalPedido.estado === 'enviado' ? 'Pendiente de preparación' : modalPedido.estado}
              </b>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', background:'#f8f9fa', borderRadius:8, marginBottom:8, borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{padding:'6px 8px'}}>#</th>
                    <th style={{padding:'6px 8px'}}>Producto</th>
                    <th style={{padding:'6px 8px'}}>Pedida</th>
                    <th style={{padding:'6px 8px'}}>Enviada</th>
                    <th style={{padding:'6px 8px'}}>Formato</th>
                    <th style={{padding:'6px 8px'}}>Comentario</th>
                    <th style={{padding:'6px 8px'}}>Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {modalPedido.lineas.map((l, i) => (
                    <tr key={i}>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{i + 1}</td>
                      <td style={{padding:'6px 8px'}}>{l.producto}</td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.cantidad}</td>
                      <td style={{padding:'6px 8px', textAlign:'center'}}>{l.cantidadEnviada || '-'}</td>
                      <td style={{padding:'6px 8px'}}>{l.formato}</td>
                      <td style={{padding:'6px 8px'}}>{l.comentario || '-'}</td>
                      <td style={{padding:'6px 8px'}}>{l.lote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => generarPDFAlbaran(modalPedido)} style={{
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

export default HistoricoTienda;