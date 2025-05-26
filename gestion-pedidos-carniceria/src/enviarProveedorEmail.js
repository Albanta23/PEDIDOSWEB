// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

// Endpoint para enviar la lista de proveedor por email con PDF adjunto
const { authorize, sendEmail } = require('./gmailService');

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const subject = `Pedido de fresco - ${tienda || ''} (${fecha})`;
      const body = `
        <h1>Pedido de Productos Frescos</h1>
        <p>Estimado proveedor,</p>
        <p>Le remitimos el pedido de frescos para la tienda de carnicería correspondiente al <b>${fecha}</b>.</p>
        <ul>
          ${lineas.map(l => `<li>${l.referencia}: ${l.cantidad} unidades</li>`).join('')}
        </ul>
        <p>Gracias por su colaboración.</p>
      `;

      const auth = await authorize();
      const response = await sendEmail(auth, proveedorEmail, subject, body);

      res.status(200).json({ ok: true, response });
    } catch (err) {
      console.error('Error enviando email:', err);
      res.status(500).json({ error: 'Error enviando email', details: err.message });
    }
  });
};
