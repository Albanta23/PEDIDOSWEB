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
            const nuevoCliente = new Cliente({
              nombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
              nif: pedidoWoo.billing.vat,
              direccion: `${pedidoWoo.billing.address_1}, ${pedidoWoo.billing.city}, ${pedidoWoo.billing.state} ${pedidoWoo.billing.postcode}`,
              email: pedidoWoo.billing.email,
              telefono: pedidoWoo.billing.phone,
              codigoCliente: `430...` // Asignar código de cliente SAGE50
            });
            const clienteGuardado = await nuevoCliente.save();
            clienteId = clienteGuardado._id;
          }

          const ultimoPedido = await PedidoCliente.findOne({}, {}, { sort: { numeroPedido: -1 } });
          const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
          const nuevoPedido = new PedidoCliente({
            clienteId,
            numeroPedido: siguienteNumero,
            fechaPedido: pedidoWoo.date_created,
            estado: 'borrador_woocommerce',
            clienteNombre: `${pedidoWoo.billing.first_name} ${pedidoWoo.billing.last_name}`,
            direccion: `${pedidoWoo.billing.address_1}, ${pedidoWoo.billing.city}, ${pedidoWoo.billing.state} ${pedidoWoo.billing.postcode}`,
            lineas: pedidoWoo.line_items.map(item => ({
              producto: item.name,
              cantidad: item.quantity,
              precio: item.price,
              iva: item.total_tax,
              tipoProducto: item.variation_id ? 'variable' : 'simple',
              variaciones: item.meta_data
            })),
            origen: {
              tipo: 'woocommerce',
              id: pedidoWoo.id
            },
            notasCliente: pedidoWoo.customer_note,
            subtotal: pedidoWoo.total - pedidoWoo.total_tax,
            totalIva: pedidoWoo.total_tax,
            total: pedidoWoo.total
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
      const response = await WooCommerce.get('products');
      const productosWoo = response.data;

      for (const productoWoo of productosWoo) {
        await ProductoWoo.findOneAndUpdate(
          { idWoo: productoWoo.id },
          {
            idWoo: productoWoo.id,
            nombre: productoWoo.name,
            tipo: productoWoo.type,
            precio: productoWoo.price,
            peso: productoWoo.weight,
            atributos: productoWoo.attributes
          },
          { upsert: true, new: true }
        );
      }
      res.json({ message: 'Sincronización de productos completada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
