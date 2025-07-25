const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Función simplificada para buscar clientes por nombre
async function buscarClientes() {
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
        
        // Buscar clientes que contengan "Pascual" o "Fernandez" en su nombre
        const clientes = await Cliente.find({
            nombre: { $regex: /pascual|fernandez/i }
        }).limit(10);
        
        if (clientes.length === 0) {
            console.log('❌ No se encontraron clientes con nombres similares a "Pascual Fernandez Fernandez"');
            return;
        }
        
        console.log(`✅ Se encontraron ${clientes.length} clientes con nombres similares:`);
        
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

buscarClientes();
