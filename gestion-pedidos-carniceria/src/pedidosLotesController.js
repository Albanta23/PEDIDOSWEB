const PedidoLote = require('./models/PedidoLote');

// Listar todos los pedidos de cestas/lotes
exports.listar = async (req, res) => {
  try {
    const pedidos = await PedidoLote.find();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear un nuevo pedido de cesta/lote
exports.crear = async (req, res) => {
  try {
    const ultimoPedido = await PedidoLote.findOne({}, {}, { sort: { numeroPedido: -1 } });
    const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
    const nuevoPedido = new PedidoLote({
      ...req.body,
      numeroPedido: siguienteNumero,
      fechaCreacion: req.body.fechaCreacion || new Date(),
      fechaPedido: req.body.fechaPedido,
      fechaEnvio: req.body.fechaEnvio,
      fechaRecepcion: req.body.fechaRecepcion
    });
    const guardado = await nuevoPedido.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar un pedido de cesta/lote
exports.actualizar = async (req, res) => {
  try {
    const actualizado = await PedidoLote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar un pedido de cesta/lote
exports.eliminar = async (req, res) => {
  try {
    const eliminado = await PedidoLote.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
