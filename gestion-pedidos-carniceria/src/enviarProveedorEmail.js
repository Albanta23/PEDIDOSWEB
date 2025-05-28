// ENDPOINT DESACTIVADO: Solo Mailjet gestiona el envío de emails a proveedores. No usar este archivo.

// Endpoint para enviar la lista de proveedor por email con PDF adjunto
const mailgun = require('mailgun-js');
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

module.exports = function(app) {
  // app.post('/api/enviar-proveedor', async (req, res) => {
  //   try {
  //     const { tienda, fecha, lineas, pdfBase64 } = req.body;
  //     const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
  //     const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'notificaciones@sandboxXXXXXXXXXXXX.mailgun.org';
  //     const pdfData = pdfBase64.split(',')[1];
  //     const htmlTableRows = lineas.map(l => `
  //       <tr>
  //         <td>${l.referencia || ''}</td>
  //         <td>${l.cantidad || ''}</td>
  //         <td>${l.unidad || 'kg'}</td>
  //       </tr>
  //     `).join('');
  //     const html = `<!DOCTYPE html>
  // <html lang="es">
  // <head>
  //   <meta charset="UTF-8">
  //   <title>Pedido de Frescos - Embutidos Ballesteros SL</title>
  //   <style>
  //     body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9f6f2; margin: 0; padding: 20px; }
  //     .container { background: #fff; border-radius: 10px; max-width: 620px; margin: auto; padding: 32px; box-shadow: 0 2px 10px rgba(110, 73, 36, 0.08); border: 2px solid #a9241f; }
  //     h2 { color: #a9241f; margin-top: 0; letter-spacing: 1px; }
  //     .logo { display: block; margin: 0 auto 18px auto; max-width: 140px; }
  //     table { width: 100%; border-collapse: collapse; margin: 26px 0 20px 0; }
  //     th, td { border: 1px solid #cdb196; padding: 10px 8px; text-align: left; }
  //     th { background: #f4e8dc; color: #a9241f; font-weight: bold; }
  //     .footer { font-size: 13px; color: #907a66; margin-top: 34px; text-align: center; }
  //     .empresa { font-weight: bold; color: #a9241f; font-size: 18px; letter-spacing: 1px; }
  //   </style>
  // </head>
  // <body>
  //   <div class="container" id="pedido-content">
  //     <img src="https://raw.githubusercontent.com/ballesterosdigital/gestion-pedidos-carniceria/main/public/logo1.png" alt="Logo Embutidos Ballesteros SL" class="logo" />
  //     <div class="empresa">Embutidos Ballesteros SL</div>
  //     <h2>Pedido de Productos Frescos</h2>
  //     <p>Estimado proveedor,</p>
  //     <p>Le remitimos el pedido de frescos para la tienda de carnicería correspondiente al <b>${fecha}</b>.</p>
  //     <table>
  //       <thead>
  //         <tr>
  //           <th>Producto</th>
  //           <th>Cantidad</th>
  //           <th>Unidad</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         ${htmlTableRows}
  //       </tbody>
  //     </table>
  //     <p>Para cualquier consulta o aclaración, quedamos a su disposición.</p>
  //     <div class="footer">Embutidos Ballesteros SL &mdash; Gracias por su confianza.</div>
  //   </div>
  // </body>
  // </html>`;
  //     const data = {
  //       from: `Pedidos Carnicería <${fromEmail}>`,
  //       to: proveedorEmail,
  //       subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
  //       text: `Adjunto pedido de fresco para proveedor. Tienda: ${tienda} Fecha: ${fecha} Resumen: ${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join(', ')}`,
  //       html,
  //       attachment: {
  //         data: Buffer.from(pdfData, 'base64'),
  //         filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
  //         contentType: 'application/pdf'
  //       }
  //     };
  //     mg.messages().send(data, function (error, body) {
  //       if (error) {
  //         console.error('Error enviando email con Mailgun:', error);
  //         return res.status(500).json({ error: 'Error enviando email con Mailgun', details: error.message });
  //       }
  //       res.status(200).json({ ok: true, mailgun: body });
  //     });
  //   } catch (err) {
  //     console.error('Error enviando email al proveedor:', err);
  //     res.status(500).json({ error: 'Error enviando email al proveedor' });
  //   }
  // });
};
