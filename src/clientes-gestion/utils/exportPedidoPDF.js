import jsPDF from 'jspdf';
import { DATOS_EMPRESA } from '../../configDatosEmpresa';
import { formatearDireccionCompletaPedido } from './formatDireccion';
import { formatearNombreClientePedido } from '../../utils/formatNombreCompleto';
import { obtenerLogoPDF } from './logoBase64';

// Función de respaldo completa (mantener por si acaso)
async function cargarLogo() {
  // NUEVA ESTRATEGIA: Usar logo embebido que siempre funciona
  try {
    console.log('🖼️ Cargando logo embebido...');
    const logoEmbebido = await obtenerLogoPDF();
    console.log('✅ Logo embebido cargado exitosamente');
    return logoEmbebido;
  } catch (error) {
    console.error('❌ Error crítico con logo embebido:', error);
    return null;
  }
}

// Función para cabecera profesional
async function crearCabecera(doc, y = 10) {
  console.log('🎨 Iniciando creación de cabecera...');
  const logoBase64 = await cargarLogo();
  
  if (logoBase64) {
    try {
      console.log('✅ Añadiendo logo al PDF...');
      // Añadir logo con tamaño ajustado
      doc.addImage(logoBase64, 'PNG', 15, y, 35, 25);
      console.log('✅ Logo añadido exitosamente al PDF');
    } catch (error) {
      console.error('❌ Error al añadir logo al PDF:', error);
      // Continuar sin logo pero con mensaje
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('[Logo no disponible]', 15, y + 15);
    }
  } else {
    console.warn('⚠️ No se pudo cargar el logo, continuando sin él');
    // Placeholder visual cuando no hay logo
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 35, 25, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('LOGO', 25, y + 15, { align: 'center' });
  }
  
  // Información de la empresa
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(DATOS_EMPRESA.nombre, 55, y + 12);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(DATOS_EMPRESA.direccion, 55, y + 19);
  doc.text(`Tel: ${DATOS_EMPRESA.telefono} · ${DATOS_EMPRESA.email}`, 55, y + 25);
  doc.text(DATOS_EMPRESA.web, 55, y + 31);
  
  // Línea separadora
  doc.setLineWidth(1);
  doc.setDrawColor(102, 126, 234);
  doc.line(15, y + 35, 195, y + 35);
  
  console.log('✅ Cabecera creada exitosamente');
  return y + 40;
}

