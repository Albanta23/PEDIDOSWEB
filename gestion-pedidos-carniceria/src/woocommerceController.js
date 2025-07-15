const WooCommerce = require('./services/woocommerceService');
const PedidoCliente = require('./models/PedidoCliente');

module.exports = {
  async sincronizarPedidos(req, res) {
    try {
      const response = await WooCommerce.get('orders');
      const pedidosWoo = response.data;

      for (const pedidoWoo of pedidosWoo) {
        const existe = await PedidoCliente.findOne({ 'origen.id': pedidoWoo.id, 'origen.tipo': 'woocommerce' });
        if (!existe) {
          const nuevoPedido = new PedidoCliente({
            numeroPedido: pedidoWoo.number,
            fechaPedido: pedidoWoo.date_created,
            estado: pedidoWoo.status,
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
  }
};
