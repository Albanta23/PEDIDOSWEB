import React, { useState, useEffect } from "react";
import TransferenciasPanel from './TransferenciasPanel';
import HistoricoTiendaPanel from './HistoricoTiendaPanel';
import { crearPedido, actualizarPedido, obtenerPedidos } from '../services/pedidosService';
import { abrirHistoricoEnVentana } from '../utils/historicoVentana';
import { FORMATOS_PEDIDO } from '../configFormatos';

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual, tiendas }) {
  const [mostrarTransferencias, setMostrarTransferencias] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [lineasEdit, setLineasEdit] = useState([]);
  const [logGuardado, setLogGuardado] = useState(false);
  const [showToast, setShowToast] = useState(false); // Toast de confirmación
  const [mostrarHistoricoTienda, setMostrarHistoricoTienda] = useState(false);

  // Restaurar pedido borrador desde localStorage si existe y no está en memoria
  useEffect(() => {
    if (!tiendaActual?.id) return;
    const key = 'pedido_borrador_' + tiendaActual.id;
    const lineasGuardadas = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    const pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual.id || p.tienda?.id === tiendaActual.id));
    if (lineasGuardadas && !pedidoBorrador) {
      const lineas = JSON.parse(lineasGuardadas);
      const nuevoBorrador = {
        id: 'borrador_' + tiendaActual.id,
        estado: 'borrador',
        lineas,
        tienda: tiendaActual,
        tiendaId: tiendaActual.id,
        fechaPedido: new Date().toISOString(),
      };
      if (typeof onModificar === 'function') {
        onModificar(nuevoBorrador.id, nuevoBorrador);
      }
    }
    // Solo ejecuta al montar o al cambiar tiendaActual.id
    // eslint-disable-next-line
  }, [tiendaActual?.id]);

  // Función para obtener el siguiente número de pedido disponible
  const getNextNumeroPedido = () => {
    const maxNumero = pedidos.reduce((max, p) => p.numeroPedido && p.numeroPedido > max ? p.numeroPedido : max, 0);
    return maxNumero + 1;
  };

  // Función para iniciar la edición de un pedido en borrador (o crear uno nuevo)
  const handleEditarPedidoBorrador = () => {
    let pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
    // Si existe pero no tiene número, asignar uno
    if (pedidoBorrador && !pedidoBorrador.numeroPedido) {
      const actualizado = { ...pedidoBorrador, numeroPedido: getNextNumeroPedido() };
      if (typeof onModificar === 'function') {
        onModificar(actualizado.id, actualizado);
      }
      pedidoBorrador = actualizado;
    }
    if (pedidoBorrador) {
      setCreandoNuevo(true);
      setLineasEdit(pedidoBorrador.lineas ? pedidoBorrador.lineas.map(l => ({ ...l })) : []);
    } else {
      // Si no existe, crear uno nuevo con número
      const nuevoNumero = getNextNumeroPedido();
      setCreandoNuevo(true);
      setLineasEdit([]);
      const nuevoBorrador = {
        id: 'borrador_' + (tiendaActual?.id || 'default'),
        estado: 'borrador',
        lineas: [],
        tienda: tiendaActual,
        tiendaId: tiendaActual?.id,
        fechaPedido: new Date().toISOString(),
        numeroPedido: nuevoNumero
      };
      if (typeof onModificar === 'function') {
        onModificar(nuevoBorrador.id, nuevoBorrador);
      }
    }
  };

  return (
    <>
      {/* Toast de confirmación de guardado */}
      {showToast && (
        <div style={{position:'fixed',top:24,right:24,zIndex:3000,background:'#28a745',color:'#fff',padding:'16px 32px',borderRadius:10,boxShadow:'0 2px 12px #0003',fontWeight:700,fontSize:17,transition:'opacity 0.3s'}}>✔ Líneas guardadas como borrador</div>
      )}
      {mostrarTransferencias && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:400,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarTransferencias(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0}}>Traspasos y devoluciones</h2>
            {!tiendaActual?.nombre && (
              <div style={{color:'#dc3545',fontWeight:700,marginBottom:16}}>⚠️ Selecciona una tienda para operar con traspasos y devoluciones.</div>
            )}
            <TransferenciasPanel 
              tiendas={tiendas}
              tiendaActual={tiendaActual}
              modoFabrica={false}
            />
          </div>
        </div>
      )}
      {mostrarHistoricoTienda && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.45)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(2px)'}}>
          <div style={{background:'#fff',borderRadius:18,minWidth:380,maxWidth:900,width:'96vw',padding:'36px 36px 40px 36px',boxShadow:'0 8px 40px #007bff33',position:'relative',display:'flex',flexDirection:'column',alignItems:'stretch',border:'1.5px solid #e3eaff'}}>
            <button onClick={()=>setMostrarHistoricoTienda(false)} style={{position:'absolute',top:18,right:22,background:'none',border:'none',fontSize:28,cursor:'pointer',color:'#007bff',lineHeight:1,fontWeight:700}} title="Cerrar">×</button>
            <HistoricoTiendaPanel pedidos={pedidos} tiendaId={tiendaActual?.id} tiendaNombre={tiendaActual?.nombre} onVolver={()=>setMostrarHistoricoTienda(false)} />
          </div>
        </div>
      )}
      {/* Editor visual unificado para crear pedido */}
      {creandoNuevo && (() => {
        // Buscar el pedido borrador actual (el que tiene el número recién asignado)
        const pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
        const numeroPedido = pedidoBorrador?.numeroPedido || '';
        const fechaPedido = pedidoBorrador?.fechaPedido ? new Date(pedidoBorrador.fechaPedido).toLocaleString() : '-';
        return (
          <div style={{ border: "2px solid #007bff", margin: 12, padding: 20, background: '#fafdff', borderRadius: 14, boxShadow:'0 2px 12px #007bff11', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', position:'relative' }}>
            {/* Nombre de la tienda centrado y destacado */}
            {tiendaActual?.nombre && (
              <div style={{
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: '#007bff',
                marginBottom: 8,
                letterSpacing: 1,
                background: '#eaf4ff',
                borderRadius: 10,
                padding: '12px 0',
                boxShadow: '0 2px 8px #007bff11'
              }}>
                {tiendaActual.nombre}
              </div>
            )}
            {/* Cabecera con número y fecha SIEMPRE visible */}
            <div style={{textAlign:'center',marginBottom:8}}>
              <span style={{fontSize:20,fontWeight:700,color:'#ff9800'}}>Nº Pedido: <b>{numeroPedido}</b></span>
              <span style={{fontSize:16,marginLeft:18,color:'#007bff',fontWeight:600}}>Fecha: {fechaPedido}</span>
            </div>
            {/* Log visual de creación de borrador */}
            <div style={{textAlign:'center',marginBottom:10}}>
              <span style={{background:'#eaf4ff',color:'#007bff',padding:'6px 18px',borderRadius:8,fontWeight:700,fontSize:16,boxShadow:'0 1px 4px #007bff22'}}>Pedido borrador creado Nº {numeroPedido}</span>
            </div>
            <b style={{fontSize:18, color:'#007bff'}}>Nuevo pedido (borrador)</b>
            {/* Log de confirmación visual */}
            {logGuardado && (
              <div style={{
                position: 'absolute',
                top:12,
                right:20,
                background: '#28a745',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 2px 8px #28a74544',
                zIndex: 10,
                transition: 'opacity 0.3s',
                opacity: logGuardado ? 1 : 0
              }}>
                Líneas guardadas ✔
              </div>
            )}
            <div style={{background:'#f8f9fa',padding:16,borderRadius:10,margin:'14px 0'}}>
              <ul style={{padding:0, margin:0, listStyle:'none'}}>
                {lineasEdit.length === 0 && (
                  <li style={{color:'#888',fontStyle:'italic',marginBottom:8}}>No hay líneas. Añade una para comenzar.</li>
                )}
                {lineasEdit.map((linea, i) => (
                  <li key={i} style={{marginBottom:6, display:'flex', gap:10, alignItems:'center'}}>
                    <input value={linea.producto} onChange={e => setLineasEdit(lineasEdit.map((l, idx) => idx === i ? { ...l, producto: e.target.value } : l))} placeholder="Producto" style={{width:110, border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} />
                    <input type="number" min="1" value={linea.cantidad} onChange={e => setLineasEdit(lineasEdit.map((l, idx) => idx === i ? { ...l, cantidad: Number(e.target.value) } : l))} placeholder="Cantidad" style={{width:60, border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} />
                    <select value={linea.formato || ''} onChange={e => setLineasEdit(lineasEdit.map((l, idx) => idx === i ? { ...l, formato: e.target.value } : l))} style={{width:110, border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}}>
                      <option value="">Formato</option>
                      {FORMATOS_PEDIDO.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <input value={linea.comentario||''} onChange={e => setLineasEdit(lineasEdit.map((l, idx) => idx === i ? { ...l, comentario: e.target.value } : l))} placeholder="Comentario" style={{width:130, border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} />
                    <button onClick={() => setLineasEdit(lineasEdit.filter((_, idx) => idx !== i))} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:20}}>🗑</button>
                  </li>
                ))}
              </ul>
              <div style={{display:'flex', gap:10, marginTop:12, alignItems:'center'}}>
                <button onClick={() => setLineasEdit([...lineasEdit, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }])} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>Añadir línea</button>
                <button onClick={() => {
                  // Guardar líneas localmente en localStorage para no perderlas
                  if (lineasEdit.length === 0) {
                    alert('No hay líneas para guardar.');
                    return;
                  }
                  // Filtrar solo líneas válidas (producto y cantidad > 0)
                  const lineasValidas = lineasEdit.filter(l => l.producto && l.cantidad > 0);
                  if (lineasValidas.length === 0) {
                    alert('No hay líneas válidas para guardar.');
                    return;
                  }
                  if (typeof window !== 'undefined' && window.localStorage) {
                    const key = 'pedido_borrador_' + (tiendaActual?.id || 'default');
                    window.localStorage.setItem(key, JSON.stringify(lineasValidas));
                  }
                  // Crear o actualizar pedido en borrador en la lista de pedidos
                  let pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
                  if (!pedidoBorrador) {
                    pedidoBorrador = {
                      id: 'borrador_' + (tiendaActual?.id || 'default'),
                      estado: 'borrador',
                      lineas: lineasValidas,
                      tienda: tiendaActual,
                      tiendaId: tiendaActual?.id,
                      fechaPedido: new Date().toISOString(),
                    };
                    if (typeof onModificar === 'function') {
                      onModificar(pedidoBorrador.id, pedidoBorrador);
                    }
                  } else {
                    const actualizado = { ...pedidoBorrador, lineas: lineasValidas, estado: 'borrador' };
                    if (typeof onModificar === 'function') {
                      onModificar(pedidoBorrador.id, actualizado);
                    }
                  }
                  setLogGuardado(true);
                  setTimeout(() => setLogGuardado(false), 2200);
                  // NO cerrar ni limpiar el editor, solo guardar y mostrar confirmación
                }} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:6,padding:'9px 26px',fontWeight:800,boxShadow:'0 2px 8px #ffc10744',fontSize:17,letterSpacing:1}}>💾 Guardar líneas</button>
                <button onClick={() => { setCreandoNuevo(false); setLineasEdit([]); }} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Botones de acción alineados horizontalmente y centrados en una sola fila, tamaño uniforme y compacto */}
      <div style={{
        marginTop:56,
        padding:'32px 0',
        display:'flex',
        gap:12,
        justifyContent:'center',
        alignItems:'center',
        flexWrap:'nowrap',
        width:'100%',
        maxWidth:900,
        marginLeft:'auto',
        marginRight:'auto',
        background:'#f8fafd',
        borderRadius:14,
        boxShadow:'0 2px 12px #007bff11'
      }}>
        <button onClick={handleEditarPedidoBorrador} style={{background:'#007bff',color:'#fff',border:'none',borderRadius:8,padding:'0 10px',fontWeight:700, minWidth:120, maxWidth:150, fontSize:15, height:48, whiteSpace:'normal', textAlign:'center', lineHeight:'1.2', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <span>+ Crear<br/>pedido</span>
        </button>
        {/* Mostrar el botón de confirmar solo si se está creando o editando un pedido */}
        {creandoNuevo && (
          <button onClick={async () => {
            // Confirmar y enviar el pedido en borrador usando las líneas editadas actuales
            let pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
            if (!pedidoBorrador) {
              alert('No hay pedidos en borrador para enviar.');
              return;
            }
            // Validación mínima
            const lineasValidas = lineasEdit.filter(l => l.producto && l.cantidad > 0);
            if (lineasValidas.length === 0) {
              alert('El pedido no tiene líneas válidas.');
              return;
            }
            // Asegurar que el pedido tiene número antes de enviar
            let numeroPedido = pedidoBorrador.numeroPedido;
            if (!numeroPedido) {
              const pedidosAll = await obtenerPedidos();
              const maxNumero = pedidosAll.reduce((max, p) => p.numeroPedido && p.numeroPedido > max ? p.numeroPedido : max, 0);
              numeroPedido = maxNumero + 1;
              pedidoBorrador = { ...pedidoBorrador, numeroPedido };
              if (typeof onModificar === 'function') onModificar(pedidoBorrador.id, pedidoBorrador);
            }
            try {
              // Cambiar estado a 'enviado' y persistir
              const actualizado = {
                ...pedidoBorrador,
                estado: 'enviado',
                fechaPedido: new Date().toISOString(),
                numeroPedido,
                tiendaId: tiendaActual?.id || pedidoBorrador.tiendaId,
                lineas: lineasValidas.map(l => ({
                  ...l,
                  cantidadEnviada: l.cantidad // Inicializar cantidadEnviada con la cantidad pedida
                }))
              };
              await actualizarPedido(pedidoBorrador._id || pedidoBorrador.id, actualizado);
              // Refrescar lista de pedidos tras enviar
              const data = await obtenerPedidos();
              if (typeof onModificar === 'function') onModificar(pedidoBorrador.id, actualizado); // Usar id
              setCreandoNuevo(false);
              setLineasEdit([]);
              alert('Pedido enviado correctamente.');
            } catch (e) {
              alert('Error al enviar el pedido.');
            }
          }} style={{background:'#ff9800',color:'#fff',border:'none',borderRadius:8,padding:'0 10px',fontWeight:700, minWidth:120, maxWidth:150, fontSize:15, height:48, whiteSpace:'normal', textAlign:'center', lineHeight:'1.2', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span>Confirmar y<br/>enviar pedido</span>
          </button>
        )}
        <button onClick={() => setMostrarTransferencias(true)} style={{background:'#00b894',color:'#fff',border:'none',borderRadius:8,padding:'0 10px',fontWeight:600, minWidth:120, maxWidth:150, fontSize:15, height:48, whiteSpace:'normal', textAlign:'center', lineHeight:'1.2', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <span>Traspasos y<br/>devoluciones</span>
        </button>
        <button
          onClick={() => setMostrarHistoricoTienda(true)}
          style={{background:'#007bff',color:'#fff',border:'none',borderRadius:8,padding:'0 10px',fontWeight:700, minWidth:120, maxWidth:150, fontSize:15, height:48, whiteSpace:'normal', textAlign:'center', lineHeight:'1.2', display:'flex', alignItems:'center', justifyContent:'center'}}
        >
          <span>Historial</span>
        </button>
      </div>
    </>
  );
}
