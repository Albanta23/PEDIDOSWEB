import jsPDF from 'jspdf';
import { DATOS_EMPRESA } from '../../configDatosEmpresa';
import { formatearDireccionCompletaPedido } from './formatDireccion';

// Función simple y directa para cargar logo (enfoque minimalista)
async function cargarLogoSimple() {
  try {
    console.log('🖼️ Cargando logo con método directo...');
    
    // Método más directo usando fetch - probando rutas más comunes
    const rutas = ['/logo1.png', '/public/logo1.png', './logo1.png'];
    
    for (const ruta of rutas) {
      try {
        console.log(`🔍 Probando ruta: ${ruta}`);
        const response = await fetch(ruta);
        if (response.ok) {
          const blob = await response.blob();
          const logoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          console.log(`✅ Logo cargado exitosamente desde ${ruta}: ${logoBase64.length} caracteres`);
          return logoBase64;
        } else {
          console.warn(`❌ HTTP ${response.status} para ${ruta}`);
        }
      } catch (error) {
        console.warn(`❌ Error con ${ruta}:`, error.message);
      }
    }
    
    console.warn('❌ No se pudo cargar logo con método simple');
    return null;
  } catch (error) {
    console.error('❌ Error general cargando logo:', error);
    return null;
  }
}

// Función de respaldo completa (mantener por si acaso)
async function cargarLogo() {
  // Primero intentar el método simple
  let logo = await cargarLogoSimple();
  if (logo) return logo;

  // Si falla, usar el método completo como respaldo
  const rutasLogo = [
    '/logo1.png', // Ruta directa desde public (más probable que funcione)
    `${window.location.origin}/logo1.png`,
    `${import.meta.env.BASE_URL || '/'}logo1.png`, // Usando BASE_URL de Vite
    './logo1.png'
  ];

  console.log('🖼️ Método simple falló, probando rutas múltiples:', rutasLogo);

  // Intentar con Image() para las rutas restantes
  for (const logoUrl of rutasLogo) {
    try {
      console.log(`🔍 Probando: ${logoUrl}`);
      const logoBase64 = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.naturalWidth || this.width;
            canvas.height = this.naturalHeight || this.height;
            ctx.drawImage(this, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            console.log(`✅ Logo cargado con Image desde: ${logoUrl}`);
            resolve(dataUrl);
          } catch (canvasError) {
            console.warn(`❌ Error canvas:`, canvasError);
            reject(canvasError);
          }
        };
        
        img.onerror = () => reject(new Error(`Falló ${logoUrl}`));
        img.src = logoUrl;
      });
      
      return logoBase64;
    } catch (error) {
      console.warn(`❌ Falló ${logoUrl}:`, error.message);
      continue;
    }
  }

  console.error('❌ CRÍTICO: Todos los métodos de carga fallaron');
  return null;
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
  
  doc.text(`Cliente: ${pedido.clienteNombre || 'N/A'}`, 110, y);
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
  
  // Historial de estados si existe
  if (pedido.historialEstados && pedido.historialEstados.length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('HISTORIAL DE ESTADOS', 15, y);
    y += 10;
    
    // Cabecera del historial
    doc.setFillColor(168, 237, 234);
    doc.rect(15, y - 2, 180, 10, 'F');
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO', 18, y + 5);
    doc.text('USUARIO', 68, y + 5);
    doc.text('FECHA Y HORA', 118, y + 5);
    y += 12;
    
    // Líneas del historial
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    pedido.historialEstados.forEach((h, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 2, 180, 8, 'F');
      }
      
      doc.text((h.estado || '').replace('_', ' ').toUpperCase(), 18, y + 4);
      doc.text(h.usuario || '-', 68, y + 4);
      doc.text(h.fecha ? new Date(h.fecha).toLocaleString('es-ES') : '-', 118, y + 4);
      y += 10;
      
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
  }

  // Pie de página profesional
  crearPie(doc);
  
  // Guardar el archivo
  doc.save(`Pedido_${pedido.numeroPedido || pedido._id || 'detalle'}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
