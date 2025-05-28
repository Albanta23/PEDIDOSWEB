// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando Mailjet
const mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');

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
      const botonEnvio = `<button style="background:transparent;border:none;cursor:pointer;"><img src='${logo2Url}' alt='Enviar' style='height:38px;vertical-align:middle;'/></button>`;
      // Reemplazar placeholders en la plantilla
      html = html.replace(/\$\{fecha\}/g, fecha || '-');
      html = html.replace(/\$\{tabla\}/g, htmlTableRows);
      html = html.replace(/\$\{boton_envio\}/g, botonEnvio);
      // LOG para comprobar destinatarios principales y CC
      console.log('[MAILJET] Enviando email a:', toList.map(e => e.Email).join(','));
      if (ccList.length > 0) {
        console.log('[MAILJET] Enviando en CC a:', ccList.map(e => e.Email).join(','));
      } else {
        console.log('[MAILJET] Sin destinatario en CC');
      }
      // LOG para depuración: mostrar el HTML final que se envía
      console.log('[MAILJET][DEBUG] HTML enviado al proveedor:\n', html);
      // Enviar email con Mailjet
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
            HTMLPart: html
          }
        ]
      });
      await request;
      res.json({ ok: true, message: 'Email enviado correctamente al proveedor.' });
    } catch (err) {
      let errorMsg = 'Error desconocido';
      if (err && err.message) errorMsg = err.message;
      if (err && err.response && err.response.body) errorMsg += ' | ' + JSON.stringify(err.response.body);
      console.error('Error al enviar email con Mailjet:', errorMsg);
      res.status(500).json({ ok: false, error: errorMsg });
    }
  });
};
