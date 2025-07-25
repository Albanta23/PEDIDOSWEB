const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function verificarPedidosPascual() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión a MongoDB establecida correctamente');
        
        // ID del cliente Pascual Fernandez Fernandez
        const clienteId = "687deb2a96a8842b040c9fc6";
        console.log(`🔍 Buscando pedidos para el cliente con ID: ${clienteId}`);
        
        // Definir esquema para PedidoCliente
        const PedidoClienteSchema = new mongoose.Schema({}, { strict: false });
        const PedidoCliente = mongoose.model('PedidoCliente', PedidoClienteSchema);
        
        // Buscar pedidos con diferentes variantes del ID
        const pedidosCliente = await PedidoCliente.find({
            $or: [
                { cliente: clienteId },
                { cliente: mongoose.Types.ObjectId(clienteId) },
                { "cliente._id": clienteId },
                { "cliente._id": mongoose.Types.ObjectId(clienteId) },
                { clienteId: clienteId }
            ]
        }).sort({ fechaPedido: -1, fechaCreacion: -1 });
        
        console.log(`📊 Se encontraron ${pedidosCliente.length} pedidos para este cliente`);
        
        // Mostrar detalles de los pedidos
        if (pedidosCliente.length > 0) {
            console.log('\n📋 Detalles de los pedidos:');
            pedidosCliente.forEach((pedido, index) => {
                const fecha = pedido.fechaPedido 
                    ? new Date(pedido.fechaPedido).toLocaleDateString() 
                    : (pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleDateString() : 'Sin fecha');
                
                console.log(`\n🧾 Pedido #${index + 1}:`);
                console.log(`   ID: ${pedido._id}`);
                console.log(`   Número: ${pedido.numeroPedido || 'No asignado'}`);
                console.log(`   Estado: ${pedido.estado || 'Sin estado'}`);
                console.log(`   Fecha: ${fecha}`);
                console.log(`   Cliente ID en pedido: ${typeof pedido.cliente === 'object' ? 
                    (pedido.cliente._id ? pedido.cliente._id.toString() : 'No disponible') : 
                    (pedido.cliente ? pedido.cliente.toString() : 'No disponible')}`);
                
                if (pedido.lineas && pedido.lineas.length > 0) {
                    console.log(`   Productos: ${pedido.lineas.length}`);
                    pedido.lineas.slice(0, 3).forEach((linea, idx) => {
                        console.log(`     - ${linea.cantidad} ${linea.formato || 'und'} de ${linea.producto}`);
                    });
                    if (pedido.lineas.length > 3) {
                        console.log(`     - ... y ${pedido.lineas.length - 3} productos más`);
                    }
                } else {
                    console.log('   Productos: Ninguno');
                }
            });
            
            // Analizar por qué no se podrían ver estos pedidos en la interfaz antes
            console.log('\n🔍 Análisis de la función cargarPedidosCliente:');
            console.log('Antes de la corrección, la función solo buscaba pedidos donde:');
            console.log('1. cliente === clienteId (coincidencia exacta de string)');
            console.log('2. Pero el tipo de dato podría ser diferente entre el _id guardado y la consulta');
            console.log('\nDespués de la corrección, la función busca pedidos donde:');
            console.log('1. cliente === clienteId (coincidencia exacta de string)');
            console.log('2. cliente === ObjectId(clienteId) (convertido a ObjectId)');
            console.log('3. cliente._id === clienteId (coincidencia en objetos anidados como string)');
            console.log('4. cliente._id === ObjectId(clienteId) (coincidencia en objetos anidados como ObjectId)');
            console.log('5. clienteId === clienteId (campo alternativo que podría existir)');
            console.log('\n✅ La corrección debería permitir visualizar todos estos pedidos en la interfaz');
            
        } else {
            console.log('⚠️ Este cliente no tiene pedidos asociados en la base de datos');
            
            // Verificar si hay algún pedido con el nombre del cliente
            console.log('\n🔍 Buscando pedidos por nombre del cliente...');
            
            const pedidosPorNombre = await PedidoCliente.find({
                $or: [
                    { "cliente.nombre": { $regex: "pascual fernandez", $options: "i" } },
                    { nombreCliente: { $regex: "pascual fernandez", $options: "i" } }
                ]
            }).limit(5);
            
            if (pedidosPorNombre.length > 0) {
                console.log(`✅ Se encontraron ${pedidosPorNombre.length} pedidos por nombre de cliente:`);
                
                pedidosPorNombre.forEach((pedido, index) => {
                    console.log(`\n🧾 Pedido por nombre #${index + 1}:`);
                    console.log(`   ID: ${pedido._id}`);
                    console.log(`   Cliente: ${pedido.cliente?.nombre || pedido.nombreCliente || 'No disponible'}`);
                });
            } else {
                console.log('❌ No se encontraron pedidos por nombre del cliente');
                
                // Verificar si hay pedidos recientes como referencia
                console.log('\n🔍 Buscando pedidos recientes para verificar estructura...');
                
                const pedidosRecientes = await PedidoCliente.find().limit(2);
                
                if (pedidosRecientes.length > 0) {
                    console.log('✅ Estructura de un pedido reciente para referencia:');
                    console.log(JSON.stringify(pedidosRecientes[0], null, 2));
                }
            }
        }
    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

verificarPedidosPascual();
