// Script para verificar todos los pedidos en la base de datos
// y buscar específicamente los que tienen cliente "Pascual Fernandez Fernandez"
require('dotenv').config();
const mongoose = require('mongoose');
const chalk = require('chalk');

// Configuración de conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(chalk.green('✅ Conexión a MongoDB establecida correctamente'));
  buscarPedidos();
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

async function buscarPedidos() {
  try {
    console.log(chalk.blue('\n=== VERIFICANDO TODAS LAS COLECCIONES DE PEDIDOS ==='));
    
    // 1. Verificar colección 'pedidos'
    const pedidos = await Pedido.find().limit(200);
    console.log(chalk.yellow(`\nColección 'pedidos': ${pedidos.length} documentos encontrados`));
    
    // Buscar pedidos relacionados con Pascual Fernandez
    const pedidosPascual = pedidos.filter(p => 
      p.cliente && 
      typeof p.cliente === 'string' && 
      p.cliente.toLowerCase().includes('pascual fernandez')
    );
    
    console.log(chalk.green(`- Pedidos relacionados con 'Pascual Fernandez': ${pedidosPascual.length}`));
    pedidosPascual.forEach((p, i) => {
      console.log(chalk.green(`  ${i+1}. Cliente: "${p.cliente}" - ID: ${p._id}`));
    });
    
    // 2. Verificar colección 'pedidoclientes'
    const pedidosCliente = await PedidoCliente.find().limit(200);
    console.log(chalk.yellow(`\nColección 'pedidoclientes': ${pedidosCliente.length} documentos encontrados`));
    
    // Analizar estructura de pedidosCliente
    if (pedidosCliente.length > 0) {
      const ejemplo = pedidosCliente[0];
      console.log(chalk.blue('Estructura de ejemplo de pedidoCliente:'));
      
      const clienteInfo = typeof ejemplo.cliente === 'object' ? 
        `Objeto: ${JSON.stringify(ejemplo.cliente)}` : 
        `String: "${ejemplo.cliente}"`;
      
      console.log(chalk.yellow(`- cliente: ${clienteInfo}`));
      console.log(chalk.yellow(`- Otros campos: ${Object.keys(ejemplo).join(', ')}`));
    }
    
    // Buscar pedidosCliente relacionados con Pascual Fernandez
    const pedidosClientePascual = pedidosCliente.filter(p => {
      if (typeof p.cliente === 'string') {
        return p.cliente.toLowerCase().includes('pascual fernandez');
      } else if (typeof p.cliente === 'object' && p.cliente && p.cliente.nombre) {
        return p.cliente.nombre.toLowerCase().includes('pascual fernandez');
      } else if (p.nombreCliente) {
        return p.nombreCliente.toLowerCase().includes('pascual fernandez');
      }
      return false;
    });
    
    console.log(chalk.green(`- PedidosCliente relacionados con 'Pascual Fernandez': ${pedidosClientePascual.length}`));
    pedidosClientePascual.forEach((p, i) => {
      const clienteNombre = 
        typeof p.cliente === 'string' ? p.cliente :
        typeof p.cliente === 'object' && p.cliente && p.cliente.nombre ? p.cliente.nombre :
        p.nombreCliente || 'No disponible';
      
      console.log(chalk.green(`  ${i+1}. Cliente: "${clienteNombre}" - ID: ${p._id}`));
    });
    
    // 3. Verificar cliente específico
    const clientePascual = await Cliente.findOne({ nombre: /pascual fernandez/i });
    if (clientePascual) {
      console.log(chalk.blue(`\nCliente encontrado:`));
      console.log(chalk.yellow(`- ID: ${clientePascual._id}`));
      console.log(chalk.yellow(`- Nombre: ${clientePascual.nombre}`));
      
      // Buscar pedidosCliente por ID de cliente
      const pedidosPorClienteId = await PedidoCliente.find({
        $or: [
          { cliente: clientePascual._id.toString() },
          { "cliente._id": clientePascual._id.toString() },
          { clienteId: clientePascual._id.toString() }
        ]
      });
      
      console.log(chalk.green(`- Pedidos encontrados por ID de cliente: ${pedidosPorClienteId.length}`));
      pedidosPorClienteId.forEach((p, i) => {
        console.log(chalk.green(`  ${i+1}. ID: ${p._id} - Fecha: ${new Date(p.fechaPedido || p.fechaCreacion || p.fecha).toLocaleDateString()}`));
      });
    } else {
      console.log(chalk.red('\nNo se encontró el cliente "Pascual Fernandez"'));
    }
    
    // 4. Verificar todas las colecciones disponibles en la base de datos
    const colecciones = await mongoose.connection.db.listCollections().toArray();
    console.log(chalk.blue(`\nColecciones disponibles en la base de datos: ${colecciones.length}`));
    colecciones.forEach((col, i) => {
      console.log(chalk.yellow(`  ${i+1}. ${col.name}`));
    });
    
    // 5. Resumen y conclusiones
    console.log(chalk.blue('\n=== CONCLUSIONES ==='));
    console.log(chalk.green('1. La estructura de datos muestra que los pedidos pueden estar en diferentes colecciones'));
    console.log(chalk.green('2. La relación cliente-pedido puede ser por ID o por nombre'));
    console.log(chalk.green('3. La lógica de filtrado debe adaptarse según el tipo de dato y estructura'));
    console.log(chalk.green('4. La nueva lógica implementada debería resolver los problemas de filtrado por nombre'));
    
    await mongoose.disconnect();
    console.log(chalk.green('\n✅ Verificación completada y conexión cerrada'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error durante la búsqueda:'), error);
    await mongoose.disconnect();
  }
}
