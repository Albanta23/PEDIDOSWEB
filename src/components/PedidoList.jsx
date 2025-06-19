import React, { useState, useEffect } from "react";
import TransferenciasPanel from './TransferenciasPanel';
import { crearPedido, actualizarPedido, obtenerPedidos } from '../services/pedidosService';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { useProductos } from './ProductosContext';

// Definir API_URL global seguro para todas las llamadas
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001'; // Usa la variable de entorno de Vite, o localhost por defecto

// Constante global para el ID de la tienda de clientes
const TIENDA_CLIENTES_ID = 'PEDIDOS_CLIENTES';

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

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual, onVerHistoricoPedidos }) {
  const { productos, cargando } = useProductos();
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [lineasEdit, setLineasEdit] = useState([]);
  const [logGuardado, setLogGuardado] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [enviandoProveedor, setEnviandoProveedor] = useState(false);
  const [mensajeProveedor, setMensajeProveedor] = useState("");
  const [mostrarHistorialProveedor, setMostrarHistorialProveedor] = useState(false);
  const [historialProveedor, setHistorialProveedor] = useState([]);
  const [forzarTextoPlano, setForzarTextoPlano] = useState(false);
  const [mostrarHistorialProveedorTienda, setMostrarHistorialProveedorTienda] = useState(false);
  const [historialProveedorTienda, setHistorialProveedorTienda] = useState([]);
  const [envioExpandido, setEnvioExpandido] = useState(null);
  // --- HISTORIAL DE PEDIDOS A PROVEEDOR POR TIENDA ---
  const [periodoHistorial, setPeriodoHistorial] = useState('semana');
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

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

  // Guardado automático cada 30 segundos mientras el editor está abierto
  useEffect(() => {
    if (!creandoNuevo) return;
    const interval = setInterval(() => {
      if (tiendaActual?.id && lineasEdit.length > 0) {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(lineasEdit));
      }
    }, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [creandoNuevo, lineasEdit, tiendaActual?.id]);

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

  // Utilidad para obtener la familia de un producto dado su nombre
  const obtenerFamiliaProducto = (nombreProducto) => {
    const prod = productos.find(p => p.nombre === nombreProducto);
    return prod?.nombreFamilia || prod?.familia || '';
  };

  const ordenarLineasPorFamilia = (lineas) => {
    // Esta función ordenará las líneas de producto por familia y nombre,
    // y colocará todas las líneas de comentario después de las líneas de producto,
    // manteniendo el orden relativo entre los comentarios.
    return [...lineas].sort((a, b) => {
      const aEsComentario = a.esComentario || false;
      const bEsComentario = b.esComentario || false;

      if (aEsComentario && bEsComentario) {
        return 0; // Mantener orden relativo entre comentarios
      }
      if (aEsComentario) {
        return 1; // Comentarios después de líneas de producto
      }
      if (bEsComentario) {
        return -1; // Comentarios después de líneas de producto
      }

      // Ambas son líneas de producto, ordenar por familia y luego por nombre
      const famA = obtenerFamiliaProducto(a.producto)?.toLowerCase() || '';
      const famB = obtenerFamiliaProducto(b.producto)?.toLowerCase() || '';

      if (famA < famB) return -1;
      if (famA > famB) return 1;

      // Si las familias son iguales, ordenar por nombre de producto
      const nombreA = a.producto?.toLowerCase() || '';
      const nombreB = b.producto?.toLowerCase() || '';
      if (nombreA < nombreB) return -1;
      if (nombreA > nombreB) return 1;
      
      return 0;
    });
  };

  const handleGuardarLineas = () => {
    if (lineasEdit.length === 0) {
      alert('No hay líneas para guardar.');
      return;
    }

    // Filtrar líneas válidas: productos con nombre y cantidad, o comentarios.
    const lineasParaGuardar = lineasEdit.filter(l => 
      (l.esComentario && typeof l.comentario === 'string') || 
      (!l.esComentario && l.producto && l.cantidad > 0)
    );

    if (lineasParaGuardar.length === 0) {
      alert('No hay líneas válidas para guardar.');
      return;
    }

    const lineasOrdenadas = ordenarLineasPorFamilia(lineasParaGuardar);

    // Crear o actualizar pedido en borrador
    let pedidoBorrador = pedidos.find(p => p.estado === 'borrador' && (p.tiendaId === tiendaActual?.id || p.tienda?.id === tiendaActual?.id));
    
    if (!pedidoBorrador) {
      // Crear nuevo pedido borrador
      pedidoBorrador = {
        id: 'borrador_' + (tiendaActual?.id || 'default'),
        estado: 'borrador',
        lineas: lineasOrdenadas,
        tienda: tiendaActual,
        tiendaId: tiendaActual?.id,
        fechaPedido: new Date().toISOString(),
      };
      if (typeof onModificar === 'function') {
        onModificar(pedidoBorrador.id, pedidoBorrador);
      }
    } else {
      // Actualizar pedido borrador existente
      const actualizado = { ...pedidoBorrador, lineas: lineasOrdenadas, estado: 'borrador' };
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
    // Filtrar líneas válidas: productos con nombre y cantidad, o comentarios.
    const lineasParaEnviar = lineasEdit.filter(l => 
      (l.esComentario && typeof l.comentario === 'string') || 
      (!l.esComentario && l.producto && l.cantidad > 0)
    );

    if (lineasParaEnviar.length === 0) {
      alert('El pedido no tiene líneas válidas.');
      return;
    }

    const lineasOrdenadasYFiltradas = ordenarLineasPorFamilia(lineasParaEnviar);

    try {
      // Crear el pedido con estado 'enviado'
      const nuevoPedido = {
        estado: 'enviado',
        fechaPedido: new Date().toISOString(),
        tiendaId: tiendaActual?.id,
        tienda: tiendaActual,
        lineas: lineasOrdenadasYFiltradas.map(l => {
          if (l.esComentario) {
            return {
              esComentario: true,
              comentario: l.comentario || '' // Asegurar que el comentario sea string
            };
          }
          // Es una línea de producto
          return {
            producto: l.producto,
            cantidad: l.cantidad,
            formato: l.formato,
            // Mantener el comentario de la línea de producto si existe
            comentario: l.comentario || '', 
            cantidadEnviada: l.cantidad // Inicializar cantidadEnviada con la cantidad pedida
          };
        })
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

  const handleAgregarLinea = () => {
    const nuevas = [...lineasEdit, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }];
    setLineasEdit(ordenarLineasPorFamilia(nuevas));
  };

  const handleAgregarLineaComentario = () => {
    const nuevas = [...lineasEdit, { esComentario: true, comentario: '' }];
    // No es necesario ordenar por familia para líneas de comentario, se pueden añadir al final
    setLineasEdit(nuevas);
  };

  const handleEliminarLinea = (idx) => {
    const nuevas = lineasEdit.filter((_, i) => i !== idx);
    setLineasEdit(ordenarLineasPorFamilia(nuevas));
  };

  const handleLineaChange = (idx, campo, valor) => {
    const nuevasLineas = lineasEdit.map((linea, i) => 
      i === idx ? { ...linea, [campo]: valor } : linea
    );
    setLineasEdit(ordenarLineasPorFamilia(nuevasLineas));
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

  // Guardar en localStorage cada vez que se edita la lista
  useEffect(() => {
    if (mostrarModalProveedor && tiendaActual?.id) {
      localStorage.setItem(getProveedorKey(), JSON.stringify(lineasProveedor));
    }
  }, [lineasProveedor, mostrarModalProveedor, tiendaActual?.id]);

  const handleProveedorLineaChange = (idx, campo, valor) => {
    setLineasProveedor(lineasProveedor.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };
  const handleProveedorAgregarLinea = () => {
    setLineasProveedor([...lineasProveedor, { referencia: '', cantidad: '', unidad: 'kg' }]);
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
    const logoBase64 = await cargarLogoBase64(window.location.origin + '/logo1.png');
    const doc = new jsPDF();
    // Logo en la cabecera
    doc.addImage(logoBase64, 'PNG', 15, 10, 30, 18);
    let y = 28;
    doc.setFontSize(20); // Más grande
    doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
    y += 12;
    doc.setFontSize(14);
    if (tiendaActual?.nombre) {
      doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y);
      y += 9;
    }
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
    y += 11;
    // Cabecera tabla
    doc.setFontSize(14);
    doc.text('Referencia', 14, y);
    doc.text('Cantidad', 70, y); // Más junto
    doc.text('Unidad', 110, y);  // Más junto
    y += 8;
    doc.setLineWidth(0.3);
    doc.line(14, y, 150, y); // Línea más corta
    y += 5;
    doc.setFontSize(13);
    lineasProveedor.forEach(l => {
      if (l.referencia && l.cantidad) {
        doc.text(String(l.referencia).toUpperCase(), 14, y);
        doc.text(String(l.cantidad), 70, y);
        doc.text(String(l.unidad || 'kg'), 110, y);
        y += 9;
        if (y > 280) {
          doc.addPage();
          y = 28;
        }
      }
    });
    doc.save(`pedidos_proveedor_${tiendaActual?.nombre || ''}_${Date.now()}.pdf`);
  }

  // --- Enviar lista de proveedor por email usando Mailjet (unificado) ---
  async function enviarProveedorMailjet() {
    setEnviandoProveedor(true);
    setMensajeProveedor("");
    try {
      // 1. Generar PDF como base64
      const logoBase64 = await cargarLogoBase64(window.location.origin + '/logo1.png');
      const doc = new jsPDF();
      doc.addImage(logoBase64, 'PNG', 15, 10, 30, 18);
      let y = 28;
      doc.setFontSize(20); // Más grande
      doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
      y += 12;
      doc.setFontSize(14);
      if (tiendaActual?.nombre) {
        doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y);
        y += 9;
      }
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
      y += 11;
      doc.setFontSize(14);
      doc.text('Referencia', 14, y);
      doc.text('Cantidad', 70, y);
      doc.text('Unidad', 110, y);
      y += 8;
      doc.setLineWidth(0.3);
      doc.line(14, y, 150, y);
      y += 5;
      doc.setFontSize(13);
      lineasProveedor.forEach(l => {
        if (l.referencia && l.cantidad) {
          doc.text(String(l.referencia).toUpperCase(), 14, y);
          doc.text(String(l.cantidad), 70, y);
          doc.text(String(l.unidad || 'kg'), 110, y);
          y += 9;
          if (y > 280) {
            doc.addPage();
            y = 28;
          }
        }
      });
      let pdfBase64 = doc.output('datauristring');
      if (pdfBase64.startsWith('data:')) {
        pdfBase64 = pdfBase64.substring(pdfBase64.indexOf(',') + 1);
      }
      // 2. Enviar al backend
      const lineasProveedorMayus = lineasProveedor.map(l => ({ ...l, referencia: l.referencia ? l.referencia.toUpperCase() : '' }));
      // Normalizar tiendaId para proveedor
      let tiendaIdEnvio = tiendaActual?.id;
      if (typeof tiendaIdEnvio === 'string' && tiendaIdEnvio.trim().toLowerCase() === 'clientes') {
        tiendaIdEnvio = TIENDA_CLIENTES_ID;
      }
      const bodyData = {
        tienda: tiendaActual?.nombre || '',
        tiendaId: tiendaIdEnvio,
        fecha: new Date().toLocaleDateString(),
        lineas: lineasProveedorMayus,
        pdfBase64,
        forzarTextoPlano: forzarTextoPlano // Usar el valor del checkbox
      };
      
      const res = await fetch(`${API_URL}/api/enviar-proveedor-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setMensajeProveedor("¡Pedido enviado al proveedor!");
        handleProveedorLimpiar();
        // Eliminar el cierre automático del modal, solo cerrar cuando el usuario pulse "Cerrar"
        // setTimeout(()=>{
        //   setMensajeProveedor("");
        //   setMostrarModalProveedor(false);
        // }, 1500);
      } else {
        setMensajeProveedor("Error al enviar el email al proveedor.");
      }
    } catch (e) {
      setMensajeProveedor("Error al generar o enviar el PDF.");
    }
    setEnviandoProveedor(false);
  }

  // --- Cargar historial de pedidos a proveedor ---
  const cargarHistorialProveedor = async () => {
    if (!tiendaActual?.id) return;
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      // Normalizar el ID de tienda para el historial de proveedor
      let tiendaIdHistorial = tiendaActual.id;
      if (typeof tiendaIdHistorial === 'string' && tiendaIdHistorial.trim().toLowerCase() === 'clientes') {
        tiendaIdHistorial = TIENDA_CLIENTES_ID;
      }
      // Consulta individual por tienda y periodo
      const res = await fetch(`${API_URL}/api/historial-proveedor?tiendaId=${encodeURIComponent(tiendaIdHistorial)}&periodo=${periodoHistorial}`);
      const data = await res.json();
      if (data.ok) setHistorialProveedor(data.historial);
      else setErrorHistorial(data.error || 'Error al cargar historial');
    } catch (e) {
      setErrorHistorial('Error de red');
    }
    setCargandoHistorial(false);
  };

  useEffect(() => {
    if (mostrarHistorialProveedor) cargarHistorialProveedor();
    // eslint-disable-next-line
  }, [mostrarHistorialProveedor, periodoHistorial, tiendaActual?.id]);

  // Normaliza el campo formato de líneas antiguas a los nuevos valores válidos
  function normalizarFormato(formato) {
    if (!formato) return 'Bolsas';
    // Mapear antiguos a nuevos
    const mapa = {
      'kg': 'Kilos',
      'uds': 'Unidades',
      'caja': 'Cajas',
      'piezas': 'Bolsas',
      'bolsa': 'Bolsas',
      'bolsas': 'Bolsas',
      'kilos': 'Kilos',
      'unidades': 'Unidades',
      'cajas': 'Cajas',
    };
    const f = String(formato).toLowerCase();
    return mapa[f] || formato;
  }

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
          setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' })));
        }
      } catch (e) {
        setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' })));
      }
    } else {
      setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' })));
    }
  }, [tiendaActual?.id, mostrarModalProveedor]);

  // Añadir función para validar si el producto existe
  const productoValido = (valor) => {
    if (!valor) return true;
    // Buscar por nombre o referencia
    return productos.some(p =>
      (p.nombre && p.nombre.toLowerCase() === valor.toLowerCase()) ||
      (p.referencia && p.referencia.toLowerCase() === valor.toLowerCase())
    );
  };

  // --- Selección múltiple de productos para añadir varias líneas ---
  const [busquedaMulti, setBusquedaMulti] = useState('');
  const [seleccionMulti, setSeleccionMulti] = useState([]);
  const [filtroFamiliaMulti, setFiltroFamiliaMulti] = useState('');

  // Obtener familias únicas de los productos
  const familiasUnicas = React.useMemo(() => {
    const setFamilias = new Set();
    productos.forEach(p => {
      if (p.familia || p.nombreFamilia) setFamilias.add(p.nombreFamilia || p.familia);
    });
    return Array.from(setFamilias).filter(Boolean).sort();
  }, [productos]);

  const productosFiltradosMulti = React.useMemo(() => {
    const texto = busquedaMulti.trim().toLowerCase();
    return productos.filter(p => {
      const coincideTexto = !texto || (p.nombre && p.nombre.toLowerCase().includes(texto)) || (p.referencia && p.referencia.toLowerCase().includes(texto));
      const coincideFamilia = !filtroFamiliaMulti || (p.nombreFamilia || p.familia) === filtroFamiliaMulti;
      return coincideTexto && coincideFamilia;
    });
  }, [busquedaMulti, filtroFamiliaMulti, productos]);

  const handleAnadirSeleccionados = () => {
    if (seleccionMulti.length === 0) return;
    const nuevas = [...lineasEdit];
    seleccionMulti.forEach(nombre => {
      if (!nuevas.some(l => l.producto === nombre)) {
        nuevas.push({ producto: nombre, cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' });
      }
    });
    setLineasEdit(ordenarLineasPorFamilia(nuevas));
    setSeleccionMulti([]);
    setBusquedaMulti('');
  };

  return (
    <>
      {/* Toast de confirmación de guardado */}
      {showToast && (
        <div style={{position:'fixed',top:24,right:24,zIndex:3000,background:'#28a745',color:'#fff',padding:'16px 32px',borderRadius:10,boxShadow:'0 2px 12px #0003',fontWeight:700,fontSize:17,transition:'opacity 0.3s'}}>✔ Líneas guardadas como borrador</div>
      )}
      
      {/* Editor visual unificado para crear pedido */}
      {creandoNuevo && (
        <div style={{ border: "2px solid #007bff", margin: 12, padding: 20, background: '#fafdff', borderRadius: 14, boxShadow:'0 2px 12px #007bff11', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', position:'relative' }}>
          {/* NUEVO: Selección múltiple de productos */}
          <div style={{marginBottom:18,background:'#f8fafd',padding:12,borderRadius:8}}>
            <b style={{color:'#007bff'}}>Buscar y marcar productos para añadir varias líneas</b>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:8,marginBottom:8}}>
              <input
                type="text"
                placeholder="Buscar producto por nombre o referencia"
                value={busquedaMulti}
                onChange={e=>setBusquedaMulti(e.target.value)}
                style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}
              />
              <select value={filtroFamiliaMulti} onChange={e=>setFiltroFamiliaMulti(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:140}}>
                <option value="">Todas las familias</option>
                {familiasUnicas.map(fam => (
                  <option key={fam} value={fam}>{fam}</option>
                ))}
              </select>
            </div>
            <div style={{maxHeight:180,overflowY:'auto',marginTop:8,display:'flex',flexWrap:'wrap',gap:8}}>
              {productosFiltradosMulti.map(p => (
                <label key={p.nombre} style={{display:'flex',alignItems:'center',gap:6,background:seleccionMulti.includes(p.nombre)?'#e3f2fd':'#fff',border:'1px solid #ccc',borderRadius:4,padding:'4px 10px',cursor:'pointer'}}>
                  <input
                    type="checkbox"
                    checked={seleccionMulti.includes(p.nombre)}
                    onChange={e => {
                      if (e.target.checked) setSeleccionMulti(arr => [...arr, p.nombre]);
                      else setSeleccionMulti(arr => arr.filter(n => n !== p.nombre));
                    }}
                  />
                  {p.nombre} {p.referencia ? <span style={{color:'#888',fontSize:13}}>({p.referencia})</span> : ''}
                </label>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:10,alignItems:'center',flexWrap:'wrap'}}>
              <button
                onClick={handleAnadirSeleccionados}
                disabled={seleccionMulti.length === 0}
                style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
                Añadir seleccionados
              </button>
              <span style={{marginLeft:16,color:'#888',fontSize:13}}>
                {seleccionMulti.length} producto(s) marcado(s)
              </span>
            </div>
          </div>

          {/* Resumen visual fijo */}
          <div style={{position:'sticky',top:0,background:'#eaf4ff',padding:'8px 0 8px 0',zIndex:2,borderBottom:'1px solid #e0e6ef',marginBottom:12,borderRadius:8,fontWeight:600,fontSize:16,color:'#007bff',textAlign:'center'}}>
            Resumen: {lineasEdit.length} líneas · {lineasEdit.reduce((a,l)=>a+(Number(l.cantidad)||0),0)} unidades · {new Set(lineasEdit.map(l=>l.producto)).size} productos únicos
          </div>
          <b style={{fontSize:18, color:'#007bff'}}>Nuevo pedido (borrador)</b>
          {/* Indicador de guardado */}
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
              {lineasEdit.map((linea, i) => {
                return (
                  linea.esComentario ? (
                    <li key={i} style={{
                      marginBottom:12,
                      display:'flex',
                      gap:18,
                      alignItems:'center',
                      background:'#fffbe6',
                      borderRadius:10,
                      boxShadow:'0 1px 6px #b8860b1f',
                      padding:'10px 18px',
                      border:'1px solid #ffe58f',
                      position:'relative'
                    }}>
                      <span style={{fontSize:18, marginRight:8, color: '#b8860b'}}>📝</span>
                      <input 
                        value={linea.comentario || ''} 
                        onChange={e => handleLineaChange(i, 'comentario', e.target.value)} 
                        placeholder="Escribe tu comentario aquí..." 
                        style={{
                          flexGrow:1, 
                          border:'none', 
                          background:'transparent', 
                          padding:'6px 0px', 
                          fontSize:'1em',
                          color: '#b8860b',
                          fontStyle: 'italic',
                        }} 
                      />
                      <button onClick={() => handleEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:20,marginLeft:8,alignSelf:'center',position:'relative',zIndex:1}} title="Eliminar comentario">🗑</button>
                    </li>
                  ) : (
                    <li key={i} style={{
                      marginBottom:12,
                      display:'flex',
                      gap:18,
                      alignItems:'flex-end',
                      background:'#fff',
                      borderRadius:10,
                      boxShadow:'0 1px 6px #007bff11',
                      padding:'12px 28px 12px 18px',
                      border:'1px solid #e0e6ef',
                      position:'relative'
                    }}>
                      <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:110}}>
                        <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Producto</label>
                        <input 
                          list={`productos-lista-global`}
                          value={linea.producto} 
                          onChange={e => handleLineaChange(i, 'producto', e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              // Buscar si el valor coincide exactamente con una referencia de producto
                              const productoEncontrado = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === String(e.target.value).toLowerCase());
                              if (productoEncontrado) {
                                handleLineaChange(i, 'producto', productoEncontrado.nombre);
                                // Opcional: seleccionar el input tras autocompletar
                                e.target.select();
                                e.preventDefault();
                              }
                            }
                          }}
                          placeholder="Producto" 
                          style={{
                            width:'100%',
                            border:'1px solid '+(productoValido(linea.producto)?'#bbb':'#dc3545'),
                            borderRadius:6,
                            padding:'6px 8px',
                            background: productoValido(linea.producto)?'#fff':'#fff0f0'
                          }} 
                        />
                        {!productoValido(linea.producto) && (
                          <span style={{color:'#dc3545',fontSize:12,marginTop:2}}>Producto no encontrado</span>
                        )}
                        <datalist id="productos-lista-global">
                          {productos.map(p => (
                            <option key={p._id || p.referencia || p.nombre} value={p.nombre}>
                              {p.nombre} {p.referencia ? `(${p.referencia})` : ''}
                            </option>
                          ))}
                        </datalist>
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
                      <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:90}}>
                        <label style={{fontWeight:500,fontSize:13,color:'#007bff'}}>Unidad</label>
                        <select 
                          value={normalizarFormato(linea.formato) || 'Bolsas'} 
                          onChange={e => handleLineaChange(i, 'formato', e.target.value)} 
                          style={{width:'100%', border:'1px solid #bbb', borderRadius:6, padding:'6px 8px'}}
                        >
                          <option value="Cajas">Cajas</option>
                          <option value="Bolsas">Bolsas</option>
                          <option value="Kilos">Kilos</option>
                          <option value="Unidades">Unidades</option>
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
                  )
                );
              })}
            </ul>
            <div style={{display:'flex', gap:10, marginTop:12, alignItems:'center', justifyContent:'flex-end'}}>
              <button onClick={handleAgregarLinea} style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,boxShadow:'0 2px 8px #00c6ff44'}}>
                Añadir línea
              </button>
              <button onClick={handleAgregarLineaComentario} style={{background:'#6c757d',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,boxShadow:'0 2px 8px #6c757d44'}}>
                Añadir comentario
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

      {/* Ordenar visualmente el panel de tiendas: separar claramente acciones principales, historial y utilidades */}
      <div style={{
        marginTop: 56,
        padding: '32px 0',
        display: 'flex',
        gap: 18,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: 900,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: '#f8fafd',
        borderRadius: 14,
        boxShadow: '0 2px 12px #007bff11',
        border: '1px solid #e0e6ef',
      }}>
        <button 
          onClick={handleEditarPedidoBorrador} 
          style={{
            background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px', fontWeight: 700, minWidth: 120, maxWidth: 150, fontSize: 15, height: 48, whiteSpace: 'normal', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow:'0 2px 8px #007bff33'
          }}
        >
          <span>+ Crear<br/>pedido</span>
        </button>
        <button onClick={() => setMostrarModalProveedor(true)} style={{background:'#ffb6b6',color:'#b71c1c',border:'none',borderRadius:8,padding:'7px 18px',fontWeight:700,fontSize:18,display:'flex',alignItems:'center',flexDirection:'column',boxShadow:'0 2px 8px #ffb6b644'}} title="Enviar lista a proveedor">
          <span role="img" aria-label="cerdo" style={{fontSize:28,marginBottom:2}}>🐷</span>
          <span style={{lineHeight:'1.1',textAlign:'center'}}>Pedidos<br/>de fresco</span>
        </button>
        {creandoNuevo && (
          <button 
            onClick={handleConfirmarYEnviarPedido} 
            style={{
              background: '#ff9800', color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px', fontWeight: 700, minWidth: 120, maxWidth: 150, fontSize: 15, height: 48, whiteSpace: 'normal', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow:'0 2px 8px #ff980044'
            }}
          >
            <span>Confirmar y<br/>enviar pedido</span>
          </button>
        )}
      </div>
      <div style={{
        marginTop: 32,
        marginBottom: 24,
        padding: '18px 0',
        background: '#f1f8ff',
        borderRadius: 12,
        boxShadow: '0 1px 8px #007bff11',
        maxWidth: 900,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #e0e6ef'
      }}>
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
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Unidad</th>
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
                          value={linea.referencia ? linea.referencia.toUpperCase() : ''}
                          onChange={e => handleProveedorLineaChange(i, 'referencia', e.target.value.toUpperCase())}
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
                        <select value={linea.unidad || 'kg'} onChange={e => handleProveedorLineaChange(i, 'unidad', e.target.value)} style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}}>
                          <option value="kg">kg</option>
                          <option value="uds">uds</option>
                        </select>
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
              <button onClick={()=>exportarProveedorPDF(lineasProveedor, tiendaActual)} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700}}>
                Ver PDF
              </button>
              <button 
                onClick={enviarProveedorMailjet}
                disabled={enviandoProveedor || !!mensajeProveedor}
                aria-disabled={enviandoProveedor || !!mensajeProveedor}
                style={{
                  backgroundImage:'url(logo_2.jpg)',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center top',color:'red',border:'none',borderRadius:6,padding:'15px',fontWeight:700,display:'flex',alignItems:'flex-end',justifyContent:'center',textShadow:'1px 1px 2px rgba(255,255,255,0.8)',width:80,height:80,fontSize:'12px',
                  opacity: (enviandoProveedor || !!mensajeProveedor) ? 0.5 : 1,
                  cursor: (enviandoProveedor || !!mensajeProveedor) ? 'not-allowed' : 'pointer'
                }}
              >
                {enviandoProveedor ? 'Enviando...' : 'Enviar'}
              </button>
              <button onClick={()=>setMostrarHistorialProveedor(true)} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',fontWeight:700,marginLeft:8}}>
                <span role="img" aria-label="historial" style={{marginRight:6}}>📦</span>Ver historial de envíos
              </button>
            </div>

            {mensajeProveedor && <div style={{marginTop:16,color:'#388e3c',fontWeight:700,fontSize:16}}>{mensajeProveedor}</div>}
            {/* Botón cerrar solo cuando hay mensaje de confirmación */}
            {mensajeProveedor && (
              <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
                <button onClick={() => { setMensajeProveedor(""); setMostrarModalProveedor(false); }} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:700,fontSize:16}}>Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de historial de pedidos a proveedor */}
      {mostrarHistorialProveedor && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:340,maxWidth:700,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarHistorialProveedor(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0,marginBottom:16,fontSize:22,color:'#1976d2'}}>Historial de pedidos a proveedor</h2>
            <div style={{marginBottom:18,display:'flex',gap:12,alignItems:'center'}}>
              <label>Periodo:</label>
              <select value={periodoHistorial} onChange={e=>setPeriodoHistorial(e.target.value)} style={{padding:'6px 12px',borderRadius:6}}>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="año">Año</option>
              </select>
              <button onClick={cargarHistorialProveedor} style={{marginLeft:10,padding:'6px 16px',borderRadius:6,background:'#1976d2',color:'#fff',fontWeight:600}}>Actualizar</button>
            </div>
            {cargandoHistorial && <div>Cargando historial...</div>}
            {errorHistorial && <div style={{color:'#b71c1c',fontWeight:700}}>{errorHistorial}</div>}
            {!cargandoHistorial && !errorHistorial && (
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
                <thead>
                  <tr style={{background:'#f8f9fa'}}>
                    <th style={{padding:'8px',borderBottom:'1px solid #ddd'}}>Fecha</th>
                    <th style={{padding:'8px',borderBottom:'1px solid #ddd'}}>Tienda</th>
                    <th style={{padding:'8px',borderBottom:'1px solid #ddd'}}>Nº líneas</th>
                    <th style={{padding:'8px',borderBottom:'1px solid #ddd'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialProveedor.length === 0 && (
                    <tr><td colSpan={4} style={{color:'#888',fontStyle:'italic',padding:10}}>No hay pedidos en este periodo.</td></tr>
                  )}
                  {historialProveedor.map((h, idx) => (
                    <tr key={h.id} style={{background:idx%2?'#f8fafd':'#fff'}}>
                      <td style={{padding:'8px'}}>{
                        h.fechaEnvio
                          ? (() => { 
                              const d = new Date(h.fechaEnvio); 
                              return isNaN(d) ? '-' : d.toLocaleString();
                            })()
                          : (h.fecha ? (() => { 
                              const d = new Date(h.fecha); 
                              return isNaN(d) ? '-' : d.toLocaleString();
                            })() : '-')
                      }</td>
                      <td style={{padding:'8px'}}>{h.tienda?.nombre || h.tienda || '-'}</td>
                      <td style={{padding:'8px',textAlign:'center'}}>{h.numeroLineas}</td>
                      <td style={{padding:'8px',display:'flex',gap:8}}>
                        <button onClick={()=>setEnvioExpandido(h.id)} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Ver detalles</button>
                        <button onClick={() => {
                          // Generar PDF en pantalla
                          if(h.pedido && h.pedido.lineas && h.tienda) exportarProveedorPDF(h.pedido.lineas, {nombre: h.tienda?.nombre || h.tienda});
                        }} style={{background:'#ffc107',color:'#333',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Ver PDF</button>
                        <button onClick={() => {
                          if(h.pedido && Array.isArray(h.pedido.lineas)) {
                            setLineasProveedor(h.pedido.lineas.map(l => ({...l, cantidad: ''})));
                            setMostrarModalProveedor(true);
                          }
                        }} style={{background:'#00b894',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Reutilizar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Detalle expandido */}
            {envioExpandido && (
              <div style={{marginTop:18,padding:18,background:'#f8fafd',borderRadius:10}}>
                <button onClick={()=>setEnvioExpandido(null)} style={{float:'right',background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600}}>Cerrar</button>
                <h3 style={{marginTop:0}}>Detalle del pedido</h3>
                {(() => {
                  const h = historialProveedor.find(x=>x.id===envioExpandido);
                  if(!h) return null;
                  return (
                    <div>
                      <div><b>Fecha:</b> {h.fecha ? new Date(h.fecha).toLocaleString() : '-'}</div>
                      <div><b>Tienda:</b> {h.tienda?.nombre || h.tienda || '-'}</div>
                      <div><b>Nº líneas:</b> {h.numeroLineas}</div>
                      <div><b>Proveedor:</b> {h.proveedor}</div>
                      <div style={{marginTop:10}}>
                        <b>Líneas del pedido:</b>
                        <ul style={{marginTop:6}}>
                          {h.pedido?.lineas?.map((l,i)=>(
                            <li key={i}>{l.referencia || '-'} - {l.cantidad} {l.unidad || 'kg'}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}