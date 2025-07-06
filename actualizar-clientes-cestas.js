/**
 * ACTUALIZADOR DE CLIENTES PARA CESTAS NAVIDEÑAS
 * Lee el CSV y marca los clientes existentes como "clientes de cestas navideñas"
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Conexión a MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://dbjavier:Albanta2025@cluster0.e16j9g4.mongodb.net/gestion-pedidos?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI);

// Esquema del cliente existente (asumo que ya existe en tu base de datos)
const clienteSchema = new mongoose.Schema({
    nombre: String,
    razonSocial: String,
    cif: String,
    direccion: String,
    telefono: String,
    email: String,
    poblacion: String,
    provincia: String,
    codPostal: String,
    activo: { type: Boolean, default: true },
    fechaRegistro: { type: Date, default: Date.now },
    
    // NUEVO CAMPO PARA CESTAS NAVIDEÑAS
    esClienteCestasNavidenas: { type: Boolean, default: false },
    fechaMarcadoCestas: Date,
    observacionesCestas: String,
    
    // Datos adicionales del CSV si no existen
    nomComercial: String,
    formaPago: String,
    descuento1: Number,
    descuento2: Number,
    descuento3: Number,
    tipoCliente: String,
    fax: String,
    recargoEquiv: Boolean,
    exentoIVA: Boolean
}, { 
    collection: 'clientes',  // Usar la colección existente de clientes
    timestamps: true 
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Función para limpiar datos del CSV
function limpiarDatosCSV(registro) {
    return {
        numCliente: parseInt(registro.NumCliente) || 0,
        razonSocial: (registro.RazonSocial || '').replace(/"/g, '').trim(),
        nomComercial: (registro.NomComercial || '').replace(/"/g, '').trim(),
        cif: (registro.CIF || '').replace(/"/g, '').trim().toUpperCase(),
        direccion: (registro.Direccion || '').replace(/"/g, '').trim(),
        codPostal: (registro.CodPostal || '').replace(/"/g, '').trim(),
        poblacion: (registro.Poblacion || '').replace(/"/g, '').trim(),
        provincia: (registro.Provincia || '').replace(/"/g, '').trim(),
        telefono: (registro.Telefono || '').replace(/"/g, '').trim(),
        fax: (registro.Fax || '').replace(/"/g, '').trim(),
        email: (registro.Email || '').replace(/"/g, '').trim(),
        recargoEquiv: registro.RecargoEquiv === 'true',
        formaPago: (registro.FormaPago || '').replace(/"/g, '').trim(),
        descuento1: parseFloat(registro.Descuento1) || 0,
        descuento2: parseFloat(registro.Descuento2) || 0,
        descuento3: parseFloat(registro.Descuento3) || 0,
        tipoCliente: (registro.TipoCliente || '').replace(/"/g, '').trim(),
        exentoIVA: registro.ExentoIVA === 'true',
        activo: registro.Activo === 'true'
    };
}

// Función para buscar coincidencias de clientes
async function buscarCoincidenciaCliente(clienteCSV) {
    // Buscar por CIF (más confiable)
    if (clienteCSV.cif) {
        const porCIF = await Cliente.findOne({ 
            cif: { $regex: new RegExp(clienteCSV.cif, 'i') }
        });
        if (porCIF) return { cliente: porCIF, metodo: 'CIF' };
    }
    
    // Buscar por razón social exacta
    if (clienteCSV.razonSocial) {
        const porRazonSocial = await Cliente.findOne({ 
            $or: [
                { razonSocial: { $regex: new RegExp(clienteCSV.razonSocial, 'i') } },
                { nombre: { $regex: new RegExp(clienteCSV.razonSocial, 'i') } }
            ]
        });
        if (porRazonSocial) return { cliente: porRazonSocial, metodo: 'RAZON_SOCIAL' };
    }
    
    // Buscar por teléfono
    if (clienteCSV.telefono) {
        const porTelefono = await Cliente.findOne({ 
            telefono: { $regex: new RegExp(clienteCSV.telefono.replace(/\s/g, ''), 'i') }
        });
        if (porTelefono) return { cliente: porTelefono, metodo: 'TELEFONO' };
    }
    
    // Buscar por email
    if (clienteCSV.email) {
        const porEmail = await Cliente.findOne({ 
            email: { $regex: new RegExp(clienteCSV.email, 'i') }
        });
        if (porEmail) return { cliente: porEmail, metodo: 'EMAIL' };
    }
    
    return null;
}

// Función principal para procesar el CSV y actualizar clientes
async function actualizarClientesCestas() {
    console.log('🎄 INICIANDO ACTUALIZACIÓN DE CLIENTES PARA CESTAS NAVIDEÑAS 🎄');
    console.log('================================================================');
    
    const csvPath = path.join(__dirname, '_TabClientes__202506221857.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error('❌ Archivo CSV no encontrado:', csvPath);
        return;
    }
    
    const clientesCSV = [];
    const resultados = {
        procesados: 0,
        coincidencias: 0,
        actualizados: 0,
        nuevos: 0,
        errores: 0,
        detalles: []
    };
    
    console.log('📖 Leyendo archivo CSV...');
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (registro) => {
                try {
                    const clienteLimpio = limpiarDatosCSV(registro);
                    if (clienteLimpio.razonSocial && clienteLimpio.activo) {
                        clientesCSV.push(clienteLimpio);
                    }
                } catch (error) {
                    console.warn('⚠️ Error procesando registro CSV:', error.message);
                    resultados.errores++;
                }
            })
            .on('end', async () => {
                try {
                    console.log(`📊 ${clientesCSV.length} clientes activos encontrados en CSV`);
                    console.log('\n🔍 Buscando coincidencias con clientes existentes...\n');
                    
                    // Procesar en lotes para archivos grandes
                    const LOTE_SIZE = 50;
                    const totalLotes = Math.ceil(clientesCSV.length / LOTE_SIZE);
                    let loteActual = 0;
                    
                    for (let i = 0; i < clientesCSV.length; i += LOTE_SIZE) {
                        loteActual++;
                        const lote = clientesCSV.slice(i, i + LOTE_SIZE);
                        console.log(`\n📦 Procesando lote ${loteActual}/${totalLotes} (${lote.length} clientes)...`);
                        
                        for (const clienteCSV of lote) {
                        resultados.procesados++;
                        
                        try {
                            const coincidencia = await buscarCoincidenciaCliente(clienteCSV);
                            
                            if (coincidencia) {
                                // CLIENTE ENCONTRADO - ACTUALIZAR CON MARCA DE CESTAS
                                resultados.coincidencias++;
                                
                                const clienteExistente = coincidencia.cliente;
                                
                                // Actualizar campos del cliente existente
                                const actualizacion = {
                                    esClienteCestasNavidenas: true,
                                    fechaMarcadoCestas: new Date(),
                                    observacionesCestas: `Marcado como cliente de cestas navideñas desde CSV. Método: ${coincidencia.metodo}`,
                                    
                                    // Actualizar datos adicionales si no existen
                                    ...((!clienteExistente.nomComercial && clienteCSV.nomComercial) && { nomComercial: clienteCSV.nomComercial }),
                                    ...((!clienteExistente.formaPago && clienteCSV.formaPago) && { formaPago: clienteCSV.formaPago }),
                                    ...((!clienteExistente.tipoCliente && clienteCSV.tipoCliente) && { tipoCliente: clienteCSV.tipoCliente }),
                                    ...((!clienteExistente.fax && clienteCSV.fax) && { fax: clienteCSV.fax }),
                                    
                                    // Actualizar descuentos si son mayores
                                    ...((clienteCSV.descuento1 > (clienteExistente.descuento1 || 0)) && { descuento1: clienteCSV.descuento1 }),
                                    ...((clienteCSV.descuento2 > (clienteExistente.descuento2 || 0)) && { descuento2: clienteCSV.descuento2 }),
                                    ...((clienteCSV.descuento3 > (clienteExistente.descuento3 || 0)) && { descuento3: clienteCSV.descuento3 }),
                                    
                                    // Actualizar flags booleanos
                                    ...(clienteCSV.recargoEquiv !== undefined && { recargoEquiv: clienteCSV.recargoEquiv }),
                                    ...(clienteCSV.exentoIVA !== undefined && { exentoIVA: clienteCSV.exentoIVA })
                                };
                                
                                await Cliente.findByIdAndUpdate(clienteExistente._id, actualizacion);
                                resultados.actualizados++;
                                
                                console.log(`✅ ${coincidencia.metodo}: ${clienteCSV.razonSocial} → MARCADO COMO CLIENTE CESTAS`);
                                
                                resultados.detalles.push({
                                    accion: 'ACTUALIZADO',
                                    metodo: coincidencia.metodo,
                                    cliente: clienteCSV.razonSocial,
                                    id: clienteExistente._id
                                });
                                
                            } else {
                                // CLIENTE NO ENCONTRADO - CREAR NUEVO CON MARCA DE CESTAS
                                const nuevoCliente = new Cliente({
                                    nombre: clienteCSV.razonSocial,
                                    razonSocial: clienteCSV.razonSocial,
                                    nomComercial: clienteCSV.nomComercial,
                                    cif: clienteCSV.cif,
                                    direccion: clienteCSV.direccion,
                                    telefono: clienteCSV.telefono,
                                    email: clienteCSV.email,
                                    poblacion: clienteCSV.poblacion,
                                    provincia: clienteCSV.provincia,
                                    codPostal: clienteCSV.codPostal,
                                    formaPago: clienteCSV.formaPago,
                                    tipoCliente: clienteCSV.tipoCliente,
                                    fax: clienteCSV.fax,
                                    descuento1: clienteCSV.descuento1,
                                    descuento2: clienteCSV.descuento2,
                                    descuento3: clienteCSV.descuento3,
                                    recargoEquiv: clienteCSV.recargoEquiv,
                                    exentoIVA: clienteCSV.exentoIVA,
                                    activo: clienteCSV.activo,
                                    
                                    // MARCAR COMO CLIENTE DE CESTAS NAVIDEÑAS
                                    esClienteCestasNavidenas: true,
                                    fechaMarcadoCestas: new Date(),
                                    observacionesCestas: 'Cliente nuevo creado desde CSV de cestas navideñas'
                                });
                                
                                await nuevoCliente.save();
                                resultados.nuevos++;
                                
                                console.log(`🆕 NUEVO: ${clienteCSV.razonSocial} → CREADO CON MARCA CESTAS`);
                                
                                resultados.detalles.push({
                                    accion: 'CREADO',
                                    metodo: 'NUEVO',
                                    cliente: clienteCSV.razonSocial,
                                    id: nuevoCliente._id
                                });
                            }
                            
                        } catch (error) {
                            console.error(`❌ Error procesando ${clienteCSV.razonSocial}:`, error.message);
                            resultados.errores++;
                        }
                    }
                    }
                    
                    // REPORTE FINAL
                    console.log('\n🎊 ACTUALIZACIÓN COMPLETADA 🎊');
                    console.log('================================');
                    console.log(`📊 Registros procesados: ${resultados.procesados}`);
                    console.log(`🎯 Coincidencias encontradas: ${resultados.coincidencias}`);
                    console.log(`✅ Clientes actualizados: ${resultados.actualizados}`);
                    console.log(`🆕 Clientes nuevos creados: ${resultados.nuevos}`);
                    console.log(`❌ Errores: ${resultados.errores}`);
                    
                    // Verificar total de clientes con marca de cestas
                    const totalClientesCestas = await Cliente.countDocuments({ esClienteCestasNavidenas: true });
                    console.log(`\n🎄 TOTAL CLIENTES DE CESTAS NAVIDEÑAS: ${totalClientesCestas}`);
                    
                    // Generar reporte JSON
                    const reporte = {
                        fechaProcesamiento: new Date().toISOString(),
                        archivo: csvPath,
                        resultados: resultados,
                        totalClientesCestasNavidenas: totalClientesCestas
                    };
                    
                    const reportePath = path.join(__dirname, 'reporte-actualizacion-cestas.json');
                    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
                    console.log(`📄 Reporte guardado: ${reportePath}`);
                    
                    console.log('\n✨ Los clientes marcados están listos para usar en gestor-cestas-navideñas-pro');
                    
                    resolve(reporte);
                    
                } catch (error) {
                    console.error('💥 Error en el procesamiento:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('❌ Error leyendo CSV:', error);
                reject(error);
            });
    });
}

// Función para listar clientes de cestas navideñas
async function listarClientesCestasNavidenas() {
    console.log('\n📋 LISTADO DE CLIENTES DE CESTAS NAVIDEÑAS');
    console.log('===========================================');
    
    const clientes = await Cliente.find({ 
        esClienteCestasNavidenas: true 
    }).select('nombre razonSocial cif poblacion provincia fechaMarcadoCestas').sort({ fechaMarcadoCestas: -1 });
    
    console.log(`Total: ${clientes.length} clientes\n`);
    
    clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.razonSocial || cliente.nombre}`);
        console.log(`   CIF: ${cliente.cif || 'N/A'}`);
        console.log(`   Ubicación: ${cliente.poblacion || 'N/A'}, ${cliente.provincia || 'N/A'}`);
        console.log(`   Marcado: ${cliente.fechaMarcadoCestas ? cliente.fechaMarcadoCestas.toLocaleDateString('es-ES') : 'N/A'}`);
        console.log('');
    });
    
    return clientes;
}

// Ejecutar el proceso
async function main() {
    try {
        await actualizarClientesCestas();
        await listarClientesCestasNavidenas();
        
        console.log('🎉 PROCESO COMPLETADO - Clientes listos para gestor-cestas-navideñas-pro');
        
    } catch (error) {
        console.error('💥 Error en el proceso:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = {
    actualizarClientesCestas,
    listarClientesCestasNavidenas
};
