import React, { useState, useRef, useEffect } from 'react';
import Watermark from './Watermark';
import TransferenciasPanel from './TransferenciasPanel';
import logo from '../assets/logo1.png';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';
import PedidoForm from './PedidoForm';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  const [pedidoAbierto, setPedidoAbierto] = useState(null);
  const [mostrarHistoricoTransferencias, setMostrarHistoricoTransferencias] = useState(false);
  const [modalPeso, setModalPeso] = useState({visible: false, lineaIdx: null, valores: []});
  const [modalCrearPedido, setModalCrearPedido] = useState(false);
  const [tiendaNuevaPedido, setTiendaNuevaPedido] = useState('');
  const { productos } = useProductos();

  // Paleta de colores para los botones de tienda
  const colores = [
    '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#00838f', '#c2185b', '#ffa000', '#455a64', '#5d4037'
  ];

  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado' (no mostrar cerrados)
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  // Estado para forzar refresco visual tras guardar/enviar
  const [refresco, setRefresco] = useState(0);

  // Agrupar pedidos por tienda
  const pedidosPorTienda = {};
  pedidosPendientes.forEach(p => {
    if (!pedidosPorTienda[p.tiendaId]) pedidosPorTienda[p.tiendaId] = [];
    pedidosPorTienda[p.tiendaId].push(p);
  });

  // Normaliza el campo formato de líneas antiguas a los nuevos valores válidos
  function normalizarFormato(formato) {
    if (!formato) return 'Bolsas';
    // Mapear antiguos a nuevos
    const mapa = {
      'kg': 'Kilos',
      'uds': 'Unidades',
      'caja': 'Cajas',
      'piezas': 'Bolsas', // Cambio solicitado: piezas -> bolsas
      'bolsa': 'Bolsas',
      'bolsas': 'Bolsas',
      'kilos': 'Kilos',
      'unidades': 'Unidades',
      'cajas': 'Cajas',
    };
    const f = String(formato).toLowerCase();
    return mapa[f] || formato;
  }

  // --- BORRADOR LOCAL ---
  // Al abrir un pedido, si hay borrador local, cargarlo automáticamente
  const abrirPedido = (pedido) => {
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    let pedidoBorrador = null;
    try {
      const borradorStr = localStorage.getItem(borradorKey);
      if (borradorStr) pedidoBorrador = JSON.parse(borradorStr);
    } catch {}
    const base = pedidoBorrador || pedido;
    const lineasNormalizadas = base.lineas.map(l => {
      if (l.esComentario === true || l.esComentario === 'true' || (typeof l.esComentario !== 'undefined' && l.esComentario)) {
        return { esComentario: true, comentario: l.comentario || '' };
      }
      return { ...l, formato: normalizarFormato(l.formato) };
    });
    setPedidoAbierto({ ...base, lineas: lineasNormalizadas });
  };

  // Guardar automáticamente en localStorage cada vez que cambia el pedido abierto
  useEffect(() => {
    if (!pedidoAbierto) return;
    if (!pedidoAbierto._id && !pedidoAbierto.id) return;
    const borradorKey = `pedido_borrador_${pedidoAbierto._id || pedidoAbierto.id}`;
    try {
      localStorage.setItem(borradorKey, JSON.stringify(pedidoAbierto));
    } catch {}
  }, [pedidoAbierto]);

  // Función para cerrar el pedido abierto
  const cerrarPedido = () => {
    setPedidoAbierto(null);
    setTimeout(() => setRefresco(r => r + 1), 50); // Fuerza refresco tras cerrar
  };

  // Función para actualizar una línea editada
  const actualizarLinea = (idx, campo, valor) => {
    setPedidoAbierto(prev => {
      const nuevasLineas = prev.lineas.map((l, i) => {
        if (i === idx) {
          // Si es una línea de comentario, solo se puede editar el campo 'comentario'
          if (l.esComentario) {
            if (campo === 'comentario') {
              return { ...l, comentario: valor };
            }
            return l; // No permitir editar otros campos en comentarios
          }

          // Lógica existente para líneas de producto
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
      });
      return {
        ...prev,
        lineas: nuevasLineas
      };
    });
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
    // Filtrar líneas de producto válidas y mantener todas las líneas de comentario
    const lineasParaGuardar = pedidoAbierto.lineas.filter(l => 
      l.esComentario || 
      (!l.esComentario && l.producto && (l.cantidad !== undefined && l.cantidad !== null))
    );

    if (lineasParaGuardar.length === 0 && pedidoAbierto.lineas.some(l => !l.esComentario)) {
      // Si todas las líneas de PRODUCTO se borraron o invalidaron, considerar opciones
      // Por ahora, no hacemos nada o podríamos eliminar el pedido si no quedan líneas de producto.
    }

    const lineasNormalizadas = lineasParaGuardar.map(l => {
      if (l.esComentario) {
        return { esComentario: true, comentario: l.comentario || '' };
      }
      // Normalización para líneas de producto
      return {
        ...l,
        preparada: !!l.preparada,
        peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
        cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
        cantidad: Number(l.cantidad)
      };
    });

    await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
    // Limpiar borrador local tras guardar
    const borradorKey = `pedido_borrador_${pedidoAbierto._id || pedidoAbierto.id}`;
    try { localStorage.removeItem(borradorKey); } catch {}
    setPedidoAbierto(null);
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

  // Función para autocompletar/reemplazar producto por nombre si se introduce referencia
  const autocompletarProducto = (valor) => {
    if (!valor) return valor;
    const productoEncontrado = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === String(valor).toLowerCase());
    if (productoEncontrado) return productoEncontrado.nombre;
    return valor;
  };

  // Función para crear pedido manual de tienda desde fábrica
  const handleCrearPedidoTienda = async (pedido) => {
    if (!tiendaNuevaPedido) return;
    const tiendaObj = tiendas.find(t => t.id === tiendaNuevaPedido);
    const nuevoPedido = {
      tiendaId: tiendaNuevaPedido,
      tiendaNombre: tiendaObj?.nombre || tiendaNuevaPedido,
      fechaPedido: new Date().toISOString(),
      estado: 'enviado',
      lineas: pedido.lineas,
      creadoEnFabrica: true
    };
    try {
      await import('../services/pedidosService').then(mod => mod.crearPedido(nuevoPedido));
      setModalCrearPedido(false);
      setTiendaNuevaPedido('');
      // Opcional: mostrar mensaje de éxito
      // Si tienes acceso a setPedidos, podrías actualizar el estado aquí
      // Si no, el nuevo pedido aparecerá en la próxima recarga automática
    } catch (e) {
      alert('Error al crear pedido: ' + (e?.message || e));
    }
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
              minWidth: 200,
              height: 44,
              background:'#ffc107',
              color:'#333',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #ffc10722',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="devoluciones" style={{marginRight:8}}>↩️</span>Devoluciones a fábrica
          </button>
          <button
            onClick={()=>setModalCrearPedido(true)}
            style={{
              minWidth: 180,
              height: 44,
              background:'#28a745',
              color:'#fff',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #28a74522',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="nuevo-pedido" style={{marginRight:8}}>📝</span>Crear pedido tienda
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
        <div className="modal-editor-fabrica-bg" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#fff', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: 0, padding: 0
        }} onClick={() => setPedidoAbierto(null)}>
          <div 
            className="modal-editor-fabrica"
            style={{
              background: '#fff', borderRadius: 0, minWidth: '100vw', maxWidth: '100vw', width: '100vw',
              minHeight: '100vh', maxHeight: '100vh', height: '100vh',
              padding: '36px 36px 40px 36px', boxShadow: 'none',
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'stretch',
              overflowY: 'auto',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              margin: 0
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual para móvil */}
            <div className="modal-editor-fabrica-handle" style={{
              width: 48, height: 6, background: '#e0e0e0', borderRadius: 4, margin: '0 auto 18px auto', display: 'none'
            }} />
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
            <table className="tabla-edicion-fabrica" style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
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
                {pedidoAbierto.lineas.map((linea, idx) => {
                  // Renderizado de línea de comentario
                  if (linea.esComentario === true || linea.esComentario === 'true' || (typeof linea.esComentario !== 'undefined' && linea.esComentario)) {
                    return (
                      <tr key={`comment-${idx}`} style={{ backgroundColor: '#fffbe6', border: '2px solid #ffe58f' }}>
                        <td colSpan="8" style={{ padding: '12px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 20, color: '#b8860b' }}>📝</span>
                            <span style={{ fontWeight: 'bold', color: '#b8860b', fontSize: 16 }}>COMENTARIO:</span>
                            <input
                              type="text"
                              value={linea.comentario || ''}
                              onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                              placeholder="Escribe aquí tu comentario..."
                              style={{ 
                                flexGrow: 1, 
                                border: '1px dashed #b8860b', 
                                borderRadius: 6, 
                                padding: '8px 12px', 
                                background: '#fffdf7',
                                fontStyle: 'italic',
                                fontSize: 15,
                                color: '#b8860b'
                              }}
                            />
                            <button
                              style={{
                                background:'#dc3545',
                                color:'#fff',
                                border:'none',
                                borderRadius:6,
                                padding:'6px 12px',
                                fontWeight:600,
                                cursor:'pointer',
                                fontSize: 14
                              }}
                              onClick={() => borrarLinea(idx)}
                              title="Eliminar comentario"
                            >
                              🗑 Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  // Renderizado normal para líneas de producto
                  return (
                    <tr key={idx}>
                      <td>
                        <input
                          list="productos-lista-global"
                          value={linea.producto}
                          onChange={e => {
                            const valor = autocompletarProducto(e.target.value);
                            actualizarLinea(idx, 'producto', valor);
                          }}
                          placeholder="Producto"
                          style={{ width: 260, border: '1px solid #bbb', borderRadius: 6, padding: '6px 8px', fontSize: 15 }}
                        />
                        <datalist id="productos-lista-global">
                          {productos.map(prod => (
                            <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                              {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td style={{position:'relative',display:'flex',alignItems:'center',gap:6}}>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                          style={{ width: 60 }}
                        />
                        {/* Botón sumatorio solo si cantidad > 1 */}
                        {linea.cantidad > 1 && linea.cantidad <= 10 && (
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
                        {/* Si hay modal de suma, mostrarlo flotante ARRIBA de la celda cantidad */}
                        {modalPeso && modalPeso.visible && modalPeso.lineaIdx === idx && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            // Si la fila es una de las 5 primeras, abrir hacia abajo (top:36), si no, hacia arriba (bottom:36)
                            ...(idx < 5 ? { top: 36 } : { bottom: 36 }),
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
                          value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                          onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                          style={{ width: 70, zIndex: 1, position: 'relative', background: '#fff' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
                          onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                          style={{ width: 70 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
                          onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <select value={linea.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)} style={{ width: 90 }}>
                          {FORMATOS_PEDIDO.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={linea.comentario === null || linea.comentario === undefined ? '' : linea.comentario}
                          onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                          style={{ width: 110 }}
                        />
                      </td>
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
                  );
                })}
                {/* Botón para añadir línea */}
                <tr>
                  <td colSpan="8" style={{textAlign:'left', paddingTop:8}}>
                    <button
                      style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8, marginRight: 12}}
                      onClick={() => setPedidoAbierto(prev => ({
                        ...prev,
                        lineas: [
                          ...prev.lineas,
                          { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null, cantidadEnviada: null, lote: '', preparada: false, esComentario: false }
                        ]
                      }))}
                    >
                      Añadir línea de producto
                    </button>
                    <button
                      style={{background:'#6c757d',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8}}
                      onClick={() => {
                        setPedidoAbierto(prev => ({
                          ...prev,
                          lineas: [
                            ...prev.lineas,
                            { esComentario: true, comentario: '' }
                          ]
                        }));
                      }}
                    >
                      Añadir comentario
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="8" style={{textAlign:'right', paddingTop:16}}>
                    <button
                      style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}}
                      onClick={async () => {
                        // Filtrar líneas de producto válidas y mantener todas las líneas de comentario
                        const lineasParaGuardar = pedidoAbierto.lineas.filter(l => 
                          l.esComentario || 
                          (!l.esComentario && l.producto && (l.cantidad !== undefined && l.cantidad !== null))
                        );

                        const lineasNormalizadas = lineasParaGuardar.map(l => {
                          if (l.esComentario) {
                            return { esComentario: true, comentario: l.comentario || '' };
                          }
                          return {
                            ...l,
                            preparada: !!l.preparada,
                            peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
                            cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
                            cantidad: Number(l.cantidad)
                          };
                        });
                        await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                        // Limpiar borrador local tras guardar
                        const borradorKey = `pedido_borrador_${pedidoAbierto._id || pedidoAbierto.id}`;
                        try { localStorage.removeItem(borradorKey); } catch {}
                        setPedidoAbierto(null);
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}}
                      onClick={async () => {
                        // Filtrar líneas de producto válidas y mantener todas las líneas de comentario
                        const lineasParaEnviar = pedidoAbierto.lineas.filter(l => 
                          l.esComentario || 
                          (!l.esComentario && l.producto && (l.cantidad !== undefined && l.cantidad !== null))
                        );

                        if (!lineasParaEnviar.some(l => !l.esComentario) && pedidoAbierto.lineas.some(l => !l.esComentario)) {
                          // Si no quedan líneas de PRODUCTO válidas pero el pedido original sí tenía, se considera eliminar el pedido.
                          await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'eliminar');
                          setPedidoAbierto(null);
                          return;
                        }
                        
                        const lineasNormalizadas = lineasParaEnviar.map(l => {
                           if (l.esComentario) {
                            return { esComentario: true, comentario: l.comentario || '' };
                          }
                          return {
                            ...l,
                            preparada: !!l.preparada,
                            peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
                            cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
                            cantidad: Number(l.cantidad)
                          };
                        });

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
      {/* Modal para crear pedido manual de tienda */}
      {modalCrearPedido && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:340,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>{setModalCrearPedido(false); setTiendaNuevaPedido(''); setPedidoAbierto(null);}} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0,marginBottom:16,fontSize:22,color:'#28a745'}}>Crear pedido manual para tienda</h2>
            <div style={{marginBottom:18}}>
              <label htmlFor="tienda-nueva-pedido" style={{fontWeight:600}}>Selecciona tienda:</label>
              <select id="tienda-nueva-pedido" value={tiendaNuevaPedido} onChange={e=>{
                setTiendaNuevaPedido(e.target.value);
                if (e.target.value) {
                  // Inicializar pedido nuevo para edición completa
                  const tiendaObj = tiendas.find(t => t.id === e.target.value);
                  setPedidoAbierto({
                    _id: undefined,
                    id: undefined,
                    tiendaId: e.target.value,
                    tiendaNombre: tiendaObj?.nombre || e.target.value,
                    fechaPedido: new Date().toISOString(),
                    estado: 'enviado',
                    lineas: [],
                    creadoEnFabrica: true
                  });
                } else {
                  setPedidoAbierto(null);
                }
              }} style={{marginLeft:12,padding:8,borderRadius:6,border:'1px solid #bbb',minWidth:180}}>
                <option value="">-- Selecciona tienda --</option>
                {tiendas.filter(t=>t.id!=='clientes').map(t=>(<option key={t.id} value={t.id}>{t.nombre}</option>))}
              </select>
            </div>
            {/* Editor completo de pedido para creación */}
            {pedidoAbierto && tiendaNuevaPedido && (
              <div style={{marginTop:24}}>
                {/* Reutiliza la tabla y controles del editor de pedido abierto, pero con lógica de guardado diferente */}
                <div style={{overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px #0001', background:'#fff'}}>
                  <table className="tabla-edicion-fabrica" style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
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
                      {pedidoAbierto.lineas.map((linea, idx) => {
                        if (linea.esComentario === true || linea.esComentario === 'true' || (typeof linea.esComentario !== 'undefined' && linea.esComentario)) {
                          return (
                            <tr key={`comment-${idx}`} style={{ backgroundColor: '#fffbe6', border: '2px solid #ffe58f' }}>
                              <td colSpan="8" style={{ padding: '12px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 20, color: '#b8860b' }}>📝</span>
                                  <span style={{ fontWeight: 'bold', color: '#b8860b', fontSize: 16 }}>COMENTARIO:</span>
                                  <input
                                    type="text"
                                    value={linea.comentario || ''}
                                    onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                                    placeholder="Escribe aquí tu comentario..."
                                    style={{ 
                                      flexGrow: 1, 
                                      border: '1px dashed #b8860b', 
                                      borderRadius: 6, 
                                      padding: '8px 12px', 
                                      background: '#fffdf7',
                                      fontStyle: 'italic',
                                      fontSize: 15,
                                      color: '#b8860b'
                                    }}
                                  />
                                  <button
                                    style={{
                                      background:'#dc3545',
                                      color:'#fff',
                                      border:'none',
                                      borderRadius:6,
                                      padding:'6px 12px',
                                      fontWeight:600,
                                      cursor:'pointer',
                                      fontSize: 14
                                    }}
                                    onClick={() => borrarLinea(idx)}
                                    title="Eliminar comentario"
                                  >
                                    🗑 Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={idx}>
                            <td>
                              <input
                                list="productos-lista-global"
                                value={linea.producto}
                                onChange={e => {
                                  const valor = autocompletarProducto(e.target.value);
                                  actualizarLinea(idx, 'producto', valor);
                                }}
                                placeholder="Producto"
                                style={{ width: 260, border: '1px solid #bbb', borderRadius: 6, padding: '6px 8px', fontSize: 15 }}
                              />
                              <datalist id="productos-lista-global">
                                {productos.map(prod => (
                                  <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                                    {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                                  </option>
                                ))}
                              </datalist>
                            </td>
                            <td style={{position:'relative',display:'flex',alignItems:'center',gap:6}}>
                              <input
                                type="number"
                                min="1"
                                value={linea.cantidad}
                                onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                                style={{ width: 60 }}
                              />
                              {/* Botón sumatorio solo si cantidad > 1 */}
                              {linea.cantidad > 1 && linea.cantidad <= 10 && (
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
                              {/* Si hay modal de suma, mostrarlo flotante ARRIBA de la celda cantidad */}
                              {modalPeso && modalPeso.visible && modalPeso.lineaIdx === idx && (
                                <div style={{
                                  position: 'absolute',
                                  left: 0,
                                  // Si la fila es una de las 5 primeras, abrir hacia abajo (top:36), si no, hacia arriba (bottom:36)
                                  ...(idx < 5 ? { top: 36 } : { bottom: 36 }),
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
                                value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                                onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                                style={{ width: 70, zIndex: 1, position: 'relative', background: '#fff' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
                                onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                                style={{ width: 70 }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
                                onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                                style={{ width: 90 }}
                              />
                            </td>
                            <td>
                              <select value={linea.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)} style={{ width: 90 }}>
                                {FORMATOS_PEDIDO.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={linea.comentario === null || linea.comentario === undefined ? '' : linea.comentario}
                                onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                                style={{ width: 110 }}
                              />
                            </td>
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
                        );
                      })}
                      {/* Botón para añadir línea */}
                      <tr>
                        <td colSpan="8" style={{textAlign:'left', paddingTop:8}}>
                          <button
                            style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8, marginRight: 12}}
                            onClick={() => setPedidoAbierto(prev => ({
                              ...prev,
                              lineas: [
                                ...prev.lineas,
                                { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null, cantidadEnviada: null, lote: '', preparada: false, esComentario: false }
                              ]
                            }))}
                          >
                            Añadir línea de producto
                          </button>
                          <button
                            style={{background:'#6c757d',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8}}
                            onClick={() => {
                              setPedidoAbierto(prev => ({
                                ...prev,
                                lineas: [
                                  ...prev.lineas,
                                  { esComentario: true, comentario: '' }
                                ]
                              }));
                            }}
                          >
                            Añadir comentario
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="8" style={{textAlign:'right', paddingTop:16}}>
                          <button
                            style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}}
                            onClick={async () => {
                              // Guardar pedido nuevo
                              const lineasParaGuardar = pedidoAbierto.lineas.filter(l => 
                                l.esComentario || 
                                (!l.esComentario && l.producto && (l.cantidad !== undefined && l.cantidad !== null))
                              );
                              if (lineasParaGuardar.length === 0) return;
                              const lineasNormalizadas = lineasParaGuardar.map(l => {
                                if (l.esComentario) {
                                  return { esComentario: true, comentario: l.comentario || '' };
                                }
                                return {
                                  ...l,
                                  preparada: !!l.preparada,
                                  peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso),
                                  cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada),
                                  cantidad: Number(l.cantidad)
                                };
                              });
                              const tiendaObj = tiendas.find(t => t.id === tiendaNuevaPedido);
                              const nuevoPedido = {
                                tiendaId: tiendaNuevaPedido,
                                tiendaNombre: tiendaObj?.nombre || tiendaNuevaPedido,
                                fechaPedido: new Date().toISOString(),
                                estado: 'enviado',
                                lineas: lineasNormalizadas,
                                creadoEnFabrica: true
                              };
                              try {
                                await import('../services/pedidosService').then(mod => mod.crearPedido(nuevoPedido));
                                setModalCrearPedido(false);
                                setTiendaNuevaPedido('');
                                setPedidoAbierto(null);
                              } catch (e) {
                                alert('Error al crear pedido: ' + (e?.message || e));
                              }
                            }}
                          >
                            Guardar y enviar pedido
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricaPanel;