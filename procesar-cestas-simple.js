/**
 * PROCESADOR SIMPLE DE CESTAS NAVIDEÑAS
 * Compatible con MongoDB 3.6.8
 */

const fs = require('fs');
const csv = require('csv-parser');

// Datos para procesamiento
const clientesData = [];
const cestasData = [];

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
        activo: registro.Activo === 'true',
        fechaRegistro: new Date(),
        categoria: 'CESTAS_NAVIDEÑAS'
    };
}

// Función para determinar el tipo de cesta según criterios
function determinarTipoCesta(cliente) {
    const numCliente = cliente.numCliente;
    const provincia = cliente.provincia.toUpperCase();
    
    // Criterios para asignar tipo de cesta
    if (provincia.includes('MADRID') || provincia.includes('BARCELONA') || provincia.includes('VALENCIA')) {
        return 'DELUXE'; // Ciudades principales -> Cesta Deluxe
    } else if (numCliente % 3 === 0) {
        return 'PREMIUM'; // Cada 3er cliente -> Cesta Premium
    } else {
        return 'BÁSICA'; // Por defecto -> Cesta Básica
    }
}

// Función para generar una cesta navideña
function generarCesta(cliente, numeroOrden) {
    const tipoCesta = determinarTipoCesta(cliente);
    const productos = PRODUCTOS_CESTAS[tipoCesta];
    const precioTotal = productos.reduce((total, producto) => total + (producto.precio * producto.cantidad), 0);
    
    return {
        numeroOrden: numeroOrden,
        cliente: {
            numCliente: cliente.numCliente,
            razonSocial: cliente.razonSocial,
            cif: cliente.cif,
            direccion: cliente.direccion,
            poblacion: cliente.poblacion,
            provincia: cliente.provincia,
            telefono: cliente.telefono,
            email: cliente.email
        },
        tipoCesta: tipoCesta,
        productos: productos,
        precioTotal: Math.round(precioTotal * 100) / 100, // Redondear a 2 decimales
        estado: 'PENDIENTE',
        fechaCreacion: new Date(),
        fechaEntrega: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)), // 15 días después
        formaPago: cliente.formaPago || 'CONTADO',
        descuentoAplicado: cliente.descuento1 || 0,
        historiaEstados: [{
            estado: 'PENDIENTE',
            fecha: new Date(),
            usuario: 'SISTEMA',
            observaciones: 'Cesta generada automáticamente'
        }]
    };
}

