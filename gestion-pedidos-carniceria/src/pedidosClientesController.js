// Controlador para pedidos de clientes/expediciones
const Pedido = require('./models/Pedido');

module.exports = {
  async listar(req, res) {
    try {
      // Solo pedidos de clientes
      const pedidos = await Pedido.find({ tiendaId: 'clientes' });
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async crear(req, res) {
    try {
      const ultimoPedido = await Pedido.findOne({ tiendaId: 'clientes' }, {}, { sort: { numeroPedido: -1 } });
      const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
      const nuevoPedido = new Pedido({
        ...req.body,
        numeroPedido: siguienteNumero,
        fechaCreacion: req.body.fechaCreacion || new Date(),
        fechaPedido: req.body.fechaPedido,
        fechaEnvio: req.body.fechaEnvio,
        fechaRecepcion: req.body.fechaRecepcion,
        tiendaId: 'clientes'
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
      const pedidoPrevio = await Pedido.findById(id);
      if (!pedidoPrevio || pedidoPrevio.tiendaId !== 'clientes') return res.status(404).json({ error: 'Pedido no encontrado' });
      const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
      res.json(pedidoActualizado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const pedidoEliminado = await Pedido.findOneAndDelete({ _id: id, tiendaId: 'clientes' });
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
