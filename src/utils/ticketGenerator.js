import { DATOS_EMPRESA } from '../configDatosEmpresa';
import { formatearNombreClientePedido } from './formatNombreCompleto';
import { obtenerDireccionEnvio, formatearNombreDestinatario } from './direccionEnvioUtils';

export function generarTicket(pedido, bultoNum = 1, totalBultos = 1) {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');
  const { nombre, direccion, telefono, web } = DATOS_EMPRESA;

  return {
    html: generateProfessionalLabelHTML(pedido, bultoNum, totalBultos, fecha, hora, { nombre, direccion, telefono, web }),
    text: generateTextVersion(pedido, bultoNum, totalBultos, fecha, hora, { nombre, direccion, telefono, web })
  };
}

// Nueva función para generar ticket de texto profesional (Epson TM-T70II)
export function generarTicketTexto(pedido, usuario) {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');
  const { nombre, direccion, telefono, web } = DATOS_EMPRESA;

  return generateProfessionalTextTicket(pedido, fecha, hora, { nombre, direccion, telefono, web }, usuario);
}

// Nueva función para generar documento completo con todas las etiquetas
export function generarDocumentoEtiquetasCompleto(pedido, numBultos) {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');
  const { nombre, direccion, telefono, web } = DATOS_EMPRESA;

  return generateAllLabelsDocument(pedido, numBultos, fecha, hora, { nombre, direccion, telefono, web });
}

