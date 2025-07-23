// Corregir pedidosTiendaController.js para registrar correctamente las entradas en tiendas
const { registrarBajaStock, registrarMovimientoStock } = require('./utils/stock');

// Función actualizar corregida para registrar tanto la baja en central como la entrada en tienda
async function actualizar(req, res) {
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
      console.log(`[INFO] Pedido ${id} cambió a estado enviadoTienda. Registrando movimientos...`);
      
      // Iterar las líneas para registrar movimientos en ambos almacenes
      for (const linea of pedidoActualizado.lineas) {
        if (linea.esComentario) continue;
        if (!linea.producto || !linea.cantidadEnviada) continue;
        
        console.log(`[INFO] Procesando línea: ${linea.producto}, cantidad: ${linea.cantidadEnviada}, peso: ${linea.peso}`);
        
        // 1. Registrar baja en almacén central
        await registrarBajaStock({
          tiendaId: 'almacen_central',
          producto: linea.producto,
          cantidad: -Math.abs(linea.cantidadEnviada), // Cantidad negativa para indicar baja
          unidad: linea.formato || 'kg',
          lote: linea.lote || '',
          motivo: `Salida a tienda (${pedidoActualizado.tiendaId}) por pedido ${pedidoActualizado.numeroPedido || id}`,
          peso: typeof linea.peso !== 'undefined' ? Math.abs(linea.peso) : undefined // Peso POSITIVO
        });
        
        // 2. Registrar entrada en la tienda destino
        await registrarMovimientoStock({
          tiendaId: pedidoActualizado.tiendaId,
          producto: linea.producto,
          cantidad: Math.abs(linea.cantidadEnviada), // Cantidad positiva para indicar entrada
          unidad: linea.formato || 'kg',
          lote: linea.lote || '',
          motivo: `Entrada desde fábrica por pedido ${pedidoActualizado.numeroPedido || id}`,
          tipo: 'entrada',
          pedidoId: pedidoActualizado._id.toString(),
          peso: typeof linea.peso !== 'undefined' ? Math.abs(linea.peso) : undefined,
          fecha: new Date()
        });
        
        console.log(`[INFO] Movimientos registrados para línea ${linea.producto}`);
      }
    }
    
    res.json(pedidoActualizado);
  } catch (err) {
    console.error('[ERROR] Error al actualizar pedido:', err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { actualizar };
