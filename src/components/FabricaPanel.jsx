import React, { useState, useRef, useEffect } from 'react';
import Watermark from './Watermark';
import TransferenciasPanel from './TransferenciasPanel';
import logo from '../assets/logo1.png';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';
import PedidoEditorFabrica from './PedidoEditorFabrica';

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
  // Al abrir un pedido, si hay borrador local, cargarlo automáticamente SOLO si es válido y tiene al menos tantas líneas como el pedido real
  const abrirPedido = (pedido) => {
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    let pedidoBorrador = null;
    let usarBorrador = false;
    try {
      const borradorStr = localStorage.getItem(borradorKey);
      if (borradorStr) pedidoBorrador = JSON.parse(borradorStr);
    } catch {}
    // Validar borrador: debe tener líneas y al menos tantas como el pedido real
    if (
      pedidoBorrador &&
      Array.isArray(pedidoBorrador.lineas) &&
      pedidoBorrador.lineas.length > 0 &&
      pedidoBorrador.lineas.length >= (pedido.lineas?.length || 0)
    ) {
      usarBorrador = true;
    } else if (pedidoBorrador) {
      // Borrador corrupto o incompleto: eliminarlo
      try { localStorage.removeItem(borradorKey); } catch {}
    }
    const base = usarBorrador ? pedidoBorrador : pedido;
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
      {pedidoAbierto && !modalCrearPedido && (
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
            <h3>
              {tiendas.find(t => t.id === pedidoAbierto.tiendaId)?.nombre || pedidoAbierto.tiendaId} - Nº Pedido: {pedidoAbierto.numeroPedido}
            </h3>
            <div>Fecha: {pedidoAbierto.fechaPedido ? new Date(pedidoAbierto.fechaPedido).toLocaleString() : '-'}</div>
            <div style={{ marginTop: 12 }}>
              Estado: <b>{estados[pedidoAbierto.estado] || pedidoAbierto.estado}</b>
            </div>
            <PedidoEditorFabrica
              pedido={pedidoAbierto}
              tiendas={tiendas}
              onSave={async (lineasNormalizadas) => {
                await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                const borradorKey = `pedido_borrador_${pedidoAbierto._id || pedidoAbierto.id}`;
                try { localStorage.removeItem(borradorKey); } catch {}
                setPedidoAbierto(null);
              }}
              onSend={() => setPedidoAbierto(null)}
              onCancel={() => setPedidoAbierto(null)}
              onLineaDetalleChange={onLineaDetalleChange}
              onEstadoChange={onEstadoChange}
              onAbrirModalPeso={(idx, peso, cantidad) => {
                setModalPeso({
                  visible: true,
                  lineaIdx: idx,
                  valores: Array.from({ length: cantidad || 1 }, (_, i) => {
                    if (i === 0 && peso) return peso;
                    return '';
                  })
                });
              }}
            />
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
              <PedidoEditorFabrica
                pedido={pedidoAbierto}
                tiendas={tiendas}
                onSave={null}
                onSend={async (lineasNormalizadas) => {
                  if (!lineasNormalizadas.length) return;
                  const tiendaObj = tiendas.find(t => t.id === tiendaNuevaPedido);
                  // 1. Crear pedido en estado 'enviado'
                  const nuevoPedido = {
                    tiendaId: tiendaNuevaPedido,
                    tiendaNombre: tiendaObj?.nombre || tiendaNuevaPedido,
                    fechaPedido: new Date().toISOString(),
                    estado: 'enviado',
                    lineas: lineasNormalizadas,
                    creadoEnFabrica: true
                  };
                  try {
                    const creado = await import('../services/pedidosService').then(mod => mod.crearPedido(nuevoPedido));
                    // 2. Actualizar a 'enviadoTienda' para disparar movimientos de stock
                    await import('../services/pedidosService').then(mod => mod.actualizarPedido(creado._id || creado.id, { ...creado, estado: 'enviadoTienda' }));
                    setModalCrearPedido(false);
                    setTiendaNuevaPedido('');
                    setPedidoAbierto(null);
                  } catch (e) {
                    alert('Error al crear pedido: ' + (e?.message || e));
                  }
                }}
                onCancel={() => { setModalCrearPedido(false); setTiendaNuevaPedido(''); setPedidoAbierto(null); }}
                tiendaNombre={tiendas.find(t => t.id === tiendaNuevaPedido)?.nombre}
              />
            )}
          </div>
        </div>
      )}
      {/* Modal sumatorio de pesos movible */}
      {modalPeso.visible && (
        <DraggableModalPeso
          modalPeso={modalPeso}
          setModalPeso={setModalPeso}
          cambiarValorPeso={cambiarValorPeso}
          aplicarPesos={aplicarPesos}
        />
      )}
    </div>
  );
};

