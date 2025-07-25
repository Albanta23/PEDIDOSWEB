const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function buscarClientePascual() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión a MongoDB establecida correctamente');
        
        // Definir esquema simplificado para Cliente
        const ClienteSchema = new mongoose.Schema({}, { strict: false });
        const Cliente = mongoose.model('Cliente', ClienteSchema);
        
        // Buscar clientes que contengan "Pascual" en su nombre
        const clientes = await Cliente.find({
            nombre: { $regex: /pascual/i }
        });
        
        if (clientes.length === 0) {
            console.log('❌ No se encontraron clientes con el nombre "Pascual"');
            
            // Buscar también por cliente ID si no hay coincidencias por nombre
            console.log('\n🔍 Buscando por clientes que puedan tener pedidos...');
            
            // Definir esquema para PedidoCliente
            const PedidoClienteSchema = new mongoose.Schema({}, { strict: false });
            const PedidoCliente = mongoose.model('PedidoCliente', PedidoClienteSchema);
            
            // Buscar pedidos recientes
            const pedidosRecientes = await PedidoCliente.find({})
                .sort({ fechaPedido: -1, fechaCreacion: -1 })
                .limit(10);
                
            if (pedidosRecientes.length > 0) {
                console.log(`\n✅ Se encontraron ${pedidosRecientes.length} pedidos recientes`);
                
                // Extraer IDs de clientes de los pedidos
                const clienteIds = pedidosRecientes.map(pedido => {
                    if (typeof pedido.cliente === 'object' && pedido.cliente && pedido.cliente._id) {
                        return pedido.cliente._id;
                    } else {
                        return pedido.cliente;
                    }
                }).filter(id => id);
                
                // Buscar clientes por los IDs encontrados
                if (clienteIds.length > 0) {
                    const clientesConPedidos = await Cliente.find({
                        _id: { $in: clienteIds }
                    });
                    
                    console.log(`\n✅ Se encontraron ${clientesConPedidos.length} clientes con pedidos recientes:`);
                    
                    // Mostrar detalles de los clientes
                    clientesConPedidos.forEach((cliente, index) => {
                        console.log(`\n👤 Cliente con pedidos #${index + 1}:`);
                        console.log(`   ID: ${cliente._id}`);
                        console.log(`   Nombre: ${cliente.nombre || 'No disponible'}`);
                        console.log(`   Email: ${cliente.email || 'No disponible'}`);
                        console.log(`   Teléfono: ${cliente.telefono || 'No disponible'}`);
                    });
                }
            } else {
                console.log('❌ No se encontraron pedidos recientes');
            }
            
            return;
        }
        
        console.log(`✅ Se encontraron ${clientes.length} clientes con "Pascual" en su nombre:`);
        
        // Mostrar detalles de los clientes
        clientes.forEach((cliente, index) => {
            console.log(`\n👤 Cliente #${index + 1}:`);
            console.log(`   ID: ${cliente._id}`);
            console.log(`   Nombre: ${cliente.nombre || 'No disponible'}`);
            console.log(`   Email: ${cliente.email || 'No disponible'}`);
            console.log(`   Teléfono: ${cliente.telefono || 'No disponible'}`);
        });
        
    } catch (error) {
        console.error('❌ Error durante la búsqueda:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

buscarClientePascual();
