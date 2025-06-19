import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ClientesMantenimiento() {
  const [clientes, setClientes] = useState([]);
  const [modo, setModo] = useState('lista'); // 'lista', 'crear', 'editar'
  const [clienteEdit, setClienteEdit] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [mensaje, setMensaje] = useState('');

  const cargarClientes = () => {
    axios.get('/api/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  };

  useEffect(() => { cargarClientes(); }, []);

  const handleGuardar = async () => {
    if (!form.nombre) { setMensaje('El nombre es obligatorio'); return; }
    try {
      if (modo === 'crear') {
        await axios.post('/api/clientes', form);
        setMensaje('Cliente creado');
      } else if (modo === 'editar' && clienteEdit) {
        await axios.put(`/api/clientes/${clienteEdit._id||clienteEdit.id}`, form);
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
      await axios.delete(`/api/clientes/${cliente._id||cliente.id}`);
      cargarClientes();
    } catch {}
  };

  return (
    <div style={{maxWidth:700,margin:'0 auto',background:'#fff',borderRadius:16,boxShadow:'0 2px 16px #0001',padding:32}}>
      <h2 style={{marginBottom:24}}>Mantenimiento de clientes</h2>
      {modo==='lista' && (
        <>
          <button onClick={()=>{setModo('crear');setForm({nombre:'',email:'',telefono:'',direccion:''});}} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:18}}>+ Nuevo cliente</button>
          <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
            <thead>
              <tr style={{background:'#f0f4fa'}}>
                <th style={{textAlign:'left',padding:8}}>Nombre</th>
                <th style={{textAlign:'left',padding:8}}>Email</th>
                <th style={{textAlign:'left',padding:8}}>Teléfono</th>
                <th style={{textAlign:'left',padding:8}}>Dirección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c=>(
                <tr key={c._id||c.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:8}}>{c.nombre}</td>
                  <td style={{padding:8}}>{c.email}</td>
                  <td style={{padding:8}}>{c.telefono}</td>
                  <td style={{padding:8}}>{c.direccion}</td>
                  <td style={{padding:8}}>
                    <button onClick={()=>handleEditar(c)} style={{marginRight:8,background:'#ffc107',color:'#333',border:'none',borderRadius:4,padding:'4px 10px'}}>Editar</button>
                    <button onClick={()=>handleEliminar(c)} style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px'}}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
