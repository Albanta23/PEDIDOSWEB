import React, { useState } from 'react';
import Watermark from './Watermark';
import TransferenciasPanel from './TransferenciasPanel';
import logo from '../assets/logo1.png';
import { FORMATOS_PEDIDO } from '../configFormatos';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  const [pedidoAbierto, setPedidoAbierto] = useState(null);
  const [mostrarHistoricoTransferencias, setMostrarHistoricoTransferencias] = useState(false);
  const [modalPeso, setModalPeso] = useState({visible: false, lineaIdx: null, valores: []});

  // Paleta de colores para los botones de tienda
  const colores = [
    '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#00838f', '#c2185b', '#ffa000', '#455a64', '#5d4037'
  ];

  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado'
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  // Estado para forzar refresco visual tras guardar/enviar
  const [refresco, setRefresco] = useState(0);

  // Agrupar pedidos por tienda
  const pedidosPorTienda = {};
  pedidosPendientes.forEach(p => {
    if (!pedidosPorTienda[p.tiendaId]) pedidosPorTienda[p.tiendaId] = [];
    pedidosPorTienda[p.tiendaId].push(p);
  });

  // Función para abrir un pedido concreto
  const abrirPedido = (pedido) => {
    setPedidoAbierto({
      ...pedido,
      lineas: pedido.lineas.map(l => ({ ...l }))
    });
  };

  // Función para cerrar el pedido abierto
  const cerrarPedido = () => {
    setPedidoAbierto(null);
    setTimeout(() => setRefresco(r => r + 1), 50); // Fuerza refresco tras cerrar
  };

  // Función para actualizar una línea editada
  const actualizarLinea = (idx, campo, valor) => {
    setPedidoAbierto(prev => ({
      ...prev,
      lineas: prev.lineas.map((l, i) => {
        if (i === idx) {
          let nuevoValor = valor;
          if (campo === 'peso' || campo === 'cantidadEnviada') {
            nuevoValor = valor === '' ? null : parseFloat(valor);
            if (isNaN(nuevoValor)) {
              nuevoValor = null; // Si no es un número válido, establece null
            }
          }
          return { ...l, [campo]: nuevoValor };
        }
        return l;
      })
    }));
  };

  // Función para borrar una línea
  const borrarLinea = (idx) => {
    setPedidoAbierto(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== idx)
    }));
  };

  // Guardar edición de un pedido
  const guardarEdicion = async () => {
    const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && (l.cantidad !== undefined && l.cantidad !== null)); // Asegurar que cantidad exista
    if (nuevasLineas.length === 0 && pedidoAbierto.lineas.length > 0) { // Si todas las líneas se borraron o invalidaron
      // Opcional: decidir si eliminar el pedido o simplemente no guardar líneas vacías
      // Por ahora, si había líneas y ahora no hay válidas, no hacemos nada o podríamos eliminar el pedido.
      // await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'eliminar');
      // setPedidoAbierto(null);
      // return;
    }
    // Asegurarse de que el peso se incluye y es un número
    const lineasNormalizadas = nuevasLineas.map(l => ({
      ...l,
      preparada: !!l.preparada, // Mantener la lógica de preparada
      peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
      cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
      cantidad: Number(l.cantidad) // Asegurar que cantidad también sea número
    }));
    await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
    setPedidoAbierto(null); // Cerrar el modal de edición después de guardar
  };

  // Cambiar valor de peso en el modal de suma
  const cambiarValorPeso = (i, valor) => {
    setModalPeso(prev => ({
      ...prev,
      valores: prev.valores.map((v, idx) => idx === i ? valor : v)
    }));
  };

  // Aplicar pesos sumados a la línea correspondiente
  const aplicarPesos = () => {
    if (modalPeso.lineaIdx !== null) {
      const suma = modalPeso.valores.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
      actualizarLinea(modalPeso.lineaIdx, 'peso', suma);
    }
    setModalPeso({visible:false, lineaIdx:null, valores:[]});
  };

  return (
    <div style={{
      fontFamily:'Inter, Segoe UI, Arial, sans-serif',
      fontSize:16,
      background:'#f6f8fa',
      minHeight:'100vh',
      paddingBottom:40,
      position:'relative',
      zIndex:1,
      overflow:'hidden'
    }}>
      <Watermark />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,marginTop:10}}>
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 75,
            height: 75,
            objectFit: 'contain',
            boxShadow: '0 4px 24px #0002',
            borderRadius: 18,
            background: '#fff',
            padding: 12,
            margin: 0
          }}
        />
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <button
            onClick={onVerHistorico}
            style={{
              minWidth: 160,
              height: 44,
              background:'#007bff',
              color:'#fff',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #007bff22',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="histórico" style={{marginRight:8}}>📦</span>Historial de envíos
          </button>
          <button
            onClick={()=>setMostrarHistoricoTransferencias(true)}
            style={{
              minWidth: 150,
              height: 44,
              background:'#00b894',
              color:'#fff',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #00b89422',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="devoluciones" style={{marginRight:8}}>↩️</span>Devoluciones
          </button>
        </div>
      </div>
      <h2 style={{margin:0}}>Panel de Fábrica</h2>
      {mostrarHistoricoTransferencias && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:400,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarHistoricoTransferencias(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0}}>Histórico de devoluciones de tiendas</h2>
            <TransferenciasPanel tiendas={tiendas} modoFabrica={true} />
          </div>
        </div>
      )}
      <h3 style={{marginBottom:12,marginTop:24}}>Pedidos pendientes de preparar o enviar</h3>
      {/* Botones de tiendas con pedidos pendientes */}
      <div style={{display:'flex',flexWrap:'wrap',gap:18,marginBottom:32}} key={refresco}>
        {Object.entries(pedidosPorTienda).map(([tiendaId, pedidos], idx) => {
          const tienda = tiendas.find(t => t.id === tiendaId);
          return pedidos.map((pedido, pidx) => {
            // Clave única robusta: id/_id + número de pedido + índice
            const key = `${pedido.id || pedido._id || 'sinid'}-${pedido.numeroPedido || 'nonum'}-${pidx}`;
            return (
              <button
                key={key}
                onClick={() => {
                  console.log('[DEBUG] Click en miniatura de pedido', pedido);
                  // Log visual temporal
                  const msg = document.createElement('div');
                  msg.textContent = 'Click en miniatura: Pedido ' + (pedido.numeroPedido || 'sin número');
                  msg.style.position = 'fixed';
                  msg.style.top = '10px';
                  msg.style.left = '50%';
                  msg.style.transform = 'translateX(-50%)';
                  msg.style.background = '#007bff';
                  msg.style.color = '#fff';
                  msg.style.padding = '10px 32px';
                  msg.style.borderRadius = '8px';
                  msg.style.fontWeight = 'bold';
                  msg.style.fontSize = '18px';
                  msg.style.zIndex = 4000;
                  document.body.appendChild(msg);
                  setTimeout(() => msg.remove(), 2000);
                  // Log completo del pedido
                  console.log('[DEBUG] Objeto pedido completo:', JSON.stringify(pedido, null, 2));
                  if (!pedido.lineas || !Array.isArray(pedido.lineas) || pedido.lineas.length === 0 || (!pedido._id && !pedido.id)) {
                    const err = document.createElement('div');
                    err.textContent = 'ERROR: El pedido no tiene líneas o identificador. Revisa la consola.';
                    err.style.position = 'fixed';
                    err.style.top = '60px';
                    err.style.left = '50%';
                    err.style.transform = 'translateX(-50%)';
                    err.style.background = '#dc3545';
                    err.style.color = '#fff';
                    err.style.padding = '10px 32px';
                    err.style.borderRadius = '8px';
                    err.style.fontWeight = 'bold';
                    err.style.fontSize = '18px';
                    err.style.zIndex = 4000;
                    document.body.appendChild(err);
                    setTimeout(() => err.remove(), 4000);
                    return;
                  }
                  abrirPedido(pedido);
                  setTimeout(() => {
                    console.log('[DEBUG] Estado pedidoAbierto tras click:', pedidoAbierto);
                  }, 500);
                }}
                style={{
                  minWidth: 180,
                  minHeight: 90,
                  background: colores[(idx + pidx) % colores.length],
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 18,
                  margin: 0,
                  boxShadow: '0 2px 8px #bbb',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s',
                  outline: 'none',
                  padding: 12
                }}
              >
                <span style={{fontSize:22}}>{tienda?.nombre || tiendaId}</span>
                <span style={{fontSize:14,marginTop:6}}>Nº Pedido: <b>{pedido.numeroPedido}</b></span>
                <span style={{fontSize:13,marginTop:2}}>Líneas: {pedido.lineas.length}</span>
              </button>
            );
          });
        })}
      </div>
      {/* Edición del pedido abierto */}
      {pedidoAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setPedidoAbierto(null)}>
          <div style={{
            background: '#fff', borderRadius: 18, minWidth: 380, maxWidth: 700, width: '95vw',
            padding: '36px 36px 40px 36px', boxShadow: '0 8px 40px #007bff33',
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3>
              {tiendas.find(t => t.id === pedidoAbierto.tiendaId)?.nombre || pedidoAbierto.tiendaId} - Nº Pedido: {pedidoAbierto.numeroPedido}
            </h3>
            <div>Fecha: {pedidoAbierto.fechaPedido ? new Date(pedidoAbierto.fechaPedido).toLocaleString() : '-'}</div>
            <div style={{ marginTop: 12 }}>
              Estado: <b>{estados[pedidoAbierto.estado] || pedidoAbierto.estado}</b>
            </div>
            <div style={{ marginTop: 12, display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={cerrarPedido} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Cancelar</button>
            </div>
            <div style={{overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px #0001', background:'#fff'}}>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant. pedida</th>
                  <th>Peso (kg)</th>
                  <th>Cant. enviada</th>
                  <th>Lote</th>
                  <th>Formato pedido</th>
                  <th>Comentario</th>
                  <th>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {pedidoAbierto.lineas.map((linea, idx) => (
                  <tr key={idx}>
                    <td>{linea.producto}</td>
                    <td style={{position:'relative',display:'flex',alignItems:'center',gap:6}}>
                      {linea.cantidad}
                      {/* Botón sumatorio solo si cantidad > 1 */}
                      {linea.cantidad > 1 && (
                        <button
                          style={{
                            background: '#ff9800',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 18,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #ff980044',
                            zIndex: 2
                          }}
                          title="Sumar pesos parciales"
                          onClick={() => setModalPeso({visible:true, lineaIdx:idx, valores:Array.from({length: linea.cantidad}, (_,i)=>modalPeso.visible && modalPeso.lineaIdx===idx && modalPeso.valores.length===linea.cantidad ? modalPeso.valores[i]||'' : '')})}
                          type="button"
                        >
                          ➕
                        </button>
                      )}
                      {/* Si hay modal de suma, mostrarlo flotante debajo de la celda cantidad */}
                      {modalPeso && modalPeso.visible && modalPeso.lineaIdx === idx && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 36,
                          zIndex: 10,
                          background: '#fff',
                          border: '1px solid #007bff',
                          borderRadius: 8,
                          boxShadow: '0 2px 12px #007bff22',
                          padding: 12,
                          minWidth: 160,
                          minHeight: 60
                        }}>
                          <div style={{fontWeight:700,marginBottom:6}}>Sumar pesos</div>
                          {modalPeso.valores.map((v, i) => (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                              <input type="number" step="0.01" min="0" value={v} onChange={e=>cambiarValorPeso(i, e.target.value)} style={{width:60,padding:'2px 6px',borderRadius:4,border:'1px solid #ccc'}} />
                              <span>kg</span>
                            </div>
                          ))}
                          <div style={{margin:'8px 0',fontWeight:600}}>Total: {modalPeso.valores.reduce((acc,v)=>acc+(parseFloat(v)||0),0).toFixed(2)} kg</div>
                          <div style={{display:'flex',gap:8,marginTop:6}}>
                            <button onClick={aplicarPesos} style={{background:'#28a745',color:'#fff',padding:'4px 12px',border:'none',borderRadius:6,fontWeight:600}}>Aplicar</button>
                            <button onClick={()=>setModalPeso({visible:false,lineaIdx:null,valores:[]})} style={{background:'#888',color:'#fff',padding:'4px 12px',border:'none',borderRadius:6}}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={linea.peso ?? ''}
                        onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                        style={{ width: 70, zIndex: 1, position: 'relative', background: '#fff' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any" // Permitir decimales si es necesario para cantidadEnviada
                        value={linea.cantidadEnviada ?? ''} // Muestra string vacío si es null/undefined
                        onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={linea.lote ?? ''}
                        onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>{FORMATOS_PEDIDO.includes(linea.formato) ? linea.formato : '-'}</td>
                    <td>{linea.comentario}</td>
                    <td>
                      <button
                        style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                        onClick={() => borrarLinea(idx)}
                        title="Eliminar línea"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="8" style={{textAlign:'right', paddingTop:16}}>
                    <button
                      style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}}
                      onClick={async () => {
                        const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && (l.cantidad !== undefined && l.cantidad !== null));
                        const lineasNormalizadas = nuevasLineas.map(l => ({
                          ...l,
                          preparada: !!l.preparada,
                          peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
                          cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
                          cantidad: Number(l.cantidad) // Asegurar que cantidad sea número
                        }));
                        await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                        // No cerramos el pedido aquí para permitir más ediciones o el envío posterior.
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}}
                      onClick={async () => {
                        const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && (l.cantidad !== undefined && l.cantidad !== null));
                        if (nuevasLineas.length === 0) {
                          // Si no hay líneas válidas pero el pedido original sí tenía, se considera eliminar el pedido.
                          // Esto es consistente con la lógica previa de eliminar si no hay líneas.
                          await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'eliminar');
                          setPedidoAbierto(null);
                          return;
                        }
                        const lineasNormalizadas = nuevasLineas.map(l => ({
                          ...l,
                          preparada: !!l.preparada,
                          peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
                          cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
                          cantidad: Number(l.cantidad)
                        }));
                        await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                        await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'enviadoTienda');
                        setPedidoAbierto(null);
                      }}
                    >
                      Enviar pedido
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricaPanel;