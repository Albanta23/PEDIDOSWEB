// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

const { FaGlassMartiniAlt } = require('react-icons/fa');
// Endpoint para enviar la lista de proveedor por email con PDF adjunto
const { authorize, sendEmail, sendMail } = require('./gmailService');

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas } = req.body;
      const proveedorEmail = 'fabricaembutidosballesteros@gmail.com'; // Configurar remitente fijo
      const subject = `Pedido de fresco - ${tienda || ''} (${fecha})`;
      const body = `
        <h1 style="color: #2c3e50; text-align: center;">Pedido de Productos Frescos</h1>
        <p style="font-size: 16px; color: #34495e;">Estimado proveedor,</p>
        <p style="font-size: 16px; color: #34495e;">Le remitimos el pedido de frescos para la tienda de carnicería correspondiente al <b>${fecha}</b>.</p>
        <ul style="font-size: 16px; color: #34495e;">
          ${lineas.map(l => `<li>${l.referencia}: ${l.cantidad} unidades</li>`).join('')}
        </ul>
        <p style="font-size: 16px; color: #34495e;">Gracias por su colaboración.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="cid:pedido.pdf" download="pedido_proveedor_${tienda || 'tienda'}.pdf" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px;">Descargar PDF</a>
        </div>
      `;

      const auth = await authorize();
      const response = await sendEmail(auth, proveedorEmail, subject, body);

      res.status(200).json({ ok: true, response });
    } catch (err) {
      console.error('Error enviando email:', err);
      res.status(500).json({ error: 'Error enviando email', details: err.message });
    }
  });

  app.post('/api/enviar-proveedor-test', async (req, res) => {
    try {
      const { tienda, fecha, lineas } = req.body;
      const proveedorEmail = 'fabricaembutidosballesteros@gmail.com'; // Forzar remitente para el botón rojo
      const subject = `Prueba de Pedido de fresco - ${tienda || ''} (${fecha})`;
      const body = `
        <h1 style="color: #2c3e50; text-align: center;">Prueba de Pedido de Productos Frescos</h1>
        <p style="font-size: 16px; color: #34495e;">Estimado proveedor,</p>
        <p style="font-size: 16px; color: #34495e;">Este es un correo de prueba para verificar el flujo de envío de correos electrónicos.</p>
        <p style="font-size: 16px; color: #34495e;">Le remitimos el pedido de frescos para la tienda de carnicería correspondiente al <b>${fecha}</b>.</p>
        <ul style="font-size: 16px; color: #34495e;">
          ${lineas.map(l => `<li>${l.referencia}: ${l.cantidad} unidades</li>`).join('')}
        </ul>
        <p style="font-size: 16px; color: #34495e;">Gracias por su colaboración.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="cid:pedido.pdf" download="pedido_proveedor_${tienda || 'tienda'}.pdf" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px;">Descargar PDF</a>
        </div>
      `;

      const auth = await authorize();
      const response = await sendEmail(auth, proveedorEmail, subject, body);

      res.status(200).json({ ok: true, response });
    } catch (err) {
      console.error('Error enviando email de prueba:', err);
      res.status(500).json({ error: 'Error enviando email de prueba', details: err.message });
    }
  });

  app.post('/api/enviar-proveedor-gmail', async (req, res) => {
    try {
      const { tienda, fecha, lineas } = req.body;
      const proveedorEmail = 'fabricaembutidosballesteros@gmail.com'; // Configurar remitente fijo
      const subject = `Pedido de fresco - ${tienda || ''} (${fecha})`;
      const body = `
        <h1 style="color: #2c3e50; text-align: center;">Pedido de Productos Frescos</h1>
        <p style="font-size: 16px; color: #34495e;">Estimado proveedor,</p>
        <p style="font-size: 16px; color: #34495e;">Le remitimos el pedido de frescos para la tienda de carnicería correspondiente al <b>${fecha}</b>.</p>
        <ul style="font-size: 16px; color: #34495e;">
          ${lineas.map(l => `<li>${l.referencia}: ${l.cantidad} unidades</li>`).join('')}
        </ul>
        <p style="font-size: 16px; color: #34495e;">Gracias por su colaboración.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="cid:pedido.pdf" download="pedido_proveedor_${tienda || 'tienda'}.pdf" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px;">Descargar PDF</a>
        </div>
      `;

      const auth = await authorize();
      const response = await sendEmail(auth, proveedorEmail, subject, body);

      res.status(200).json({ ok: true, response });
    } catch (err) {
      console.error('Error enviando email con Gmail:', err);
      res.status(500).json({ error: 'Error enviando email con Gmail', details: err.message });
    }
  });

  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, message } = req.body; // Recibir datos del formulario desde el frontend

      const auth = await authorize(); // Autorizar con Gmail
      const response = await sendMail(auth, { to, subject, message }); // Enviar correo

      res.status(200).json({ success: true, response }); // Responder al frontend con éxito
    } catch (error) {
      console.error('Error enviando correo:', error);
      res.status(500).json({ success: false, error: error.message }); // Responder con error
    }
  });

  app.post('/api/test-gmail', async (req, res) => {
    try {
      const testEmail = {
        to: 'destinatario@ejemplo.com', // Cambiar por un correo válido para pruebas
        subject: 'Prueba de Gmail API',
        message: '<h1>Prueba Exitosa</h1><p>Este es un correo de prueba enviado desde la API de Gmail.</p>'
      };

      const auth = await authorize(); // Autorizar con Gmail
      const response = await sendMail(auth, testEmail); // Enviar correo de prueba

      res.status(200).json({ success: true, response }); // Responder con éxito
    } catch (error) {
      console.error('Error enviando correo de prueba:', error);
      res.status(500).json({ success: false, error: error.message }); // Responder con error
    }
  });
};
