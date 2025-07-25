const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Modelos
const Cliente = require('./models/Cliente');
const PedidoCliente = require('./models/PedidoCliente');

async function main() {
    try {
        console.log('🔍 Iniciando diagnóstico para cliente "Pascual Fernandez Fernandez"...');
        
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión a MongoDB establecida correctamente');
        
        // Buscar cliente
        const cliente = await Cliente.findOne({
            $or: [
                { nombre: { $regex: 'Pascual Fernandez Fernandez', $options: 'i' } },
                { nombre: { $regex: 'Pascual', $options: 'i' } }
            ]
        });
        
        if (!cliente) {
            console.log('❌ No se encontró al cliente "Pascual Fernandez Fernandez"');
            return;
        }
        
        console.log(`✅ Cliente encontrado: ID=${cliente._id}, Nombre=${cliente.nombre}`);
        
        // Buscar pedidos con diferentes variantes del ID
        const clienteId = cliente._id.toString();
        const pedidosCliente = await PedidoCliente.find({
            $or: [
                { cliente: clienteId },
                { cliente: cliente._id },
                { "cliente._id": clienteId },
                { "cliente._id": cliente._id },
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
        }
        
        // Verificar si la función en ClientesMantenimiento.jsx funcionaría correctamente
        console.log('\n🔍 Simulando función cargarPedidosCliente de ClientesMantenimiento.jsx...');
        console.log(`Cliente ID utilizado: ${clienteId}`);
        
        // Mostrar cómo se formatearía la consulta en la función corregida
        console.log('Consulta que se ejecutaría:');
        console.log(`{ $or: [
    { cliente: "${clienteId}" },
    { cliente: ObjectId("${clienteId}") },
    { "cliente._id": "${clienteId}" },
    { "cliente._id": ObjectId("${clienteId}") },
    { clienteId: "${clienteId}" }
]}`);

        console.log('\n✅ Diagnóstico completado');
    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

main();
