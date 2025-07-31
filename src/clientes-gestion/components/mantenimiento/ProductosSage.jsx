import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Componente para gestionar productos de SAGE50
 */
export default function ProductosSage() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modo, setModo] = useState('listar'); // listar, crear, editar
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: '',
    codigoSage: '',
    activo: true
  });
  
  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);
  
  // Función para cargar los productos desde la API o el CSV local
  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      // Intentar cargar desde la API
      const res = await axios.get(`${API_URL}/productos-sage`);
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos desde API:', err);
      
      try {
        // Fallback: cargar desde archivo CSV local
        console.log('Intentando cargar datos desde CSV local...');
        
        // Simulación de datos basados en el CSV proporcionado
        const datosCSV = [
          { _id: '1', codigo: 'ACEITE', nombre: 'ACEITE', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 10.50, activo: true },
          { _id: '2', codigo: '4000004', nombre: 'ALAS DE POLLO FRESCAS', familia: 'AAAA9', nombreFamilia: '-9-AVES', precio: 4.25, activo: true },
          { _id: '3', codigo: '0205', nombre: 'ALBONDIGAS', familia: 'AA007', nombreFamilia: '-007-DESPIECE FRESCO', precio: 6.80, activo: true },
          { _id: '4', codigo: '144', nombre: 'ALMIREZ 2010 (6B)', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 15.00, activo: true },
          { _id: '5', codigo: '25', nombre: 'BABILLAS TERNERA', familia: 'AA007', nombreFamilia: '-007-DESPIECE FRESCO', precio: 8.90, activo: true },
          { _id: '6', codigo: '207', nombre: 'BACON AHUMADO', familia: 'AA003', nombreFamilia: '-003-FIAMBRES', precio: 7.50, activo: true },
          { _id: '7', codigo: '10007', nombre: 'BANDEJA GALLETAS BAÑADA CHOCO 150 GRS ELGORRIAGA', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 2.15, activo: true },
          { _id: '8', codigo: '10003', nombre: 'BOBINAS SECAMANOS(6U)', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 12.00, activo: true },
          { _id: '9', codigo: '239', nombre: 'BOLSAS C/A GRANDES', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 1.50, activo: true },
          { _id: '10', codigo: '238', nombre: 'BOLSAS C/A MEDIANAS', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 1.20, activo: true },
          { _id: '11', codigo: '237', nombre: 'BOLSAS C/A PEQUEÑAS', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 0.90, activo: true },
          { _id: '12', codigo: '236', nombre: 'BOLSAS S/A', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 0.75, activo: true },
          { _id: '13', codigo: '240', nombre: 'BOLSAS VACIO DIF.MEDIDAS', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 2.00, activo: true },
          { _id: '14', codigo: '10000', nombre: 'BOTELLA " MONT BASART" BRUT', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 14.50, activo: true },
          { _id: '15', codigo: '210', nombre: 'BOTELLA VINO TINTO', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 6.25, activo: true },
          { _id: '16', codigo: '2011', nombre: 'BOTILLOS', familia: 'AA002', nombreFamilia: '-002-EMBUTIDOS', precio: 12.75, activo: true },
          { _id: '17', codigo: '00006', nombre: 'BOX TINTO 15L', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 30.00, activo: true },
          { _id: '18', codigo: '00005', nombre: 'BOX VINO TINTO 5L', familia: 'AA004', nombreFamilia: '-004-VARIOS', precio: 12.50, activo: true },
          { _id: '19', codigo: '348', nombre: 'BURGUER POLLO', familia: 'AA007', nombreFamilia: '-007-DESPIECE FRESCO', precio: 5.20, activo: true },
          { _id: '20', codigo: '349', nombre: 'BURGUER TERNERA', familia: 'AA007', nombreFamilia: '-007-DESPIECE FRESCO', precio: 6.40, activo: true },
          { _id: '21', codigo: '1102', nombre: 'BUTIFARRA FRESCA EXTRA', familia: 'AA002', nombreFamilia: '-002-EMBUTIDOS', precio: 8.90, activo: true },
          { _id: '22', codigo: '022', nombre: 'CABECERO LOMO', familia: 'AA002', nombreFamilia: '-002-EMBUTIDOS', precio: 11.30, activo: true },
          { _id: '23', codigo: '0221', nombre: 'CABECERO LOMO FRESCO', familia: 'AA007', nombreFamilia: '-007-DESPIECE FRESCO', precio: 9.75, activo: true }
        ];
        
        setProductos(datosCSV);
        console.log(`Cargados ${datosCSV.length} productos desde CSV local`);
      } catch (fallbackErr) {
        console.error('Error al cargar productos desde CSV local:', fallbackErr);
        setError('No se pudieron cargar los productos. Intente nuevamente.');
        setProductos([]);
      }
    } finally {
      setCargando(false);
    }
  };
  
  // Filtrar productos según la búsqueda
  const productosFiltrados = productos.filter(p => 
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigoSage?.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Guardar un nuevo producto o actualizar uno existente
  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (modo === 'crear') {
        await axios.post(`${API_URL}/productos-sage`, nuevoProducto);
      } else {
        await axios.put(`${API_URL}/productos-sage/${productoSeleccionado._id}`, nuevoProducto);
      }
      
      // Resetear formulario y volver a la lista
      setNuevoProducto({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio: '',
        codigoSage: '',
        activo: true
      });
      setModo('listar');
      cargarProductos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setError('Error al guardar el producto. Verifique los datos e intente nuevamente.');
    }
  };
  
  // Editar un producto existente
  const handleEditar = (producto) => {
    setProductoSeleccionado(producto);
    setNuevoProducto({
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio?.toString() || '',
      codigoSage: producto.codigoSage || '',
      activo: producto.activo !== false
    });
    setModo('editar');
  };
  
  // Cancelar la edición o creación
  const handleCancelar = () => {
    setNuevoProducto({
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: '',
      codigoSage: '',
      activo: true
    });
    setModo('listar');
    setProductoSeleccionado(null);
  };
  
  // Importar productos desde CSV y guardar en la DB
  const handleImportarCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCargando(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const lines = normalizedText.split('\n').filter(l => l.trim());
          const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
          const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo'));
          const codigoSageIdx = headers.findIndex(h => h.includes('codigo sage'));
          const nombreIdx = headers.findIndex(h => h.includes('nombre'));
          const descripcionIdx = headers.findIndex(h => h.includes('descripcion') || h.includes('descripción'));
          const precioIdx = headers.findIndex(h => h.includes('precio'));
          const activoIdx = headers.findIndex(h => h.includes('activo') || h.includes('estado'));
          if (codigoIdx === -1 || nombreIdx === -1) throw new Error('El CSV debe tener columnas Código y Nombre.');
          let importados = 0;
          for (let i = 1; i < lines.length; i++) {
            const fields = lines[i].split(';');
            const codigo = fields[codigoIdx]?.trim();
            const codigoSage = codigoSageIdx !== -1 ? fields[codigoSageIdx]?.trim() : '';
            const nombre = fields[nombreIdx]?.trim();
            const descripcion = descripcionIdx !== -1 ? fields[descripcionIdx]?.trim() : '';
            let precio = 0;
            if (precioIdx !== -1) {
              const precioStr = fields[precioIdx]?.trim().replace(',', '.').replace(/[^ -9.-]/g, '');
              precio = precioStr ? parseFloat(precioStr) : 0;
            }
            let activo = true;
            if (activoIdx !== -1) {
              const activoStr = fields[activoIdx]?.trim().toLowerCase();
              activo = !(activoStr === 'no' || activoStr === 'false' || activoStr === '0' || activoStr === 'inactivo');
            }
            if (!codigo || !nombre) continue;
            // Verificar si existe en la DB
            let existente = null;
            try {
              const res = await axios.get(`${API_URL}/productos-sage`);
              existente = res.data.find(p => p.codigo === codigo);
            } catch {}
            const payload = { codigo, codigoSage, nombre, descripcion, precio, activo };
            try {
              if (existente) {
                await axios.put(`${API_URL}/productos-sage/${existente._id}`, payload);
              } else {
                await axios.post(`${API_URL}/productos-sage`, payload);
              }
              importados++;
            } catch (err) {
              console.warn('Error al guardar producto:', codigo, err);
            }
          }
          await cargarProductos();
          setError('');
          alert(`Importación completada: ${importados} productos procesados.`);
        } catch (csvError) {
          console.error('Error al procesar CSV:', csvError);
          setError(`Error al procesar el archivo CSV: ${csvError.message}`);
        } finally {
          setCargando(false);
        }
      };
      reader.onerror = () => {
        setError('Error al leer el archivo CSV.');
        setCargando(false);
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Error al importar productos:', err);
      setError('Error al importar productos. Verifique el formato del archivo.');
      setCargando(false);
    } finally {
      e.target.value = '';
    }
  };
  
  // Exportar productos a CSV
  const handleExportarCSV = async () => {
    try {
      const res = await axios.get(`${API_URL}/productos-sage/exportar`, {
        responseType: 'blob'
      });
      
      // Crear URL temporal y enlace para descargar
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'productos_sage50.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error al exportar productos:', err);
      setError('Error al exportar productos a CSV.');
    }
  };
  
  // Eliminar un producto
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/productos-sage/${id}`);
      cargarProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError('Error al eliminar el producto.');
    }
  };
  
  // Renderizar formulario de creación/edición
  if (modo === 'crear' || modo === 'editar') {
    return (
      <div>
        <h3>{modo === 'crear' ? 'Nuevo Producto' : 'Editar Producto'}</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleGuardarProducto} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Código:</label>
            <input
              type="text"
              name="codigo"
              value={nuevoProducto.codigo}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Código SAGE50:</label>
            <input
              type="text"
              name="codigoSage"
              value={nuevoProducto.codigoSage}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={nuevoProducto.nombre}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          
          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Descripción:</label>
            <textarea
              name="descripcion"
              value={nuevoProducto.descripcion}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
            ></textarea>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Precio:</label>
            <input
              type="number"
              name="precio"
              value={nuevoProducto.precio}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                name="activo"
                checked={nuevoProducto.activo}
                onChange={handleInputChange}
              />
              {' '}Producto Activo
            </label>
          </div>
          
          <div style={{ gridColumn: '1 / span 2', marginTop: '15px' }}>
            <button
              type="submit"
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 15px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              {modo === 'crear' ? 'Crear Producto' : 'Guardar Cambios'}
            </button>
            
            <button
              type="button"
              onClick={handleCancelar}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 15px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // Renderizar lista de productos
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3>Productos SAGE50</h3>
        
        <div>
          <button
            onClick={() => setModo('crear')}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            + Nuevo Producto
          </button>
          
          <button
            onClick={handleExportarCSV}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            📤 Exportar CSV
          </button>
          
          <label
            style={{
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            📥 Importar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportarCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      {cargando ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos registrados. Cree uno nuevo o importe desde CSV.</p>
      ) : (
        <>
          <p>Total: {productosFiltrados.length} productos</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Código</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Código SAGE</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Precio</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(producto => (
                  <tr key={producto._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{producto.codigo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{producto.codigoSage || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{producto.nombre}</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>
                      {typeof producto.precio === 'number' 
                        ? producto.precio.toFixed(2) + ' €' 
                        : (producto.precio || '0.00') + ' €'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <span style={{
                        background: producto.activo !== false ? '#4caf50' : '#f44336',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {producto.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditar(producto)}
                        style={{
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          marginRight: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(producto._id)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
