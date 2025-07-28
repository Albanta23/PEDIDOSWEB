import { DATOS_EMPRESA } from '../configDatosEmpresa';

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
        <div class="header">
          <h1>Etiqueta de Envío</h1>
          <div>${empresa.nombre}</div>
        </div>
        
        <div class="bulto-info">
          BULTO ${i} DE ${numBultos}
        </div>
        
        <div class="contenido">
          <div class="direccion">
            <div class="direccion-nombre">${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'Cliente'}</div>
            <div class="direccion-linea">${pedido.direccion || pedido.direccionEnvio || 'Dirección no disponible'}</div>
            <div class="direccion-linea">${pedido.codigoPostal || ''} ${pedido.poblacion || ''}</div>
            ${pedido.telefono ? `<div class="direccion-linea">Tel: ${pedido.telefono}</div>` : ''}
          </div>
          
          <div class="codigo-barras">
            ||||| ${(pedido.numeroPedido || '12345678').toString().slice(-8).padStart(8, '0')} |||||
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
            padding: 10px;
          }
          
          .etiqueta {
            border: 2px solid black;
            padding: 15px;
            font-size: 12px;
            width: 300px;
            margin: 0 auto 20px auto;
            min-height: 200px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px solid black;
            padding-bottom: 10px;
          }
          
          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .bulto-info {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            background: #f0f0f0;
            padding: 8px;
            border: 1px solid black;
          }
          
          .contenido {
            font-size: 12px;
          }
          
          .direccion {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px dashed black;
            background: #f9f9f9;
          }
          
          .direccion-nombre {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .direccion-linea {
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .codigo-barras {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            padding: 10px;
            border: 2px solid black;
            background: white;
          }
          
          @media print {
            body { 
              padding: 0; 
            }
            .etiqueta {
              margin: 0 auto;
              page-break-inside: avoid;
            }
          }
          
          @page {
            margin: 10mm;
            size: auto;
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
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px;
            width: 300px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.3;
          }
          
          .ticket {
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed black;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          
          .empresa-nombre {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .empresa-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          
          .titulo-ticket {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
          }
          
          .info-pedido {
            margin-bottom: 15px;
          }
          
          .info-line {
            margin-bottom: 3px;
          }
          
          .label {
            font-weight: bold;
          }
          
          .cliente-info {
            border-top: 1px dashed black;
            border-bottom: 1px dashed black;
            padding: 10px 0;
            margin: 10px 0;
          }
          
          .productos {
            margin: 15px 0;
          }
          
          .producto-line {
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px dotted #ccc;
          }
          
          .producto-nombre {
            font-weight: bold;
          }
          
          .producto-detalles {
            font-size: 11px;
          }
          
          .totales {
            border-top: 1px dashed black;
            padding-top: 10px;
            margin-top: 15px;
          }
          
          .total-line {
            margin-bottom: 3px;
          }
          
          .total-final {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid black;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 1px dashed black;
            padding-top: 10px;
            font-size: 10px;
          }
          
          .observaciones {
            margin: 10px 0;
            padding: 5px;
            border: 1px dashed black;
            font-size: 11px;
          }
          
          @media print {
            body { 
              padding: 0; 
              width: auto;
            }
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
            <div class="info-line"><span class="label">Estado:</span> ${pedido.estado || 'Preparado'}</div>
          </div>
          
          <div class="cliente-info">
            <div class="info-line"><span class="label">CLIENTE:</span></div>
            <div class="info-line">${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'N/A'}</div>
            <div class="info-line">${pedido.direccion || pedido.direccionEnvio || 'N/A'}</div>
            <div class="info-line">${pedido.codigoPostal || ''} ${pedido.poblacion || ''}</div>
            ${pedido.telefono ? `<div class="info-line">Tel: ${pedido.telefono}</div>` : ''}
          </div>
          
          <div class="productos">
            <div class="info-line"><span class="label">PRODUCTOS:</span></div>
            ${(pedido.lineas || []).map(linea => `
              <div class="producto-line">
                <div class="producto-nombre">${linea.producto?.nombre || linea.nombre || 'Producto'}</div>
                <div class="producto-detalles">
                  Cant: ${linea.cantidad || 0} ${linea.producto?.unidad || 'ud'} - 
                  Precio: ${(linea.precio || 0).toFixed(2)}€ - 
                  Total: ${((linea.cantidad || 0) * (linea.precio || 0)).toFixed(2)}€
                </div>
                ${linea.lote ? `<div class="producto-detalles">Lote: ${linea.lote}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="totales">
            <div class="total-line"><span class="label">Subtotal:</span> ${(pedido.subtotal || 0).toFixed(2)}€</div>
            ${pedido.descuento ? `<div class="total-line"><span class="label">Descuento:</span> -${pedido.descuento.toFixed(2)}€</div>` : ''}
            <div class="total-line"><span class="label">IVA:</span> ${(pedido.iva || 0).toFixed(2)}€</div>
            <div class="total-final">TOTAL: ${(pedido.total || 0).toFixed(2)}€</div>
          </div>
          
          ${pedido.notasCliente ? `
          <div class="observaciones">
            <div class="label">OBSERVACIONES:</div>
            <div>${pedido.notasCliente}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div>¡Gracias por su compra!</div>
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
              <div class="direccion-nombre">${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'Cliente'}</div>
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
            padding: 20px;
            width: 400px;
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
            padding: 20px;
          }
          
          .seccion {
            margin-bottom: 20px;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 15px;
          }
          
          .seccion:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .titulo-seccion {
            background: #34495e;
            color: white;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            border-radius: 4px;
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
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            margin-top: 8px;
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
            font-size: 20px;
            font-weight: bold;
            margin: 10px 0;
            letter-spacing: 2px;
            color: #2c3e50;
          }
          
          @media print {
            body { 
              padding: 0; 
              width: auto;
            }
            .etiqueta {
              box-shadow: none;
              border: 2px solid #2c3e50;
            }
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
            <div class="seccion">
              <div class="titulo-seccion">📋 Información del Pedido</div>
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
              <div class="codigo-barras">
                ||||| ${(pedido.numeroPedido || pedido._id || '').toString().slice(-8).padStart(8, '0')} |||||
              </div>
            </div>
            
            <div class="seccion">
              <div class="titulo-seccion">📦 Remitente</div>
              <div class="direccion">
                <div class="direccion-nombre">${empresa.nombre}</div>
                <div class="direccion-linea">${empresa.direccion}</div>
                <div class="direccion-linea">Tel: ${empresa.telefono}</div>
                <div class="direccion-linea">${empresa.web}</div>
              </div>
            </div>
            
            <div class="seccion">
              <div class="titulo-seccion">🏠 Destinatario</div>
              <div class="direccion">
                <div class="direccion-nombre">
                  ${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'Sin nombre'}
                </div>
                ${pedido.direccion || pedido.direccionEnvio ? 
                  `<div class="direccion-linea">${pedido.direccion || pedido.direccionEnvio}</div>` : ''}
                ${pedido.codigoPostal || pedido.poblacion ? 
                  `<div class="direccion-linea">${pedido.codigoPostal || ''} ${pedido.poblacion || ''}</div>` : ''}
                ${pedido.telefono ? 
                  `<div class="direccion-linea">Tel: ${pedido.telefono}</div>` : ''}
              </div>
            </div>
            
            ${pedido.notasCliente ? `
            <div class="seccion">
              <div class="titulo-seccion">📝 Observaciones</div>
              <div class="observaciones">
                ${pedido.notasCliente}
              </div>
            </div>
            ` : ''}
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
${pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || 'Sin nombre'}
${pedido.direccion || pedido.direccionEnvio || ''}
${pedido.codigoPostal || ''} ${pedido.poblacion || ''}
Tel: ${pedido.telefono || ''}

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
