// Nuevo endpoint para enviar pedidos a proveedor - Versión mejorada que funciona
const mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');
const HistorialProveedor = require('./models/HistorialProveedor'); // Usar modelo global

const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

module.exports = function(app) {
  app.post('/api/enviar-proveedor-v2', async (req, res) => {
    try {
      console.log('[PROVEEDOR-V2] === INICIO ENDPOINT V2 ===');
      console.log('[PROVEEDOR-V2] Body recibido:', JSON.stringify(req.body, null, 2));
      
      const { tienda, fecha, lineas, tiendaId, pdfBase64, forzarTextoPlano } = req.body;
      
      // Configuración de emails
      const proveedorEmail = process.env.PROVEEDOR_EMAIL || 'proveedor@ejemplo.com';
      const ccEmail = process.env.MAILJET_COPIA_EMAIL;
      const fromEmail = process.env.MAILJET_FROM_EMAIL || 'notificaciones@tudominio.com';
      const fromName = process.env.MAILJET_FROM_NAME || 'Pedidos Carnicería';
      
      // Imprimir en consola el email del proveedor SOLO en entorno local
      console.log('[PROVEEDOR-V2] Email proveedor:', proveedorEmail);
      
      const toList = [{ Email: proveedorEmail, Name: 'Proveedor' }];
      const ccList = ccEmail ? [{ Email: ccEmail, Name: 'Copia' }] : [];
      
      console.log('[PROVEEDOR-V2] Configuración email:', {
        to: proveedorEmail,
        cc: ccEmail || 'ninguno',
        from: fromEmail
      });
      
      // Procesar forzarTextoPlano como booleano estricto
      const usarTextoPlano = forzarTextoPlano === true || forzarTextoPlano === 'true' || 
                            forzarTextoPlano === 1 || forzarTextoPlano === '1';
      
      console.log('[PROVEEDOR-V2] forzarTextoPlano:', forzarTextoPlano, '-> usarTextoPlano:', usarTextoPlano);
      
      // Seleccionar plantilla según el flag
      let plantillaPath, contenido;
      if (usarTextoPlano) {
        plantillaPath = path.join(__dirname, '../../public/PLANTILLA_TEXTO_PLANO.txt');
        console.log('[PROVEEDOR-V2] Usando plantilla de TEXTO PLANO:', plantillaPath);
      } else {
        plantillaPath = path.join(__dirname, '../../public/PLANTILLA.html');
        console.log('[PROVEEDOR-V2] Usando plantilla HTML:', plantillaPath);
      }
      
      // Verificar que la plantilla existe
      if (!fs.existsSync(plantillaPath)) {
        throw new Error(`Plantilla no encontrada: ${plantillaPath}`);
      }
      
      contenido = fs.readFileSync(plantillaPath, 'utf8');
      console.log('[PROVEEDOR-V2] Plantilla cargada, longitud:', contenido.length);
      console.log('[PROVEEDOR-V2] Primeros 100 chars:', contenido.substring(0, 100));
      
      // Reemplazar variables en la plantilla
      if (usarTextoPlano) {
        // Para texto plano: formato simple
        const listaLineas = (lineas || []).map(l => 
          `- ${l.referencia || ''}: ${l.cantidad || ''} ${l.unidad || 'kg'}`
        ).join('\n');
        
        contenido = contenido.replace(/\$\{fecha\}/g, fecha || new Date().toLocaleDateString());
        contenido = contenido.replace(/\$\{tienda\}/g, tienda || 'Sin especificar');
        contenido = contenido.replace(/\$\{tabla\}/g, listaLineas);
      } else {
        // Para HTML: formato tabla
        const filasTabla = (lineas || []).map(l => `
          <tr>
            <td>${l.referencia || ''}</td>
            <td>${l.cantidad || ''}</td>
            <td>${l.unidad || 'kg'}</td>
          </tr>
        `).join('');
        
        contenido = contenido.replace(/\$\{fecha\}/g, fecha || new Date().toLocaleDateString());
        contenido = contenido.replace(/\$\{tienda\}/g, tienda || 'Sin especificar');
        contenido = contenido.replace(/\$\{tabla\}/g, filasTabla);
      }
      
      console.log('[PROVEEDOR-V2] Contenido procesado, longitud final:', contenido.length);
      
      // Procesar PDF adjunto SOLO para el email, nunca guardar en DB
      let pdfBuffer = null;
      if (pdfBase64) {
        console.log('[PROVEEDOR-V2] PDF recibido, longitud base64:', pdfBase64.length);
        
        // Limpiar prefijo si existe
        let base64Clean = pdfBase64;
        if (base64Clean.startsWith('data:')) {
          base64Clean = base64Clean.substring(base64Clean.indexOf(',') + 1);
        }
        
        try {
          pdfBuffer = Buffer.from(base64Clean, 'base64');
          console.log('[PROVEEDOR-V2] PDF procesado correctamente, tamaño buffer:', pdfBuffer.length);
        } catch (e) {
          console.error('[PROVEEDOR-V2] Error procesando PDF:', e.message);
          pdfBuffer = null;
        }
      } else {
        console.log('[PROVEEDOR-V2] No se recibió PDF en la petición');
      }
      
      // Preparar adjuntos
      const attachments = pdfBuffer ? [{
        ContentType: 'application/pdf',
        Filename: `pedido_${tienda}_${fecha || Date.now()}.pdf`,
        Base64Content: pdfBuffer.toString('base64')
      }] : [];
      
      console.log('[PROVEEDOR-V2] Adjuntos preparados:', attachments.length);
      
      // Configurar el mensaje de Mailjet
      const mailjetData = {
        Messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: toList,
            Cc: ccList,
            Subject: `Pedido de frescos - ${tienda || 'Sin tienda'}`,
            // Usar TextPart o HTMLPart según el tipo
            ...(usarTextoPlano ? { TextPart: contenido } : { HTMLPart: contenido }),
            Attachments: attachments
          }
        ]
      };
      
      console.log('[PROVEEDOR-V2] Mensaje Mailjet configurado:', {
        to: toList.length,
        cc: ccList.length,
        subject: mailjetData.Messages[0].Subject,
        tipoContenido: usarTextoPlano ? 'TextPart' : 'HTMLPart',
        adjuntos: attachments.length,
        longitud: usarTextoPlano ? mailjetData.Messages[0].TextPart?.length : mailjetData.Messages[0].HTMLPart?.length
      });
      
      // Enviar email
      console.log('[PROVEEDOR-V2] Enviando email...');
      const request = mailjetClient.post('send', { version: 'v3.1' }).request(mailjetData);
      const result = await request;
      
      console.log('[PROVEEDOR-V2] Email enviado exitosamente:', result.body?.Messages?.[0]?.Status);
      
      // Guardar en historial individual por tienda (sin PDF, sin global)
      try {
        if (tiendaId && lineas && Array.isArray(lineas)) {
          await HistorialProveedor.create({
            tiendaId: tiendaId, // Guardar por tienda real
            tiendaOriginal: tiendaId, // Para referencia
            proveedor: 'proveedor-fresco',
            pedido: { lineas, fecha: fecha || new Date(), tienda: 'PEDIDOS CLIENTES' },
            fechaEnvio: new Date()
            // No se guarda pdfBase64 ni se guarda en global
          });
          console.log('[PROVEEDOR-V2] Guardado en historial de tienda correctamente (PEDIDOS CLIENTES)');
        }
      } catch (histErr) {
        console.error('[PROVEEDOR-V2] Error guardando historial por tienda:', histErr.message);
      }
      
      console.log('[PROVEEDOR-V2] === FIN ENDPOINT V2 - ÉXITO ===');
      res.json({ 
        ok: true, 
        message: 'Email enviado correctamente al proveedor (V2)',
        debug: {
          usarTextoPlano,
          adjuntos: attachments.length,
          tienda,
          lineas: lineas?.length || 0
        }
      });
      
    } catch (err) {
      console.error('[PROVEEDOR-V2] ERROR:', err.message);
      console.error('[PROVEEDOR-V2] Stack:', err.stack);
      
      let errorMsg = 'Error desconocido en endpoint V2';
      if (err && err.message) errorMsg = err.message;
      if (err && err.response && err.response.body) {
        errorMsg += ' | Mailjet: ' + JSON.stringify(err.response.body);
      }
      
      res.status(500).json({ 
        ok: false, 
        error: errorMsg,
        endpoint: 'v2'
      });
    }
  });
  
  // Endpoint SOLO para pruebas: guardar pedido de fresco en historial sin enviar email
  app.post('/api/guardar-proveedor-v2', async (req, res) => {
    try {
      console.log('[GUARDAR-PROVEEDOR-V2] === INICIO ENDPOINT SOLO GUARDADO ===');
      console.log('[GUARDAR-PROVEEDOR-V2] Body recibido:', JSON.stringify(req.body, null, 2));
      const { fecha, lineas, tiendaId } = req.body;
      const tienda = 'pedidos clientes'; // Forzar tienda a "pedidos clientes"
      if (tiendaId && lineas && Array.isArray(lineas)) {
        await HistorialProveedor.create({
          tiendaId: tiendaId, // Guardar por tienda real
          tiendaOriginal: tiendaId, // Para referencia
          proveedor: 'proveedor-fresco',
          pedido: { lineas, fecha: fecha || new Date(), tienda },
          fechaEnvio: new Date()
        });
        console.log('[GUARDAR-PROVEEDOR-V2] Guardado en historial de tienda correctamente');
        res.json({ ok: true, message: 'Pedido guardado en historial de proveedor (sin email)' });
      } else {
        res.status(400).json({ ok: false, error: 'Faltan datos requeridos (tiendaId, lineas)' });
      }
      console.log('[GUARDAR-PROVEEDOR-V2] === FIN ENDPOINT SOLO GUARDADO ===');
    } catch (err) {
      console.error('[GUARDAR-PROVEEDOR-V2] ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message, endpoint: 'guardar-proveedor-v2' });
    }
  });
};