function DraggableModalPeso({ modalPeso, setModalPeso, cambiarValorPeso, aplicarPesos }) {
  const [pos, setPos] = useState({ x: window.innerWidth/2 - 200, y: window.innerHeight/2 - 150 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detectar si es touch (móvil/tablet)
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Drag solo en desktop
  const onMouseDown = e => {
    if (isTouch) return;
    dragging.current = true;
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = e => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // Estilos responsive y scroll para móvil
  const modalStyle = isTouch
    ? {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '95vw',
        maxWidth: 420,
        minWidth: 0,
        maxHeight: '90vh',
        background: '#fff',
        padding: '18px 8px 18px 8px',
        borderRadius: 14,
        boxShadow: '0 4px 32px #0004',
        overflowY: 'auto',
        cursor: 'default',
        userSelect: 'none',
        touchAction: 'auto',
        zIndex: 4001
      }
    : {
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        background: '#fff',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 32px #0004',
        minWidth: 340,
        maxWidth: 900,
        maxHeight: '90vh',
        overflowY: 'auto',
        cursor: 'default',
        userSelect: 'none',
        zIndex: 4001
      };

  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.35)',zIndex:3000}} onClick={()=>setModalPeso({visible:false,lineaIdx:null,valores:[]})}>
      <div
        style={modalStyle}
        onClick={e=>e.stopPropagation()}
      >
        <div
          style={{
            cursor: isTouch ? 'default' : 'move',
            fontWeight:700,
            marginBottom:12,
            background:'#eafaf1',
            padding:'8px 0 8px 12px',
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            gap:8,
            fontSize: isTouch ? 17 : 20
          }}
          onMouseDown={onMouseDown}
        >
          <span style={{fontSize:20}}>🟰</span> Sumar pesos para la línea
          {isTouch && <span style={{marginLeft:8,color:'#888',fontSize:13}}>(Desplaza para ver todo)</span>}
        </div>
        {modalPeso.valores.map((v, idx) => (
          <div key={idx} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontWeight:600}}>Peso #{idx+1}:</span>
            <input type="number" step="0.01" min="0" value={v} onChange={e=>cambiarValorPeso(idx, e.target.value)} style={{width:80,padding:'4px 8px',borderRadius:4,border:'1px solid #ccc'}} />
          </div>
        ))}
        <div style={{margin:'12px 0',fontWeight:600}}>Suma total: {modalPeso.valores.reduce((acc,v)=>acc+(parseFloat(v)||0),0).toFixed(2)} kg</div>
        <button onClick={aplicarPesos} style={{background:'#28a745',color:'#fff',padding:'8px 18px',border:'none',borderRadius:6,fontWeight:600,marginRight:8}}>Aplicar</button>
        <button onClick={()=>setModalPeso({visible:false,lineaIdx:null,valores:[]})} style={{background:'#888',color:'#fff',padding:'8px 18px',border:'none',borderRadius:6}}>Cancelar</button>
      </div>
    </div>
  );
}

export default FabricaPanel;