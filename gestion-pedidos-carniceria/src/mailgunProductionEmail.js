// Endpoint mejorado para envío de emails con mejores prácticas anti-spam
const mailgun = require('mailgun-js');

module.exports = function(app) {
  app.post('/api/enviar-proveedor-production', async (req, res) => {
    try {
      const { tienda, proveedor, productos, fechaPedido, observaciones } = req.body;
      const proveedorEmail = proveedor?.email || process.env.PROVEEDOR_EMAIL || 'javier.cantoral.fernandez@gmail.com';
      
      console.log('[MAILGUN PROD] Datos recibidos:', {
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

      // Generar contenido del email con mejores prácticas anti-spam
      const productosTexto = productos.map(p => 
        `${p.nombre}: ${p.cantidad} unidades (${p.peso || 'N/A'}) - €${p.precio || 'N/A'}`
      ).join('\n');

      const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad || 0), 0);
      const fechaFormateada = new Date(fechaPedido).toLocaleDateString('es-ES');

      // Email con mejores prácticas anti-spam
      const emailData = {
        from: `Carniceria Ballesteros <${process.env.MAILGUN_FROM}>`,
        to: proveedorEmail,
        subject: `Pedido ${fechaFormateada} - ${tienda}`, // Asunto más profesional
        text: `
PEDIDO DE PRODUCTOS CARNICOS

Tienda: ${tienda}
Fecha: ${fechaFormateada}
Contacto: ${proveedorEmail}

PRODUCTOS:
${productosTexto}

TOTAL: ${total.toFixed(2)} EUR

OBSERVACIONES:
${observaciones || 'Ninguna'}

Saludos cordiales,
Carniceria Ballesteros
        `,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido Carnicería</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #f4f4f4;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #2c3e50; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Carnicería Ballesteros</h1>
                            <p style="color: #ecf0f1; margin: 10px 0 0 0; font-size: 14px;">Pedido de Productos Cárnicos</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            
                            <!-- Pedido Info -->
                            <table role="presentation" style="width: 100%; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px; background-color: #ecf0f1; border-radius: 5px;">
                                        <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Información del Pedido</h3>
                                        <p style="margin: 5px 0; color: #34495e;"><strong>Tienda:</strong> ${tienda}</p>
                                        <p style="margin: 5px 0; color: #34495e;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                                        <p style="margin: 5px 0; color: #34495e;"><strong>Referencia:</strong> PED-${Date.now().toString().slice(-6)}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Productos -->
                            <h3 style="color: #2c3e50; margin-bottom: 15px;">Productos Solicitados</h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                <thead>
                                    <tr style="background-color: #3498db;">
                                        <th style="padding: 12px; text-align: left; color: #ffffff; border: 1px solid #2980b9;">Producto</th>
                                        <th style="padding: 12px; text-align: center; color: #ffffff; border: 1px solid #2980b9;">Cantidad</th>
                                        <th style="padding: 12px; text-align: center; color: #ffffff; border: 1px solid #2980b9;">Peso</th>
                                        <th style="padding: 12px; text-align: right; color: #ffffff; border: 1px solid #2980b9;">Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productos.map((p, index) => `
                                    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                                        <td style="padding: 10px; border: 1px solid #ddd; color: #2c3e50;">${p.nombre}</td>
                                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #2c3e50;">${p.cantidad}</td>
                                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #2c3e50;">${p.peso || 'N/A'}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd; color: #2c3e50;">€${(p.precio || 0).toFixed(2)}</td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            
                            <!-- Total -->
                            <table role="presentation" style="width: 100%; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px; background-color: #e8f5e8; border-radius: 5px; text-align: right;">
                                        <h3 style="color: #27ae60; margin: 0;">Total Estimado: €${total.toFixed(2)}</h3>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Observaciones -->
                            ${observaciones ? `
                            <table role="presentation" style="width: 100%; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                                        <h4 style="color: #856404; margin: 0 0 10px 0;">Observaciones:</h4>
                                        <p style="margin: 0; color: #856404;">${observaciones}</p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #ecf0f1; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
                                Carnicería Ballesteros - Sistema de Gestión de Pedidos<br>
                                Para consultas, responda a este email o contacte directamente con su tienda.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        // Headers anti-spam
        'h:List-Unsubscribe': '<mailto:no-reply@carniceriaballesteros.com>',
        'h:X-Campaign-Id': 'pedidos-proveedor',
        'h:Reply-To': proveedorEmail
      };

      console.log('[MAILGUN PROD] Enviando email profesional:', {
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

      console.log('[MAILGUN PROD] Email enviado exitosamente:', result);
      
      res.status(200).json({ 
        ok: true, 
        message: 'Email profesional enviado correctamente',
        messageId: result.id,
        destinatario: proveedorEmail,
        productos: productos.length,
        total: total.toFixed(2),
        referencias: `PED-${Date.now().toString().slice(-6)}`
      });
      
    } catch (err) {
      console.error('[MAILGUN PROD] Error enviando email profesional:', err);
      res.status(500).json({ 
        error: 'Error enviando email profesional: ' + err.message,
        detalles: err.toString()
      });
    }
  });
};
