const WooCommerce = require('./services/woocommerceService');
const PedidoCliente = require('./models/PedidoCliente');
const Cliente = require('./models/Cliente');
const ProductoWoo = require('./models/ProductoWoo');
const { construirNombreCompleto } = require('./sincronizarNombresPedidos');

/**
 * Separar nombre y apellidos considerando metadatos de WooCommerce
 * @param {string} firstName - Nombre del cliente
 * @param {string} lastName - Apellidos del cliente (puede contener uno o dos apellidos)
 * @param {Array} metaData - Metadatos del pedido de WooCommerce
 * @returns {object} - Objeto con nombre, primerApellido y segundoApellido separados
 */
function separarNombreApellidos(firstName, lastName, metaData = []) {
  const nombre = firstName ? firstName.trim() : '';
  
  if (!lastName) {
    return {
      nombre,
      primerApellido: '',
      segundoApellido: ''
    };
  }
  
  // Dividir el lastName por espacios y filtrar elementos vacíos
  const apellidos = lastName.trim().split(/\s+/).filter(apellido => apellido.length > 0);
  
  let primerApellido = apellidos[0] || '';
  let segundoApellido = apellidos[1] || '';
  
  // Verificar si hay segundo apellido en metadatos (campo _billing_myfield3)
  if (metaData && Array.isArray(metaData)) {
    const segundoApellidoMeta = metaData.find(meta => meta.key === '_billing_myfield3');
    if (segundoApellidoMeta && segundoApellidoMeta.value && segundoApellidoMeta.value.trim()) {
      segundoApellido = segundoApellidoMeta.value.trim();
      console.log(`[WooCommerce] Segundo apellido desde metadatos: ${segundoApellido}`);
    }
  }
  
  return {
    nombre,
    primerApellido,
    segundoApellido
  };
}

/**
 * Comparar direcciones de facturación y envío para determinar si son diferentes
 * @param {object} billing - Dirección de facturación
 * @param {object} shipping - Dirección de envío
 * @returns {boolean} - true si las direcciones son diferentes
 */
function direccionesEnvioSonDiferentes(billing, shipping) {
  // Campos principales para comparar direcciones
  const camposComparar = ['address_1', 'city', 'postcode', 'first_name', 'last_name'];
  
  for (const campo of camposComparar) {
    const valorBilling = (billing[campo] || '').trim().toLowerCase();
    const valorShipping = (shipping[campo] || '').trim().toLowerCase();
    
    if (valorBilling !== valorShipping) {
      console.log(`[WooCommerce] Diferencia en ${campo}: "${billing[campo]}" vs "${shipping[campo]}"`);
      return true;
    }
  }
  
  return false;
}

/**
 * Extraer información completa de dirección para etiquetas de envío
 * @param {object} shipping - Dirección de envío de WooCommerce
 * @param {object} billing - Dirección de facturación (como fallback)
 * @returns {object} - Objeto con los datos de dirección formateados
 */
