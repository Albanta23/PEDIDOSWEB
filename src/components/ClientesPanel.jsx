import React, { useEffect, useState } from 'react';

export default function ClientesPanel() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ codigo: '', nombre: '', razonComercial: '', nif: '', email: '', telefono: '', direccion: '', cpostal: '', poblacion: '', provincia: '', contacto: '', mensajeVentas: '', bloqueadoVentas: false, observaciones: '' });
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  async function cargarClientes() {
    const res = await fetch('/api/clientesproveedores?tipo=cliente');
    const data = await res.json();
    setClientes(data || []);
  }

  useEffect(() => { cargarClientes(); }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editId ? `/api/clientesproveedores/${editId}` : '/api/clientesproveedores';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tipo: 'cliente' }) });
    if (res.ok) {
      setForm({ codigo: '', nombre: '', razonComercial: '', nif: '', email: '', telefono: '', direccion: '', cpostal: '', poblacion: '', provincia: '', contacto: '', mensajeVentas: '', bloqueadoVentas: false, observaciones: '' });
      setEditId(null);
      cargarClientes();
    }
  }

  function handleEditar(cliente) {
    setForm(cliente);
    setEditId(cliente._id);
  }

  async function handleBorrar(id) {
    if (!window.confirm('¿Seguro que deseas borrar este cliente?')) return;
    await fetch(`/api/clientesproveedores/${id}`, { method: 'DELETE' });
    cargarClientes();
  }

  const clientesFiltrados = clientes.filter(c =>
    Object.values(c).join(' ').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{padding:24}}>
      <h2>Gestión de Clientes</h2>
      <form onSubmit={handleSubmit} style={{marginBottom:24,background:'#f9f9f9',padding:16,borderRadius:8}}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <input name="codigo" value={form.codigo} onChange={handleChange} placeholder="Código" required style={{width:100}} />
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required style={{width:180}} />
          <input name="razonComercial" value={form.razonComercial} onChange={handleChange} placeholder="Razón comercial" style={{width:180}} />
          <input name="nif" value={form.nif} onChange={handleChange} placeholder="NIF" style={{width:100}} />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{width:160}} />
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" style={{width:120}} />
          <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" style={{width:180}} />
          <input name="cpostal" value={form.cpostal} onChange={handleChange} placeholder="C. postal" style={{width:80}} />
          <input name="poblacion" value={form.poblacion} onChange={handleChange} placeholder="Población" style={{width:120}} />
          <input name="provincia" value={form.provincia} onChange={handleChange} placeholder="Provincia" style={{width:120}} />
          <input name="contacto" value={form.contacto} onChange={handleChange} placeholder="Contacto" style={{width:120}} />
          <input name="mensajeVentas" value={form.mensajeVentas} onChange={handleChange} placeholder="Mensaje ventas" style={{width:120}} />
          <label style={{display:'flex',alignItems:'center',gap:4}}>
            <input type="checkbox" name="bloqueadoVentas" checked={form.bloqueadoVentas} onChange={handleChange} /> Bloqueado ventas
          </label>
          <input name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" style={{width:180}} />
        </div>
        <button type="submit" style={{marginTop:12,background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 24px',fontWeight:700}}>{editId ? 'Actualizar' : 'Crear'} cliente</button>
        {editId && <button type="button" onClick={()=>{setForm({ codigo: '', nombre: '', razonComercial: '', nif: '', email: '', telefono: '', direccion: '', cpostal: '', poblacion: '', provincia: '', contacto: '', mensajeVentas: '', bloqueadoVentas: false, observaciones: '' }); setEditId(null);}} style={{marginLeft:12,background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 24px',fontWeight:700}}>Cancelar</button>}
      </form>
      <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar cliente..." style={{marginBottom:12,padding:6,borderRadius:4,border:'1px solid #ccc',width:220}} />
      <table style={{width:'100%',borderCollapse:'collapse',background:'#fff'}}>
        <thead>
          <tr style={{background:'#f1f8ff'}}>
            <th>Código</th><th>Nombre</th><th>Razón comercial</th><th>NIF</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th>C.Postal</th><th>Población</th><th>Provincia</th><th>Contacto</th><th>Bloqueado</th><th>Observaciones</th><th></th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map(c => (
            <tr key={c._id}>
              <td>{c.codigo}</td><td>{c.nombre}</td><td>{c.razonComercial}</td><td>{c.nif}</td><td>{c.email}</td><td>{c.telefono}</td><td>{c.direccion}</td><td>{c.cpostal}</td><td>{c.poblacion}</td><td>{c.provincia}</td><td>{c.contacto}</td><td>{c.bloqueadoVentas ? 'Sí' : ''}</td><td>{c.observaciones}</td>
              <td>
                <button onClick={()=>handleEditar(c)} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600,marginRight:6}}>Editar</button>
                <button onClick={()=>handleBorrar(c._id)} style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
