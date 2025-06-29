// utils/exportPDFBase.js
// Utilidad centralizada para exportar PDF con cabecera y pie profesional y carga de logo
import jsPDF from 'jspdf';
import { DATOS_EMPRESA } from '../configDatosEmpresa';

export async function cargarLogoBase64() {
  const base = import.meta.env.BASE_URL || '/';
  const url = window.location.origin + base + 'logo1.png';
  try {
    return await new Promise((resolve) => {
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
      img.onerror = () => resolve(null); // Si falla, no bloquea
      img.src = url;
    });
  } catch (e) {
    return null;
  }
}

export async function cabeceraPDF(doc, y = 10) {
  const logoBase64 = await cargarLogoBase64();
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 15, y, 30, 18);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(DATOS_EMPRESA.nombre, 50, y + 10);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(DATOS_EMPRESA.direccion, 50, y + 17);
  doc.text(`Tel: ${DATOS_EMPRESA.telefono}  ·  ${DATOS_EMPRESA.email}`, 50, y + 23);
  doc.text(DATOS_EMPRESA.web, 50, y + 29);
  doc.setLineWidth(0.5);
  doc.line(15, y + 32, 195, y + 32);
}

export function piePDF(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${DATOS_EMPRESA.nombre} · CIF: ${DATOS_EMPRESA.cif}`, 105, 286, { align: 'center' });
    doc.text(`${DATOS_EMPRESA.direccion} · Tel: ${DATOS_EMPRESA.telefono}`, 105, 292, { align: 'center' });
    doc.text(`Página ${i} de ${pageCount}`, 195, 292, { align: 'right' });
  }
}