// Función para generar el reporte HTML
function generarReporteHTML(clientes, cestas) {
    const fechaGeneracion = new Date().toLocaleString('es-ES');
    
    // Calcular estadísticas
    const totalClientes = clientes.length;
    const clientesActivos = clientes.filter(c => c.activo).length;
    const totalCestas = cestas.length;
    
    const cestasPorTipo = {
        BÁSICA: cestas.filter(c => c.tipoCesta === 'BÁSICA').length,
        PREMIUM: cestas.filter(c => c.tipoCesta === 'PREMIUM').length,
        DELUXE: cestas.filter(c => c.tipoCesta === 'DELUXE').length
    };
    
    const valorTotal = cestas.reduce((total, cesta) => total + cesta.precioTotal, 0);
    const valorPromedio = valorTotal / totalCestas;
    
    const cestasHTML = cestas.map(cesta => `
        <tr>
            <td>${cesta.numeroOrden}</td>
            <td>${cesta.cliente.razonSocial}</td>
            <td>${cesta.cliente.poblacion}</td>
            <td>${cesta.cliente.provincia}</td>
            <td><span class="tipo-${cesta.tipoCesta.toLowerCase()}">${cesta.tipoCesta}</span></td>
            <td>€${cesta.precioTotal.toFixed(2)}</td>
            <td><span class="estado-${cesta.estado.toLowerCase()}">${cesta.estado}</span></td>
        </tr>
    `).join('');
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Cestas Navideñas 2025</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c5530 0%, #5d8a60 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card h3 {
            color: #2c5530;
            font-size: 1.8em;
            margin-bottom: 10px;
        }
        
        .stat-card p {
            color: #666;
            font-size: 1.1em;
        }
        
        .table-container {
            padding: 30px;
            overflow-x: auto;
        }
        
        .table-container h2 {
            color: #2c5530;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            background: #2c5530;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .tipo-básica { background: #28a745; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.9em; }
        .tipo-premium { background: #ffc107; color: #333; padding: 5px 10px; border-radius: 20px; font-size: 0.9em; }
        .tipo-deluxe { background: #dc3545; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.9em; }
        
        .estado-pendiente { background: #17a2b8; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.9em; }
        
        .footer {
            background: #2c5530;
            color: white;
            text-align: center;
            padding: 20px;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #5d8a60 0%, #2c5530 100%);
            color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }
        
        .summary-box h3 {
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-item .number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        
        .summary-item .label {
            font-size: 0.9em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎄 Reporte de Cestas Navideñas 2025 🎄</h1>
            <p class="subtitle">Gestión Completa de Pedidos - Generado el ${fechaGeneracion}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${totalClientes}</h3>
                <p>Total Clientes</p>
            </div>
            <div class="stat-card">
                <h3>${clientesActivos}</h3>
                <p>Clientes Activos</p>
            </div>
            <div class="stat-card">
                <h3>${totalCestas}</h3>
                <p>Cestas Generadas</p>
            </div>
            <div class="stat-card">
                <h3>€${valorTotal.toFixed(2)}</h3>
                <p>Valor Total</p>
            </div>
        </div>
        
        <div class="summary-box">
            <h3>📊 Distribución por Tipo de Cesta</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="number">${cestasPorTipo.BÁSICA}</span>
                    <span class="label">Cestas Básicas</span>
                </div>
                <div class="summary-item">
                    <span class="number">${cestasPorTipo.PREMIUM}</span>
                    <span class="label">Cestas Premium</span>
                </div>
                <div class="summary-item">
                    <span class="number">${cestasPorTipo.DELUXE}</span>
                    <span class="label">Cestas Deluxe</span>
                </div>
                <div class="summary-item">
                    <span class="number">€${valorPromedio.toFixed(2)}</span>
                    <span class="label">Valor Promedio</span>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <h2>📋 Listado Completo de Cestas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nº Orden</th>
                        <th>Cliente</th>
                        <th>Población</th>
                        <th>Provincia</th>
                        <th>Tipo Cesta</th>
                        <th>Precio Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${cestasHTML}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>© 2025 Sistema de Gestión de Pedidos - Cestas Navideñas</p>
            <p>Reporte generado automáticamente el ${fechaGeneracion}</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
}

// Función principal
async function procesarCestasNavidenas() {
    console.log('🎄 INICIANDO PROCESAMIENTO DE CESTAS NAVIDEÑAS 🎄');
    console.log('================================================');
    
    const csvPath = '/workspaces/PEDIDOSWEB/_TabClientes__202506221857.csv';
    
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(csvPath)) {
            return reject(new Error(`Archivo CSV no encontrado: ${csvPath}`));
        }
        
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.NumCliente && row.RazonSocial) {
                    const clienteLimpio = limpiarDatos(row);
                    clientesData.push(clienteLimpio);
                    
                    // Solo generar cestas para clientes activos
                    if (clienteLimpio.activo) {
                        const numeroOrden = 1000 + cestasData.length + 1;
                        const cesta = generarCesta(clienteLimpio, numeroOrden);
                        cestasData.push(cesta);
                    }
                }
            })
            .on('end', () => {
                console.log(`📊 RESUMEN DE IMPORTACIÓN:`);
                console.log(`   • Total registros procesados: ${clientesData.length}`);
                console.log(`   • Clientes activos: ${clientesData.filter(c => c.activo).length}`);
                console.log(`   • Cestas navideñas generadas: ${cestasData.length}`);
                
                // Calcular estadísticas
                const valorTotal = cestasData.reduce((total, cesta) => total + cesta.precioTotal, 0);
                console.log(`   • Valor total del negocio: €${valorTotal.toFixed(2)}`);
                
                // Generar reporte HTML
                console.log('📝 Generando reporte HTML...');
                const reporteHTML = generarReporteHTML(clientesData, cestasData);
                
                // Guardar reporte
                const reportePath = '/workspaces/PEDIDOSWEB/reporte-cestas-navidenas.html';
                fs.writeFileSync(reportePath, reporteHTML);
                console.log(`✅ Reporte HTML generado: ${reportePath}`);
                
                // Guardar datos JSON para referencia
                const datosJSON = {
                    fechaGeneracion: new Date().toISOString(),
                    estadisticas: {
                        totalClientes: clientesData.length,
                        clientesActivos: clientesData.filter(c => c.activo).length,
                        totalCestas: cestasData.length,
                        valorTotal: valorTotal,
                        cestasPorTipo: {
                            BÁSICA: cestasData.filter(c => c.tipoCesta === 'BÁSICA').length,
                            PREMIUM: cestasData.filter(c => c.tipoCesta === 'PREMIUM').length,
                            DELUXE: cestasData.filter(c => c.tipoCesta === 'DELUXE').length
                        }
                    },
                    clientes: clientesData,
                    cestas: cestasData
                };
                
                const jsonPath = '/workspaces/PEDIDOSWEB/datos-cestas-navidenas.json';
                fs.writeFileSync(jsonPath, JSON.stringify(datosJSON, null, 2));
                console.log(`💾 Datos guardados en JSON: ${jsonPath}`);
                
                console.log('');
                console.log('🎉 PROCESAMIENTO COMPLETADO EXITOSAMENTE');
                console.log('=========================================');
                console.log(`✅ ${clientesData.length} clientes procesados`);
                console.log(`✅ ${cestasData.length} cestas navideñas generadas`);
                console.log(`✅ Valor total del negocio: €${valorTotal.toFixed(2)}`);
                console.log(`✅ Reporte HTML generado: reporte-cestas-navidenas.html`);
                console.log(`✅ Datos JSON guardados: datos-cestas-navidenas.json`);
                
                resolve({
                    clientes: clientesData,
                    cestas: cestasData,
                    valorTotal: valorTotal
                });
            })
            .on('error', (error) => {
                console.error('❌ Error procesando CSV:', error);
                reject(error);
            });
    });
}

// Ejecutar el procesamiento
if (require.main === module) {
    procesarCestasNavidenas()
        .then(() => {
            console.log('🎄 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en el proceso:', error);
            process.exit(1);
        });
}

module.exports = { procesarCestasNavidenas };
