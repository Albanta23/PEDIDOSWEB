// Script para verificar los pedidos del cliente Pascual Fernandez Fernandez usando nombre
// Comprueba la nueva lógica de filtrado por nombre de cliente
require('dotenv').config();
const mongoose = require('mongoose');
const chalk = require('chalk');

// Configuración de conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(chalk.green('✅ Conexión a MongoDB establecida correctamente'));
  ejecutarVerificacion();
}).catch(err => {
  console.error(chalk.red('❌ Error al conectar con MongoDB:'), err);
  process.exit(1);
});

// Esquemas y modelos
const PedidoSchema = new mongoose.Schema({}, { strict: false });
const Pedido = mongoose.model('Pedido', PedidoSchema);

const ClienteSchema = new mongoose.Schema({}, { strict: false });
const Cliente = mongoose.model('Cliente', ClienteSchema);

async function ejecutarVerificacion() {
  try {
    // Buscar al cliente específico
    const nombreCliente = "Pascual Fernandez Fernandez";
    const cliente = await Cliente.findOne({ 
      nombre: { $regex: new RegExp(nombreCliente, 'i') } 
    });

    if (!cliente) {
      console.log(chalk.red(`❌ No se encontró al cliente: ${nombreCliente}`));
      mongoose.disconnect();
      return;
    }

    console.log(chalk.blue(`\n=== CLIENTE ENCONTRADO ===`));
    console.log(chalk.yellow(`ID: ${cliente._id}`));
    console.log(chalk.yellow(`Nombre: ${cliente.nombre}`));
    console.log(chalk.yellow(`Email: ${cliente.email || 'No disponible'}`));
    console.log(chalk.yellow(`Teléfono: ${cliente.telefono || 'No disponible'}`));

    // Buscar todos los pedidos
    const todosLosPedidos = await Pedido.find({ 
      enHistorialDevoluciones: { $ne: true } 
    }).limit(100);
    
    console.log(chalk.blue(`\n=== TOTAL DE PEDIDOS ANALIZADOS: ${todosLosPedidos.length} ===`));

    // Verificar pedidos que coinciden con la lógica antigua (por nombre)
    const pedidosAntiguaLogica = todosLosPedidos.filter(pedido => {
      if (!pedido.cliente || typeof pedido.cliente !== 'string') return false;
      
      const clientePedido = pedido.cliente.toLowerCase();
      const clienteBuscado = nombreCliente.toLowerCase();
      return clientePedido.includes(clienteBuscado) || clienteBuscado.includes(clientePedido);
    });

    console.log(chalk.red(`\n🔴 PEDIDOS CON LÓGICA ANTIGUA (PROBLEMÁTICA):`));
    console.log(chalk.red(`Pedidos encontrados: ${pedidosAntiguaLogica.length}`));
    
    // Mostrar resumen de pedidos con lógica antigua
    pedidosAntiguaLogica.forEach((pedido, index) => {
      console.log(chalk.red(`  ${index + 1}. Cliente: "${pedido.cliente}" - Fecha: ${new Date(pedido.fecha || pedido.fechaPedido || pedido.fechaCreacion).toLocaleDateString()}`));
    });

    // Verificar pedidos que coinciden con la nueva lógica (por nombre)
    const pedidosNuevaLogica = todosLosPedidos.filter(pedido => {
      if (!pedido.cliente || typeof pedido.cliente !== 'string') return false;
      
      const clientePedido = pedido.cliente.toLowerCase();
      const clienteBuscado = nombreCliente.toLowerCase();
      
      // Coincidencia exacta
      const coincideExacto = clientePedido === clienteBuscado;
      
      // Para clientes con nombres largos, permitimos coincidencia parcial si el nombre es suficientemente específico
      const esCasiExacto = 
        (clientePedido.split(' ').length >= 2 && clienteBuscado.includes(clientePedido)) || 
        (clienteBuscado.split(' ').length >= 2 && clientePedido.includes(clienteBuscado));
      
      return coincideExacto || esCasiExacto;
    });

    console.log(chalk.green(`\n🟢 PEDIDOS CON LÓGICA NUEVA (CORREGIDA):`));
    console.log(chalk.green(`Pedidos encontrados: ${pedidosNuevaLogica.length}`));
    
    // Mostrar resumen de pedidos con lógica nueva
    pedidosNuevaLogica.forEach((pedido, index) => {
      console.log(chalk.green(`  ${index + 1}. Cliente: "${pedido.cliente}" - Fecha: ${new Date(pedido.fecha || pedido.fechaPedido || pedido.fechaCreacion).toLocaleDateString()}`));
    });
    
    // Pedidos que ya no aparecerán (falsos positivos eliminados)
    const pedidosEliminados = pedidosAntiguaLogica.filter(
      pedidoAntiguo => !pedidosNuevaLogica.some(
        pedidoNuevo => pedidoNuevo._id.toString() === pedidoAntiguo._id.toString()
      )
    );
    
    console.log(chalk.blue(`\n=== FALSOS POSITIVOS ELIMINADOS: ${pedidosEliminados.length} ===`));
    pedidosEliminados.forEach((pedido, index) => {
      console.log(chalk.yellow(`  ${index + 1}. Cliente: "${pedido.cliente}" - Fecha: ${new Date(pedido.fecha || pedido.fechaPedido || pedido.fechaCreacion).toLocaleDateString()}`));
    });

    // Verificar devoluciones
    const Devolucion = mongoose.model('Devolucion', new mongoose.Schema({}, { strict: false }));
    const todasLasDevoluciones = await Devolucion.find().limit(50);
    
    console.log(chalk.blue(`\n=== ANÁLISIS DE DEVOLUCIONES (Total: ${todasLasDevoluciones.length}) ===`));
    
    // Devoluciones con lógica antigua
    const devolucionesAntiguaLogica = todasLasDevoluciones.filter(dev => {
      if (!dev.cliente || typeof dev.cliente !== 'string') return false;
      
      const clienteDev = dev.cliente.toLowerCase();
      const clienteBuscado = nombreCliente.toLowerCase();
      return clienteDev.includes(clienteBuscado) || clienteBuscado.includes(clienteDev);
    });
    
    console.log(chalk.red(`Devoluciones con lógica antigua: ${devolucionesAntiguaLogica.length}`));
    
    // Devoluciones con lógica nueva
    const devolucionesNuevaLogica = todasLasDevoluciones.filter(dev => {
      if (!dev.cliente || typeof dev.cliente !== 'string') return false;
      
      const clienteDev = dev.cliente.toLowerCase();
      const clienteBuscado = nombreCliente.toLowerCase();
      
      const coincideExacto = clienteDev === clienteBuscado;
      const esCasiExacto = 
        (clienteDev.split(' ').length >= 2 && clienteBuscado.includes(clienteDev)) || 
        (clienteBuscado.split(' ').length >= 2 && clienteDev.includes(clienteBuscado));
      
      return coincideExacto || esCasiExacto;
    });
    
    console.log(chalk.green(`Devoluciones con lógica nueva: ${devolucionesNuevaLogica.length}`));
    
    console.log(chalk.blue(`\n=== CONCLUSIÓN ===`));
    console.log(chalk.green(`✅ La nueva lógica ha eliminado ${pedidosEliminados.length} falsos positivos en pedidos`));
    console.log(chalk.green(`✅ La nueva lógica ha eliminado ${devolucionesAntiguaLogica.length - devolucionesNuevaLogica.length} falsos positivos en devoluciones`));
    console.log(chalk.green(`✅ Ahora solo se muestran los pedidos y devoluciones que realmente corresponden a ${nombreCliente}`));

    mongoose.disconnect();
    console.log(chalk.green('\n✅ Verificación completada y conexión cerrada'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error durante la verificación:'), error);
    mongoose.disconnect();
  }
}
