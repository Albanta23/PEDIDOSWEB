// Endpoint simplificado para pruebas de envío de email sin PDF adjunto
const mailgun = require('mailgun-js');

module.exports = function(app) {
  app.post('/api/enviar-proveedor-test', async (req, res) => {
    try {
      const { tienda, proveedor, productos, fechaPedido, observaciones } = req.body;
      const proveedorEmail = proveedor?.email || process.env.PROVEEDOR_EMAIL || 'javier.cantoral.fernandez@gmail.com';
      
      console.log('[MAILGUN TEST] Datos recibidos:', {
        tienda,
        proveedorEmail,
        productosCount: productos?.length,
        fechaPedido
      });

      // Configurar Mailgun con sandbox
      const mg = mailgun({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_SANDBOX_DOMAIN
      });

      console.log('[MAILGUN TEST] Configuración:', {
        domain: process.env.MAILGUN_SANDBOX_DOMAIN,
        hasApiKey: !!process.env.MAILGUN_API_KEY
      });

      // Generar contenido del email
      const productosTexto = productos.map(p => 
        `${p.nombre}: ${p.cantidad} unidades (${p.peso || 'N/A'}) - €${p.precio || 'N/A'}`
      ).join('\n');

      const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad || 0), 0);

      // Preparar el email
      const emailData = {
        from: process.env.MAILGUN_FROM || 'Pedidos Carnicería <mailgun@' + process.env.MAILGUN_SANDBOX_DOMAIN + '>',
        to: proveedorEmail,
        subject: `🥩 Pedido de Carnicería - ${tienda} (${new Date(fechaPedido).toLocaleDateString()})`,
        text: `
PEDIDO DE CARNICERÍA
=====================

Tienda: ${tienda}
Fecha del pedido: ${new Date(fechaPedido).toLocaleDateString()}
Email de contacto: ${proveedorEmail}

PRODUCTOS SOLICITADOS:
${productosTexto}

TOTAL ESTIMADO: €${total.toFixed(2)}

OBSERVACIONES:
${observaciones || 'Ninguna'}

---
Este es un email de prueba generado automáticamente para validar el flujo de envío de pedidos.
Carnicería - Sistema de Gestión de Pedidos
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
      🥩 Pedido de Carnicería
    </h1>
    
    <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h3 style="color: #34495e; margin-top: 0;">Información del Pedido</h3>
      <p><strong>Tienda:</strong> ${tienda}</p>
      <p><strong>Fecha:</strong> ${new Date(fechaPedido).toLocaleDateString()}</p>
      <p><strong>Email de contacto:</strong> ${proveedorEmail}</p>
    </div>
    
    <h3 style="color: #34495e;">Productos Solicitados</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #3498db; color: white;">
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Producto</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Cantidad</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Peso</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${productos.map(p => `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${p.nombre}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${p.cantidad}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${p.peso || 'N/A'}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">€${p.precio || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h4 style="color: #27ae60; margin-top: 0;">Total Estimado: €${total.toFixed(2)}</h4>
    </div>
    
    ${observaciones ? `
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h4 style="color: #856404; margin-top: 0;">Observaciones:</h4>
      <p style="margin-bottom: 0;">${observaciones}</p>
    </div>
    ` : ''}
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
      Este es un email de prueba generado automáticamente para validar el flujo de envío de pedidos.<br>
      <strong>Carnicería - Sistema de Gestión de Pedidos</strong>
    </p>
    
  </div>
</div>
        `
      };

      console.log('[MAILGUN TEST] Enviando email con datos:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        productosCount: productos.length
      });

      // Enviar el email
      const result = await new Promise((resolve, reject) => {
        mg.messages().send(emailData, (error, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      });

      console.log('[MAILGUN TEST] Email enviado exitosamente:', result);
      
      res.status(200).json({ 
        ok: true, 
        message: 'Email de prueba enviado correctamente',
        messageId: result.id,
        destinatario: proveedorEmail,
        productos: productos.length,
        total: total.toFixed(2)
      });
      
    } catch (err) {
      console.error('[MAILGUN TEST] Error enviando email de prueba:', err);
      res.status(500).json({ 
        error: 'Error enviando email de prueba: ' + err.message,
        detalles: err.toString()
      });
    }
  });
};
