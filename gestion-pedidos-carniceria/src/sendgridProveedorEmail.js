// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const pdfData = pdfBase64.split(',')[1];
      const msg = {
        to: proveedorEmail,
        from: process.env.SENDGRID_FROM || 'Pedidos Carnicería <no-reply@tudominio.com>',
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        attachments: [
          {
            content: pdfData,
            filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          }
        ]
      };
      await sgMail.send(msg);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error enviando email al proveedor (SendGrid):', err);
      res.status(500).json({ error: 'Error enviando email al proveedor' });
    }
  });
};