// Función para generar documento con todas las etiquetas juntas
function generateAllLabelsDocument(pedido, numBultos, fecha, hora, empresa) {
  const etiquetas = [];
  
  // Generar cada etiqueta
  for (let i = 1; i <= numBultos; i++) {
    etiquetas.push(`
      <div class="etiqueta" style="page-break-after: ${i < numBultos ? 'always' : 'auto'};">
        <div class="header-empresa">
          <div class="empresa-logo">
            <img src="./logo1.png" alt="Logo" style="height: 35px; width: auto;" />
          </div>
          <div class="empresa-datos">
            <div class="empresa-nombre">${empresa.nombre}</div>
            <div class="empresa-direccion">${empresa.direccion}</div>
            <div class="empresa-contacto">Tel: ${empresa.telefono} | ${empresa.web}</div>
          </div>
        </div>
        
        <div class="contenido">
          <div class="seccion-destinatario">
            <div class="seccion-titulo">📍 DESTINATARIO:</div>
            <div class="direccion-wrapper">
              ${(() => {
                const datosEnvio = obtenerDireccionEnvio(pedido);
                const nombreFormateado = formatearNombreDestinatario(datosEnvio);
                
                const direccionPrincipal = `
                  <div class="direccion-nombre">${nombreFormateado}</div>
                  <div class="direccion-linea">${datosEnvio.direccionCompleta}</div>
                  <div class="direccion-linea">${datosEnvio.codigoPostal || ''} ${datosEnvio.poblacion || ''}</div>
                  ${datosEnvio.provincia ? `<div class="direccion-linea">${datosEnvio.provincia}</div>` : ''}
                  ${datosEnvio.telefono ? `<div class="direccion-linea">📞 Tel: ${datosEnvio.telefono}</div>` : ''}
                `;

                if (datosEnvio.esEnvioAlternativo) {
                  return `
                    <div class="direccion">${direccionPrincipal}</div>
                    <div class="direccion-especial">⚠️ DIRECCIÓN DE ENVÍO DIFERENTE</div>
                  `;
                }
                
                return `<div class="direccion">${direccionPrincipal}</div>`;
              })()}
            </div>
          </div>
          
          <div class="bulto-info">
            <div class="bulto-numero">BULTO ${i} DE ${numBultos}</div>
            <div class="pedido-info-linea">
              <div class="pedido-numero">Pedido Nº ${pedido.numeroPedido || pedido._id}</div>
              <div class="info-adicional">
                <span class="fecha-envio">📅 ${fecha} ${hora}</span>
                <span class="operario">👤 Op: ${pedido.usuario || 'Expediciones'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Etiquetas de Envío - ${numBultos} Bultos</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 5mm;
          }
          
          .etiqueta {
            border: 3px solid black;
            padding: 5mm;
            font-size: 14px;
            width: 140mm;   /* 14cm - ANCHO PARA APAISADO */
            height: 90mm;  /* 9cm - ALTO PARA APAISADO */
            margin: 0 auto 10mm auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 4mm;
          }
          
          .header-empresa {
            display: flex;
            align-items: center;
            padding-bottom: 3mm;
            border-bottom: 2px solid #1976d2;
          }
          
          .empresa-logo {
            margin-right: 8px;
            display: flex;
            align-items: center;
          }
          
          .empresa-datos {
            flex: 1;
          }
          
          .empresa-nombre {
            font-size: 14px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 1px;
          }
          
          .empresa-direccion {
            font-size: 11px;
            color: #333;
            margin-bottom: 1px;
          }
          
          .empresa-contacto {
            font-size: 10px;
            color: #666;
          }
          
          .contenido {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4mm;
          }
          
          .seccion-destinatario {
            background: #f8f9fa;
            padding: 4mm;
            border: 2px solid #1976d2;
            border-radius: 3mm;
            min-height: 40mm; /* Se quita flex:1 y se añade min-height para evitar que el bloque crezca y empuje el contenido */
          }
          
          .seccion-titulo {
            font-size: 13px;
            font-weight: bold;
            background: #e3f2fd;
            padding: 3px 6px;
            border-left: 3px solid #1976d2;
            margin-bottom: 3mm;
          }

          .direccion-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .direccion {
            font-size: 13px;
            flex-grow: 1;
          }
          
          .direccion-nombre {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #1976d2;
          }
          
          .direccion-linea {
            margin-bottom: 1mm;
            color: #333;
            word-wrap: break-word;
          }
          
          .direccion-especial {
            padding: 3mm;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 2mm;
            font-size: 11px;
            font-weight: bold;
            color: #856404;
            text-align: center;
            margin-left: 4mm;
            flex-shrink: 0;
          }
          
          .bulto-info {
            text-align: center;
            margin: 2mm 0;
          }
          
          .bulto-numero {
            font-size: 16px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 4px;
            border: 2px solid black;
            margin-bottom: 2mm;
          }
          
          .pedido-numero {
            font-size: 14px;
            font-weight: bold;
            color: #1976d2;
          }
          
          .pedido-info-linea {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          
          .info-adicional {
            display: flex;
            gap: 8px;
            font-size: 10px;
            color: #666;
          }
          
          .fecha-envio, .operario {
            white-space: nowrap;
          }

          .codigo-barras {
            text-align: center;
            margin: 3mm 0;
            padding: 4mm;
            border: 3px solid black;
            background: white;
          }
          
          .codigo-titulo {
            font-size: 14px; /* Más grande para apaisado */
            font-weight: bold;
            margin-bottom: 2mm;
          }
          
          @media print {
            body { 
              padding: 0; 
            }
            .etiqueta {
              margin: 0 auto;
              page-break-inside: avoid;
              page-break-after: always;
            }
            .etiqueta:last-child {
              page-break-after: auto;
            }
          }
          
          @page {
            margin: 5mm;
            size: 150mm 100mm; /* 15cm x 10cm - APAISADO */
          }
        </style>
      </head>
      <body>
        ${etiquetas.join('')}
      </body>
    </html>
  `;
}

// Función para generar ticket de texto profesional para Epson TM-T70II
function generateProfessionalTextTicket(pedido, fecha, hora, empresa, usuario) {
  // Formatear productos desde las líneas
  const productosFormateados = (pedido.lineas || []).filter(linea => !linea.esComentario).map(linea => {
    return `
              <div class="producto-line">
                <div class="producto-nombre">${linea.producto || 'Producto'}</div>
                <div class="producto-detalles">
                  Cant: ${linea.cantidad || 0} ${linea.formato || 'ud'}
                  ${linea.peso ? `- Peso: ${linea.peso}kg` : ''}
                  ${linea.lote ? `- Lote: ${linea.lote}` : ''}
                </div>
                ${linea.comentario ? `<div class="producto-comentario">Nota: ${linea.comentario}</div>` : ''}
              </div>`;
  }).join('');

  // Formatear comentarios
  const comentarios = (pedido.lineas || []).filter(linea => linea.esComentario).map(linea => {
    return `<div class="comentario-line">📝 ${linea.comentario}</div>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Pedido ${pedido.numeroPedido || pedido._id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 5px;
            width: 264px; /* 7cm = 264px */
            margin: 0 auto;
            font-size: 14px; /* Ajustado para 7cm */
            line-height: 1.2;
          }
          
          .ticket {
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid black;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          
          .empresa-nombre {
            font-size: 15px; /* Ajustado para 7cm */
            font-weight: bold;
            margin-bottom: 3px;
          }
          
          .empresa-info {
            font-size: 12px;
            margin-bottom: 1px;
          }
          
          .titulo-ticket {
            font-size: 16px; /* Ajustado para 7cm */
            font-weight: bold;
            margin: 8px 0;
          }
          
          .info-pedido {
            margin-bottom: 12px;
          }
          
          .info-line {
            margin-bottom: 2px;
            font-size: 13px; /* Ajustado para 7cm */
          }
          
          .label {
            font-weight: bold;
          }
          
          .cliente-info {
            border-top: 2px dashed black;
            border-bottom: 2px dashed black;
            padding: 10px 0;
            margin: 10px 0;
          }
          
          .productos {
            margin: 12px 0;
          }
          
          .productos-titulo {
            font-size: 14px; /* Ajustado para 7cm */
            font-weight: bold;
            margin-bottom: 6px;
            text-align: center;
            background: #f0f0f0;
            padding: 5px;
            border: 1px solid black;
          }
          
          .producto-line {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #666;
          }
          
          .producto-nombre {
            font-weight: bold;
            font-size: 13px; /* Ajustado para 7cm */
            margin-bottom: 2px;
          }
          
          .producto-detalles {
            font-size: 12px;
            color: #333;
          }
          
          .producto-comentario {
            font-size: 12px;
            color: #666;
            font-style: italic;
            margin-top: 2px;
          }
          
          .comentarios {
            margin: 12px 0;
            border: 2px solid #ff9800;
            padding: 8px;
            background: #fff3e0;
          }
          
          .comentarios-titulo {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #e65100;
          }
          
          .comentario-line {
            font-size: 13px;
            margin-bottom: 4px;
            color: #bf360c;
          }
          
          .bultos-info {
            text-align: center;
            font-size: 14px; /* Ajustado para 7cm */
            font-weight: bold;
            margin: 10px 0;
            background: #e3f2fd;
            padding: 6px;
            border: 2px solid #1976d2;
            color: #0d47a1;
          }          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 2px dashed black;
            padding-top: 12px;
            font-size: 14px;
          }
          
          .origen-info {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
            padding: 6px;
            border-radius: 6px;
            color: white;
          }
          
          .origen-woocommerce {
            background: #ff9800;
          }
          
          .origen-manual {
            background: #1976d2;
          }
          
          @media print {
            body { 
              padding: 0; 
              width: auto;
            }
          }
          
          @page {
            margin: 5mm;
            size: 70mm auto; /* 7cm de ancho */
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="empresa-nombre">${empresa.nombre}</div>
            <div class="empresa-info">${empresa.direccion}</div>
            <div class="empresa-info">Tel: ${empresa.telefono}</div>
            <div class="empresa-info">${empresa.web}</div>
            <div class="titulo-ticket">TICKET DE PEDIDO</div>
          </div>
          
          <div class="info-pedido">
            <div class="info-line"><span class="label">Pedido Nº:</span> ${pedido.numeroPedido || pedido._id}</div>
            <div class="info-line"><span class="label">Fecha:</span> ${fecha}</div>
            <div class="info-line"><span class="label">Hora:</span> ${hora}</div>
            <div class="info-line"><span class="label">Operario:</span> ${usuario || 'Expediciones'}</div>
            <div class="info-line"><span class="label">Estado:</span> PREPARADO</div>
          </div>

          <div class="origen-info ${pedido.origen?.tipo === 'woocommerce' ? 'origen-woocommerce' : 'origen-manual'}">
            ORIGEN: ${pedido.origen?.tipo === 'woocommerce' ? 'WOOCOMMERCE' : 'MANUAL'}
          </div>
          
          <div class="cliente-info">
            <div class="info-line"><span class="label">CLIENTE:</span></div>
            <div class="info-line">${formatearNombreClientePedido(pedido)}</div>
            <div class="info-line">${pedido.direccion || pedido.direccionEnvio || 'N/A'}</div>
            <div class="info-line">${pedido.codigoPostal || ''} ${pedido.poblacion || ''}</div>
            ${pedido.telefono ? `<div class="info-line">Tel: ${pedido.telefono}</div>` : ''}
          </div>
          
          <div class="productos">
            <div class="productos-titulo">📦 PRODUCTOS PEDIDO</div>
            ${productosFormateados || '<div class="info-line">Sin productos especificados</div>'}
          </div>

          ${comentarios ? `
          <div class="comentarios">
            <div class="comentarios-titulo">📝 COMENTARIOS:</div>
            ${comentarios}
          </div>
          ` : ''}

          <div class="bultos-info">
            📦 BULTOS: ${pedido.bultos || 1}
          </div>
          
          ${pedido.notasCliente ? `
          <div class="comentarios">
            <div class="comentarios-titulo">📋 NOTAS DEL CLIENTE:</div>
            <div class="comentario-line">${pedido.notasCliente}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div>¡Gracias por su pedido!</div>
            <div>${fecha} ${hora}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Función para generar etiqueta térmica simplificada para Zebra GK420d
function generateThermalLabelHTML(pedido, bultoNum, totalBultos, fecha, hora, empresa) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Etiqueta de Envío ${bultoNum}/${totalBultos}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 10px;
            width: 300px;
            margin: 0 auto;
          }
          
          .etiqueta {
            border: 1px solid black;
            padding: 10px;
            font-size: 12px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .header h1 {
            font-size: 14px;
            font-weight: bold;
          }
          
          .bulto-info {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .contenido {
            font-size: 12px;
          }
          
          .direccion {
            margin-top: 10px;
            padding: 5px;
            border: 1px dashed black;
          }
          
          .direccion-nombre {
            font-size: 12px;
            font-weight: bold;
          }
          
          .direccion-linea {
            font-size: 12px;
          }
          
          .direccion-especial {
            margin-top: 3px;
            padding: 3px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            color: #856404;
            text-align: center;
          }
          
          .codigo-barras {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
          }
          
          @media print {
            body { 
              padding: 0; 
              width: auto;
            }
            .etiqueta {
              border: 1px solid black;
            }
          }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          <div class="header">
            <h1>Etiqueta de Envío</h1>
            <div>${empresa.nombre}</div>
          </div>
          
          <div class="bulto-info">
            BULTO ${bultoNum} DE ${totalBultos}
          </div>
          
          <div class="contenido">
            <div class="direccion">
              <div class="direccion-nombre">${formatearNombreClientePedido(pedido)}</div>
              <div class="direccion-linea">${pedido.direccion || pedido.direccionEnvio || 'Dirección no disponible'}</div>
              <div class="direccion-linea">${pedido.codigoPostal || ''} ${pedido.poblacion || ''}</div>
              ${pedido.telefono ? `<div class="direccion-linea">Tel: ${pedido.telefono}</div>` : ''}
            </div>
            
            <div class="codigo-barras">
              ||||| ${(pedido.numeroPedido || '12345678').toString().slice(-8).padStart(8, '0')} |||||
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateProfessionalLabelHTML(pedido, bultoNum, totalBultos, fecha, hora, empresa) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Etiqueta de Envío ${bultoNum}/${totalBultos}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 10px;
            width: 580px; /* Ancho amplio para diseño horizontal */
            margin: 0 auto;
          }
          
          .etiqueta {
            border: 3px solid #2c3e50;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #3498db, #2c3e50);
            color: white;
            padding: 15px;
            text-align: center;
            position: relative;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 3px solid white;
            margin: 0 auto 10px;
            display: block;
            object-fit: cover;
            background: white;
            padding: 5px;
          }
          
          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .bulto-info {
            background: #e74c3c;
            color: white;
            padding: 8px 15px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 1px;
          }
          
          .contenido {
            padding: 15px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
          }
          
          .columna-izquierda {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .columna-derecha {
            flex: 1.2;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .seccion {
            border: 1px solid #ecf0f1;
            border-radius: 6px;
            overflow: hidden;
          }
          
          .seccion:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .titulo-seccion {
            background: #34495e;
            color: white;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0;
          }
          
          .contenido-seccion {
            padding: 10px;
          }
          
          .info-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 13px;
          }
          
          .label {
            font-weight: bold;
            color: #2c3e50;
            min-width: 80px;
          }
          
          .value {
            color: #34495e;
            text-align: right;
            flex: 1;
            margin-left: 10px;
          }
          
          .direccion {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border-left: 3px solid #3498db;
          }
          
          .direccion-compacta {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 4px;
            border-left: 3px solid #3498db;
          }
          
          .direccion-nombre {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          
          .direccion-linea {
            font-size: 14px;
            color: #34495e;
            margin-bottom: 3px;
          }
          
          .observaciones {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 12px;
            color: #856404;
            font-size: 13px;
            line-height: 1.4;
          }
          
          .footer {
            background: #95a5a6;
            color: white;
            text-align: center;
            padding: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .codigo-barras {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            padding: 8px;
            letter-spacing: 1px;
            color: #2c3e50;
            background: #f8f9fa;
            border: 2px solid #34495e;
            border-radius: 4px;
          }
          
          @media print {
            body { 
              padding: 5mm; 
              width: auto;
              max-width: 140mm; /* Ancho horizontal amplio */
            }
            .etiqueta {
              box-shadow: none;
              border: 2px solid #2c3e50;
            }
          }
          
          @page {
            margin: 5mm;
            size: 150mm 100mm; /* 15cm x 10cm - APAISADO */
          }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          <div class="header">
            <img src="/logo1.png" alt="Logo" class="logo" onerror="this.style.display='none'">
            <h1>Etiqueta de Envío</h1>
            <div style="font-size: 12px; opacity: 0.9;">${empresa.nombre}</div>
          </div>
          
          <div class="bulto-info">
            BULTO ${bultoNum} DE ${totalBultos}
          </div>
          
          <div class="contenido">
            <div class="columna-izquierda">
              <div class="seccion">
                <div class="titulo-seccion">📋 Información del Pedido</div>
                <div class="contenido-seccion">
                  <div class="info-line">
                    <span class="label">Pedido Nº:</span>
                    <span class="value">${pedido.numeroPedido || pedido._id || pedido.id || 'N/A'}</span>
                  </div>
                  <div class="info-line">
                    <span class="label">Fecha:</span>
                    <span class="value">${fecha}</span>
                  </div>
                  <div class="info-line">
                    <span class="label">Hora:</span>
                    <span class="value">${hora}</span>
                  </div>
                  <div class="info-line">
                    <span class="label">Operario:</span>
                    <span class="value">${pedido.usuarioTramitando || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div class="seccion">
                <div class="titulo-seccion">📦 Remitente</div>
                <div class="contenido-seccion">
                  <div class="direccion-compacta">
                    <div class="direccion-nombre">${empresa.nombre}</div>
                    <div class="direccion-linea">${empresa.direccion}</div>
                    <div class="direccion-linea">Tel: ${empresa.telefono} | ${empresa.web}</div>
                  </div>
                </div>
              </div>
              
              <div class="codigo-barras">
                ||||| ${(pedido.numeroPedido || pedido._id || '').toString().slice(-8).padStart(8, '0')} |||||
              </div>
            </div>
            
            <div class="columna-derecha">
              <div class="seccion">
                <div class="titulo-seccion">🏠 Destinatario</div>
                <div class="contenido-seccion">
                  <div class="direccion">
                    ${(() => {
                      const datosEnvio = obtenerDireccionEnvio(pedido);
                      const nombreFormateado = formatearNombreDestinatario(datosEnvio);
                      
                      return `
                        <div class="direccion-nombre">${nombreFormateado}</div>
                        <div class="direccion-linea">${datosEnvio.direccionCompleta}</div>
                        ${datosEnvio.codigoPostal || datosEnvio.poblacion ? 
                          `<div class="direccion-linea">${datosEnvio.codigoPostal || ''} ${datosEnvio.poblacion || ''}</div>` : ''}
                        ${datosEnvio.provincia ? 
                          `<div class="direccion-linea">${datosEnvio.provincia}</div>` : ''}
                        ${datosEnvio.telefono ? 
                          `<div class="direccion-linea">Tel: ${datosEnvio.telefono}</div>` : ''}
                        ${datosEnvio.esEnvioAlternativo ? 
                          `<div class="direccion-especial">⚠️ DIRECCIÓN DE ENVÍO DIFERENTE</div>` : ''}
                      `;
                    })()}
                  </div>
                </div>
              </div>
              
              ${pedido.notasCliente ? `
              <div class="seccion">
                <div class="titulo-seccion">📝 Observaciones</div>
                <div class="contenido-seccion">
                  <div class="observaciones">
                    ${pedido.notasCliente}
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="footer">
            ¡Gracias por confiar en nosotros!
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateTextVersion(pedido, bultoNum, totalBultos, fecha, hora, empresa) {
  const datosEnvio = obtenerDireccionEnvio(pedido);
  const nombreFormateado = formatearNombreDestinatario(datosEnvio);
  
  let ticket = `
========================================
              ETIQUETA DE ENVÍO
========================================

BULTO: ${bultoNum} de ${totalBultos}
Fecha: ${fecha} - Hora: ${hora}
Pedido Nº: ${pedido.numeroPedido || pedido._id || pedido.id || 'N/A'}
Operario: ${pedido.usuarioTramitando || 'N/A'}

========================================
REMITENTE:
${empresa.nombre}
${empresa.direccion}
Tel: ${empresa.telefono}
Web: ${empresa.web}

========================================
DESTINATARIO:
${nombreFormateado}
${datosEnvio.direccionCompleta}
${datosEnvio.codigoPostal || ''} ${datosEnvio.poblacion || ''}
${datosEnvio.provincia ? datosEnvio.provincia : ''}
Tel: ${datosEnvio.telefono || ''}
${datosEnvio.esEnvioAlternativo ? '\n⚠️ DIRECCIÓN DE ENVÍO DIFERENTE' : ''}

========================================
`;

  if (pedido.notasCliente) {
    ticket += `
OBSERVACIONES:
${pedido.notasCliente}

========================================
`;
  }

  ticket += `
       ¡GRACIAS POR SU PEDIDO!
========================================
`;

  return ticket;
}