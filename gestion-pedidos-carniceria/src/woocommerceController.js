const WooCommerce = require('./services/woocommerceService');
const PedidoCliente = require('./models/PedidoCliente');
const Cliente = require('./models/Cliente');
const ProductoWoo = require('./models/ProductoWoo');

module.exports = {
  async sincronizarPedidos(req, res) {
    try {
      // Parámetro opcional para forzar la sincronización de todos los pedidos
      const forzarSincronizacion = req.query.forzar === 'true';
      
      // Obtener los últimos pedidos sincronizados para actualizar su estado
      const pedidosSincronizados = await PedidoCliente.find({'origen.tipo': 'woocommerce'}).select('origen.id yaActualizado').lean();
      const idsYaSincronizados = new Set(
        pedidosSincronizados
          .filter(p => p.yaActualizado === true)
          .map(p => p.origen.id)
      );
      
      console.log(`[WooCommerce] ${idsYaSincronizados.size} pedidos ya están marcados como sincronizados`);
      
      // Obtener pedidos de WooCommerce
      const response = await WooCommerce.get('orders');
      const pedidosWoo = response.data;
      
      // Si no se fuerza la sincronización, filtrar los pedidos que ya están sincronizados
      const pedidosAActualizar = forzarSincronizacion 
        ? pedidosWoo 
        : pedidosWoo.filter(p => !idsYaSincronizados.has(p.id.toString()));
      
      console.log(`[WooCommerce] Encontrados ${pedidosWoo.length} pedidos en total, se procesarán ${pedidosAActualizar.length}`);
      
      const resultados = { 
        procesados: 0, 
        nuevos: 0, 
        existentes: 0, 
        clientesCreados: 0,
        omitidos: pedidosWoo.length - pedidosAActualizar.length
      };

      for (const pedidoWoo of pedidosAActualizar) {
        const existe = await PedidoCliente.findOne({ 'origen.id': pedidoWoo.id, 'origen.tipo': 'woocommerce' });
        if (!existe) {
          resultados.procesados++;
          
                    // Buscar cliente por múltiples criterios para mejorar la coincidencia
          let clienteExistente = null;
          let criteriosBusqueda = [];
          
          // Recopilamos todos los criterios posibles de búsqueda en un array
          if (pedidoWoo.billing.vat) {
            criteriosBusqueda.push({ nif: pedidoWoo.billing.vat });
          }
          
          if (pedidoWoo.billing.email) {
            criteriosBusqueda.push({ email: pedidoWoo.billing.email });
          }
          
          if (pedidoWoo.billing.phone) {
            criteriosBusqueda.push({ telefono: pedidoWoo.billing.phone });
          }
          
          const nombreCompleto = `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`;
          criteriosBusqueda.push({ nombre: nombreCompleto });
          
          // Buscar con $or para encontrar coincidencias con cualquiera de los criterios
          if (criteriosBusqueda.length > 0) {
            clienteExistente = await Cliente.findOne({ $or: criteriosBusqueda });
          }
          
          let clienteId = clienteExistente ? clienteExistente._id : null;
          let codigoCliente = clienteExistente ? clienteExistente.codigoCliente || null : null;
          
          // Si no existe el cliente, crear uno nuevo con número de cliente SAGE50
          if (!clienteExistente) {
            resultados.clientesCreados++;
            
            // Buscar el último código 430... en la base de datos
            const ultimoCliente430 = await Cliente.findOne({ codigoCliente: /^430/ }, {}, { sort: { codigoCliente: -1 } });
            let nuevoCodigo = '4300001';
            if (ultimoCliente430 && ultimoCliente430.codigoCliente) {
              nuevoCodigo = String(Number(ultimoCliente430.codigoCliente) + 1);
            }
            
            const nuevoCliente = new Cliente({
              nombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
              nif: pedidoWoo.billing.vat || '',
              direccion: `${pedidoWoo.billing.address_1}${pedidoWoo.billing.address_2 ? ', ' + pedidoWoo.billing.address_2 : ''}`,
              email: pedidoWoo.billing.email || '',
              telefono: pedidoWoo.billing.phone || '',
              codigoPostal: pedidoWoo.billing.postcode || '',
              poblacion: pedidoWoo.billing.city || '',
              provincia: pedidoWoo.billing.state || '',
              pais: pedidoWoo.billing.country || 'ES',
              codigoCliente: nuevoCodigo // Asignar código de cliente SAGE50
            });
            
            const clienteGuardado = await nuevoCliente.save();
            clienteId = clienteGuardado._id;
            codigoCliente = nuevoCodigo;
          }

          const ultimoPedido = await PedidoCliente.findOne({}, {}, { sort: { numeroPedido: -1 } });
          const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
          
          // Procesar líneas de pedido con información mejorada
          const lineasProcesadas = await Promise.all(pedidoWoo.line_items.map(async item => {
            // Buscar el producto en la DB por nombre o idWoo
            const productoDb = await ProductoWoo.findOne({ $or: [{ nombre: item.name }, { idWoo: item.product_id }] });
            
            // --- INICIO DE LÓGICA MEJORADA PARA LÍNEAS DE PEDIDO ---

            let formato = productoDb?.formatoEstandar || 'Unidad'; // Valor por defecto
            let pesoMedio = null;

            // 1. Lógica para el IVA: Priorizar el IVA real de la transacción para máxima precisión.
            let tipoIva = 10; // IVA por defecto si no se puede calcular.
            const totalTax = parseFloat(item.total_tax);
            const lineTotal = parseFloat(item.total); // 'total' es el total de la línea (precio * cantidad) después de descuentos.

            if (!isNaN(totalTax) && !isNaN(lineTotal) && lineTotal > 0) {
              // Calculamos la tasa de IVA efectiva para esta línea específica.
              // Esto es lo más preciso, ya que refleja el impuesto exacto cobrado al cliente en esa compra.
              const calculatedRate = (totalTax / lineTotal) * 100;
              tipoIva = Math.round(calculatedRate); // Redondear al entero más cercano (ej. 20.99 -> 21)
            } else if (productoDb?.tipoIva) {
              // Si no se pudo calcular (ej. pedidos gratuitos), usamos el IVA del producto en nuestra BD.
              tipoIva = productoDb.tipoIva;
            }

            // 2. Lógica para formato y comentarios desde meta_data
            let comentariosLinea = [];
            let formatoYaEnComentarios = false;
            if (item.meta_data && Array.isArray(item.meta_data)) {
              for (const meta of item.meta_data) {
                // Extraer peso medio si existe
                if (meta.key && meta.key.toLowerCase().includes('peso')) pesoMedio = meta.value;

                // Si es un metadato visible, procesarlo
                if (meta.display_key && meta.display_value) {
                  // Si es el formato principal (Peso o Formato), actualizar el campo 'formato'
                  if (['peso', 'formato'].includes(meta.display_key.toLowerCase())) {
                    formato = meta.display_value;
                    formatoYaEnComentarios = true;
                  }
                  // Añadir SIEMPRE el metadato visible a los comentarios para máxima información
                  comentariosLinea.push(`${meta.display_key}: ${meta.display_value}`);
                }
              }
            }

            // Asegurarse de que el formato (ya sea de metadatos o por defecto) esté en el comentario
            if (!formatoYaEnComentarios && formato) {
              comentariosLinea.unshift(`Formato: ${formato}`);
            }
            
            return {
              producto: item.name,
              cantidad: item.quantity,
              precio: item.price, // Usar el precio exacto de la línea del pedido de WooCommerce.
              iva: tipoIva,
              comentario: comentariosLinea.join('; '), // Comentarios generados desde meta_data.
              tipoProducto: item.variation_id ? 'variable' : 'simple',
              variaciones: item.meta_data,
              idWoo: item.product_id,
              formato: formato, // El formato extraído de los metadatos o el default.
              pesoMedio,
              productoWoo: productoDb ? {
                sku: productoDb.sku,
                descripcion: productoDb.descripcion,
                descripcionCorta: productoDb.descripcionCorta,
                categorias: productoDb.categorias,
                imagenes: productoDb.imagenes,
                tags: productoDb.tags,
                stock_status: productoDb.stock_status,
                meta_data: productoDb.meta_data,
                dimensiones: productoDb.dimensiones,
                price_html: productoDb.price_html,
                related_ids: productoDb.related_ids,
                brands: productoDb.brands,
                translations: productoDb.translations,
                idWoo: productoDb.idWoo,
                nombre: productoDb.nombre,
                tipo: productoDb.tipo,
                precio: productoDb.precio,
                peso: productoDb.peso,
                atributos: productoDb.atributos,
                tipoIva: productoDb.tipoIva,
                formatoEstandar: productoDb.formatoEstandar,
                pesoUnidad: productoDb.pesoUnidad,
                requierePeso: productoDb.requierePeso,
                codigoSage: productoDb.codigoSage
              } : null
            };
          }));
          
          const nuevoPedido = new PedidoCliente({
            clienteId,
            codigoCliente, // Guardar el código de cliente para SAGE50
            numeroPedido: siguienteNumero, // El número generado por la aplicación
            numeroPedidoWoo: pedidoWoo.id, // Guardar el número de WooCommerce como referencia
            fechaPedido: pedidoWoo.date_created,
            estado: 'borrador_woocommerce',
            clienteNombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
            nif: pedidoWoo.billing.vat || '',
            direccion: `${pedidoWoo.billing.address_1}${pedidoWoo.billing.address_2 ? ', ' + pedidoWoo.billing.address_2 : ''}`,
            codigoPostal: pedidoWoo.billing.postcode || '',
            poblacion: pedidoWoo.billing.city || '',
            provincia: pedidoWoo.billing.state || '',
            pais: pedidoWoo.billing.country || 'ES',
            email: pedidoWoo.billing.email || '',
            telefono: pedidoWoo.billing.phone || '',
            lineas: lineasProcesadas,
            origen: {
              tipo: 'woocommerce',
              id: pedidoWoo.id
            },
            yaActualizado: true, // Marcar el pedido como ya sincronizado para evitar futuros procesamientos
            notasCliente: pedidoWoo.customer_note || '',
            subtotal: pedidoWoo.total - pedidoWoo.total_tax,
            totalIva: pedidoWoo.total_tax,
            total: pedidoWoo.total,
            datosFacturaWoo: pedidoWoo.billing, // Guardar todos los datos de factura
            clienteExistente: !!clienteExistente, // Indicar si el cliente ya existía
            clienteCreado: !clienteExistente, // Indicar si se creó un nuevo cliente
            esTiendaOnline: true // Marcar como pedido de tienda online
          });
          
          await nuevoPedido.save();
          resultados.nuevos++;
        } else {
          // Si el pedido existe pero no está marcado como ya actualizado, lo actualizamos ahora
          if (!existe.yaActualizado) {
            await PedidoCliente.findByIdAndUpdate(existe._id, { yaActualizado: true });
            console.log(`[WooCommerce] Marcando pedido existente #${existe.numeroPedido} (ID WooCommerce: ${pedidoWoo.id}) como sincronizado`);
          }
          resultados.existentes++;
        }
      }
      
      res.json({ 
        message: 'Sincronización completada', 
        resultados: resultados,
        detalles: {
          totalPedidosWoo: pedidosWoo.length,
          pedidosProcesados: pedidosAActualizar.length,
          pedidosOmitidos: resultados.omitidos,
          forzadoManualmente: forzarSincronizacion
        }
      });
    } catch (error) {
      console.error('Error en sincronizarPedidos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async sincronizarProductos(req, res) {
    try {
      let productosWoo = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await WooCommerce.get('products', { per_page: 10, page });
        if (response.headers && response.headers['x-wp-totalpages']) {
          totalPages = parseInt(response.headers['x-wp-totalpages'], 10);
        }
        productosWoo = productosWoo.concat(response.data);
        page++;
      } while (page <= totalPages);

      for (const productoWoo of productosWoo) {
        // Extraer tipo de IVA de los metadatos si existe
        let tipoIva = 10; // Valor por defecto
        let formatoEstandar = 'Unidad'; // Valor por defecto
        let pesoUnidad = null;
        let requierePeso = false;
        let codigoSage = null;
        
        // Procesar metadatos para extraer información importante
        if (productoWoo.meta_data && Array.isArray(productoWoo.meta_data)) {
          for (const meta of productoWoo.meta_data) {
            if (meta.key && meta.key.toLowerCase().includes('iva')) {
              const valorIva = parseFloat(meta.value);
              if (!isNaN(valorIva)) {
                tipoIva = valorIva;
              }
            }
            if (meta.key && meta.key.toLowerCase().includes('formato')) {
              formatoEstandar = meta.value;
            }
            if (meta.key && meta.key.toLowerCase().includes('peso_unidad')) {
              const pesoValue = parseFloat(meta.value);
              if (!isNaN(pesoValue)) {
                pesoUnidad = pesoValue;
              }
            }
            if (meta.key && meta.key.toLowerCase().includes('requiere_peso')) {
              requierePeso = meta.value === 'true' || meta.value === '1' || meta.value === 'si';
            }
            if (meta.key && (meta.key.toLowerCase().includes('codigo_sage') || meta.key.toLowerCase().includes('codigo_erp'))) {
              codigoSage = meta.value;
            }
          }
        }
        
        // También buscar en atributos
        if (productoWoo.attributes && Array.isArray(productoWoo.attributes)) {
          for (const attr of productoWoo.attributes) {
            if (attr.name && attr.name.toLowerCase().includes('iva')) {
              const valorIva = parseFloat(attr.options && attr.options.length > 0 ? attr.options[0] : '');
              if (!isNaN(valorIva)) {
                tipoIva = valorIva;
              }
            }
            if (attr.name && attr.name.toLowerCase().includes('formato')) {
              formatoEstandar = attr.options && attr.options.length > 0 ? attr.options[0] : formatoEstandar;
            }
          }
        }
        
        // Procesar categorías para intentar determinar el tipo de IVA
        if (tipoIva === 10 && productoWoo.categories && Array.isArray(productoWoo.categories)) {
          for (const cat of productoWoo.categories) {
            // Alimentos básicos suelen tener 4%
            if (cat.name && (cat.name.toLowerCase().includes('básico') || 
                            cat.name.toLowerCase().includes('basico') || 
                            cat.name.toLowerCase().includes('pan') || 
                            cat.name.toLowerCase().includes('leche'))) {
              tipoIva = 4;
              break;
            }
          }
        }
        
        await ProductoWoo.findOneAndUpdate(
          { idWoo: productoWoo.id },
          {
            idWoo: productoWoo.id,
            nombre: productoWoo.name,
            tipo: productoWoo.type,
            precio: productoWoo.price,
            peso: productoWoo.weight,
            atributos: productoWoo.attributes,
            sku: productoWoo.sku,
            descripcion: productoWoo.description,
            descripcionCorta: productoWoo.short_description,
            categorias: productoWoo.categories,
            imagenes: productoWoo.images,
            tags: productoWoo.tags,
            stock_status: productoWoo.stock_status,
            meta_data: productoWoo.meta_data,
            dimensiones: productoWoo.dimensions,
            price_html: productoWoo.price_html,
            related_ids: productoWoo.related_ids,
            brands: productoWoo.brands,
            translations: productoWoo.translations,
            // Nuevos campos estandarizados
            tipoIva,
            formatoEstandar,
            pesoUnidad,
            requierePeso,
            codigoSage
          },
          { upsert: true, new: true }
        );
      }
      res.json({ message: `Sincronización de productos completada. Total: ${productosWoo.length}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
