// Script para analizar la estructura correcta de filtrado de pedidos por cliente
require('dotenv').config();
const mongoose = require('mongoose');
const chalk = require('chalk');

// Configuración de conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(chalk.green('✅ Conexión a MongoDB establecida correctamente'));
  analizarEstructuraPedidos();
}).catch(err => {
  console.error(chalk.red('❌ Error al conectar con MongoDB:'), err);
  process.exit(1);
});

// Esquemas y modelos
const PedidoSchema = new mongoose.Schema({}, { strict: false });
const Pedido = mongoose.model('Pedido', PedidoSchema);

const PedidoClienteSchema = new mongoose.Schema({}, { strict: false });
const PedidoCliente = mongoose.model('PedidoCliente', PedidoClienteSchema);

const ClienteSchema = new mongoose.Schema({}, { strict: false });
const Cliente = mongoose.model('Cliente', ClienteSchema);

async function analizarEstructuraPedidos() {
  try {
    // 1. Buscar algunos clientes para pruebas
    const clientes = await Cliente.find().limit(3);
    console.log(chalk.blue(`\n=== CLIENTES DE PRUEBA ===`));
    
    for (const cliente of clientes) {
      console.log(chalk.yellow(`\nCliente: ${cliente.nombre}`));
      console.log(chalk.yellow(`ID: ${cliente._id}`));
      
      // 2. Buscar pedidos para este cliente en la colección pedidoclientes
      const pedidosCliente = await PedidoCliente.find({
        $or: [
          { clienteId: cliente._id.toString() },
          { "cliente._id": cliente._id.toString() },
          { clienteNombre: { $regex: new RegExp(cliente.nombre, 'i') } }
        ]
      }).limit(5);
      
      console.log(chalk.green(`Pedidos encontrados: ${pedidosCliente.length}`));
      
      if (pedidosCliente.length > 0) {
        const pedidoEjemplo = pedidosCliente[0];
        console.log(chalk.blue(`\nEstructura de pedido para cliente ${cliente.nombre}:`));
        
        // Analizar la estructura del pedido
        console.log(chalk.cyan(`- Cómo se referencia al cliente:`));
        
        if (pedidoEjemplo.clienteId) {
          console.log(chalk.green(`  ✅ clienteId: ${pedidoEjemplo.clienteId}`));
        } else {
          console.log(chalk.red(`  ❌ No tiene campo clienteId`));
        }
        
        if (pedidoEjemplo.clienteNombre) {
          console.log(chalk.green(`  ✅ clienteNombre: ${pedidoEjemplo.clienteNombre}`));
        } else {
          console.log(chalk.red(`  ❌ No tiene campo clienteNombre`));
        }
        
        if (pedidoEjemplo.cliente) {
          if (typeof pedidoEjemplo.cliente === 'string') {
            console.log(chalk.green(`  ✅ cliente (string): ${pedidoEjemplo.cliente}`));
          } else if (typeof pedidoEjemplo.cliente === 'object') {
            console.log(chalk.green(`  ✅ cliente (objeto): ${JSON.stringify(pedidoEjemplo.cliente)}`));
          }
        } else {
          console.log(chalk.red(`  ❌ No tiene campo cliente`));
        }
        
        // Extraer campos relevantes del pedido
        console.log(chalk.cyan(`\n- Campos clave del pedido:`));
        const camposRelevantes = {
          numeroPedido: pedidoEjemplo.numeroPedido,
          estado: pedidoEjemplo.estado,
          fechaPedido: pedidoEjemplo.fechaPedido,
          fechaCreacion: pedidoEjemplo.fechaCreacion,
          tipo: pedidoEjemplo.tipo,
          enHistorialDevoluciones: pedidoEjemplo.enHistorialDevoluciones
        };
        
        console.log(chalk.green(`  ${JSON.stringify(camposRelevantes, null, 2)}`));
      } else {
        console.log(chalk.red(`No se encontraron pedidos para este cliente`));
      }
    }
    
    // 3. Analizar una muestra aleatoria de pedidos para ver estructura general
    const pedidosAleatorios = await PedidoCliente.aggregate([{ $sample: { size: 5 } }]);
    
    console.log(chalk.blue(`\n=== MUESTRA ALEATORIA DE PEDIDOS ===`));
    
    for (const pedido of pedidosAleatorios) {
      console.log(chalk.yellow(`\nPedido ID: ${pedido._id}`));
      
      // Detectar cómo se referencia al cliente
      const referenciaCliente = [];
      
      if (pedido.clienteId) referenciaCliente.push(`clienteId: ${pedido.clienteId}`);
      if (pedido.clienteNombre) referenciaCliente.push(`clienteNombre: ${pedido.clienteNombre}`);
      if (pedido.cliente) {
        if (typeof pedido.cliente === 'string') {
          referenciaCliente.push(`cliente (string): ${pedido.cliente}`);
        } else if (typeof pedido.cliente === 'object') {
          referenciaCliente.push(`cliente (objeto): ${JSON.stringify(pedido.cliente)}`);
        }
      }
      
      console.log(chalk.green(`Referencia al cliente: ${referenciaCliente.join(', ')}`));
      
      // Mostrar otros campos relevantes
      const camposRelevantes = {
        numeroPedido: pedido.numeroPedido,
        estado: pedido.estado,
        fechaPedido: pedido.fechaPedido,
        fechaCreacion: pedido.fechaCreacion,
        tipo: pedido.tipo,
        enHistorialDevoluciones: pedido.enHistorialDevoluciones
      };
      
      console.log(chalk.cyan(`Información del pedido:`));
      console.log(chalk.green(`${JSON.stringify(camposRelevantes, null, 2)}`));
    }
    
    // 4. Proponer una solución basada en el análisis
    console.log(chalk.blue(`\n=== CONCLUSIONES Y SOLUCIÓN PROPUESTA ===`));
    console.log(chalk.green(`1. Los pedidos pueden referenciar al cliente de varias formas:`));
    console.log(chalk.green(`   - Por clienteId (referencia al ID del cliente)`));
    console.log(chalk.green(`   - Por clienteNombre (referencia al nombre del cliente)`));
    console.log(chalk.green(`   - Por campo cliente (puede ser string u objeto)`));
    
    console.log(chalk.green(`\n2. La solución correcta debe incluir todas estas posibilidades:`));
    console.log(chalk.cyan(`   function cargarPedidosCliente(clienteId, nombreCliente) {`));
    console.log(chalk.cyan(`     return axios.get('/api/pedidos-clientes', {`));
    console.log(chalk.cyan(`       params: {`));
    console.log(chalk.cyan(`         clienteId: clienteId,`));
    console.log(chalk.cyan(`         nombreCliente: nombreCliente,`));
    console.log(chalk.cyan(`         enHistorialDevoluciones: false`));
    console.log(chalk.cyan(`       }`));
    console.log(chalk.cyan(`     })`));
    console.log(chalk.cyan(`   }`));
    
    console.log(chalk.green(`\n3. Y en el backend (controlador de pedidos):`));
    console.log(chalk.cyan(`   // Filtro correcto para pedidos`));
    console.log(chalk.cyan(`   const filtro = { enHistorialDevoluciones: { $ne: true } };`));
    console.log(chalk.cyan(`   `));
    console.log(chalk.cyan(`   if (req.query.clienteId) {`));
    console.log(chalk.cyan(`     filtro.$or = [`));
    console.log(chalk.cyan(`       { clienteId: req.query.clienteId },`));
    console.log(chalk.cyan(`       { "cliente._id": req.query.clienteId },`));
    console.log(chalk.cyan(`     ];`));
    console.log(chalk.cyan(`   } else if (req.query.nombreCliente) {`));
    console.log(chalk.cyan(`     const nombreClienteRegex = new RegExp(req.query.nombreCliente, 'i');`));
    console.log(chalk.cyan(`     filtro.$or = [`));
    console.log(chalk.cyan(`       { clienteNombre: nombreClienteRegex },`));
    console.log(chalk.cyan(`       { cliente: nombreClienteRegex },`));
    console.log(chalk.cyan(`       { "cliente.nombre": nombreClienteRegex }`));
    console.log(chalk.cyan(`     ];`));
    console.log(chalk.cyan(`   }`));
    
    console.log(chalk.green(`\n4. Esta solución cubrirá todos los casos de asociación cliente-pedido`));
    
    await mongoose.disconnect();
    console.log(chalk.green('\n✅ Análisis completado y conexión cerrada'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error durante el análisis:'), error);
    await mongoose.disconnect();
  }
}
