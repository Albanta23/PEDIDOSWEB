import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function ClientesMantenimiento() {
  const [clientes, setClientes] = useState([]);
  const [modo, setModo] = useState('lista'); // 'lista', 'crear', 'editar'
  const [clienteEdit, setClienteEdit] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [mensaje, setMensaje] = useState('');

  const cargarClientes = () => {
    axios.get(`${API_URL}/api/clientes`)
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  };

  useEffect(() => { cargarClientes(); }, []);

  const handleGuardar = async () => {
    if (!form.nombre) { setMensaje('El nombre es obligatorio'); return; }
    try {
      if (modo === 'crear') {
        await axios.post(`${API_URL}/api/clientes`, form);
        setMensaje('Cliente creado');
      } else if (modo === 'editar' && clienteEdit) {
        await axios.put(`${API_URL}/api/clientes/${clienteEdit._id||clienteEdit.id}`, form);
        setMensaje('Cliente actualizado');
      }
      setForm({ nombre: '', email: '', telefono: '', direccion: '' });
      setModo('lista');
      cargarClientes();
    } catch {
      setMensaje('Error al guardar');
    }
  };

  const handleEditar = (cliente) => {
    setClienteEdit(cliente);
    setForm({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setModo('editar');
  };

  const handleEliminar = async (cliente) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await axios.delete(`${API_URL}/api/clientes/${cliente._id||cliente.id}`);
      cargarClientes();
    } catch {}
  };

  // Importar clientes desde CSV
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if (lines.length < 2) return setMensaje('CSV vacío o sin datos');
    const headers = lines[0].split(/\t/).map(h=>h.trim());
    const clientes = lines.slice(1).map(line => {
      const cols = line.split(/\t/);
      const obj = {};
      headers.forEach((h,i)=>{ obj[h]=cols[i]!==undefined?cols[i].trim():''; });
      return {
        nombre: obj.RazonSocial || obj.NomComercial || obj.Nombre || '',
        email: obj.Email || '',
        telefono: obj.Telefono || '',
        direccion: [obj.Direccion, obj.CodPostal, obj.Poblacion, obj.Provincia].filter(Boolean).join(', '),
        cif: obj.CIF || '',
        activo: obj.Activo === 'true' || obj.Activo === '1',
        tipoCliente: obj.TipoCliente || '',
        exentoIVA: obj.ExentoIVA === 'true' || obj.ExentoIVA === '1',
        formaPago: obj.FormaPago || '',
        recargoEquiv: obj.RecargoEquiv === 'true' || obj.RecargoEquiv === '1',
        descuento1: parseFloat(obj.Descuento1)||0,
        descuento2: parseFloat(obj.Descuento2)||0,
        descuento3: parseFloat(obj.Descuento3)||0
      };
    });
    // DEBUG: Mostrar los clientes parseados en consola
    console.log('CLIENTES IMPORTADOS', clientes);
    if (clientes.length === 0) return setMensaje('No se han detectado clientes en el archivo. Revisa el formato.');
    try {
      for (const cli of clientes) {
        await axios.post(`${API_URL}/api/clientes`, cli);
      }
      setMensaje('Clientes importados correctamente');
      cargarClientes();
    } catch {
      setMensaje('Error al importar clientes');
    }
  };

  // --- Scroll horizontal con click derecho ---
  const tablaRef = React.useRef();
  React.useEffect(() => {
    const tabla = tablaRef.current;
    if (!tabla) return;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    const onMouseDown = (e) => {
      if (e.button !== 2) return; // solo click derecho
      isDragging = true;
      startX = e.pageX - tabla.offsetLeft;
      scrollLeft = tabla.scrollLeft;
      tabla.style.cursor = 'grab';
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const x = e.pageX - tabla.offsetLeft;
      const walk = (x - startX);
      tabla.scrollLeft = scrollLeft - walk;
    };
    const onMouseUp = () => {
      isDragging = false;
      tabla.style.cursor = '';
    };
    tabla.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      tabla.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div style={{maxWidth:700,margin:'0 auto',background:'#fff',borderRadius:16,boxShadow:'0 2px 16px #0001',padding:32}}>
      <h2 style={{marginBottom:24}}>Mantenimiento de clientes</h2>
      {modo==='lista' && (
        <>
          <button onClick={()=>{setModo('crear');setForm({nombre:'',email:'',telefono:'',direccion:''});}} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:18}}>+ Nuevo cliente</button>
          <input type="file" accept=".csv,.txt" onChange={handleImportCSV} style={{marginLeft:16,marginBottom:18}} />
          <div ref={tablaRef} style={{overflowX:'auto',width:'100%',cursor:'pointer'}} title="Click derecho y arrastra para desplazar horizontalmente">
            <table style={{minWidth:900,width:'100%',borderCollapse:'collapse',marginBottom:16}}>
              <thead>
                <tr style={{background:'#f0f4fa'}}>
                  <th style={{textAlign:'left',padding:8}}>Nombre</th>
                  <th style={{textAlign:'left',padding:8}}>Email</th>
                  <th style={{textAlign:'left',padding:8}}>Teléfono</th>
                  <th style={{textAlign:'left',padding:8,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Dirección</th>
                  <th style={{textAlign:'left',padding:8}}>CIF</th>
                  <th style={{textAlign:'left',padding:8}}>Tipo</th>
                  <th style={{textAlign:'left',padding:8}}>Activo</th>
                  <th style={{textAlign:'left',padding:8}}>Exento IVA</th>
                  <th style={{textAlign:'left',padding:8}}>Forma Pago</th>
                  <th style={{textAlign:'left',padding:8}}>Recargo Eq.</th>
                  <th style={{textAlign:'left',padding:8}}>Dto1</th>
                  <th style={{textAlign:'left',padding:8}}>Dto2</th>
                  <th style={{textAlign:'left',padding:8}}>Dto3</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c=>(
                  <tr key={c._id||c.id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:8}}>{c.nombre}</td>
                    <td style={{padding:8}}>{c.email}</td>
                    <td style={{padding:8}}>{c.telefono}</td>
                    <td style={{padding:8,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={c.direccion}>{c.direccion}</td>
                    <td style={{padding:8}}>{c.cif}</td>
                    <td style={{padding:8}}>{c.tipoCliente}</td>
                    <td style={{padding:8}}>{c.activo ? 'Sí' : 'No'}</td>
                    <td style={{padding:8}}>{c.exentoIVA ? 'Sí' : 'No'}</td>
                    <td style={{padding:8}}>{c.formaPago}</td>
                    <td style={{padding:8}}>{c.recargoEquiv ? 'Sí' : 'No'}</td>
                    <td style={{padding:8}}>{c.descuento1}</td>
                    <td style={{padding:8}}>{c.descuento2}</td>
                    <td style={{padding:8}}>{c.descuento3}</td>
                    <td style={{padding:8}}>
                      <button onClick={()=>handleEditar(c)} style={{marginRight:8,background:'#ffc107',color:'#333',border:'none',borderRadius:4,padding:'4px 10px'}}>Editar</button>
                      <button onClick={()=>handleEliminar(c)} style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px'}}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {(modo==='crear'||modo==='editar') && (
        <div style={{marginTop:12}}>
          <div style={{display:'flex',gap:16,marginBottom:12}}>
            <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #bbb'}} />
            <input placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #bbb'}} />
          </div>
          <div style={{display:'flex',gap:16,marginBottom:12}}>
            <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #bbb'}} />
            <input placeholder="Dirección" value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} style={{flex:2,padding:8,borderRadius:6,border:'1px solid #bbb'}} />
          </div>
          <div style={{display:'flex',gap:12}}>
            <button onClick={handleGuardar} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 22px',fontWeight:700}}>{modo==='crear'?'Crear':'Guardar'}</button>
            <button onClick={()=>{setModo('lista');setForm({nombre:'',email:'',telefono:'',direccion:''});}} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px'}}>Cancelar</button>
          </div>
          {mensaje && <div style={{marginTop:10,color:'#1976d2'}}>{mensaje}</div>}
        </div>
      )}
    </div>
  );
}
