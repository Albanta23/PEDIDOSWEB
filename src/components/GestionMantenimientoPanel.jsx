import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

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
