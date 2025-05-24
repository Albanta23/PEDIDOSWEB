// Endpoint para enviar la lista de proveedor por email con PDF adjunto
const mailgun = require('mailgun-js');
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'notificaciones@sandboxXXXXXXXXXXXX.mailgun.org';
      const pdfData = pdfBase64.split(',')[1];
      const data = {
        from: `Pedidos Carnicería <${fromEmail}>`,
        to: proveedorEmail,
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        attachment: {
          data: Buffer.from(pdfData, 'base64'),
          filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
          contentType: 'application/pdf'
        }
      };
      mg.messages().send(data, function (error, body) {
        if (error) {
          console.error('Error enviando email con Mailgun:', error);
          return res.status(500).json({ error: 'Error enviando email con Mailgun', details: error.message });
        }
        res.status(200).json({ ok: true, mailgun: body });
      });
    } catch (err) {
      console.error('Error enviando email al proveedor:', err);
      res.status(500).json({ error: 'Error enviando email al proveedor' });
    }
  });
};
