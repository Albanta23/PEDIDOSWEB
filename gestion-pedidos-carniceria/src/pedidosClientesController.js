// Controlador para pedidos de clientes/expediciones
const PedidoCliente = require('./models/PedidoCliente');

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
  }
};
