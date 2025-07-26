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
