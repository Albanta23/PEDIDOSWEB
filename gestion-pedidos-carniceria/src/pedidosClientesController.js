// Controlador para pedidos de clientes/expediciones
const PedidoCliente = require('./models/PedidoCliente');
const { registrarBajaStock } = require('./utils/stock');

module.exports = {
  async listar(req, res) {
    try {
      // Listar todos los pedidos de clientes
      const pedidos = await PedidoCliente.find();
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async crear(req, res) {
    try {
      const ultimoPedido = await PedidoCliente.findOne({}, {}, { sort: { numeroPedido: -1 } });
      const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
      const nuevoPedido = new PedidoCliente({
        ...req.body,
        numeroPedido: siguienteNumero,
        fechaCreacion: req.body.fechaCreacion || new Date(),
        fechaPedido: req.body.fechaPedido,
        fechaEnvio: req.body.fechaEnvio,
        fechaRecepcion: req.body.fechaRecepcion
      });
      const pedidoGuardado = await nuevoPedido.save();
      // Registrar movimiento de stock por expedición de cliente
      for (const linea of pedidoGuardado.lineas) {
        if (linea.esComentario) continue;
        if (!linea.producto || !linea.cantidad) continue;
        await registrarBajaStock({
          tiendaId: 'almacen_central',
          producto: linea.producto,
          cantidad: linea.cantidad,
          unidad: linea.formato || 'kg',
          lote: linea.lote || '',
          motivo: `Expedición cliente (${pedidoGuardado.clienteNombre})`,
          peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
        });
      }
      res.status(201).json(pedidoGuardado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const pedidoPrevio = await PedidoCliente.findById(id);
      if (!pedidoPrevio) return res.status(404).json({ error: 'Pedido no encontrado' });
      const pedidoActualizado = await PedidoCliente.findByIdAndUpdate(id, req.body, { new: true });
      res.json(pedidoActualizado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const pedidoEliminado = await PedidoCliente.findOneAndDelete({ _id: id });
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  /**
   * Registrar devolución de cliente (entrada de stock)
   * Espera body: { pedidoId, devoluciones: [{ producto, cantidad, unidad, lote, peso, comentario }] }
   */
  async registrarDevolucion(req, res) {
    try {
      const { pedidoId, devoluciones } = req.body;
      if (!pedidoId || !Array.isArray(devoluciones) || devoluciones.length === 0) {
        return res.status(400).json({ error: 'Faltan datos para registrar devolución' });
      }
      for (const dev of devoluciones) {
        if (!dev.producto || !dev.cantidad) continue;
        await registrarBajaStock({
          tiendaId: 'almacen_central',
          producto: dev.producto,
          cantidad: dev.cantidad,
          unidad: dev.unidad || 'kg',
          lote: dev.lote || '',
          motivo: `Devolución cliente (pedido ${pedidoId})${dev.comentario ? ': ' + dev.comentario : ''}`,
          peso: typeof dev.peso !== 'undefined' ? dev.peso : undefined
        });
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
