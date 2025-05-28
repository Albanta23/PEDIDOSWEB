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
      // Leer plantilla HTML moderna desde archivo externo
      const plantillaPath = path.join(__dirname, '../../public/PLANTILLA.html');
      let html = fs.readFileSync(plantillaPath, 'utf8');
      // Construir filas de la tabla
      const htmlTableRows = (lineas || []).map(l => `
        <tr>
          <td>${l.referencia || ''}</td>
          <td>${l.cantidad || ''}</td>
          <td>${l.unidad || 'kg'}</td>
        </tr>
      `).join('');
      // Incluir logo2.png como imagen de botón de envío
      const logo2Url = process.env.BASE_URL_LOGO2 || `${req.protocol}://${req.get('host')}/logo2.png`;
      // Reemplazar placeholders en la plantilla
      html = html.replace(/\$\{fecha\}/g, fecha || '-');
      html = html.replace(/\$\{tabla\}/g, htmlTableRows);
      html = html.replace(/\$\{logo2Url\}/g, logo2Url);
      // Generar PDF desde HTML usando puppeteer
      let pdfBuffer;
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
      // LOG para comprobar destinatarios principales y CC
      console.log('[MAILJET] Enviando email a:', toList.map(e => e.Email).join(','));
      if (ccList.length > 0) {
        console.log('[MAILJET] Enviando en CC a:', ccList.map(e => e.Email).join(','));
      } else {
        console.log('[MAILJET] Sin destinatario en CC');
      }
      // LOG para depuración: mostrar el HTML final que se envía
      console.log('[MAILJET][DEBUG] HTML enviado al proveedor:\n', html);
      // LOG para depuración: mostrar si el botón de imprimir está presente
      if (html.includes('Imprimir PDF')) {
        console.log('[MAILJET][DEBUG] ✔ La plantilla contiene el botón de imprimir PDF.');
      } else {
        console.warn('[MAILJET][DEBUG] ❌ La plantilla NO contiene el botón de imprimir PDF.');
      }
      // Enviar email con Mailjet, adjuntando el PDF si se generó
      const attachments = pdfBuffer ? [{
        ContentType: 'application/pdf',
        Filename: `pedido_${fecha || Date.now()}.pdf`,
        Base64Content: pdfBuffer.toString('base64')
      }] : [];
      const request = mailjetClient.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: toList,
            Cc: ccList,
            Subject: `Pedido de frescos - ${tienda || ''}`,
            HTMLPart: html,
            Attachments: attachments
          }
        ]
      });
      await request;
      // Guardar en historial de proveedor tras enviar
      try {
        const tiendaId = req.body.tiendaId || tienda; // Prioriza el id, pero si no existe usa el nombre (compatibilidad)
        if (tiendaId && lineas && Array.isArray(lineas)) {
          await HistorialProveedor.create({
            tiendaId,
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
