import React, { useState, useEffect } from "react";
import TransferenciasPanel from './TransferenciasPanel';
import { crearPedido, actualizarPedido, obtenerPedidos } from '../services/pedidosService';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { jsPDF } from 'jspdf';

// Utilidad para cargar imagen como base64
async function cargarLogoBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Utilidad para cargar imagen como base64 y comprimirla (opcional calidad)
async function cargarLogoBase64Optimizado(url, maxWidth = 120, maxHeight = 60, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      // Redimensionar el logo para reducir el peso
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
      if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // Comprimir a calidad media
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(null); // Si falla, no bloquea
    img.src = url;
  });
}

// Utilidad robusta para convertir ArrayBuffer a base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  try {
    const base64 = window.btoa(binary);
    // Validar que el base64 no esté vacío y tenga una longitud razonable
    if (!base64 || base64.length < 20) {
      console.error('[Base64] Conversión fallida o resultado muy corto:', base64 ? base64.substring(0,50) : 'null');
      return null; // Devolver null si la conversión falla o es muy corta
    }
    return base64;
  } catch (e) {
    console.error('[Base64] Error en window.btoa:', e);
    return null; // Devolver null en caso de error
  }
}

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual, onVerHistoricoPedidos }) {
  const [mostrarTransferencias, setMostrarTransferencias] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [lineasEdit, setLineasEdit] = useState([]);
  const [logGuardado, setLogGuardado] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [enviandoProveedor, setEnviandoProveedor] = useState(false);
  const [mensajeProveedor, setMensajeProveedor] = useState("");

  // Clave para localStorage específica de la tienda
  const getStorageKey = () => `pedido_borrador_${tiendaActual?.id || 'default'}`;

  // Cargar líneas desde localStorage al montar o cambiar tienda
  useEffect(() => {
    if (!tiendaActual?.id) return;
    
    const key = getStorageKey();
    const lineasGuardadas = localStorage.getItem(key);
    
    if (lineasGuardadas) {
      try {
        const lineas = JSON.parse(lineasGuardadas);
        setLineasEdit(lineas);
        // Si hay líneas guardadas, abrir automáticamente el editor
        if (lineas.length > 0) {
          setCreandoNuevo(true);
        }
      } catch (error) {
        console.warn('Error al cargar líneas desde localStorage:', error);
      }
    }
  }, [tiendaActual?.id]);

  // Guardar en localStorage cada vez que cambian las líneas
  useEffect(() => {
    if (tiendaActual?.id && lineasEdit.length > 0) {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(lineasEdit));
    }
  }, [lineasEdit, tiendaActual?.id]);

  // Función para obtener el siguiente número de pedido disponible
  const getNextNumeroPedido = () => {
    const maxNumero = pedidos.reduce((max, p) => p.numeroPedido && p.numeroPedido > max ? p.numeroPedido : max, 0);
    return maxNumero + 1;
  };

  // Función para limpiar localStorage cuando se envía el pedido
  const limpiarStorage = () => {
    if (tiendaActual?.id) {
      const key = getStorageKey();
      localStorage.removeItem(key);
    }
  };

  const handleEditarPedidoBorrador = () => {
    setCreandoNuevo(true);
    // Si no hay líneas, crear una línea vacía
    if (lineasEdit.length === 0) {
      setLineasEdit([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
    }
  };

  const handleGuardarLineas = () => {
    if (lineasEdit.length === 0) {
      alert('No hay líneas para guardar.');
      return;
    }

    // Filtrar solo líneas válidas
    const lineasValidas = lineasEdit.filter(l => l.producto && l.cantidad > 0);
    if (lineasValidas.length === 0) {
      alert('No hay líneas válidas para guardar.');
      return;
    }

    // Crear o actualizar pedido en borrador
    let pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
    
    if (!pedidoBorrador) {
      // Crear nuevo pedido borrador
      pedidoBorrador = {
        id: 'borrador_' + (tiendaActual?.id || 'default'),
        estado: 'borrador',
        lineas: lineasValidas,
        tienda: tiendaActual,
        tiendaId: tiendaActual?.id,
        fechaPedido: new Date().toISOString(),
        numeroPedido: getNextNumeroPedido()
      };
      if (typeof onModificar === 'function') {
        onModificar(pedidoBorrador.id, pedidoBorrador);
      }
    } else {
      // Actualizar pedido borrador existente
      const actualizado = { ...pedidoBorrador, lineas: lineasValidas, estado: 'borrador' };
      if (typeof onModificar === 'function') {
        onModificar(pedidoBorrador.id, actualizado);
      }
    }

    setLogGuardado(true);
    setTimeout(() => setLogGuardado(false), 2200);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleConfirmarYEnviarPedido = async () => {
    // Filtrar líneas válidas
    const lineasValidas = lineasEdit.filter(l => l.producto && l.cantidad > 0);
    if (lineasValidas.length === 0) {
      alert('El pedido no tiene líneas válidas.');
      return;
    }

    try {
      const numeroPedido = getNextNumeroPedido();
      
      // Crear el pedido con estado 'enviado'
      const nuevoPedido = {
        estado: 'enviado',
        fechaPedido: new Date().toISOString(),
        numeroPedido,
        tiendaId: tiendaActual?.id,
        tienda: tiendaActual,
        lineas: lineasValidas.map(l => ({
          ...l,
          cantidadEnviada: l.cantidad // Inicializar cantidadEnviada con la cantidad pedida
        }))
      };

      await crearPedido(nuevoPedido);
      
      // Limpiar editor y storage
      setLineasEdit([]);
      setCreandoNuevo(false);
      limpiarStorage();
      
      alert('Pedido enviado correctamente.');
      
      // Refrescar la lista de pedidos si hay una función para ello
      if (typeof onVerHistoricoPedidos === 'function') {
        // Trigger refresh
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      alert('Error al enviar el pedido.');
    }
  };

  const handleEliminarLinea = (idx) => {
    const nuevasLineas = lineasEdit.filter((_, i) => i !== idx);
    setLineasEdit(nuevasLineas);
  };

  const handleAgregarLinea = () => {
    setLineasEdit([...lineasEdit, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };

  const handleLineaChange = (idx, campo, valor) => {
    const nuevasLineas = lineasEdit.map((linea, i) => 
      i === idx ? { ...linea, [campo]: valor } : linea
    );
    setLineasEdit(nuevasLineas);
  };

  const handleCancelar = () => {
    setCreandoNuevo(false);
    // Mantener las líneas en memoria pero ocultar el editor
  };

  // --- Estado y persistencia para la lista de proveedor (despiece cerdo) ---
  const REFERENCIAS_CERDO = [
    "lomo", "panceta", "solomillos", "costilla", "chuletero", "carrilleras", "pies", "manteca", "secreto", "papada", "jamon", "paleta", "paleta tipo york", "maza de jamon"
  ];
  const getProveedorKey = () => `proveedor_despiece_${tiendaActual?.id || 'default'}`;
  const [lineasProveedor, setLineasProveedor] = useState([]);

  // Inicializar con las referencias del cerdo si está vacío y se abre el modal
  useEffect(() => {
    if (!tiendaActual?.id) return;
    const key = getProveedorKey();
    const guardadas = localStorage.getItem(key);
    if (guardadas) {
      try {
        const arr = JSON.parse(guardadas);
        if (Array.isArray(arr) && arr.length > 0) {
          setLineasProveedor(arr);
        } else {
          setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: 1 })));
        }
      } catch (e) {
        setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: 1 })));
      }
    } else {
      setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: 1 })));
    }
  }, [tiendaActual?.id, mostrarModalProveedor]);

  // Guardar líneas proveedor en localStorage
  useEffect(() => {
    if (tiendaActual?.id) {
      const key = getProveedorKey();
      localStorage.setItem(key, JSON.stringify(lineasProveedor));
    }
  }, [lineasProveedor, tiendaActual?.id]);

  const handleProveedorLineaChange = (idx, campo, valor) => {
    setLineasProveedor(lineasProveedor.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };
  const handleProveedorAgregarLinea = () => {
    setLineasProveedor([...lineasProveedor, { referencia: '', cantidad: 1 }]);
  };
  const handleProveedorEliminarLinea = (idx) => {
    setLineasProveedor(lineasProveedor.filter((_, i) => i !== idx));
  };
  const handleProveedorLimpiar = () => {
    setLineasProveedor([]);
    localStorage.removeItem(getProveedorKey());
  };

  // --- Generar PDF de la lista de proveedor ---
  async function exportarProveedorPDF(lineasProveedor, tiendaActual) {
    // Usar logo optimizado y comprimido
    const logoBase64 = await cargarLogoBase64Optimizado(window.location.origin + '/logo1.png', 100, 40, 0.6);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 15, 10, 24, 12); // Logo más pequeño
    }
    doc.setFontSize(15);
    doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    if (tiendaActual?.nombre) {
      doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y);
      y += 6;
    }
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;
    // Cabecera tabla
    doc.setFontSize(11);
    doc.text('Referencia', 14, y);
    doc.text('Cantidad', 80, y);
    y += 6;
    doc.setLineWidth(0.2);
    doc.line(14, y, 120, y);
    y += 3;
    doc.setFontSize(10);
    lineasProveedor.forEach(l => {
      if (l.referencia && l.cantidad) {
        doc.text(String(l.referencia), 14, y);
        doc.text(String(l.cantidad), 80, y);
        y += 5;
        if (y > 270) {
          doc.addPage();
          y = 18;
        }
      }
    });
    // Pie de página simple
    doc.setFontSize(8);
    doc.text('Generado por gestión de pedidos', 14, 287);
    doc.save(`pedidos_proveedor_${tiendaActual?.nombre || ''}_${Date.now()}.pdf`);
  }

  // --- Enviar lista de proveedor por email (profesional) ---
  async function enviarProveedorPorEmail(lineasProveedor, tiendaActual) {
    setEnviandoProveedor(true);
    setMensajeProveedor("");
    try {
      // 1. Generar PDF como base64 puro y robusto (usando logo optimizado)
      const logoBase64 = await cargarLogoBase64Optimizado(window.location.origin + '/logo1.png', 100, 40, 0.6);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      let y = 18;
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 15, 10, 24, 12);
      }
      doc.setFontSize(15);
      doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      if (tiendaActual?.nombre) {
        doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y);
        y += 6;
      }
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
      y += 8;
      doc.setFontSize(11);
      doc.text('Referencia', 14, y);
      doc.text('Cantidad', 80, y);
      y += 6;
      doc.setLineWidth(0.2);
      doc.line(14, y, 120, y);
      y += 3;
      doc.setFontSize(10);
      lineasProveedor.forEach(l => {
        if (l.referencia && l.cantidad) {
          doc.text(String(l.referencia), 14, y);
          doc.text(String(l.cantidad), 80, y);
          y += 5;
          if (y > 270) {
            doc.addPage();
            y = 18;
          }
        }
      });
      doc.setFontSize(8);
      doc.text('Generado por gestión de pedidos', 14, 287);
      // Obtener PDF como arraybuffer y convertir a base64 robusto
      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBase64String = arrayBufferToBase64(pdfArrayBuffer);

      // Validar que el base64 se generó correctamente
      if (!pdfBase64String) {
        setMensajeProveedor("Error: No se pudo generar el PDF (base64 vacío).");
        setEnviandoProveedor(false);
        return;
      }

      // 2. Enviar al backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10001';
      console.log('[FRONTEND] Enviando a:', `${apiUrl}/api/enviar-proveedor`);
      console.log('[FRONTEND] Datos a enviar:', {
        tienda: tiendaActual?.nombre || '',
        fecha: new Date().toLocaleDateString(),
        lineasCount: lineasProveedor.length,
        pdfBase64Length: pdfBase64String.length
      });
      
      const res = await fetch(`${apiUrl}/api/enviar-proveedor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tienda: tiendaActual?.nombre || '',
          fecha: new Date().toLocaleDateString(),
          lineas: lineasProveedor,
          pdfBase64: pdfBase64String // solo base64 puro
        })
      });
      
      console.log('[FRONTEND] Respuesta status:', res.status);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('[FRONTEND] Respuesta exitosa:', responseData);
        setMensajeProveedor("¡Lista enviada al proveedor!");
        handleProveedorLimpiar();
        setTimeout(()=>{
          setMensajeProveedor("");
          setMostrarModalProveedor(false);
        }, 1500);
      } else {
        const errorData = await res.text();
        console.error('[FRONTEND] Error del servidor:', {
          status: res.status,
          statusText: res.statusText,
          body: errorData
        });
        setMensajeProveedor(`Error al enviar email: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error('[FRONTEND] Excepción capturada:', e);
      setMensajeProveedor(`Error: ${e.message || 'Error al generar o enviar el PDF'}`);
    }
    setEnviandoProveedor(false);
  }

  return (
    <>
      {/* Toast de confirmación de guardado */}
      {showToast && (
        <div style={{position:'fixed',top:24,right:24,zIndex:3000,background:'#28a745',color:'#fff',padding:'16px 32px',borderRadius:10,boxShadow:'0 2px 12px #0003',fontWeight:700,fontSize:17,transition:'opacity 0.3s'}}>✔ Líneas guardadas como borrador</div>
      )}
      
      {/* Modal de transferencias */}
      {mostrarTransferencias && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:400,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarTransferencias(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0}}>Traspasos y devoluciones</h2>
            <TransferenciasPanel tiendas={tiendaActual ? [tiendaActual, ...((window.tiendas || []).filter(t => t.nombre !== tiendaActual.nombre))] : (window.tiendas || [])} tiendaActual={tiendaActual} modoFabrica={false} />
          </div>
        </div>
      )}

      {/* Editor visual unificado para crear pedido */}
      {creandoNuevo && (
        <div style={{ border: "2px solid #007bff", margin: 12, padding: 20, background: '#fafdff', borderRadius: 14, boxShadow:'0 2px 12px #007bff11', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', position:'relative' }}>
          {/* Nombre de la tienda */}
          {tiendaActual?.nombre && (
            <div style={{
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 900,
              color: '#007bff',
              marginBottom: 18,
              letterSpacing: 1,
              background: '#eaf4ff',
              borderRadius: 10,
              padding: '12px 0',
              boxShadow: '0 2px 8px #007bff11'
            }}>
              {tiendaActual.nombre}
            </div>
          )}
          
          <b style={{fontSize:18, color:'#007bff'}}>Nuevo pedido (borrador)</b>
          
          {/* Indicador de guardado */}
          {logGuardado && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 20,
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
                <li key={i} style={{
                  marginBottom:12,
                  display:'flex',
                  gap:18,
                  alignItems:'flex-end',
                  background:'#fff',
                  borderRadius:10,
                  boxShadow:'0 1px 6px #007bff11',
                  padding:'12px 28px 12px 18px', // padding-right aumentado
                  border:'1px solid #e0e6ef',
                  position:'relative'
                }}>
                  <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:110}}>
                    <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Producto</label>
                    <input 
                      value={linea.producto} 
                      onChange={e => handleLineaChange(i, 'producto', e.target.value)} 
                      placeholder="Producto" 
                      style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} 
                    />
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:70}}>
                    <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Cantidad</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={linea.cantidad} 
                      onChange={e => handleLineaChange(i, 'cantidad', Number(e.target.value))} 
                      placeholder="Cantidad" 
                      style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} 
                    />
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:80}}>
                    <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={linea.peso ?? ''}
                      onChange={e => handleLineaChange(i, 'peso', e.target.value === '' ? null : parseFloat(e.target.value))}
                      placeholder="Peso (kg)"
                      style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}}
                    />
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:110}}>
                    <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Formato</label>
                    <select 
                      value={linea.formato || ''} 
                      onChange={e => handleLineaChange(i, 'formato', e.target.value)} 
                      style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}}
                    >
                      <option value="">Formato</option>
                      {FORMATOS_PEDIDO.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:130}}>
                    <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Comentario</label>
                    <input 
                      value={linea.comentario||''} 
                      onChange={e => handleLineaChange(i, 'comentario', e.target.value)} 
                      placeholder="Comentario" 
                      style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}} 
                    />
                  </div>
                  <button onClick={() => handleEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:22,marginLeft:8,alignSelf:'center',position:'relative',zIndex:1}} title="Eliminar línea">🗑</button>
                </li>
              ))}
            </ul>
            
            <div style={{display:'flex', gap:10, marginTop:12, alignItems:'center', justifyContent:'flex-end'}}>
              <button onClick={handleAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>
                Añadir línea
              </button>
              <button onClick={handleGuardarLineas} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:6,padding:'9px 26px',fontWeight:800,boxShadow:'0 2px 8px #ffc10744',fontSize:17,letterSpacing:1}}>
                💾 Guardar líneas
              </button>
              <button onClick={handleCancelar} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción principales */}
      <div style={{
        marginTop: 56,
        padding: '32px 0',
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: '100%',
        maxWidth: 900,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: '#f8fafd',
        borderRadius: 14,
        boxShadow: '0 2px 12px #007bff11'
      }}>
        <button 
          onClick={handleEditarPedidoBorrador} 
          style={{
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0 10px',
            fontWeight: 700,
            minWidth: 120,
            maxWidth: 150,
            fontSize: 15,
            height: 48,
            whiteSpace: 'normal',
            textAlign: 'center',
            lineHeight: '1.2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>+ Crear<br/>pedido</span>
        </button>
        {/* Botón cerdo para proveedor */}
        <button onClick={() => setMostrarModalProveedor(true)} style={{background:'#ffb6b6',color:'#b71c1c',border:'none',borderRadius:8,padding:'7px 18px',fontWeight:700,fontSize:18,display:'flex',alignItems:'center',flexDirection:'column',boxShadow:'0 2px 8px #ffb6b644'}} title="Enviar lista a proveedor">
          <span role="img" aria-label="cerdo" style={{fontSize:28,marginBottom:2}}>🐷</span>
          <span style={{lineHeight:'1.1',textAlign:'center'}}>Pedidos<br/>de fresco</span>
        </button>
        {/* Mostrar el botón de confirmar solo si se está creando un pedido */}
        {creandoNuevo && (
          <button 
            onClick={handleConfirmarYEnviarPedido} 
            style={{
              background: '#ff9800',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0 10px',
              fontWeight: 700,
              minWidth: 120,
              maxWidth: 150,
              fontSize: 15,
              height: 48,
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span>Confirmar y<br/>enviar pedido</span>
          </button>
        )}
        <button 
          onClick={() => setMostrarTransferencias(true)} 
          style={{
            background: '#00b894',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0 10px',
            fontWeight: 600,
            minWidth: 120,
            maxWidth: 150,
            fontSize: 15,
            height: 48,
            whiteSpace: 'normal',
            textAlign: 'center',
            lineHeight: '1.2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Traspasos y<br/>devoluciones</span>
        </button>
        {onVerHistoricoPedidos && (
          <button 
            onClick={onVerHistoricoPedidos} 
            style={{
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0 10px',
              fontWeight: 700,
              minWidth: 120,
              maxWidth: 150,
              fontSize: 15,
              height: 48,
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span>Historial</span>
          </button>
        )}
      </div>
      {/* Modal para crear y enviar lista al proveedor */}
      {mostrarModalProveedor && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0007',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:320,maxWidth:540,minHeight:420,maxHeight:'90vh',position:'relative',overflow:'auto'}}>
            <button onClick={()=>setMostrarModalProveedor(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0,marginBottom:16,fontSize:22,color:'#b71c1c',display:'flex',alignItems:'center'}}>
              <span role="img" aria-label="cerdo" style={{fontSize:32,marginRight:10}}>🐷</span>Lista para proveedor
            </h2>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16,minWidth:400}}>
                <thead>
                  <tr style={{background:'#f8f9fa'}}>
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Referencia</th>
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Cantidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineasProveedor.length === 0 && (
                    <tr><td colSpan={3} style={{color:'#888',fontStyle:'italic',padding:10}}>No hay líneas. Añade una para comenzar.</td></tr>
                  )}
                  {lineasProveedor.map((linea, i) => (
                    <tr key={i}>
                      <td style={{padding:'6px'}}>
                        <input
                          value={linea.referencia}
                          onChange={e => handleProveedorLineaChange(i, 'referencia', e.target.value)}
                          placeholder="Referencia"
                          list={`referencias-cerdo-lista-${i}`}
                          style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}}
                        />
                        <datalist id={`referencias-cerdo-lista-${i}`}>
                          {REFERENCIAS_CERDO.map(ref => <option key={ref} value={ref} />)}
                        </datalist>
                      </td>
                      <td style={{padding:'6px'}}>
                        <input type="number" min="1" value={linea.cantidad} onChange={e => handleProveedorLineaChange(i, 'cantidad', Number(e.target.value))} style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}} />
                      </td>
                      <td style={{padding:'6px'}}>
                        <button onClick={() => handleProveedorEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:20}} title="Eliminar línea">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',alignItems:'center',marginBottom:8}}>
              <button onClick={handleProveedorAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>Añadir línea</button>
              <button onClick={handleProveedorLimpiar} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700}}>Limpiar</button>
              <button onClick={()=>exportarProveedorPDF(lineasProveedor, tiendaActual)} style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
                <span role="img" aria-label="pdf">🗎</span> Exportar PDF
              </button>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',alignItems:'center'}}>
              <button
                onClick={async ()=>{
                  await enviarProveedorPorEmail(lineasProveedor, tiendaActual);
                }}
                disabled={enviandoProveedor || lineasProveedor.length === 0 || lineasProveedor.some(l => !l.referencia || !l.cantidad)}
                style={{background:'#b71c1c',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:700,fontSize:17,cursor:enviandoProveedor?'wait':'pointer',opacity:enviandoProveedor||lineasProveedor.length===0||lineasProveedor.some(l=>!l.referencia||!l.cantidad)?0.7:1}}
              >
                {enviandoProveedor ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
            {mensajeProveedor && <div style={{marginTop:16,color:'#388e3c',fontWeight:700,fontSize:16}}>{mensajeProveedor}</div>}
          </div>
        </div>
      )}

      {/* Lista de pedidos en borrador (para referencia) */}
      <div style={{marginTop: 20}}>
        {pedidos.filter(p => p.estado === 'borrador').map((pedido, idx) => (
          <div key={pedido.id + '-' + idx} style={{ border: "1px solid #ccc", margin: 8, padding: 8, background: '#f9f9f9', borderRadius: 6 }}>
            <div>
              <b>Pedido #{pedido.numeroPedido || pedido.id}</b> (Estado: {pedido.estado})
              <ul style={{margin: '8px 0', paddingLeft: 20}}>
                {pedido.lineas?.map((linea, i) => (
                  <li key={i}>
                    {linea.producto} - {linea.cantidad} {linea.formato}
                    {linea.peso && <> - {linea.peso} kg</>}
                    {linea.comentario && <> ({linea.comentario})</>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}