// Función para pie de página
function crearPie(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${DATOS_EMPRESA.nombre} · CIF: ${DATOS_EMPRESA.cif}`, 105, 286, { align: 'center' });
    doc.text(`${DATOS_EMPRESA.direccion} · Tel: ${DATOS_EMPRESA.telefono}`, 105, 291, { align: 'center' });
    doc.text(`Página ${i} de ${pageCount}`, 195, 291, { align: 'right' });
  }
}

export async function exportPedidoClientePDF(pedido) {
  const doc = new jsPDF();
  
  // Cabecera profesional con logo
  let y = await crearCabecera(doc, 10);
  
  // Título principal
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('DETALLE DEL PEDIDO', 105, y, { align: 'center' });
  y += 15;
  
  // Línea decorativa
  doc.setLineWidth(2);
  doc.setDrawColor(102, 126, 234);
  doc.line(15, y, 195, y);
  y += 15;
  
  // Información del pedido en dos columnas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  
  // Columna izquierda
  doc.text('Información del Pedido:', 15, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  doc.text(`Nº Pedido: ${pedido.numeroPedido || pedido._id || 'N/A'}`, 15, y);
  y += 6;
  
  doc.text(`Estado: ${(pedido.estado || '').replace('_', ' ').toUpperCase()}`, 15, y);
  y += 6;
  
  doc.text(`Fecha: ${pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString('es-ES') : 'N/A'}`, 15, y);
  y += 6;
  
  const bultos = pedido.bultos !== undefined && pedido.bultos !== null ? pedido.bultos : 'Sin especificar';
  doc.text(`Bultos: ${bultos}`, 15, y);
  
  // Columna derecha - Información del cliente
  y = 73; // Resetear Y para columna derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Información del Cliente:', 110, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  doc.text(`Cliente: ${formatearNombreClientePedido(pedido)}`, 110, y);
  y += 8;
  
  // Dirección completa con manejo de múltiples líneas
  const direccionCompleta = formatearDireccionCompletaPedido(pedido);
  const lineasDireccion = doc.splitTextToSize(`Dirección: ${direccionCompleta}`, 85);
  lineasDireccion.forEach(linea => {
    doc.text(linea, 110, y);
    y += 6;
  });
  
  y = Math.max(y, 105); // Asegurar que hay espacio suficiente
  y += 10;
  
  // Sección de productos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('LÍNEAS DEL PEDIDO', 15, y);
  y += 10;
  
  // Cabecera de la tabla con fondo
  doc.setFillColor(102, 126, 234);
  doc.rect(15, y - 2, 180, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTO', 18, y + 6);
  doc.text('CANT.', 68, y + 6);
  doc.text('FORMATO', 88, y + 6);
  doc.text('PESO', 118, y + 6);
  doc.text('LOTE', 138, y + 6);
  doc.text('COMENTARIO', 158, y + 6);
  y += 15;
  
  // Líneas de productos
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let lineaColor = true;
  (pedido.lineas || []).forEach((l, index) => {
    // Alternar color de fondo para las filas
    if (lineaColor) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 2, 180, 12, 'F');
    }
    lineaColor = !lineaColor;
    
    if (l.esComentario) {
      // Formato especial para comentarios - más legible y destacado
      doc.setFillColor(255, 248, 220); // Fondo amarillo suave
      doc.rect(15, y - 2, 180, 15, 'F');
      
      // Borde izquierdo para destacar
      doc.setFillColor(255, 193, 7);
      doc.rect(15, y - 2, 3, 15, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(184, 134, 11); // Color dorado oscuro
      doc.text('COMENTARIO:', 20, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 53, 15); // Color marrón oscuro para mejor legibilidad
      
      const comentarioTexto = doc.splitTextToSize(l.comentario || '', 150);
      comentarioTexto.forEach((linea, idx) => {
        doc.text(linea, 20, y + 12 + (idx * 5));
      });
      
      y += Math.max(18, 12 + comentarioTexto.length * 5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      
      // Producto (con wrap si es muy largo)
      const productoTexto = doc.splitTextToSize(String(l.producto || ''), 45);
      doc.text(productoTexto[0] || '', 18, y + 6);
      
      doc.text(String(l.cantidad || ''), 68, y + 6);
      doc.text(String(l.formato || ''), 88, y + 6);
      doc.text(String(l.peso ? l.peso + ' kg' : ''), 118, y + 6);
      doc.text(String(l.lote || ''), 138, y + 6);
      
      // Comentario de línea (con wrap si es muy largo)
      if (l.comentario) {
        const comentarioTexto = doc.splitTextToSize(String(l.comentario), 35);
        doc.setTextColor(85, 85, 85); // Color gris para comentarios de línea
        comentarioTexto.forEach((linea, idx) => {
          doc.text(linea, 158, y + 6 + (idx * 4));
        });
      }
      
      y += 12;
    }
    
    // Nueva página si es necesario
    if (y > 250) {
      doc.addPage();
      // Cabecera simplificada para páginas adicionales
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(DATOS_EMPRESA.nombre, 15, 20);
      doc.setLineWidth(0.5);
      doc.setDrawColor(102, 126, 234);
      doc.line(15, 25, 195, 25);
      y = 35;
    }
  });
  
  y += 15;
  
  // Historial de eventos (estados y bultos)
  const historial = (pedido.historial || []).length > 0 ? pedido.historial : pedido.historialEstados;

  if (historial && historial.length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('HISTORIAL DEL PEDIDO', 15, y);
    y += 10;

    // Cabecera del historial
    doc.setFillColor(168, 237, 234);
    doc.rect(15, y - 2, 180, 10, 'F');

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENTO', 18, y + 5);
    doc.text('DETALLE', 68, y + 5);
    doc.text('USUARIO', 118, y + 5);
    doc.text('FECHA Y HORA', 158, y + 5);
    y += 12;

    // Líneas del historial
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    historial.forEach((h, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20; // Reset Y for new page
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 2, 180, 8, 'F');
      }
      
      let evento = '';
      let detalle = '';

      if (h.tipo === 'bultos') {
        evento = 'ACTUALIZACIÓN DE BULTOS';
        detalle = `Bultos: ${h.bultos}`;
      } else { // 'estado' or default
        evento = 'CAMBIO DE ESTADO';
        detalle = (h.estado || h.accion || '').replace(/_/g, ' ').toUpperCase();
      }

      doc.text(evento, 18, y + 4);
      doc.text(detalle, 68, y + 4);
      doc.text(h.usuario || '-', 118, y + 4);
      doc.text(h.fecha ? new Date(h.fecha).toLocaleString('es-ES') : '-', 158, y + 4);
      y += 10;
    });
  }

  // Pie de página profesional
  crearPie(doc);
  
  // Guardar el archivo
  doc.save(`Pedido_${pedido.numeroPedido || pedido._id || 'detalle'}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
