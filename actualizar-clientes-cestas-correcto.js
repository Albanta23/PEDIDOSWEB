const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Configuración de la base de datos - USA LA MISMA QUE EL SISTEMA DE GESTIÓN
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    database: process.env.DB_NAME || 'pedidos_db_local'  // CAMBIO: misma BD que gestión de clientes
};

const MONGO_URI = `mongodb://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;

// Modelo de Cliente (definición completa)
const ClienteSchema = new mongoose.Schema({
    codigo: { type: String },
    nombre: { type: String, required: true },
    razonSocial: { type: String },
    nif: { type: String },
    email: { type: String },
    telefono: { type: String },
    direccion: { type: String },
    codigoPostal: { type: String },
    poblacion: { type: String },
    provincia: { type: String },
    contacto: { type: String },
    mensajeVentas: { type: String },
    bloqueadoVentas: { type: Boolean, default: false },
    observaciones: { type: String },
    activo: { type: Boolean, default: true },
    esCestaNavidad: { type: Boolean, default: false }
});

const Cliente = mongoose.model('Cliente', ClienteSchema);

// Función para normalizar nombres y comparar
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString()
        .toUpperCase()
        .replace(/[ÁÀÄÂ]/g, 'A')
        .replace(/[ÉÈËÊ]/g, 'E')
        .replace(/[ÍÌÏÎ]/g, 'I')
        .replace(/[ÓÒÖÔ]/g, 'O')
        .replace(/[ÚÙÜÛ]/g, 'U')
        .replace(/Ñ/g, 'N')
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}

// Función para buscar cliente existente
async function buscarClienteExistente(clienteCSV) {
    const nombreNormalizado = normalizarTexto(clienteCSV.nombre);
    const nifNormalizado = normalizarTexto(clienteCSV.nif);
    const telefonoNormalizado = normalizarTexto(clienteCSV.telefono);

    // Búsqueda por múltiples criterios
    const criterios = [];

    // Búsqueda por nombre (simplificada)
    if (nombreNormalizado) {
        criterios.push({
            nombre: { $regex: new RegExp(clienteCSV.nombre.replace(/[^A-Z0-9]/gi, ''), 'i') }
        });
    }

    // Búsqueda por NIF
    if (nifNormalizado) {
        criterios.push({ nif: { $regex: new RegExp(clienteCSV.nif.replace(/[^A-Z0-9]/g, ''), 'i') } });
    }

    // Búsqueda por teléfono
    if (telefonoNormalizado) {
        criterios.push({ telefono: { $regex: new RegExp(clienteCSV.telefono.replace(/[^0-9]/g, ''), 'i') } });
    }

    if (criterios.length === 0) return null;

    return await Cliente.findOne({ $or: criterios });
}

// Función principal para procesar clientes
async function procesarClientesCestas() {
    try {
        // Conectar a MongoDB
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conexión exitosa a MongoDB\n');

        const clientes = [];
        const csvPath = '/workspaces/PEDIDOSWEB/_TabClientes__202506221857.csv';

        // Leer archivo CSV
        console.log('📖 Leyendo archivo CSV...');
        
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv({
                    headers: ['id', 'nombre', 'razonSocial', 'nif', 'direccion', 'codigoPostal', 
                             'poblacion', 'provincia', 'telefono', 'fax', 'email', 'esCliente', 
                             'formaPago', 'dto1', 'dto2', 'dto3', 'cuentaContable', 'bloqueado', 'activo']
                }))
                .on('data', (row) => {
                    if (row.nombre && row.nombre.trim()) {
                        clientes.push({
                            nombre: row.nombre.trim(),
                            razonSocial: row.razonSocial ? row.razonSocial.trim() : row.nombre.trim(),
                            nif: row.nif ? row.nif.trim() : '',
                            direccion: row.direccion ? row.direccion.trim() : '',
                            codigoPostal: row.codigoPostal ? row.codigoPostal.trim() : '',
                            poblacion: row.poblacion ? row.poblacion.trim() : '',
                            provincia: row.provincia ? row.provincia.trim() : '',
                            telefono: row.telefono ? row.telefono.trim() : '',
                            email: row.email ? row.email.trim() : '',
                            activo: true,
                            esCestaNavidad: true // TODOS los del CSV son clientes de cestas
                        });
                    }
                })
                .on('end', () => {
                    console.log(`📋 Total clientes en CSV: ${clientes.length}\n`);
                    resolve();
                })
                .on('error', reject);
        });

        // Procesar los clientes después de leer el CSV
        await procesarLotes(clientes);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Procesar en lotes para mejor rendimiento
async function procesarLotes(clientes) {
    const TAMAÑO_LOTE = 50;
    const totalLotes = Math.ceil(clientes.length / TAMAÑO_LOTE);
    
    let totalActualizados = 0;
    let totalCreados = 0;
    let errores = 0;
    
    const reporte = {
        actualizados: [],
        creados: [],
        errores: []
    };

    for (let i = 0; i < totalLotes; i++) {
        const inicio = i * TAMAÑO_LOTE;
        const fin = Math.min(inicio + TAMAÑO_LOTE, clientes.length);
        const lote = clientes.slice(inicio, fin);
        
        console.log(`📦 Procesando lote ${i + 1}/${totalLotes} (${lote.length} clientes)...`);
        
        for (const clienteCSV of lote) {
            try {
                const clienteExistente = await buscarClienteExistente(clienteCSV);
                
                if (clienteExistente) {
                    // CLIENTE EXISTENTE: Marcarlo como cliente normal Y de cestas
                    await Cliente.findByIdAndUpdate(clienteExistente._id, {
                        $set: {
                            activo: true,           // Marcarlo como cliente normal
                            esCestaNavidad: true,   // Marcarlo como cliente de cestas
                            // Actualizar otros datos si están vacíos
                            ...(clienteCSV.telefono && !clienteExistente.telefono && { telefono: clienteCSV.telefono }),
                            ...(clienteCSV.email && !clienteExistente.email && { email: clienteCSV.email }),
                            ...(clienteCSV.direccion && !clienteExistente.direccion && { direccion: clienteCSV.direccion }),
                            ...(clienteCSV.codigoPostal && !clienteExistente.codigoPostal && { codigoPostal: clienteCSV.codigoPostal }),
                            ...(clienteCSV.poblacion && !clienteExistente.poblacion && { poblacion: clienteCSV.poblacion }),
                            ...(clienteCSV.provincia && !clienteExistente.provincia && { provincia: clienteCSV.provincia })
                        }
                    });
                    
                    console.log(`✅ ACTUALIZADO: ${clienteExistente.nombre} → Cliente Normal + Cestas`);
                    totalActualizados++;
                    reporte.actualizados.push({
                        nombre: clienteExistente.nombre,
                        nif: clienteExistente.nif,
                        accion: 'Marcado como cliente normal + cestas'
                    });
                } else {
                    // CLIENTE NUEVO: Crear como cliente de cestas únicamente
                    const nuevoCliente = new Cliente({
                        ...clienteCSV,
                        activo: false,          // NO es cliente normal todavía
                        esCestaNavidad: true    // SÍ es cliente de cestas
                    });
                    
                    await nuevoCliente.save();
                    console.log(`🆕 CREADO: ${nuevoCliente.nombre} → Solo Cliente Cestas`);
                    totalCreados++;
                    reporte.creados.push({
                        nombre: nuevoCliente.nombre,
                        nif: nuevoCliente.nif,
                        accion: 'Creado solo como cliente cestas'
                    });
                }
            } catch (error) {
                console.error(`❌ Error procesando ${clienteCSV.nombre}:`, error.message);
                errores++;
                reporte.errores.push({
                    nombre: clienteCSV.nombre,
                    error: error.message
                });
            }
        }
    }

    // Resumen final
    console.log('\n🎊 PROCESO COMPLETADO 🎊');
    console.log('================================');
    console.log(`📊 Total procesados: ${clientes.length}`);
    console.log(`✅ Clientes actualizados (Normal + Cestas): ${totalActualizados}`);
    console.log(`🆕 Clientes nuevos creados (Solo Cestas): ${totalCreados}`);
    console.log(`❌ Errores: ${errores}`);
    
    // Obtener estadísticas finales
    const totalClientesNormales = await Cliente.countDocuments({ activo: true });
    const totalClientesCestas = await Cliente.countDocuments({ esCestaNavidad: true });
    const totalClientesAmbos = await Cliente.countDocuments({ activo: true, esCestaNavidad: true });
    
    console.log('\n📈 ESTADÍSTICAS FINALES:');
    console.log(`👥 Total clientes normales: ${totalClientesNormales}`);
    console.log(`🎄 Total clientes cestas: ${totalClientesCestas}`);
    console.log(`🎯 Clientes con ambas categorías: ${totalClientesAmbos}`);

    // Guardar reporte detallado
    const reporteCompleto = {
        fecha: new Date().toISOString(),
        resumen: {
            procesados: clientes.length,
            actualizados: totalActualizados,
            creados: totalCreados,
            errores: errores
        },
        estadisticasFinales: {
            clientesNormales: totalClientesNormales,
            clientesCestas: totalClientesCestas,
            clientesAmbos: totalClientesAmbos
        },
        detalles: reporte
    };

    fs.writeFileSync(
        '/workspaces/PEDIDOSWEB/reporte-cestas-correcto.json',
        JSON.stringify(reporteCompleto, null, 2)
    );
    
    console.log('\n📄 Reporte guardado: reporte-cestas-correcto.json');
    console.log('\n✨ Los clientes están listos para usar en clientes-gestión');
}

// Ejecutar el script
if (require.main === module) {
    procesarClientesCestas().then(() => {
        console.log('\n🎉 Script completado exitosamente');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { procesarClientesCestas };
