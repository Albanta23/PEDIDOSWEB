// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando Mailgun Sandbox
const mailgun = require('mailgun-js');

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      
      console.log('[MAILGUN] Datos recibidos:', {
        tienda,
        fecha,
        lineasCount: lineas?.length,
        pdfBase64Type: typeof pdfBase64,
        pdfBase64Length: pdfBase64?.length,
        pdfBase64IsNull: pdfBase64 === null,
        pdfBase64IsUndefined: pdfBase64 === undefined
      });

      // Validación inicial más estricta
      if (!pdfBase64) {
        console.error('[MAILGUN] Error: pdfBase64 es null o undefined');
        return res.status(400).json({ error: 'PDF base64 no proporcionado' });
      }

      // Limpiar prefijo si viene con data:application/pdf;base64,
      let pdfData = pdfBase64;
      if (typeof pdfData === 'string' && pdfData.startsWith('data:')) {
        console.log('[MAILGUN] Limpiando prefijo data:application/pdf;base64,');
        const base64Match = pdfData.match(/^data:application\/pdf;base64,(.+)$/);
        if (base64Match) {
          pdfData = base64Match[1];
          console.log('[MAILGUN] Prefijo eliminado. Nueva longitud:', pdfData.length);
        }
      }

      // Forzar a string y limpiar espacios
      if (pdfData && typeof pdfData !== 'string') {
        console.log('[MAILGUN] Convirtiendo pdfData a string');
        pdfData = String(pdfData);
      }
      
      // Limpiar espacios en blanco
      if (pdfData) {
        const originalLength = pdfData.length;
        pdfData = pdfData.replace(/\s/g, '');
        console.log('[MAILGUN] Espacios eliminados. Longitud original:', originalLength, 'Nueva longitud:', pdfData.length);
      }

      // Validación final más estricta
      if (!pdfData || typeof pdfData !== 'string') {
        console.error('[MAILGUN] Error: pdfData no es un string válido después del procesamiento:', typeof pdfData);
        return res.status(400).json({ error: 'PDF base64 no es un string válido' });
      }

      if (pdfData.length < 100) {
        console.error('[MAILGUN] Error: pdfData es demasiado pequeño:', pdfData.length, 'caracteres');
        return res.status(400).json({ error: 'PDF base64 demasiado pequeño' });
      }

      // Validar que es base64 válido
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(pdfData)) {
        console.error('[MAILGUN] Error: pdfData no parece ser base64 válido. Primeros 100 chars:', pdfData.substring(0, 100));
        return res.status(400).json({ error: 'PDF base64 no tiene formato válido' });
      }

      console.log('[MAILGUN] PDF validado correctamente:', {
        type: typeof pdfData,
        length: pdfData.length,
        startsWithValidBase64: /^[A-Za-z0-9]/.test(pdfData),
        endsWithValidBase64: /[A-Za-z0-9=]$/.test(pdfData),
        preview: pdfData.substring(0, 50) + '...'
      });

      // Configurar Mailgun con sandbox
      const mg = mailgun({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_SANDBOX_DOMAIN // Usar dominio sandbox
      });

      console.log('[MAILGUN] Configuración:', {
        domain: process.env.MAILGUN_SANDBOX_DOMAIN,
        hasApiKey: !!process.env.MAILGUN_API_KEY
      });

      // Crear el buffer del PDF desde base64
      const pdfBuffer = Buffer.from(pdfData, 'base64');
      
      console.log('[MAILGUN] Buffer del PDF creado:', {
        bufferLength: pdfBuffer.length,
        bufferType: typeof pdfBuffer
      });

      // Preparar el email
      const emailData = {
        from: process.env.MAILGUN_FROM || 'Pedidos Carnicería <mailgun@' + process.env.MAILGUN_SANDBOX_DOMAIN + '>',
        to: proveedorEmail,
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        html: `<p>Adjunto pedido de fresco para proveedor.</p><p><b>Tienda:</b> ${tienda}<br/><b>Fecha:</b> ${fecha}</p><pre>${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('<br/>')}</pre>`,
        attachment: [
          {
            data: pdfBuffer,
            filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log('[MAILGUN] Enviando email con datos:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        attachmentCount: emailData.attachment.length,
        attachmentSize: pdfBuffer.length
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

      console.log('[MAILGUN] Email enviado exitosamente:', result);
      console.log('[MAILGUN] Email enviado a:', proveedorEmail);
      
      res.status(200).json({ 
        ok: true, 
        message: 'Email enviado correctamente',
        messageId: result.id 
      });
      
    } catch (err) {
      console.error('[MAILGUN] Error enviando email al proveedor:', err);
      res.status(500).json({ error: 'Error enviando email al proveedor: ' + err.message });
    }
  });
};
