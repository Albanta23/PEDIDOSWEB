const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function crearPedidoPrueba() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión a MongoDB establecida correctamente');
        
        // ID del cliente Pascual Fernandez Fernandez
        const clienteId = "687deb2a96a8842b040c9fc6";
        
        // Definir esquema para Cliente
        const ClienteSchema = new mongoose.Schema({}, { strict: false });
        const Cliente = mongoose.model('Cliente', ClienteSchema);
        
        // Obtener datos del cliente para verificar
        const cliente = await Cliente.findById(clienteId);
        
        if (!cliente) {
            console.log(`❌ No se encontró el cliente con ID: ${clienteId}`);
            return;
        }
        
        console.log(`✅ Cliente encontrado: ${cliente.nombre}`);
        
        // Definir esquema para PedidoCliente
        const PedidoClienteSchema = new mongoose.Schema({}, { strict: false });
        const PedidoCliente = mongoose.model('PedidoCliente', PedidoClienteSchema);
        
        // Determinar el siguiente número de pedido
        const ultimoPedido = await PedidoCliente.findOne().sort({ numeroPedido: -1 });
        const numeroPedido = ultimoPedido ? (ultimoPedido.numeroPedido || 0) + 1 : 1;
        
        // Crear un pedido de prueba
        const nuevoPedido = new PedidoCliente({
            cliente: clienteId, // Usando el ID como string (como se haría en el frontend)
            clienteNombre: cliente.nombre,
            direccion: cliente.direccion || "Dirección de prueba",
            estado: "en_espera",
            numeroPedido: numeroPedido,
            lineas: [
                {
                    producto: "JAMÓN IBÉRICO BELLOTA",
                    cantidad: 2,
                    peso: 8.5,
                    formato: "Piezas",
                    comentario: "Pedido de prueba",
                    lote: "TEST2025"
                },
                {
                    producto: "CHORIZO IBÉRICO",
                    cantidad: 5,
                    peso: 2.5,
                    formato: "Paquetes",
                    comentario: "Calidad extra",
                    lote: "TEST2025-C"
                }
            ],
            fechaCreacion: new Date(),
            fechaPedido: new Date(),
            tipo: "cliente",
            usuarioTramitando: "test",
            historialEstados: [
                {
                    estado: "en_espera",
                    usuario: "test",
                    fecha: new Date()
                }
            ]
        });
        
        // Guardar el pedido
        await nuevoPedido.save();
        
        console.log(`✅ Pedido de prueba creado con ID: ${nuevoPedido._id}`);
        console.log(`   Número de pedido: ${nuevoPedido.numeroPedido}`);
        console.log(`   Cliente: ${nuevoPedido.clienteNombre}`);
        console.log(`   Fecha: ${nuevoPedido.fechaPedido}`);
        
        // Verificar si se puede recuperar el pedido con la consulta mejorada
        console.log('\n🔍 Verificando si el pedido se puede recuperar con la consulta mejorada...');
        
        const pedidosCliente = await PedidoCliente.find({
            $or: [
                { cliente: clienteId },
                { cliente: mongoose.Types.ObjectId(clienteId) },
                { "cliente._id": clienteId },
                { "cliente._id": mongoose.Types.ObjectId(clienteId) },
                { clienteId: clienteId }
            ]
        });
        
        if (pedidosCliente.length > 0) {
            console.log(`✅ Se recuperaron ${pedidosCliente.length} pedidos con la consulta mejorada`);
            
            // Verificar si se recuperaría con la consulta original (antes de la corrección)
            const pedidosClienteOriginal = await PedidoCliente.find({
                cliente: clienteId
            });
            
            console.log(`${pedidosClienteOriginal.length > 0 ? '✅' : '❌'} Con la consulta original se recuperarían ${pedidosClienteOriginal.length} pedidos`);
            
            if (pedidosClienteOriginal.length === 0) {
                console.log('\n👉 Esto confirma que la corrección era necesaria y ahora funciona correctamente');
                console.log('   Los pedidos se almacenan con el ID del cliente como string pero podrían recuperarse');
                console.log('   de diferentes formas dependiendo de cómo se implementen las consultas');
            }
        } else {
            console.log('❌ No se pudieron recuperar pedidos con la consulta mejorada');
        }
        
    } catch (error) {
        console.error('❌ Error durante la creación del pedido de prueba:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

crearPedidoPrueba();
