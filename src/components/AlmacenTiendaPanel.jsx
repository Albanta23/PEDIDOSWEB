import React, { useEffect, useState } from 'react';

export default function AlmacenTiendaPanel({ tiendaActual }) {
  const [stock, setStock] = useState([]); // [{producto, cantidad, unidad, caducidad, ...}]
  const [movimientos, setMovimientos] = useState([]); // [{tipo, producto, cantidad, fecha, motivo}]
  const [bajas, setBajas] = useState([]); // [{producto, cantidad, fecha, motivo}]
  const [cargando, setCargando] = useState(true);

  // Simulación: cargar stock inicial (en real, fetch a backend)
  useEffect(() => {
    setCargando(true);
    // TODO: fetch real de stock de la tienda
    setTimeout(() => {
      setStock([
        { producto: 'Lomo', cantidad: 12, unidad: 'kg', caducidad: '2025-07-01' },
        { producto: 'Chorizo', cantidad: 8, unidad: 'kg', caducidad: '2025-06-20' },
        { producto: 'Salchichón', cantidad: 5, unidad: 'kg', caducidad: '2025-06-25' },
      ]);
      setMovimientos([
        { tipo: 'entrada', producto: 'Lomo', cantidad: 12, fecha: '2025-06-10', motivo: 'Pedido fábrica' },
        { tipo: 'entrada', producto: 'Chorizo', cantidad: 8, fecha: '2025-06-10', motivo: 'Pedido fábrica' },
      ]);
      setBajas([
        { producto: 'Salchichón', cantidad: 1, fecha: '2025-06-11', motivo: 'Caducidad' },
      ]);
      setCargando(false);
    }, 500);
  }, [tiendaActual]);

  // Función para registrar baja/caducidad
  const registrarBaja = (producto, cantidad, motivo) => {
    setBajas(prev => [...prev, { producto, cantidad, fecha: new Date().toISOString().slice(0,10), motivo }]);
    setStock(prev => prev.map(s => s.producto === producto ? { ...s, cantidad: Math.max(0, s.cantidad - cantidad) } : s));
    setMovimientos(prev => [...prev, { tipo: 'baja', producto, cantidad, fecha: new Date().toISOString().slice(0,10), motivo }]);
  };

  // UI básica
  return (
    <div style={{padding:32}}>
      <h2>Gestión de almacén de {tiendaActual?.nombre || 'Tienda'}</h2>
      {cargando ? <p>Cargando stock...</p> : (
        <>
          <h3>Stock actual</h3>
          <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f8fafd'}}>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Caducidad</th>
                <th>Baja/Caducidad</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s, idx) => (
                <tr key={idx}>
                  <td>{s.producto}</td>
                  <td>{s.cantidad}</td>
                  <td>{s.unidad}</td>
                  <td>{s.caducidad}</td>
                  <td>
                    <button onClick={() => registrarBaja(s.producto, 1, 'Caducidad')} style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Baja 1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Movimientos recientes</h3>
          <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f8fafd'}}>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.concat(bajas.map(b=>({...b,tipo:'baja'}))).sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,10).map((m,idx)=>(
                <tr key={idx}>
                  <td>{m.fecha}</td>
                  <td>{m.tipo}</td>
                  <td>{m.producto}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Bajas y caducidades</h3>
          <ul>
            {bajas.map((b,idx)=>(
              <li key={idx}>{b.fecha}: {b.producto} - {b.cantidad} ({b.motivo})</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
