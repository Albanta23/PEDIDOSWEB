const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function verificarLogicaCoincidencia() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión a MongoDB establecida correctamente');
        
        // ID y nombre del cliente a verificar
        const clienteId = "687deb2a96a8842b040c9fc6";
        const clienteNombre = "PASCUAL FERNANDEZ FERNANDEZ";
        
        // Definir esquema para PedidoCliente
        const PedidoClienteSchema = new mongoose.Schema({}, { strict: false });
        const PedidoCliente = mongoose.model('PedidoCliente', PedidoClienteSchema);
        
        // Obtener todos los pedidos
        const allPedidos = await PedidoCliente.find().limit(100);
        console.log(`🔍 Analizando coincidencias en ${allPedidos.length} pedidos...`);
        
        // Simular la lógica de filtrado en el componente
        const pedidosFiltrados = allPedidos.filter(pedido => {
            // Convertir valores a string para comparación segura
            const nombre = String(clienteNombre || '').toLowerCase();
            const pedidoNombre = String(pedido.clienteNombre || '').toLowerCase();
            const pedidoId = String(pedido.clienteId || '').toLowerCase();
            const pedidoCliente = String(pedido.cliente || '').toLowerCase();
            
            // Verificar coincidencia por cualquiera de los campos
            const coincide = pedidoNombre.includes(nombre) || 
                    nombre.includes(pedidoNombre) ||
                    pedidoId.includes(nombre) || 
                    nombre.includes(pedidoId) ||
                    pedidoCliente.includes(nombre) || 
                    nombre.includes(pedidoCliente);
            
            if (coincide) {
                console.log('\n✅ Pedido coincidente:');
                console.log(`   ID: ${pedido._id}`);
                console.log(`   Número: ${pedido.numeroPedido || 'No asignado'}`);
                console.log(`   Cliente en pedido: ${pedido.clienteNombre || 'No disponible'}`);
                console.log(`   ClienteID en pedido: ${pedido.clienteId || 'No disponible'}`);
                console.log(`   Cliente ref: ${pedido.cliente || 'No disponible'}`);
                console.log('   Comparaciones:');
                console.log(`     - ¿"${pedidoNombre}" incluye "${nombre}"? ${pedidoNombre.includes(nombre)}`);
                console.log(`     - ¿"${nombre}" incluye "${pedidoNombre}"? ${nombre.includes(pedidoNombre)}`);
                console.log(`     - ¿"${pedidoId}" incluye "${nombre}"? ${pedidoId.includes(nombre)}`);
                console.log(`     - ¿"${nombre}" incluye "${pedidoId}"? ${nombre.includes(pedidoId)}`);
                console.log(`     - ¿"${pedidoCliente}" incluye "${nombre}"? ${pedidoCliente.includes(nombre)}`);
                console.log(`     - ¿"${nombre}" incluye "${pedidoCliente}"? ${nombre.includes(pedidoCliente)}`);
            }
            
            return coincide;
        });
        
        console.log(`\n📊 Total de pedidos coincidentes: ${pedidosFiltrados.length}`);
        
        // Verificar si el pedido que creamos está entre los coincidentes
        const ultimoPedidoCreado = await PedidoCliente.findOne({ clienteNombre: clienteNombre }).sort({ createdAt: -1 });
        
        if (ultimoPedidoCreado) {
            console.log('\n🔍 Verificando el último pedido creado:');
            
            // Aplicar la misma lógica de filtrado solo a este pedido
            const nombre = String(clienteNombre || '').toLowerCase();
            const pedidoNombre = String(ultimoPedidoCreado.clienteNombre || '').toLowerCase();
            const pedidoId = String(ultimoPedidoCreado.clienteId || '').toLowerCase();
            const pedidoCliente = String(ultimoPedidoCreado.cliente || '').toLowerCase();
            
            console.log(`   ID: ${ultimoPedidoCreado._id}`);
            console.log(`   Fecha: ${ultimoPedidoCreado.fechaPedido}`);
            console.log(`   Cliente en pedido: "${ultimoPedidoCreado.clienteNombre || 'No disponible'}"`);
            console.log(`   ClienteID en pedido: "${ultimoPedidoCreado.clienteId || 'No disponible'}"`);
            console.log(`   Cliente ref: "${ultimoPedidoCreado.cliente || 'No disponible'}"`);
            console.log('   Comparaciones:');
            console.log(`     - ¿"${pedidoNombre}" incluye "${nombre}"? ${pedidoNombre.includes(nombre)}`);
            console.log(`     - ¿"${nombre}" incluye "${pedidoNombre}"? ${nombre.includes(pedidoNombre)}`);
            console.log(`     - ¿"${pedidoId}" incluye "${nombre}"? ${pedidoId.includes(nombre)}`);
            console.log(`     - ¿"${nombre}" incluye "${pedidoId}"? ${nombre.includes(pedidoId)}`);
            console.log(`     - ¿"${pedidoCliente}" incluye "${nombre}"? ${pedidoCliente.includes(nombre)}`);
            console.log(`     - ¿"${nombre}" incluye "${pedidoCliente}"? ${nombre.includes(pedidoCliente)}`);
            
            const coincide = pedidoNombre.includes(nombre) || 
                    nombre.includes(pedidoNombre) ||
                    pedidoId.includes(nombre) || 
                    nombre.includes(pedidoId) ||
                    pedidoCliente.includes(nombre) || 
                    nombre.includes(pedidoCliente);
                    
            console.log(`   ✅ ¿Coincide según nuestra lógica? ${coincide ? 'SÍ' : 'NO'}`);
            
            // Verificar si el pedido aparecería en la interfaz
            console.log('\n👉 Conclusión:');
            if (coincide) {
                console.log('   El pedido DEBERÍA aparecer en la interfaz con la corrección realizada');
            } else {
                console.log('   El pedido NO aparecería en la interfaz a pesar de la corrección');
                console.log('   Puede ser necesario revisar la estructura del pedido o cómo se almacena el cliente');
            }
        } else {
            console.log('❌ No se encontró el pedido creado para este cliente');
        }
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

verificarLogicaCoincidencia();
