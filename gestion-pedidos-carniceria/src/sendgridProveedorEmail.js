// Endpoint para enviar la lista de proveedor por email con PDF adjunto usando SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = function(app) {
  app.post('/api/enviar-proveedor', async (req, res) => {
    try {
      const { tienda, fecha, lineas, pdfBase64 } = req.body;
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      
      console.log('[SENDGRID] Datos recibidos:', {
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
        console.error('[SENDGRID] Error: pdfBase64 es null o undefined');
        return res.status(400).json({ error: 'PDF base64 no proporcionado' });
      }

      // Limpiar prefijo si viene con data:application/pdf;base64,
      let pdfData = pdfBase64;
      if (typeof pdfData === 'string' && pdfData.startsWith('data:')) {
        console.log('[SENDGRID] Limpiando prefijo data:application/pdf;base64,');
        const base64Match = pdfData.match(/^data:application\/pdf;base64,(.+)$/);
        if (base64Match) {
          pdfData = base64Match[1];
          console.log('[SENDGRID] Prefijo eliminado. Nueva longitud:', pdfData.length);
        }
      }

      // Forzar a string y limpiar espacios
      if (pdfData && typeof pdfData !== 'string') {
        console.log('[SENDGRID] Convirtiendo pdfData a string');
        pdfData = String(pdfData);
      }
      
      // Limpiar espacios en blanco
      if (pdfData) {
        const originalLength = pdfData.length;
        pdfData = pdfData.replace(/\s/g, '');
        console.log('[SENDGRID] Espacios eliminados. Longitud original:', originalLength, 'Nueva longitud:', pdfData.length);
      }

      // Validación final más estricta
      if (!pdfData || typeof pdfData !== 'string') {
        console.error('[SENDGRID] Error: pdfData no es un string válido después del procesamiento:', typeof pdfData);
        return res.status(400).json({ error: 'PDF base64 no es un string válido' });
      }

      if (pdfData.length < 100) {
        console.error('[SENDGRID] Error: pdfData es demasiado pequeño:', pdfData.length, 'caracteres');
        return res.status(400).json({ error: 'PDF base64 demasiado pequeño' });
      }

      // Validar que es base64 válido
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(pdfData)) {
        console.error('[SENDGRID] Error: pdfData no parece ser base64 válido. Primeros 100 chars:', pdfData.substring(0, 100));
        return res.status(400).json({ error: 'PDF base64 no tiene formato válido' });
      }

      console.log('[SENDGRID] PDF validado correctamente:', {
        type: typeof pdfData,
        length: pdfData.length,
        startsWithValidBase64: /^[A-Za-z0-9]/.test(pdfData),
        endsWithValidBase64: /[A-Za-z0-9=]$/.test(pdfData),
        preview: pdfData.substring(0, 50) + '...'
      });
      // Crear el objeto adjunto
      const attachment = {
        content: pdfData,
        filename: `pedido_proveedor_${tienda || 'tienda'}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      };

      // Validación final del adjunto antes de enviar
      console.log('[SENDGRID] Validando adjunto final:', {
        contentType: typeof attachment.content,
        contentLength: attachment.content?.length,
        filename: attachment.filename,
        type: attachment.type,
        contentIsString: typeof attachment.content === 'string',
        contentIsNotEmpty: attachment.content && attachment.content.length > 0
      });

      // Verificación adicional para asegurar que el content es un string válido
      if (typeof attachment.content !== 'string' || !attachment.content || attachment.content.length === 0) {
        console.error('[SENDGRID] Error: El campo content del adjunto no es válido:', {
          type: typeof attachment.content,
          value: attachment.content,
          length: attachment.content?.length
        });
        return res.status(400).json({ error: 'Error: campo content del adjunto no válido' });
      }

      const msg = {
        to: proveedorEmail,
        from: process.env.SENDGRID_FROM || 'Pedidos Carnicería <no-reply@tudominio.com>',
        subject: `Pedido de fresco - ${tienda || ''} (${fecha})`,
        text: `Adjunto pedido de fresco para proveedor.\n\nTienda: ${tienda}\nFecha: ${fecha}\n\nResumen:\n${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('\n')}`,
        html: `<p>Adjunto pedido de fresco para proveedor.</p><p><b>Tienda:</b> ${tienda}<br/><b>Fecha:</b> ${fecha}</p><pre>${lineas.map(l => `${l.referencia}: ${l.cantidad}`).join('<br/>')}</pre>`,
        attachments: [attachment]
      };

      console.log('[SENDGRID] Enviando mensaje con adjunto...');
      await sgMail.send(msg);
      console.log('[SENDGRID] Email enviado exitosamente a:', proveedorEmail);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error enviando email al proveedor (SendGrid):', err);
      res.status(500).json({ error: 'Error enviando email al proveedor' });
    }
  });
};
