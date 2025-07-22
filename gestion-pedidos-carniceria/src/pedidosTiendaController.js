// Controlador para pedidos de tienda/fábrica
const Pedido = require('./models/Pedido');
const { registrarBajaStock } = require('./utils/stock');

module.exports = {
  async listar(req, res) {
    try {
      // Solo pedidos de tienda/fábrica (excluye clientes)
      const pedidos = await Pedido.find({ tiendaId: { $ne: 'clientes' } });
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async crear(req, res) {
    try {
      const ultimoPedido = await Pedido.findOne({ tiendaId: { $ne: 'clientes' } }, {}, { sort: { numeroPedido: -1 } });
      const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
      const nuevoPedido = new Pedido({
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
      const pedidoPrevio = await Pedido.findById(id);
      if (!pedidoPrevio || pedidoPrevio.tiendaId === 'clientes') return res.status(404).json({ error: 'Pedido no encontrado' });
      
      // Validación y preparación de datos
      const datos = req.body;
      
      // Validar que las líneas sean válidas si se están actualizando
      if (datos.lineas && Array.isArray(datos.lineas)) {
        // Validar cada línea
        datos.lineas = datos.lineas.map(linea => {
          // Si es un comentario, solo requerimos ese campo
          if (linea.esComentario) {
            return {
              esComentario: true,
              comentario: linea.comentario || ''
            };
          }
          
          // Para líneas normales, producto es obligatorio
          if (!linea.producto || typeof linea.producto !== 'string' || !linea.producto.trim()) {
            console.log('Línea inválida - producto requerido:', linea);
            return null;
          }
          
          // Normalizar campos numéricos
          if (linea.cantidad !== undefined) linea.cantidad = Number(linea.cantidad);
          if (linea.peso !== undefined) linea.peso = Number(linea.peso);
          if (linea.cantidadEnviada !== undefined) linea.cantidadEnviada = Number(linea.cantidadEnviada);
          
          // Normalizar valores boolean
          if (linea.preparada !== undefined) linea.preparada = Boolean(linea.preparada);
          
          return linea;
        }).filter(linea => linea !== null); // Eliminar líneas inválidas
      }
      
      console.log(`[INFO] Actualizando pedido ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      const pedidoActualizado = await Pedido.findByIdAndUpdate(id, datos, { new: true });
      
      // Registrar movimientos de stock si el estado cambió a 'enviadoTienda'
      if (pedidoActualizado && pedidoPrevio.estado !== 'enviadoTienda' && pedidoActualizado.estado === 'enviadoTienda') {
        for (const linea of pedidoActualizado.lineas) {
          if (linea.esComentario) continue;
          if (!linea.producto || !linea.cantidadEnviada) continue;
          
          // Para el registro de stock, usamos cantidades positivas para peso
          // El tipo 'baja' ya indica que es una salida
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: -Math.abs(linea.cantidadEnviada), // Cantidad negativa para indicar baja
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Salida a tienda (${pedidoActualizado.tiendaId}) por pedido`,
            peso: typeof linea.peso !== 'undefined' ? Math.abs(linea.peso) : undefined // Peso POSITIVO
          });
        }
      }
      
      res.json(pedidoActualizado);
    } catch (err) {
      console.error('[ERROR] Error al actualizar pedido:', err);
      res.status(400).json({ error: err.message });
    }
  },
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const pedidoEliminado = await Pedido.findOneAndDelete({ _id: id, tiendaId: { $ne: 'clientes' } });
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
