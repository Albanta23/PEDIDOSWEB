/**
 * PROCESADOR DE CESTAS NAVIDEÑAS
 * Importa clientes del CSV y genera cestas automáticamente
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Conexión a MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://dbjavier:Albanta2025@cluster0.e16j9g4.mongodb.net/gestion-pedidos?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI);

// Esquemas de la base de datos
const clienteSchema = new mongoose.Schema({
    numCliente: Number,
    razonSocial: String,
    nomComercial: String,
    cif: String,
    direccion: String,
    codPostal: String,
    poblacion: String,
    provincia: String,
    telefono: String,
    fax: String,
    email: String,
    recargoEquiv: Boolean,
    formaPago: String,
    descuento1: Number,
    descuento2: Number,
    descuento3: Number,
    tipoCliente: String,
    exentoIVA: Boolean,
    activo: Boolean,
    // Campos adicionales para el sistema
    fechaRegistro: { type: Date, default: Date.now },
    categoria: { type: String, default: 'CESTAS_NAVIDEÑAS' },
    observaciones: String
});

const cestaNavidenaSchema = new mongoose.Schema({
    numeroOrden: { type: Number, unique: true },
    cliente: {
        numCliente: Number,
        razonSocial: String,
        cif: String,
        direccion: String,
        poblacion: String,
        provincia: String,
        telefono: String,
        email: String
    },
    tipoCesta: {
        type: String,
        enum: ['BÁSICA', 'PREMIUM', 'DELUXE', 'PERSONALIZADA'],
        default: 'BÁSICA'
    },
    productos: [{
        nombre: String,
        cantidad: Number,
        peso: String,
        precio: Number,
        categoria: String
    }],
    precioTotal: { type: Number, default: 0 },
    estado: {
        type: String,
        enum: ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO', 'ENTREGADO', 'CANCELADO'],
        default: 'PENDIENTE'
    },
    fechaCreacion: { type: Date, default: Date.now },
    fechaEntrega: Date,
    observaciones: String,
    descuentoAplicado: Number,
    formaPago: String,
    historiaEstados: [{
        estado: String,
        fecha: { type: Date, default: Date.now },
        usuario: String,
        observaciones: String
    }]
});

// Modelos
const Cliente = mongoose.model('ClienteCestasNavidenas', clienteSchema);
const CestaNavidena = mongoose.model('CestaNavidena', cestaNavidenaSchema);

// Productos predefinidos para las cestas
const PRODUCTOS_CESTAS = {
    BÁSICA: [
        { nombre: 'Jamón Ibérico (500g)', cantidad: 1, peso: '500g', precio: 35.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Chorizo Ibérico (300g)', cantidad: 1, peso: '300g', precio: 12.50, categoria: 'EMBUTIDOS' },
        { nombre: 'Lomo Embuchado (250g)', cantidad: 1, peso: '250g', precio: 18.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Queso Curado (400g)', cantidad: 1, peso: '400g', precio: 15.00, categoria: 'QUESOS' },
        { nombre: 'Vino Tinto Reserva', cantidad: 1, peso: '750ml', precio: 20.00, categoria: 'VINOS' },
        { nombre: 'Aceite de Oliva Virgen Extra (500ml)', cantidad: 1, peso: '500ml', precio: 12.00, categoria: 'ACEITES' }
    ],
    PREMIUM: [
        { nombre: 'Jamón Ibérico Bellota (750g)', cantidad: 1, peso: '750g', precio: 65.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Chorizo Ibérico Premium (400g)', cantidad: 1, peso: '400g', precio: 18.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Lomo Embuchado Premium (350g)', cantidad: 1, peso: '350g', precio: 25.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Salchichón Ibérico (300g)', cantidad: 1, peso: '300g', precio: 16.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Queso Manchego Curado (500g)', cantidad: 1, peso: '500g', precio: 22.00, categoria: 'QUESOS' },
        { nombre: 'Queso Cabrales (250g)', cantidad: 1, peso: '250g', precio: 14.00, categoria: 'QUESOS' },
        { nombre: 'Vino Tinto Gran Reserva', cantidad: 1, peso: '750ml', precio: 35.00, categoria: 'VINOS' },
        { nombre: 'Cava Brut Nature', cantidad: 1, peso: '750ml', precio: 18.00, categoria: 'VINOS' },
        { nombre: 'Aceite de Oliva Premium (500ml)', cantidad: 1, peso: '500ml', precio: 20.00, categoria: 'ACEITES' },
        { nombre: 'Miel Artesanal (250g)', cantidad: 1, peso: '250g', precio: 12.00, categoria: 'DULCES' }
    ],
    DELUXE: [
        { nombre: 'Jamón Ibérico Bellota 5J (1kg)', cantidad: 1, peso: '1kg', precio: 120.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Chorizo Ibérico Bellota (500g)', cantidad: 1, peso: '500g', precio: 28.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Lomo Embuchado Bellota (500g)', cantidad: 1, peso: '500g', precio: 38.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Salchichón Ibérico Bellota (400g)', cantidad: 1, peso: '400g', precio: 24.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Morcilla de Burgos (300g)', cantidad: 1, peso: '300g', precio: 8.00, categoria: 'EMBUTIDOS' },
        { nombre: 'Queso Manchego Gran Reserva (600g)', cantidad: 1, peso: '600g', precio: 35.00, categoria: 'QUESOS' },
        { nombre: 'Queso Cabrales Premium (300g)', cantidad: 1, peso: '300g', precio: 18.00, categoria: 'QUESOS' },
        { nombre: 'Queso de Cabra Semicurado (400g)', cantidad: 1, peso: '400g', precio: 16.00, categoria: 'QUESOS' },
        { nombre: 'Vino Tinto Crianza DO Toro', cantidad: 2, peso: '750ml', precio: 25.00, categoria: 'VINOS' },
        { nombre: 'Cava Premium Brut', cantidad: 1, peso: '750ml', precio: 30.00, categoria: 'VINOS' },
        { nombre: 'Aceite de Oliva Gourmet (750ml)', cantidad: 1, peso: '750ml', precio: 35.00, categoria: 'ACEITES' },
        { nombre: 'Miel de Roble (350g)', cantidad: 1, peso: '350g', precio: 18.00, categoria: 'DULCES' },
        { nombre: 'Paté de Foie Gras (125g)', cantidad: 1, peso: '125g', precio: 28.00, categoria: 'CONSERVAS' },
        { nombre: 'Turron de Jijona Artesanal (200g)', cantidad: 1, peso: '200g', precio: 15.00, categoria: 'DULCES' }
    ]
};

// Función para limpiar y procesar datos del CSV
function limpiarDatos(registro) {
    return {
        numCliente: parseInt(registro.NumCliente) || 0,
        razonSocial: (registro.RazonSocial || '').replace(/"/g, '').trim(),
        nomComercial: (registro.NomComercial || '').replace(/"/g, '').trim(),
        cif: (registro.CIF || '').replace(/"/g, '').trim(),
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

// Función para determinar el tipo de cesta según el cliente
function determinarTipoCesta(cliente) {
    // Lógica para asignar tipo de cesta basada en criterios
    const provincia = cliente.provincia.toUpperCase();
    const formaPago = cliente.formaPago.toUpperCase();
    
    // Clientes VIP (ciertas provincias o formas de pago especiales)
    if (provincia.includes('MADRID') || provincia.includes('BARCELONA') || 
        formaPago.includes('TRANSFERENCI') || formaPago.includes('CONTADO')) {
        return 'PREMIUM';
    }
    
    // Clientes especiales (empresas grandes)
    if (cliente.razonSocial.includes('S.A.') || cliente.razonSocial.includes('S.L.') ||
        cliente.cif.startsWith('A') || cliente.cif.startsWith('B')) {
        return 'PREMIUM';
    }
    
    // Clientes con descuentos especiales
    if (cliente.descuento1 > 0 || cliente.descuento2 > 0) {
        return 'DELUXE';
    }
    
    return 'BÁSICA';
}

// Función para calcular precio total de la cesta
function calcularPrecioTotal(productos, descuento = 0) {
    const subtotal = productos.reduce((total, producto) => {
        return total + (producto.precio * producto.cantidad);
    }, 0);
    
    return subtotal * (1 - descuento / 100);
}

// Función principal para procesar el CSV
async function procesarCestasNavidenas() {
    console.log('🎄 INICIANDO PROCESAMIENTO DE CESTAS NAVIDEÑAS 🎄');
    console.log('================================================');
    
    const csvPath = path.join(__dirname, '_TabClientes__202506221857.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error('❌ Archivo CSV no encontrado:', csvPath);
        return;
    }
    
    const clientes = [];
    const cestas = [];
    let numeroOrden = 1;
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (registro) => {
                try {
                    const clienteLimpio = limpiarDatos(registro);
                    
                    // Solo procesar clientes activos
                    if (clienteLimpio.activo && clienteLimpio.razonSocial) {
                        clientes.push(clienteLimpio);
                        
                        // Crear cesta para este cliente
                        const tipoCesta = determinarTipoCesta(clienteLimpio);
                        const productos = PRODUCTOS_CESTAS[tipoCesta];
                        const descuentoAplicado = Math.max(clienteLimpio.descuento1, clienteLimpio.descuento2, clienteLimpio.descuento3);
                        const precioTotal = calcularPrecioTotal(productos, descuentoAplicado);
                        
                        const cesta = {
                            numeroOrden: numeroOrden++,
                            cliente: {
                                numCliente: clienteLimpio.numCliente,
                                razonSocial: clienteLimpio.razonSocial,
                                cif: clienteLimpio.cif,
                                direccion: clienteLimpio.direccion,
                                poblacion: clienteLimpio.poblacion,
                                provincia: clienteLimpio.provincia,
                                telefono: clienteLimpio.telefono,
                                email: clienteLimpio.email
                            },
                            tipoCesta: tipoCesta,
                            productos: productos,
                            precioTotal: Math.round(precioTotal * 100) / 100,
                            estado: 'PENDIENTE',
                            fechaEntrega: new Date(2025, 11, 20), // 20 de diciembre de 2025
                            descuentoAplicado: descuentoAplicado,
                            formaPago: clienteLimpio.formaPago,
                            observaciones: `Cesta navideña automática - Cliente: ${clienteLimpio.razonSocial}`,
                            historiaEstados: [{
                                estado: 'PENDIENTE',
                                fecha: new Date(),
                                usuario: 'SISTEMA_AUTOMATICO',
                                observaciones: 'Cesta creada automáticamente desde importación CSV'
                            }]
                        };
                        
                        cestas.push(cesta);
                    }
                } catch (error) {
                    console.warn('⚠️ Error procesando registro:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    console.log(`📊 RESUMEN DE IMPORTACIÓN:`);
                    console.log(`   • Total registros procesados: ${clientes.length}`);
                    console.log(`   • Cestas navideñas generadas: ${cestas.length}`);
                    
                    // Limpiar colecciones existentes
                    await Cliente.deleteMany({});
                    await CestaNavidena.deleteMany({});
                    
                    // Insertar clientes
                    console.log('\n💾 Guardando clientes en base de datos...');
                    await Cliente.insertMany(clientes);
                    console.log(`✅ ${clientes.length} clientes guardados correctamente`);
                    
                    // Insertar cestas
                    console.log('\n🎁 Guardando cestas navideñas...');
                    await CestaNavidena.insertMany(cestas);
                    console.log(`✅ ${cestas.length} cestas navideñas creadas correctamente`);
                    
                    // Estadísticas por tipo de cesta
                    const estadisticas = {};
                    cestas.forEach(cesta => {
                        estadisticas[cesta.tipoCesta] = (estadisticas[cesta.tipoCesta] || 0) + 1;
                    });
                    
                    console.log('\n📈 ESTADÍSTICAS POR TIPO DE CESTA:');
                    Object.entries(estadisticas).forEach(([tipo, cantidad]) => {
                        const precio = calcularPrecioTotal(PRODUCTOS_CESTAS[tipo]);
                        console.log(`   • ${tipo}: ${cantidad} cestas (€${precio.toFixed(2)} cada una)`);
                    });
                    
                    // Calcular valor total del negocio
                    const valorTotal = cestas.reduce((total, cesta) => total + cesta.precioTotal, 0);
                    console.log(`\n💰 VALOR TOTAL DEL NEGOCIO: €${valorTotal.toFixed(2)}`);
                    
                    console.log('\n🎉 ¡PROCESAMIENTO COMPLETADO EXITOSAMENTE! 🎉');
                    resolve();
                    
                } catch (error) {
                    console.error('❌ Error guardando en base de datos:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('❌ Error leyendo CSV:', error);
                reject(error);
            });
    });
}

// Función para generar reporte HTML
async function generarReporteHTML() {
    console.log('\n📋 Generando reporte HTML...');
    
    const cestas = await CestaNavidena.find({}).sort({ numeroOrden: 1 });
    const estadisticas = {};
    let valorTotal = 0;
    
    cestas.forEach(cesta => {
        estadisticas[cesta.tipoCesta] = (estadisticas[cesta.tipoCesta] || 0) + 1;
        valorTotal += cesta.precioTotal;
    });
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎄 Reporte Cestas Navideñas 2025</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c5530; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .table-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .tipo-basica { color: #28a745; }
        .tipo-premium { color: #fd7e14; }
        .tipo-deluxe { color: #dc3545; }
        .valor-total { font-size: 1.5em; font-weight: bold; color: #2c5530; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎄 Reporte Cestas Navideñas 2025</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>📊 Total Cestas</h3>
            <div style="font-size: 2em; font-weight: bold; color: #2c5530;">${cestas.length}</div>
        </div>
        ${Object.entries(estadisticas).map(([tipo, cantidad]) => `
        <div class="stat-card">
            <h3>🎁 ${tipo}</h3>
            <div style="font-size: 1.5em; font-weight: bold;" class="tipo-${tipo.toLowerCase()}">${cantidad} cestas</div>
            <small>€${calcularPrecioTotal(PRODUCTOS_CESTAS[tipo]).toFixed(2)} cada una</small>
        </div>
        `).join('')}
        <div class="stat-card">
            <h3>💰 Valor Total</h3>
            <div class="valor-total">€${valorTotal.toFixed(2)}</div>
        </div>
    </div>
    
    <div class="table-container">
        <h2>📋 Listado de Cestas</h2>
        <table>
            <thead>
                <tr>
                    <th>Nº Orden</th>
                    <th>Cliente</th>
                    <th>Población</th>
                    <th>Tipo Cesta</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Fecha Entrega</th>
                </tr>
            </thead>
            <tbody>
                ${cestas.map(cesta => `
                <tr>
                    <td>${cesta.numeroOrden}</td>
                    <td>${cesta.cliente.razonSocial}</td>
                    <td>${cesta.cliente.poblacion} (${cesta.cliente.provincia})</td>
                    <td><span class="tipo-${cesta.tipoCesta.toLowerCase()}">${cesta.tipoCesta}</span></td>
                    <td>€${cesta.precioTotal.toFixed(2)}</td>
                    <td>${cesta.estado}</td>
                    <td>${new Date(cesta.fechaEntrega).toLocaleDateString('es-ES')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; text-align: center;">
        <small>🎄 Sistema de Gestión de Cestas Navideñas - Generado automáticamente 🎄</small>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(__dirname, 'reporte-cestas-navidenas.html'), html);
    console.log('✅ Reporte HTML generado: reporte-cestas-navidenas.html');
}

// Ejecutar el proceso
async function main() {
    try {
        await procesarCestasNavidenas();
        await generarReporteHTML();
        
        console.log('\n🎊 ¡PROCESO COMPLETADO! 🎊');
        console.log('Los archivos generados están listos para usar.');
        
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
    procesarCestasNavidenas,
    generarReporteHTML,
    PRODUCTOS_CESTAS
};