function extraerDireccionEnvio(shipping, billing) {
  // Usar dirección de envío si está completa, sino usar facturación
  const direccionUsada = shipping.address_1 ? shipping : billing;
  
  return {
    nombre: `${direccionUsada.first_name || ''} ${direccionUsada.last_name || ''}`.trim(),
    empresa: direccionUsada.company || '',
    direccion1: direccionUsada.address_1 || '',
    direccion2: direccionUsada.address_2 || '',
    ciudad: direccionUsada.city || '',
    codigoPostal: direccionUsada.postcode || '',
    provincia: direccionUsada.state || '',
    pais: direccionUsada.country || '',
    telefono: direccionUsada.phone || billing.phone || '', // El teléfono suele estar solo en billing
    esEnvioAlternativo: direccionesEnvioSonDiferentes(billing, shipping)
  };
}

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
      
      // Obtener pedidos de WooCommerce (FILTRAR CANCELADOS)
      const response = await WooCommerce.get('orders', {
        status: 'processing,completed,on-hold,pending', // Excluir cancelled, refunded, failed
        per_page: 100 // Aumentar límite para obtener más pedidos por llamada
      });
      const pedidosWoo = response.data;
      
      console.log(`[WooCommerce] Filtrados pedidos cancelados. Obtenidos ${pedidosWoo.length} pedidos válidos`);
      
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
          const datosNombre = separarNombreApellidos(pedidoWoo.billing.first_name, pedidoWoo.billing.last_name, pedidoWoo.meta_data);
          
          // Extraer información de forma de pago
          let formaPago = pedidoWoo.payment_method_title || pedidoWoo.payment_method || 'No especificado';
          let detallesPago = {
            metodo: formaPago,
            metodoCodigo: pedidoWoo.payment_method || '',
            total: pedidoWoo.total || 0
          };
          
          // Buscar metadatos de forma de pago específicos
          if (pedidoWoo.meta_data && Array.isArray(pedidoWoo.meta_data)) {
            // PayPal
            const paypalSource = pedidoWoo.meta_data.find(meta => meta.key === '_ppcp_paypal_payment_source');
            const paypalFees = pedidoWoo.meta_data.find(meta => meta.key === '_ppcp_paypal_fees');
            
            if (paypalSource) {
              detallesPago.proveedor = 'PayPal';
              detallesPago.fuente = paypalSource.value;
            }
            if (paypalFees) {
              detallesPago.comision = paypalFees.value;
            }
            
            // Stripe
            const stripeSource = pedidoWoo.meta_data.find(meta => meta.key.includes('stripe'));
            if (stripeSource) {
              detallesPago.proveedor = 'Stripe';
            }
            
            console.log(`[WooCommerce] Pedido ${pedidoWoo.id} - Forma de pago: ${formaPago}, Detalles:`, detallesPago);
          }
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
              nombre: datosNombre.nombre,
              primerApellido: datosNombre.primerApellido,
              segundoApellido: datosNombre.segundoApellido,
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
          
          // Buscar cliente recién creado para construir nombre completo
          const clienteCompleto = await Cliente.findById(clienteId);
          const nombreCompletoCliente = construirNombreCompleto(clienteCompleto, `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`);
          
          // Extraer información de dirección de envío
          const datosEnvio = extraerDireccionEnvio(pedidoWoo.shipping, pedidoWoo.billing);
          if (datosEnvio.esEnvioAlternativo) {
            console.log(`[WooCommerce] Pedido #${pedidoWoo.id} tiene dirección de envío diferente`);
            console.log(`[WooCommerce] Envío a: ${datosEnvio.nombre}, ${datosEnvio.direccion1}, ${datosEnvio.codigoPostal} ${datosEnvio.ciudad}`);
          }
          
          const nuevoPedido = new PedidoCliente({
            clienteId,
            codigoCliente, // Guardar el código de cliente para SAGE50
            numeroPedido: siguienteNumero, // El número generado por la aplicación
            estado: 'pendiente_confirmacion',
            historialEstados: [{ estado: 'pendiente_confirmacion', usuario: 'sistema', fecha: new Date() }],
            numeroPedidoWoo: pedidoWoo.id, // Guardar el número de WooCommerce como referencia
            fechaPedido: pedidoWoo.date_created,
            estado: 'borrador_woocommerce',
            clienteNombre: nombreCompletoCliente,
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
            datosEnvioWoo: datosEnvio, // NUEVO: Información completa de dirección de envío
            formaPago: detallesPago, // NUEVO: Información de forma de pago extraída
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

/**
 * Función para determinar la forma de pago desde los datos de WooCommerce
 */
function determinarFormaPago(pedidoWoo) {
  const metodoPago = pedidoWoo.payment_method || '';
  const tituloMetodo = pedidoWoo.payment_method_title || '';
  
  // Mapear métodos de pago de WooCommerce a códigos SAGE50
  const mapeoFormasPago = {
    'bacs': '03', // Transferencia bancaria
    'cheque': '04', // Cheque  
    'cod': '01', // Contra reembolso
    'paypal': '02', // PayPal
    'stripe': '02', // Tarjeta (Stripe)
    'woocommerce_payments': '02', // Tarjeta
    'square': '02', // Tarjeta (Square)
    'direct_debit': '05', // Domiciliación
    'bank_transfer': '03', // Transferencia
    'credit_card': '02', // Tarjeta de crédito
  };
  
  // Buscar en metadatos información adicional de pago
  const metaPago = pedidoWoo.meta_data?.find(meta => 
    meta.key.includes('paypal') || 
    meta.key.includes('stripe') ||
    meta.key.includes('payment')
  );
  
  return {
    codigo: mapeoFormasPago[metodoPago] || '01', // Por defecto: Contado
    metodo: metodoPago,
    titulo: tituloMetodo,
    detalles: metaPago ? {
      key: metaPago.key,
      value: metaPago.value
    } : null
  };
}

// Exportar funciones para testing
module.exports.separarNombreApellidos = separarNombreApellidos;
module.exports.determinarFormaPago = determinarFormaPago;
module.exports.direccionesEnvioSonDiferentes = direccionesEnvioSonDiferentes;
module.exports.extraerDireccionEnvio = extraerDireccionEnvio;
