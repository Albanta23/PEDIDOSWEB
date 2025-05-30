// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando Mailjet
const mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');
const HistorialProveedor = require('./models/HistorialProveedor');
const puppeteer = require('puppeteer');

const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const toList = [
        { Email: proveedorEmail, Name: 'Proveedor' }
      ];
      // CC configurable por variable de entorno
      const ccEmail = process.env.MAILJET_COPIA_EMAIL;
      const ccList = ccEmail ? [{ Email: ccEmail, Name: 'Copia' }] : [];
      const fromEmail = process.env.MAILJET_FROM_EMAIL || 'notificaciones@tudominio.com';
      const fromName = process.env.MAILJET_FROM_NAME || 'Pedidos Carnicería';
      
      // Si se fuerza texto plano desde el frontend, usar plantilla de texto plano
      // Asegurarse de que forzarTextoPlano se interpreta como booleano
      const forzarTextoPlano = req.body.forzarTextoPlano === true || req.body.forzarTextoPlano === 'true' || req.body.forzarTextoPlano === 1 || req.body.forzarTextoPlano === '1';
      
      // Leer plantilla HTML moderna desde archivo externo
      let plantillaPath = path.join(__dirname, '../../public/PLANTILLA.html');
      if (forzarTextoPlano) {
        plantillaPath = path.join(__dirname, '../../public/PLANTILLA_TEXTO_PLANO.txt');
      }
      
      let html = fs.readFileSync(plantillaPath, 'utf8');
      // Mejor detección: ignorar comentarios y espacios antes del contenido
      const htmlTrimmed = html.trimStart().replace(/^<!--.*?-->/s, '').trimStart();
      // Si forzamos texto plano, isPlainText debe ser true
      let isPlainText = forzarTextoPlano || (!htmlTrimmed.startsWith('<!DOCTYPE html>') && !htmlTrimmed.startsWith('<html'));
      // Construir filas de la tabla
      const htmlTableRows = (lineas || []).map(l => `
        <tr>
          <td>${l.referencia || ''}</td>
          <td>${l.cantidad || ''}</td>
          <td>${l.unidad || 'kg'}</td>
        </tr>
      `).join('');
      // Reemplazos para HTML o texto plano
      if (isPlainText) {
        html = html.replace(/\$\{fecha\}/g, fecha || '-');
        html = html.replace(/\$\{tabla\}/g, (lineas || []).map(l => `- ${l.referencia || ''}: ${l.cantidad || ''} ${l.unidad || 'kg'}`).join('\n'));
        html = html.replace(/\$\{tienda\}/g, tienda || '-');
      } else {
        html = html.replace(/\$\{fecha\}/g, fecha || '-');
        html = html.replace(/\$\{tabla\}/g, htmlTableRows);
        html = html.replace(/\$\{tienda\}/g, tienda || '-');
      }
      // Usar el PDF del frontend si viene en el body
      let pdfBuffer = null;
      if (req.body.pdfBase64) {
        
        // Elimina el prefijo si viene en formato datauri
        let base64 = req.body.pdfBase64;
        if (base64.startsWith('data:application/pdf;base64,')) {
          base64 = base64.replace('data:application/pdf;base64,', '');
        } else if (base64.startsWith('data:application/pdf;')) {
          base64 = base64.substring(base64.indexOf(',') + 1);
        } else if (base64.startsWith('data:')) {
          base64 = base64.substring(base64.indexOf(',') + 1);
        }
        try {
          pdfBuffer = Buffer.from(base64, 'base64');
        } catch (e) {
          console.error('[PDF] Error al decodificar el PDF base64 recibido:', e);
          pdfBuffer = null;
        }
      } else {
        // Si no viene PDF, intentar generarlo con puppeteer
        try {
          const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'networkidle0' });
          pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
          await browser.close();
        } catch (pdfErr) {
          console.error('[PDF] Error al generar PDF:', pdfErr);
          pdfBuffer = null;
        }
      }
      
      // Enviar email con Mailjet, adjuntando el PDF si se generó
      const attachments = pdfBuffer ? [{
        ContentType: 'application/pdf',
        Filename: `pedido_${fecha || Date.now()}.pdf`,
        Base64Content: pdfBuffer.toString('base64')
      }] : [];
      
      const mailjetData = {
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: toList,
            Cc: ccList,
            Subject: `Pedido de frescos - ${tienda || ''}`,
            // Si la plantilla es texto plano, usar TextPart, si no, usar HTMLPart
            ...(isPlainText ? { TextPart: html } : { HTMLPart: html }),
            Attachments: attachments
          }
        ]
      };
      
      const request = mailjetClient.post('send', { version: 'v3.1' }).request(mailjetData);
      await request;
      // Guardar en historial de proveedor tras enviar
      try {
        const tiendaId = req.body.tiendaId || tienda; // Prioriza el id, pero si no existe usa el nombre (compatibilidad)
        if (tiendaId && lineas && Array.isArray(lineas)) {
          // Para historial de proveedor, usar siempre un ID estándar
          const historialTiendaId = 'historial-proveedor-global';
          
          await HistorialProveedor.create({
            tiendaId: historialTiendaId,
            tiendaOriginal: tiendaId, // Guardamos la tienda original para referencia
            proveedor: 'proveedor-fresco',
            pedido: { lineas, fecha: fecha || new Date(), tienda },
            fechaEnvio: new Date(),
            pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : undefined
          });
        }
      } catch (histErr) {
        console.error('[HISTORIAL PROVEEDOR] Error al guardar historial:', histErr);
      }
      res.json({ ok: true, message: 'Email enviado correctamente al proveedor.' });
    } catch (err) {
      let errorMsg2 = 'Error desconocido';
      if (err && err.message) errorMsg2 = err.message;
      if (err && err.response && err.response.body) errorMsg2 += ' | ' + JSON.stringify(err.response.body);
      console.error('Error al enviar email con Mailjet:', errorMsg2);
      res.status(500).json({ ok: false, error: errorMsg2 });
    }
  });
};
