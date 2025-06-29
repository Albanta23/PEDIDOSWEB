import jsPDF from 'jspdf';

export function exportPedidoClientePDF(pedido) {
  const doc = new jsPDF();
  let y = 18;
  doc.setFontSize(16);
  doc.text('Detalle del Pedido', 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Nº Pedido: ${pedido.numeroPedido || pedido._id || ''}`, 14, y); y += 8;
  doc.text(`Cliente: ${pedido.clienteNombre || ''}`, 14, y); y += 8;
  doc.text(`Estado: ${(pedido.estado||'').replace('_',' ').toUpperCase()}`, 14, y); y += 8;
  doc.text(`Fecha pedido: ${pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}`, 14, y); y += 8;
  doc.text(`Dirección: ${pedido.direccion || '-'}`, 14, y); y += 12;

  // Cabecera de líneas
  doc.setFontSize(12);
  doc.text('Producto', 14, y);
  doc.text('Cantidad', 74, y);
  doc.text('Formato', 104, y);
  doc.text('Comentario', 134, y);
  y += 6;
  doc.setLineWidth(0.2);
  doc.line(14, y, 196, y);
  y += 5;
  doc.setFontSize(10);
  (pedido.lineas||[]).forEach(l => {
    if (l.esComentario) {
      doc.text('Comentario:', 14, y);
      doc.text(l.comentario || '', 34, y);
    } else {
      doc.text(String(l.producto||''), 14, y);
      doc.text(String(l.cantidad||''), 74, y);
      doc.text(String(l.formato||''), 104, y);
      doc.text(String(l.comentario||''), 134, y);
    }
    y += 7;
    if (y > 270) { doc.addPage(); y = 18; }
  });
  y += 8;
  doc.setFontSize(12);
  doc.text('Historial de estados:', 14, y);
  y += 6;
  doc.setFontSize(10);
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
    if (y > 270) { doc.addPage(); y = 18; }
  });
  doc.save(`pedido_${pedido.numeroPedido || pedido._id || 'detalle'}.pdf`);
}
