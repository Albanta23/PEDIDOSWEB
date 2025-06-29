// exportExpedicionPDF.js
// Exporta a PDF una expedición de cliente mostrando cabecera, líneas, lote, pie profesional, número de bultos y usuario editor
import jsPDF from 'jspdf';
import { cabeceraPDF, piePDF } from '../utils/exportPDFBase';

/**
 * Exporta la expedición de un pedido de cliente a PDF
 * @param {Object} pedido - Objeto pedido (de expedición)
 * @param {string} usuario - Usuario que ha editado/tramitado
 */
export async function exportExpedicionClientePDF(pedido, usuario) {
  const doc = new jsPDF();
  await cabeceraPDF(doc);
  let y = 48;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Expedición de Pedido', 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº Pedido: ${pedido.numeroPedido || pedido._id || ''}`, 14, y); y += 8;
  doc.text(`Cliente: ${pedido.clienteNombre || ''}`, 14, y); y += 8;
  doc.text(`Estado: ${(pedido.estado||'').replace('_',' ').toUpperCase()}`, 14, y); y += 8;
  doc.text(`Fecha expedición: ${pedido.fechaExpedicion ? new Date(pedido.fechaExpedicion).toLocaleString() : '-'}`, 14, y); y += 8;
  doc.text(`Dirección: ${pedido.direccion || '-'}`, 14, y); y += 12;

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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bultos registrados: ${pedido.bultos !== undefined ? pedido.bultos : ''}`, 14, y);
  if (usuario) doc.text(`Tramitado por: ${usuario}`, 80, y);

  // Pie de página profesional
  piePDF(doc);
  doc.save(`expedicion_${pedido.numeroPedido || pedido._id || 'detalle'}.pdf`);
}
