// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando Mailjet
const mailjet = require('node-mailjet');

const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, destinatarios } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const toList = [
        { Email: proveedorEmail, Name: 'Proveedor' }
      ];
      const ccList = [
        { Email: process.env.MAILJET_COPIA_EMAIL || 'copia@ejemplo.com', Name: 'Copia' }
      ];
      const fromEmail = process.env.MAILJET_FROM_EMAIL || 'notificaciones@tudominio.com';
      const fromName = process.env.MAILJET_FROM_NAME || 'Pedidos Carnicería';
      const htmlTableRows = lineas.map(l => `
        <tr>
          <td>${l.referencia || ''}</td>
          <td>${l.cantidad || ''}</td>
          <td>${l.unidad || 'kg'}</td>
        </tr>
      `).join('');
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pedido de Frescos - Embutidos Ballesteros SL</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9f6f2; margin: 0; padding: 20px; }
    .container { background: #fff; border-radius: 10px; max-width: 620px; margin: auto; padding: 32px; box-shadow: 0 2px 10px rgba(110, 73, 36, 0.08); border: 2px solid #a9241f; }
    h2 { color: #a9241f; margin-top: 0; letter-spacing: 1px; }
    .logo { display: block; margin: 0 auto 18px auto; max-width: 140px; }
    table { width: 100%; border-collapse: collapse; margin: 26px 0 20px 0; }
    th, td { border: 1px solid #cdb196; padding: 10px 8px; text-align: left; }
    th { background: #f4e8dc; color: #a9241f; font-weight: bold; }
    .footer { font-size: 13px; color: #907a66; margin-top: 34px; text-align: center; }
    .empresa { font-weight: bold; color: #a9241f; font-size: 18px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="container" id="pedido-content">
    <img src="https://raw.githubusercontent.com/ballesterosdigital/gestion-pedidos-carniceria/main/public/logo1.png" alt="Logo Embutidos Ballesteros SL" class="logo" />
    <h2>Pedido de frescos</h2>
    <p><b>Tienda:</b> ${tienda || '-'}<br><b>Fecha:</b> ${fecha || '-'}</p>
    <table>
      <thead><tr><th>Referencia</th><th>Cantidad</th><th>Unidad</th></tr></thead>
      <tbody>${htmlTableRows}</tbody>
    </table>
    <div class="footer empresa">Embutidos Ballesteros SL</div>
  </div>
</body>
</html>`;

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
