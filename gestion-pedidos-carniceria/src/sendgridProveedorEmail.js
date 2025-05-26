// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando la API de Gmail
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const pdfData = pdfBase64.split(',')[1];

      // Configuración de OAuth2 para Gmail
      const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );

      // Establecer el refresh token
      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      const accessToken = await oauth2Client.getAccessToken();

      // Configuración del email
      const mailOptions = {
        from: 'Fábrica Embutidos Ballesteros <fabricaembutidosballesteros@gmail.com>',
        to: proveedorEmail,
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        attachments: [
          {
            filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
            content: pdfData,
            encoding: 'base64'
          }
        ]
      };

      // Enviar el email usando la API de Gmail
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: createEmail(mailOptions)
        }
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error enviando email al proveedor (Gmail API):', err);
      res.status(500).json({ error: 'Error enviando email al proveedor' });
    }
  });
};

// Función para crear el email en formato base64url
function createEmail({ to, from, subject, text, attachments }) {
  const boundary = 'foo_bar_baz';
  let body = `MIME-Version: 1.0\r\n`;
  body += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  body += `From: ${from}\r\n`;
  body += `To: ${to}\r\n`;
  body += `Subject: ${subject}\r\n`;
  body += `\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Type: text/plain; charset="UTF-8"\r\n`;
  body += `Content-Transfer-Encoding: 7bit\r\n`;
  body += `\r\n`;
  body += `${text}\r\n`;
  body += `--${boundary}\r\n`;

  attachments.forEach(attachment => {
    body += `Content-Type: application/pdf; name="${attachment.filename}"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n`;
    body += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
    body += `\r\n`;
    body += `${attachment.content}\r\n`;
    body += `--${boundary}\r\n`;
  });

  return Buffer.from(body).toString('base64url');
}
