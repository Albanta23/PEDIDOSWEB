import jsPDF from 'jspdf';
import { DATOS_EMPRESA } from '../../configDatosEmpresa';
import { cabeceraPDF, piePDF } from '../../utils/exportPDFBase';
import { formatearDireccionCompletaPedido } from './formatDireccion';

async function cargarLogoBase64() {
  // Solo buscar el logo en la raíz pública
  const url = window.location.origin + '/logo1.png';
  try {
    return await new Promise((resolve, reject) => {
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
  } catch (e) {
    return null;
  }
}

export async function exportPedidoClientePDF(pedido) {
  const doc = new jsPDF();
  await cabeceraPDF(doc);
  let y = 48;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle del Pedido', 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº Pedido: ${pedido.numeroPedido || pedido._id || ''}`, 14, y); y += 8;
  doc.text(`Cliente: ${pedido.clienteNombre || ''}`, 14, y); y += 8;
  doc.text(`Estado: ${(pedido.estado||'').replace('_',' ').toUpperCase()}`, 14, y); y += 8;
  doc.text(`Fecha pedido: ${pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}`, 14, y); y += 8;
  
  // Dirección completa con manejo de múltiples líneas
  const direccionCompleta = formatearDireccionCompletaPedido(pedido);
  const lineasDireccion = doc.splitTextToSize(`Dirección: ${direccionCompleta}`, 180);
  lineasDireccion.forEach(linea => {
    doc.text(linea, 14, y);
    y += 6;
  });
  y += 2;
  
  // Bultos
  const bultos = pedido.bultos !== undefined && pedido.bultos !== null ? pedido.bultos : 'Sin especificar';
  doc.text(`Bultos: ${bultos}`, 14, y); y += 12;

  // Cabecera de líneas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Producto', 14, y);
  doc.text('Cant.', 64, y);
  doc.text('Formato', 84, y);
  doc.text('Peso', 114, y);
  doc.text('Lote', 134, y);
  doc.text('Comentario', 154, y);
  y += 6;
  doc.setLineWidth(0.2);
  doc.line(14, y, 196, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  (pedido.lineas||[]).forEach(l => {
    if (l.esComentario) {
      doc.text('Comentario:', 14, y);
      doc.text(l.comentario || '', 34, y);
    } else {
      doc.text(String(l.producto||''), 14, y);
      doc.text(String(l.cantidad||''), 64, y);
      doc.text(String(l.formato||''), 84, y);
      doc.text(String(l.peso ? l.peso + ' kg' : ''), 114, y);
      doc.text(String(l.lote||''), 134, y);
      doc.text(String(l.comentario||''), 154, y);
    }
    y += 7;
    if (y > 270) { doc.addPage(); y = 48; }
  });
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Historial de estados:', 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Estado', 14, y);
  doc.text('Usuario', 64, y);
  doc.text('Fecha', 104, y);
  y += 5;
  doc.setLineWidth(0.2);
  doc.line(14, y, 196, y);
  y += 5;
  (pedido.historialEstados||[]).forEach(h => {
    doc.text((h.estado||'').replace('_',' ').toUpperCase(), 14, y);
    doc.text(h.usuario||'', 64, y);
    doc.text(h.fecha ? new Date(h.fecha).toLocaleString() : '-', 104, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 48; }
  });

  // Pie de página profesional
  piePDF(doc);
  doc.save(`pedido_${pedido.numeroPedido || pedido._id || 'detalle'}.pdf`);
}
