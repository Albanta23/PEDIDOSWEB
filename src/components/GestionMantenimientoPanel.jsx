import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { cabeceraPDF, piePDF } from '../utils/exportPDFBase';
import { useProveedores } from './ProveedoresContext';

const PIN = '1973';

const tabs = [
  { key: 'productos', label: 'Productos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'recetas', label: 'Recetas' },
];

export default function GestionMantenimientoPanel({ onClose }) {
  const [pin, setPin] = useState('');
  const [acceso, setAcceso] = useState(false);
  const [tab, setTab] = useState('productos');
  const [error, setError] = useState('');
  const [productos, setProductos] = useState([]);
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [productosDB, setProductosDB] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [productosEditados, setProductosEditados] = useState({});
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [clientes, setClientes] = useState([]);
  const [importandoClientes, setImportandoClientes] = useState(false);
  const [importErrorClientes, setImportErrorClientes] = useState('');
  const [importSuccessClientes, setImportSuccessClientes] = useState('');

  const handlePin = (e) => {
    e.preventDefault();
    if (pin === PIN) {
      setAcceso(true);
      setError('');
    } else {
      setError('PIN incorrecto');
    }
  };

  // Handler para importar productos desde Excel
  const handleImportExcel = async (e) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files[0];
    if (!file) return;
    setImportando(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setProductos(rows);
      setImportSuccess(`Se han leído ${rows.length} productos del archivo.`);
      // Aquí podrías enviar los productos al backend si lo deseas
    } catch (err) {
      setImportError('Error al procesar el archivo Excel.');
    } finally {
      setImportando(false);
    }
  };

  // Handler para importar clientes desde Excel
  const handleImportExcelClientes = async (e) => {
    setImportErrorClientes('');
    setImportSuccessClientes('');
    const file = e.target.files[0];
    if (!file) return;
    setImportandoClientes(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      // Mapeo de campos según tabla proporcionada
      const clientesMapeados = rows.map(raw => ({
        codigo: raw['Código'] || raw['Codigo'] || '',
        nombre: raw['Nombre'] || '',
        razonSocial: raw['Razón comercial'] || raw['Razon comercial'] || '',
        nif: raw['Nif'] || '',
        email: raw['Email'] || '',
        telefono: raw['Teléfono'] || raw['Telefono'] || '',
        direccion: raw['Dirección'] || raw['Direccion'] || '',
        codigoPostal: raw['C.postal'] || raw['C.Postal'] || '',
        poblacion: raw['Población'] || raw['Poblacion'] || '',
        provincia: raw['Provincia'] || '',
        contacto: raw['Contacto'] || '',
        mensajeVentas: raw['Mensaje ventas'] || '',
        bloqueadoVentas: (raw['Bloqueado ventas'] || '').toString().toLowerCase() === 'true',
        observaciones: raw['Observaciones'] || ''
      }));
      setClientes(clientesMapeados);
      setImportSuccessClientes(`Se han leído ${clientesMapeados.length} clientes del archivo.`);
    } catch (err) {
      setImportErrorClientes('Error al procesar el archivo Excel.');
    } finally {
      setImportandoClientes(false);
    }
  };

  // Cargar productos de la base de datos al montar
  useEffect(() => {
    if (acceso && tab === 'productos') {
      let apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
      if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
      axios.get(`${apiUrl}/productos`)
        .then(res => setProductosDB(res.data))
        .catch(() => setProductosDB([]));
    }
  }, [acceso, tab]);

  // Obtener lista de familias únicas
  const familias = Array.from(new Set(productosDB.map(p => p.familia).filter(f => f && f.trim() !== '')));

  // Filtrar productos por familia
  const productosFiltrados = filtroFamilia ? productosDB.filter(p => p.familia === filtroFamilia) : productosDB;

  // Eliminar producto
  const handleBorrarProducto = async (id) => {
    if (!window.confirm('¿Seguro que quieres borrar este producto?')) return;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
    try {
      await axios.delete(`${API_URL}/api/productos/${id}`);
      setProductosDB(productosDB.filter(p => p._id !== id));
    } catch (e) {
      alert('Error al borrar producto: ' + (e.response?.data?.error || e.message));
    }
  };

  // Exportar productos filtrados a PDF
  const exportarProductosPDF = async () => {
    const doc = new jsPDF();
    await cabeceraPDF(doc);
    let y = 48;
    doc.setFontSize(13);
    doc.text('Listado de productos', 10, y);
    if (filtroFamilia) {
      doc.setFontSize(10);
      doc.text(`Familia: ${filtroFamilia}`, 10, y + 6);
      y += 6;
    }
    y += 6;
    doc.setFontSize(8);
    // Cabecera
    doc.text('Nombre', 8, y);
    doc.text('Referencia', 48, y);
    doc.text('Unidad', 74, y);
    doc.text('Número de familia', 92, y);
    doc.text('Nombre Familia', 122, y); // desplazada a la derecha
    doc.text('Activo', 160, y);
    doc.text('Fabricable', 175, y);
    y += 6;
    doc.setLineWidth(0.2);
    doc.line(8, y, 200, y);
    y += 3;
    doc.setFontSize(7);
    productosFiltrados.forEach((p, i) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(p.nombre || '-'), 8, y, { maxWidth: 38 });
      doc.text(String(p.referencia || '-'), 48, y, { maxWidth: 24 });
      doc.text(String(p.unidad || '-'), 74, y, { maxWidth: 16 });
      doc.text(String(p.familia || '-'), 92, y, { maxWidth: 28 });
      doc.text(String(p.nombreFamilia || '-'), 122, y, { maxWidth: 54 }); // más ancho para nombres largos
      doc.text(p.activo ? 'Sí' : 'No', 160, y);
      doc.text(p.fabricable !== undefined ? (p.fabricable ? 'Sí' : 'No') : '-', 175, y);
      y += 6;
    });
    // Pie de página profesional
    piePDF(doc);
    doc.save(`productos_${filtroFamilia || 'todas'}_${Date.now()}.pdf`);
  };

  // --- Componente CRUD de proveedores ---
  function ProveedorCrud() {
    const { proveedores, loading, error, addProveedor, updateProveedor, deleteProveedor } = useProveedores();
    const [editMode, setEditMode] = useState(false);
    const [editados, setEditados] = useState({});
    const [nuevo, setNuevo] = useState({ codigo:'', nombre:'', razonComercial:'', nif:'', email:'', telefono:'', direccion:'', activo:true });
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    // Guardar cambios
    const handleGuardar = async () => {
      setGuardando(true);
      try {
        // Nuevo proveedor
        if (nuevo.nombre && nuevo.codigo) {
          await addProveedor(nuevo);
          setNuevo({ codigo:'', nombre:'', razonComercial:'', nif:'', email:'', telefono:'', direccion:'', activo:true });
          setMensaje('Proveedor añadido correctamente');
        }
        // Editados
        for (const id of Object.keys(editados)) {
          await updateProveedor(id, editados[id]);
        }
        setEditados({});
        setMensaje('Cambios guardados');
      } catch (e) {
        setMensaje('Error al guardar: ' + (e.message || e));
      } finally {
        setGuardando(false);
        setTimeout(()=>setMensaje(''),2000);
      }
    };

    // Borrar proveedor
    const handleBorrar = async (id) => {
      if (!window.confirm('¿Seguro que quieres borrar este proveedor?')) return;
      await deleteProveedor(id);
      setMensaje('Proveedor eliminado');
      setTimeout(()=>setMensaje(''),2000);
    };

    return (
      <div style={{marginTop:24}}>
        {loading && <div style={{color:'#1976d2'}}>Cargando proveedores...</div>}
        {error && <div style={{color:'#d32f2f'}}>{error}</div>}
        {mensaje && <div style={{color:'#388e3c',marginBottom:8}}>{mensaje}</div>}
        <button onClick={()=>setEditMode(!editMode)} style={{marginBottom:12,background:editMode?'#d32f2f':'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,cursor:'pointer'}}>
          {editMode ? 'Cancelar edición' : 'Editar proveedores'}
        </button>
        {editMode && <button onClick={handleGuardar} style={{marginLeft:8,background:'#388e3c',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,cursor:'pointer'}} disabled={guardando}>Guardar cambios</button>}
        <div style={{maxHeight:320,overflow:'auto',border:'1px solid #eee',borderRadius:8,marginTop:16}}>
          <table style={{width:'100%',fontSize:13}}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Razón comercial</th>
                <th>NIF</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {editMode && (
                <tr style={{background:'#e8f5e9'}}>
                  <td><input value={nuevo.codigo} onChange={e=>setNuevo(n=>({...n,codigo:e.target.value}))} placeholder="Código" /></td>
                  <td><input value={nuevo.nombre} onChange={e=>setNuevo(n=>({...n,nombre:e.target.value}))} placeholder="Nombre" /></td>
                  <td><input value={nuevo.razonComercial} onChange={e=>setNuevo(n=>({...n,razonComercial:e.target.value}))} placeholder="Razón comercial" /></td>
                  <td><input value={nuevo.nif} onChange={e=>setNuevo(n=>({...n,nif:e.target.value}))} placeholder="NIF" /></td>
                  <td><input value={nuevo.email} onChange={e=>setNuevo(n=>({...n,email:e.target.value}))} placeholder="Email" /></td>
                  <td><input value={nuevo.telefono} onChange={e=>setNuevo(n=>({...n,telefono:e.target.value}))} placeholder="Teléfono" /></td>
                  <td><input value={nuevo.direccion} onChange={e=>setNuevo(n=>({...n,direccion:e.target.value}))} placeholder="Dirección" /></td>
                  <td><input type="checkbox" checked={nuevo.activo} onChange={e=>setNuevo(n=>({...n,activo:e.target.checked}))} /></td>
                  <td></td>
                </tr>
              )}
              {proveedores.map((p,i) => (
                <tr key={p._id||i} style={{background:i%2?'#fafdff':'#fff'}}>
                  <td>{editMode ? <input value={editados[p._id]?.codigo ?? p.codigo} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],codigo:e.target.value}}))} /> : p.codigo}</td>
                  <td>{editMode ? <input value={editados[p._id]?.nombre ?? p.nombre} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],nombre:e.target.value}}))} /> : p.nombre}</td>
                  <td>{editMode ? <input value={editados[p._id]?.razonComercial ?? p.razonComercial} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],razonComercial:e.target.value}}))} /> : p.razonComercial}</td>
                  <td>{editMode ? <input value={editados[p._id]?.nif ?? p.nif} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],nif:e.target.value}}))} /> : p.nif}</td>
                  <td>{editMode ? <input value={editados[p._id]?.email ?? p.email} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],email:e.target.value}}))} /> : p.email}</td>
                  <td>{editMode ? <input value={editados[p._id]?.telefono ?? p.telefono} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],telefono:e.target.value}}))} /> : p.telefono}</td>
                  <td>{editMode ? <input value={editados[p._id]?.direccion ?? p.direccion} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],direccion:e.target.value}}))} /> : p.direccion}</td>
                  <td>{editMode ? <input type="checkbox" checked={editados[p._id]?.activo ?? p.activo} onChange={e=>setEditados(ed=>({...ed,[p._id]:{...p,...ed[p._id],activo:e.target.checked}}))} /> : (p.activo ? 'Sí' : 'No')}</td>
                  <td><button onClick={()=>handleBorrar(p._id)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:18}} title="Borrar">🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- Componente para importar proveedores desde varios formatos ---
  function ImportarProveedoresMultiFormato() {
    const { addProveedor } = useProveedores();
    const [importando, setImportando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleImport = async (e) => {
      setMensaje('');
      setError('');
      setImportando(true);
      const file = e.target.files[0];
      if (!file) return setImportando(false);
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let rows = [];
        if (ext === 'json') {
          const text = await file.text();
          rows = JSON.parse(text);
        } else if (ext === 'csv') {
          const text = await file.text();
          const lines = text.split(/\r?\n/).filter(Boolean);
          const headers = lines[0].split(',');
          rows = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() || ''; });
            return obj;
          });
        } else if (ext === 'xlsx' || ext === 'xls') {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        } else {
          setError('Formato no soportado. Usa CSV, Excel (.xlsx/.xls) o JSON.');
          setImportando(false);
          return;
        }
        let insertados = 0;
        for (const row of rows) {
          try {
            await addProveedor({
              codigo: row.codigo || row['Código'] || row['Codigo'] || row.ID || '',
              nombre: row.nombre || row['Nombre'] || '',
              razonComercial: row.razonComercial || row['Razón comercial'] || row['Razon comercial'] || '',
              nif: row.nif || row['NIF'] || row['CIF'] || row['Cif'] || row['cif'] || '',
              email: row.email || row['Email'] || '',
              telefono: row.telefono || row['Teléfono'] || row['Telefono'] || '',
              direccion: row.direccion || row['Dirección'] || row['Direccion'] || '',
              codigoPostal: row.codigoPostal || row['C.postal'] || row['C.Postal'] || '',
              poblacion: row.poblacion || row['Población'] || row['Poblacion'] || '',
              provincia: row.provincia || row['Provincia'] || '',
              activo: row.activo !== undefined ? Boolean(row.activo) : true
            });
            insertados++;
          } catch (e) {
            // Si hay error, continuar con el siguiente
          }
        }
        setMensaje(`Importación completada: ${insertados} proveedores insertados.`);
      } catch (err) {
        setError('Error al procesar el archivo.');
      } finally {
        setImportando(false);
      }
    };

    return (
      <div style={{margin:'24px 0',padding:'18px',background:'#f5f7fa',borderRadius:12}}>
        <h3 style={{color:'#1976d2'}}>Importar proveedores (CSV, Excel, JSON)</h3>
        <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleImport} disabled={importando} />
        {importando && <span style={{marginLeft:12, color:'#1976d2'}}>Importando...</span>}
        {mensaje && <div style={{color:'#388e3c',marginTop:8}}>{mensaje}</div>}
        {error && <div style={{color:'#d32f2f',marginTop:8}}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 24, background: '#1976d2', color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Gestión y Mantenimiento
        <button onClick={onClose} style={{ background: '#fff', color: '#1976d2', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, padding: '8px 24px', cursor: 'pointer' }}>Cerrar</button>
      </div>
      {!acceso ? (
        <form onSubmit={handlePin} style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 2px 16px #1976d222', minWidth: 320 }}>
          <h2 style={{ marginBottom: 18 }}>Introduce PIN de acceso</h2>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} style={{ fontSize: 22, padding: 12, borderRadius: 8, border: '1.5px solid #1976d2', marginBottom: 12, width: 180, textAlign: 'center' }} autoFocus />
          {error && <div style={{ color: '#d32f2f', marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, padding: '10px 32px', cursor: 'pointer' }}>Entrar</button>
        </form>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #1976d2', background: '#e3f2fd' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '18px 0', fontSize: 20, fontWeight: 700, background: tab === t.key ? '#1976d2' : 'transparent', color: tab === t.key ? '#fff' : '#1976d2', border: 'none', borderBottom: tab === t.key ? '4px solid #1976d2' : 'none', cursor: 'pointer', transition: '0.2s' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, padding: 32, background: '#fff', minHeight: 400 }}>
            {tab === 'productos' && (
              <div>
                <h2 style={{ color: '#1976d2', fontWeight: 800 }}>Gestión de productos</h2>
                <p>Importa productos desde Excel y gestiona el catálogo.</p>
                <div style={{marginTop:24,marginBottom:24}}>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} disabled={importando} />
                  {importando && <span style={{marginLeft:12, color:'#1976d2'}}>Importando...</span>}
                  {importError && <div style={{color:'#d32f2f',marginTop:8}}>{importError}</div>}
                  {importSuccess && <div style={{color:'#388e3c',marginTop:8}}>{importSuccess}</div>}
                </div>
                {/* Tabla de productos en base de datos */}
                <div style={{marginTop:32}}>
                  <h3 style={{color:'#1976d2'}}>Productos en base de datos</h3>
                  {/* Filtro de familia y botón PDF */}
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                    <label style={{fontWeight:600}}>Familia:</label>
                    <select value={filtroFamilia} onChange={e=>setFiltroFamilia(e.target.value)} style={{padding:'6px 12px',borderRadius:6}}>
                      <option value=''>Todas</option>
                      {familias.map(f=>(<option key={f} value={f}>{f}</option>))}
                    </select>
                    <button onClick={exportarProductosPDF} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,cursor:'pointer'}}>Exportar PDF</button>
                  </div>
                  <button onClick={()=>setEditMode(!editMode)} style={{marginBottom:12,background:editMode?'#d32f2f':'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,cursor:'pointer'}}>
                    {editMode ? 'Cancelar edición' : 'Editar productos'}
                  </button>
                  {editMode && <button
                    onClick={async()=>{
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
                      // Si hay línea nueva pendiente, crearla primero
                      if (productosEditados['nuevo'] && productosEditados['nuevo'].nombre) {
                        try {
                          const res = await axios.post(`${API_URL}/api/productos`, productosEditados['nuevo']);
                          setProductosDB(p=>[res.data,...p]);
                          setProductosEditados(p=>{const c={...p};delete c['nuevo'];return c;});
                        } catch(e) {
                          alert('Error al crear producto nuevo: '+(e.response?.data?.error||e.message));
                          return;
                        }
                      }
                      // Guardar cambios de productos editados existentes
                      const nuevosEditados = {...productosEditados};
                      delete nuevosEditados['nuevo'];
                      if (Object.keys(nuevosEditados).length > 0) {
                        try {
                          await axios.post(`${API_URL}/api/productos/actualizar-masivo`, { productos: Object.values(nuevosEditados) });
                          setEditMode(false);
                          setProductosEditados({});
                          // Recargar productos
                          const res = await axios.get(`${API_URL}/api/productos`);
                          setProductosDB(res.data);
                        } catch(e) {
                          alert('Error al guardar cambios: '+(e.response?.data?.error||e.message));
                        }
                      } else {
                        setEditMode(false);
                        setProductosEditados({});
                      }
                    }}
                    style={{marginLeft:8,background:'#388e3c',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,cursor:'pointer'}}>
                    Guardar cambios
                  </button>}
                  <div style={{maxHeight:320,overflow:'auto',border:'1px solid #eee',borderRadius:8,marginTop:16}}>
                    <table style={{width:'100%',fontSize:13}}>
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Referencia</th>
                          <th>Unidad</th>
                          <th>Número de familia</th>
                          <th>Nombre Familia</th>
                          <th>Activo</th>
                          <th>Fabricable</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMode && (
                          <tr style={{background:'#e8f5e9'}}>
                            <td><input value={productosEditados['nuevo']?.nombre||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],nombre:e.target.value}}))} placeholder="Nombre" /></td>
                            <td><input value={productosEditados['nuevo']?.referencia||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],referencia:e.target.value}}))} placeholder="Referencia" /></td>
                            <td>
                              <select value={productosEditados['nuevo']?.unidad||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],unidad:e.target.value}}))}>
                                <option value="">Selecciona unidad</option>
                                {/* Unidades estándar */}
                                {['kg','ud','caja','bandeja','pieza','l','ml','g','mg','m','cm','mm'].map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                                {/* Unidades de la base de datos, excluyendo las estándar */}
                                {[...new Set(productosDB.map(p=>p.unidad).filter(Boolean).filter(u=>!['kg','ud','caja','bandeja','pieza','l','ml','g','mg','m','cm','mm'].includes(u)))].map(u=>(
                                  <option key={u} value={u}>{u}</option>
                                ))}
                                <option value="otro">Otro...</option>
                              </select>
                              {productosEditados['nuevo']?.unidad==='otro' && (
                                <input style={{marginTop:4}} placeholder="Unidad personalizada" value={productosEditados['nuevo']?.unidadPersonalizada||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],unidad: e.target.value, unidadPersonalizada: e.target.value}}))} />
                              )}
                            </td>
                            <td>
                              <select value={productosEditados['nuevo']?.familia||''} onChange={e=>{
                                const nuevaFamilia = e.target.value;
                                let nuevoNombreFamilia = productosEditados['nuevo']?.nombreFamilia;
                                if (nuevaFamilia && nuevaFamilia !== 'otro') {
                                  // Buscar el nombreFamilia correspondiente a la familia seleccionada
                                  const prod = productosDB.find(p => p.familia === nuevaFamilia && p.nombreFamilia);
                                  if (prod) nuevoNombreFamilia = prod.nombreFamilia;
                                }
                                setProductosEditados(p=>({
                                  ...p,
                                  nuevo:{
                                    ...p['nuevo'],
                                    familia: nuevaFamilia,
                                    nombreFamilia: nuevoNombreFamilia
                                  }
                                }));
                              }}>
                                <option value="">Selecciona nº familia</option>
                                {[...new Set(productosDB.map(p=>p.familia).filter(Boolean))].map(f=>(<option key={f} value={f}>{f}</option>))}
                                <option value="otro">Otro...</option>
                              </select>
                              {productosEditados['nuevo']?.familia==='otro' && (
                                <input style={{marginTop:4}} placeholder="Nº familia personalizado" value={productosEditados['nuevo']?.familiaPersonalizada||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],familia: e.target.value, familiaPersonalizada: e.target.value}}))} />
                              )}
                            </td>
                            <td>
                              <select value={productosEditados['nuevo']?.nombreFamilia||''} onChange={e=>{
                                const nuevoNombreFamilia = e.target.value;
                                let nuevaFamilia = productosEditados['nuevo']?.familia;
                                if (nuevoNombreFamilia && nuevoNombreFamilia !== 'otro') {
                                  // Buscar la familia correspondiente al nombreFamilia seleccionado
                                  const prod = productosDB.find(p => p.nombreFamilia === nuevoNombreFamilia && p.familia);
                                  if (prod) nuevaFamilia = prod.familia;
                                }
                                setProductosEditados(p=>({
                                  ...p,
                                  nuevo:{
                                    ...p['nuevo'],
                                    nombreFamilia: nuevoNombreFamilia,
                                    familia: nuevaFamilia
                                  }
                                }));
                              }}>
                                <option value="">Selecciona nombre familia</option>
                                {[...new Set(productosDB.map(p=>p.nombreFamilia).filter(Boolean))].map(nf=>(<option key={nf} value={nf}>{nf}</option>))}
                                <option value="otro">Otro...</option>
                              </select>
                              {productosEditados['nuevo']?.nombreFamilia==='otro' && (
                                <input style={{marginTop:4}} placeholder="Nombre familia personalizado" value={productosEditados['nuevo']?.nombreFamiliaPersonalizada||''} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],nombreFamilia: e.target.value, nombreFamiliaPersonalizada: e.target.value}}))} />
                              )}
                            </td>
                            <td><input type="checkbox" checked={productosEditados['nuevo']?.activo??true} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],activo:e.target.checked}}))} /></td>
                            <td><input type="checkbox" checked={productosEditados['nuevo']?.fabricable??false} onChange={e=>setProductosEditados(p=>({...p,nuevo:{...p['nuevo'],fabricable:e.target.checked}}))} /></td>
                            <td>
                              <button onClick={async()=>{
                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
                                try {
                                  let nuevo = {...productosEditados['nuevo']};
                                  if(nuevo.unidad==='otro') nuevo.unidad = nuevo.unidadPersonalizada||'';
                                  if(nuevo.familia==='otro') nuevo.familia = nuevo.familiaPersonalizada||'';
                                  if(nuevo.nombreFamilia==='otro') nuevo.nombreFamilia = nuevo.nombreFamiliaPersonalizada||'';
                                  if (!nuevo?.nombre) return alert('El nombre es obligatorio');
                                  const res = await axios.post(`${API_URL}/api/productos`, nuevo);
                                  setProductosDB(p=>[res.data,...p]);
                                  setProductosEditados(p=>{const c={...p};delete c['nuevo'];return c;});
                                } catch(e) {
                                  alert('Error al crear producto: '+(e.response?.data?.error||e.message));
                                }
                              }} style={{background:'#388e3c',color:'#fff',border:'none',borderRadius:8,padding:'4px 12px',fontWeight:700,cursor:'pointer'}}>Añadir</button>
                            </td>
                          </tr>
                        )}
                        {productosFiltrados.map((prod,i) => (
                          <tr key={prod._id||i} style={{background:i%2?'#fafdff':'#fff'}}>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="nombre" value={productosEditados[prod._id]?.nombre ?? prod.nombre} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],nombre:e.target.value}}))} /> : prod.nombre}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="referencia" value={productosEditados[prod._id]?.referencia ?? prod.referencia} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],referencia:e.target.value}}))} /> : prod.referencia}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="unidad" value={productosEditados[prod._id]?.unidad ?? prod.unidad} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],unidad:e.target.value}}))} /> : prod.unidad}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="familia" value={productosEditados[prod._id]?.familia ?? prod.familia} onChange={e=>{
                              const nuevaFamilia = e.target.value;
                              let nuevoNombreFamilia = productosEditados[prod._id]?.nombreFamilia ?? prod.nombreFamilia;
                              if (nuevaFamilia) {
                                const pMatch = productosDB.find(p => p.familia === nuevaFamilia && p.nombreFamilia);
                                if (pMatch) nuevoNombreFamilia = pMatch.nombreFamilia;
                              }
                              setProductosEditados(p=>({
                                ...p,
                                [prod._id]:{
                                  ...prod,
                                  ...p[prod._id],
                                  familia: nuevaFamilia,
                                  nombreFamilia: nuevoNombreFamilia
                                }
                              }));
                            }} /> : prod.familia}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="nombreFamilia" value={productosEditados[prod._id]?.nombreFamilia ?? prod.nombreFamilia} onChange={e=>{
                              const nuevoNombreFamilia = e.target.value;
                              let nuevaFamilia = productosEditados[prod._id]?.familia ?? prod.familia;
                              if (nuevoNombreFamilia) {
                                const pMatch = productosDB.find(p => p.nombreFamilia === nuevoNombreFamilia && p.familia);
                                if (pMatch) nuevaFamilia = pMatch.familia;
                              }
                              setProductosEditados(p=>({
                                ...p,
                                [prod._id]:{
                                  ...prod,
                                  ...p[prod._id],
                                  nombreFamilia: nuevoNombreFamilia,
                                  familia: nuevaFamilia
                                }
                              }));
                            }} /> : prod.nombreFamilia}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="activo" type="checkbox" checked={productosEditados[prod._id]?.activo ?? prod.activo} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],activo:e.target.checked}}))} /> : (prod.activo ? 'Sí' : 'No')}</td>
                            <td>{editMode ? <input data-prod-id={prod._id} data-campo="fabricable" type="checkbox" checked={productosEditados[prod._id]?.fabricable ?? prod.fabricable ?? false} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],fabricable:e.target.checked}}))} /> : (prod.fabricable !== undefined ? (prod.fabricable ? 'Sí' : 'No') : '-')}</td>
                            <td><button onClick={()=>handleBorrarProducto(prod._id)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:18}} title="Borrar">🗑</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {productos.length > 0 && (
                  <div>
                    <div style={{margin:'16px 0'}}>
                      <button
                        onClick={async () => {
                          setImportError('');
                          setImportSuccess('');
                          setImportando(true);
                          try {
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
                            const res = await axios.post(`${API_URL}/api/productos/importar`, { productos });
                            if (res.data.ok) {
                              setImportSuccess(`Guardado: ${res.data.insertados} nuevos, ${res.data.actualizados} actualizados.`);
                              setProductos([]); // Limpiar tabla tras guardar
                            } else {
                              setImportError(res.data.error || 'Error al guardar productos.');
                            }
                          } catch (err) {
                            setImportError('Error al guardar productos: ' + (err.response?.data?.error || err.message));
                          } finally {
                            setImportando(false);
                          }
                        }}
                        disabled={importando}
                        style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:16,cursor:'pointer'}}
                      >
                        Guardar en base de datos
                      </button>
                    </div>
                    <div style={{maxHeight:320,overflow:'auto',border:'1px solid #eee',borderRadius:8,marginTop:16}}>
                      <table style={{width:'100%',fontSize:13}}>
                        <thead>
                          <tr>
                            {Object.keys(productos[0]).map((col,idx) => <th key={idx} style={{background:'#e3f2fd',padding:'6px 8px',fontWeight:700}}>{col}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {productos.map((prod,i) => (
                            <tr key={i} style={{background:i%2?'#fafdff':'#fff'}}>
                              {Object.values(prod).map((val,j) => <td key={j} style={{padding:'6px 8px'}}>{val}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'clientes' && (
              <div>
                <h2 style={{ color: '#1976d2', fontWeight: 800 }}>Gestión de clientes</h2>
                <p>Importa clientes desde Excel y gestiona el listado de clientes.</p>
                <div style={{marginTop:24,marginBottom:24}}>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportExcelClientes} disabled={importandoClientes} />
                  {importandoClientes && <span style={{marginLeft:12, color:'#1976d2'}}>Importando...</span>}
                  {importErrorClientes && <div style={{color:'#d32f2f',marginTop:8}}>{importErrorClientes}</div>}
                  {importSuccessClientes && <div style={{color:'#388e3c',marginTop:8}}>{importSuccessClientes}</div>}
                </div>
                {clientes.length > 0 && (
                  <div>
                    <div style={{margin:'16px 0'}}>
                      <button
                        onClick={async () => {
                          setImportErrorClientes('');
                          setImportSuccessClientes('');
                          setImportandoClientes(true);
                          try {
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
                            const res = await axios.post(`${API_URL}/api/clientes/importar`, { clientes });
                            if (res.data.ok) {
                              setImportSuccessClientes(`Guardado: ${res.data.insertados} nuevos, ${res.data.actualizados} actualizados.`);
                              // Recargar clientes desde la base de datos tras guardar
                              const lista = await axios.get(`${API_URL}/api/clientes`);
                              setClientes(lista.data);
                            } else {
                              setImportErrorClientes(res.data.error || 'Error al guardar clientes.');
                            }
                          } catch (err) {
                            setImportErrorClientes('Error al guardar clientes: ' + (err.response?.data?.error || err.message));
                          } finally {
                            setImportandoClientes(false);
                          }
                        }}
                        disabled={importandoClientes}
                        style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:16,cursor:'pointer'}}
                      >
                        Guardar en base de datos
                      </button>
                    </div>
                    <div style={{maxHeight:320,overflow:'auto',border:'1px solid #eee',borderRadius:8,marginTop:16}}>
                      <table style={{width:'100%',fontSize:13}}>
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Razón social</th>
                            <th>NIF</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>C.Postal</th>
                            <th>Población</th>
                            <th>Provincia</th>
                            <th>Contacto</th>
                            <th>Mensaje ventas</th>
                            <th>Bloqueado ventas</th>
                            <th>Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientes.map((cli,i) => (
                            <tr key={i} style={{background:i%2?'#fafdff':'#fff'}}>
                              <td>{cli.codigo}</td>
                              <td>{cli.nombre}</td>
                              <td>{cli.razonSocial}</td>
                              <td>{cli.nif}</td>
                              <td>{cli.email}</td>
                              <td>{cli.telefono}</td>
                              <td>{cli.direccion}</td>
                              <td>{cli.codigoPostal}</td>
                              <td>{cli.poblacion}</td>
                              <td>{cli.provincia}</td>
                              <td>{cli.contacto}</td>
                              <td>{cli.mensajeVentas}</td>
                              <td>{cli.bloqueadoVentas ? 'Sí' : 'No'}</td>
                              <td>{cli.observaciones}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'proveedores' && (
              <div>
                <h2 style={{ color: '#1976d2', fontWeight: 800 }}>Gestión de proveedores</h2>
                <p>Importa proveedores desde CSV, Excel o JSON y gestiona el catálogo.</p>
                <ImportarProveedoresMultiFormato />
                <ProveedorCrud />
              </div>
            )}
            {tab === 'recetas' && (
              <div>
                <h2 style={{ color: '#1976d2', fontWeight: 800 }}>Gestión de recetas</h2>
                <div style={{ marginTop: 32, color: '#888' }}><i>Próximamente...</i></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
