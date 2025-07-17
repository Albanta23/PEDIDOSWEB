const WooCommerce = require('./services/woocommerceService');
const PedidoCliente = require('./models/PedidoCliente');
const Cliente = require('./models/Cliente');
const ProductoWoo = require('./models/ProductoWoo');

module.exports = {
  async sincronizarPedidos(req, res) {
    try {
      const response = await WooCommerce.get('orders');
      const pedidosWoo = response.data;

      for (const pedidoWoo of pedidosWoo) {
        const existe = await PedidoCliente.findOne({ 'origen.id': pedidoWoo.id, 'origen.tipo': 'woocommerce' });
        if (!existe) {
          const clienteExistente = await Cliente.findOne({ $or: [{ nif: pedidoWoo.billing.vat }, { nombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}` }] });
          let clienteId = clienteExistente ? clienteExistente._id : null;
          if (!clienteExistente) {
            // Buscar el último código 430... en la base de datos
            const ultimoCliente430 = await Cliente.findOne({ codigoCliente: /^430/ }, {}, { sort: { codigoCliente: -1 } });
            let nuevoCodigo = '4300001';
            if (ultimoCliente430 && ultimoCliente430.codigoCliente) {
              nuevoCodigo = String(Number(ultimoCliente430.codigoCliente) + 1);
            }
            const nuevoCliente = new Cliente({
              nombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
              nif: pedidoWoo.billing.vat,
              direccion: `${pedidoWoo.billing.address_1}, ${pedidoWoo.billing.city}, ${pedidoWoo.billing.state} ${pedidoWoo.billing.postcode}`,
              email: pedidoWoo.billing.email,
              telefono: pedidoWoo.billing.phone,
              codigoCliente: nuevoCodigo // Asignar código de cliente SAGE50
            });
            const clienteGuardado = await nuevoCliente.save();
            clienteId = clienteGuardado._id;
          }

          const ultimoPedido = await PedidoCliente.findOne({}, {}, { sort: { numeroPedido: -1 } });
          const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
          const nuevoPedido = new PedidoCliente({
            clienteId,
            numeroPedido: siguienteNumero, // El número generado por la aplicación
            numeroPedidoWoo: pedidoWoo.id, // Guardar el número de WooCommerce como referencia
            fechaPedido: pedidoWoo.date_created,
            estado: 'borrador_woocommerce',
            clienteNombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
            direccion: `${pedidoWoo.billing.address_1}, ${pedidoWoo.billing.city}, ${pedidoWoo.billing.state} ${pedidoWoo.billing.postcode}`,
            lineas: await Promise.all(pedidoWoo.line_items.map(async item => {
              // Buscar el producto en la DB por nombre o idWoo
              const productoDb = await ProductoWoo.findOne({ $or: [{ nombre: item.name }, { idWoo: item.product_id }] });
              // Extraer formato y peso medio si existen en meta_data o atributos
              let formato = null;
              let pesoMedio = null;
              if (item.meta_data && Array.isArray(item.meta_data)) {
                for (const meta of item.meta_data) {
                  if (meta.key && meta.key.toLowerCase().includes('formato')) formato = meta.value;
                  if (meta.key && meta.key.toLowerCase().includes('peso')) pesoMedio = meta.value;
                }
              }
              if (productoDb && productoDb.atributos) {
                if (!formato && productoDb.atributos.formato) formato = productoDb.atributos.formato;
                if (!pesoMedio && productoDb.atributos.peso) pesoMedio = productoDb.atributos.peso;
              }
              return {
                producto: item.name,
                cantidad: item.quantity,
                precio: productoDb?.precio || item.price,
                iva: productoDb?.iva || item.total_tax,
                tipoProducto: item.variation_id ? 'variable' : 'simple',
                variaciones: item.meta_data,
                idWoo: item.product_id,
                formato,
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
                  atributos: productoDb.atributos
                } : null
              };
            })),
            origen: {
              tipo: 'woocommerce',
              id: pedidoWoo.id
            },
            notasCliente: pedidoWoo.customer_note,
            subtotal: pedidoWoo.total - pedidoWoo.total_tax,
            totalIva: pedidoWoo.total_tax,
            total: pedidoWoo.total,
            datosFacturaWoo: pedidoWoo.billing // Guardar todos los datos de factura
          });
          await nuevoPedido.save();
        }
      }
      res.json({ message: 'Sincronización completada' });
    } catch (error) {
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
            translations: productoWoo.translations
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
