import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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

  // Cargar productos de la base de datos al montar
  useEffect(() => {
    if (acceso && tab === 'productos') {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';
      axios.get(`${API_URL}/api/productos`)
        .then(res => setProductosDB(res.data))
        .catch(() => setProductosDB([]));
    }
  }, [acceso, tab]);

  // Obtener lista de familias únicas
  const familias = Array.from(new Set(productosDB.map(p => p.familia).filter(f => f && f.trim() !== '')));

  // Filtrar productos por familia
  const productosFiltrados = filtroFamilia ? productosDB.filter(p => p.familia === filtroFamilia) : productosDB;

  // Exportar productos filtrados a PDF
  const exportarProductosPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Listado de productos', 14, 18);
    if (filtroFamilia) {
      doc.setFontSize(13);
      doc.text(`Familia: ${filtroFamilia}`, 14, 28);
    }
    let y = filtroFamilia ? 36 : 28;
    doc.setFontSize(11);
    // Cabecera
    doc.text('Nombre', 14, y);
    doc.text('Referencia', 54, y);
    doc.text('Unidad', 84, y);
    doc.text('Familia', 104, y);
    doc.text('Activo', 134, y);
    doc.text('Fabricable', 154, y);
    doc.text('Descripción', 174, y);
    y += 7;
    doc.setLineWidth(0.2);
    doc.line(14, y, 200, y);
    y += 4;
    doc.setFontSize(10);
    productosFiltrados.forEach((p, i) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(p.nombre || '-'), 14, y);
      doc.text(String(p.referencia || '-'), 54, y);
      doc.text(String(p.unidad || '-'), 84, y);
      doc.text(String(p.familia || '-'), 104, y);
      doc.text(p.activo ? 'Sí' : 'No', 134, y);
      doc.text(p.fabricable !== undefined ? (p.fabricable ? 'Sí' : 'No') : '-', 154, y);
      doc.text(String(p.descripcion || '-').substring(0, 30), 174, y);
      y += 7;
    });
    doc.save(`productos_${filtroFamilia || 'todas'}_${Date.now()}.pdf`);
  };

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
                      try {
                        await axios.post(`${API_URL}/api/productos/actualizar-masivo`, { productos: Object.values(productosEditados) });
                        setEditMode(false);
                        setProductosEditados({});
                        // Recargar productos
                        const res = await axios.get(`${API_URL}/api/productos`);
                        setProductosDB(res.data);
                      } catch(e) {
                        alert('Error al guardar cambios: '+(e.response?.data?.error||e.message));
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
                          <th>Familia</th>
                          <th>Activo</th>
                          <th>Fabricable</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosFiltrados.map((prod,i) => (
                          <tr key={prod._id||i} style={{background:i%2?'#fafdff':'#fff'}}>
                            <td>{editMode ? <input value={productosEditados[prod._id]?.nombre ?? prod.nombre} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],nombre:e.target.value}}))} /> : prod.nombre}</td>
                            <td>{editMode ? <input value={productosEditados[prod._id]?.referencia ?? prod.referencia} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],referencia:e.target.value}}))} /> : prod.referencia}</td>
                            <td>{editMode ? <input value={productosEditados[prod._id]?.unidad ?? prod.unidad} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],unidad:e.target.value}}))} /> : prod.unidad}</td>
                            <td>{editMode ? <input value={productosEditados[prod._id]?.familia ?? prod.familia} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],familia:e.target.value}}))} /> : prod.familia}</td>
                            <td>{editMode ? <input type="checkbox" checked={productosEditados[prod._id]?.activo ?? prod.activo} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],activo:e.target.checked}}))} /> : (prod.activo ? 'Sí' : 'No')}</td>
                            <td>{editMode ? <input type="checkbox" checked={productosEditados[prod._id]?.fabricable ?? prod.fabricable ?? false} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],fabricable:e.target.checked}}))} /> : (prod.fabricable !== undefined ? (prod.fabricable ? 'Sí' : 'No') : '-')}</td>
                            <td>{editMode ? <input value={productosEditados[prod._id]?.descripcion ?? prod.descripcion} onChange={e=>setProductosEditados(p=>({...p,[prod._id]:{...prod,...p[prod._id],descripcion:e.target.value}}))} /> : prod.descripcion}</td>
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
                <div style={{ marginTop: 32, color: '#888' }}><i>Próximamente...</i></div>
              </div>
            )}
            {tab === 'proveedores' && (
              <div>
                <h2 style={{ color: '#1976d2', fontWeight: 800 }}>Gestión de proveedores</h2>
                <div style={{ marginTop: 32, color: '#888' }}><i>Próximamente...</i></div>
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
