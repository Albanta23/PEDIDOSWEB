// Endpoint para enviar la lista de proveedor por email con PDF adjunto
const nodemailer = require('nodemailer');

// Puedes mover esta configuración a un archivo .env o config.js
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.tu-servidor.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'usuario@tudominio.com',
    pass: process.env.SMTP_PASS || 'tu-contraseña'
  }
};

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const transporter = nodemailer.createTransport(SMTP_CONFIG);
      const pdfData = pdfBase64.split(',')[1];
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      await transporter.sendMail({
        from: 'Pedidos Carnicería <' + SMTP_CONFIG.auth.user + '>',
        to: proveedorEmail,
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        attachments: [
          {
            filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
            content: Buffer.from(pdfData, 'base64'),
            contentType: 'application/pdf'
          }
        ]
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error enviando email al proveedor:', err);
      res.status(500).json({ error: 'Error enviando email al proveedor' });
    }
  });
};
