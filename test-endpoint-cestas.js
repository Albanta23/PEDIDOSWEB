// Test directo del endpoint
const axios = require('axios');
const fs = require('fs');

async function testEndpoint() {
    try {
        // Leer el CSV de prueba
        const csvContent = fs.readFileSync('/workspaces/PEDIDOSWEB/prueba-cestas-mini.csv', 'utf8');
        console.log('CSV Content:', csvContent.substring(0, 200));
        
        // Parsear CSV igual que el frontend
        const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
        console.log('Lines found:', lines.length);
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        console.log('Headers:', headers);
        
        const clientesCestas = lines.slice(1).map(line => {
            const cols = line.split(',').map(col => col.replace(/"/g, ''));
            const obj = {};
            headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
            
            return {
                nombre: obj.RazonSocial || obj.NomComercial || obj.nombre || obj.Nombre || obj.NOMBRE || '',
                email: obj.Email || obj.email || obj.EMAIL || obj.correo || obj.Correo || '',
                telefono: obj.Telefono || obj.telefono || obj.TELEFONO || obj.tel || obj.Tel || '',
                nif: obj.CIF || obj.nif || obj.NIF || obj.cif || obj.dni || obj.DNI || '',
                direccion: obj.Direccion || obj.direccion || obj.DIRECCION || '',
                codigoPostal: obj.CodPostal || obj.codigoPostal || obj.CODIGO_POSTAL || '',
                poblacion: obj.Poblacion || obj.poblacion || obj.POBLACION || '',
                provincia: obj.Provincia || obj.provincia || obj.PROVINCIA || ''
            };
        }).filter(cliente => cliente.nombre.trim());
        
        console.log('Clientes parseados:', clientesCestas.length);
        console.log('Primer cliente:', clientesCestas[0]);
        
        // Hacer la petición
        const response = await axios.post('https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/api/clientes/marcar-cestas-navidad', {
            clientesCestasNavidad: clientesCestas
        });
        
        console.log('Respuesta:', response.data);
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testEndpoint();
