import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovimientosStock, registrarBajaStock } from '../services/movimientosStockService';
import TransferenciasPanel from './TransferenciasPanel';
import FormularioEntradaStock from './FormularioEntradaStock'; // Importar el nuevo formulario
import { useProductos } from './ProductosContext';
import { useSocket } from './SocketContext';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { cabeceraPDF, piePDF } from '../utils/exportPDFBase';

export default function AlmacenTiendaPanel({ tiendaActual }) {
  const socket = useSocket();
  const navigate = typeof useNavigate === 'function' ? useNavigate() : null;
  const params = typeof useParams === 'function' ? useParams() : {};
  const tienda = tiendaActual || (window.tiendas ? window.tiendas.find(t => t.id === params.idTienda) : null);

  const { productos } = useProductos();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Pestañas: stock | movimientos | bajas | entradas | transferencias
  const [tab, setTab] = useState('stock');
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState('');
  // Baja de producto
  const [productoBaja, setProductoBaja] = useState('');
  const [cantidadBaja, setCantidadBaja] = useState('');
  const [unidadBaja, setUnidadBaja] = useState('kg');
  const [loteBaja, setLoteBaja] = useState('');
  const [motivoBaja, setMotivoBaja] = useState('');
  const [pesoBaja, setPesoBaja] = useState('');

  // Estado para selección múltiple en bajas
  const [busquedaMulti, setBusquedaMulti] = useState('');
  const [seleccionMulti, setSeleccionMulti] = useState([]);

  // Forzar que el id de la tienda clientes sea siempre 'PEDIDOS_CLIENTES' (usando useMemo para evitar bucles)
  const tiendaForzada = useMemo(() => {
    if (tienda && typeof tienda.id === 'string' && tienda.id.trim().toLowerCase() === 'clientes') {
      return { ...tienda, id: 'PEDIDOS_CLIENTES', nombre: tienda.nombre || 'Clientes' };
    }
    return tienda;
  }, [tienda]);

  // Función reutilizable para refrescar movimientos de stock
  const refrescarMovimientos = async () => {
    if (!tiendaForzada) return;
    setCargando(true);
    const movs = await getMovimientosStock({ tiendaId: tiendaForzada.id });
    setMovimientos(movs);
    setCargando(false);
  };

  // DEBUG: Mostrar tienda y movimientos
  console.log('[DEBUG] tiendaForzada:', tiendaForzada);
  useEffect(() => {
    refrescarMovimientos();
  }, [tiendaForzada]);

  // Refrescar stock automáticamente tras confirmar transferencia
  useEffect(() => {
    refrescarMovimientos();
    // Suscribirse a eventos de transferencias confirmadas si hay WebSocket/socket.io
    if (socket) {
      const handler = refrescarMovimientos;
      socket.on('transferencia_confirmada', handler);
      return () => socket.off('transferencia_confirmada', handler);
    }
  }, [tiendaForzada, socket]);

  // Función para consultar el stock actual de un producto/lote en la tienda
  function getStockActual(producto, lote) {
    // Sumar entradas y transferencias recibidas
    const entradas = movimientos.filter(m => ["entrada","transferencia_entrada","devolucion_entrada"].includes(m.tipo) && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    // Restar bajas y transferencias enviadas
    const salidas = movimientos.filter(m => ["baja","transferencia_salida","devolucion_salida"].includes(m.tipo) && m.producto === producto && m.lote === lote)
      .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);
    return entradas - salidas;
  }

  // Baja de producto
  const registrarBaja = async (producto, cantidad, unidad, lote, motivo, peso) => {
    if (!tienda) return;
    await registrarBajaStock({ tiendaId: tienda.id, producto, cantidad, unidad, lote, motivo, peso });
    await refrescarMovimientos();
  };

  if (!tiendaForzada) return null;

  // Obtener familias únicas con número y nombre, usando nombreFamilia si familia no existe
  const familias = useMemo(() => {
    const map = new Map();
    productos.forEach(p => {
      // Usar familia si existe, si no nombreFamilia
      const num = p.familia ? String(p.familia).trim() : (p.nombreFamilia ? String(p.nombreFamilia).trim() : '');
      const nombre = p.nombreFamilia ? String(p.nombreFamilia).trim() : (p.familia ? String(p.familia).trim() : '');
      if (num && nombre && !map.has(num)) {
        map.set(num, nombre);
      }
    });
    return Array.from(map.entries()); // [[numero, nombre], ...]
  }, [productos]);

  // Filtrado de stock
  const stockFiltrado = movimientos.filter(s => {
    // Buscar la familia del producto (normalizando nombre)
    const prod = productos.find(p => p.nombre.trim().toLowerCase() === (s.producto || '').trim().toLowerCase());
    // Usar familia o nombreFamilia para filtrar
    const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
    // Si hay filtro de familia y el producto no existe en la lista de productos, no mostrarlo
    if (filtroFamilia && (!prod || familia !== filtroFamilia)) return false;
    return (
      (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
      (!filtroLote || (s.lote && s.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
      (!filtroFechaDesde || (s.fecha && s.fecha >= filtroFechaDesde)) &&
      (!filtroFechaHasta || (s.fecha && s.fecha <= filtroFechaHasta))
    );
  });

  // Autocompletar producto por referencia o nombre (robusto, tolerante a parciales)
  function autocompletarProducto(valor) {
    if (!valor) return valor;
    const normalizado = String(valor).trim().toLowerCase();
    // Coincidencia exacta por referencia
    let prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase() === normalizado);
    if (prod) return prod.nombre;
    // Coincidencia exacta por nombre
    prod = productos.find(p => p.nombre && String(p.nombre).toLowerCase() === normalizado);
    if (prod) return prod.nombre;
    // Coincidencia parcial por referencia
    prod = productos.find(p => p.referencia && String(p.referencia).toLowerCase().startsWith(normalizado));
    if (prod) return prod.nombre;
    // Coincidencia parcial por nombre
    prod = productos.find(p => p.nombre && String(p.nombre).toLowerCase().startsWith(normalizado));
    if (prod) return prod.nombre;
    // Si no se reconoce, devolver el valor original (y se puede mostrar feedback visual en el input)
    return valor;
  }

  // --- Lógica de filtrado y orden para la tabla de movimientos ---
  const movimientosFiltradosOrdenados = useMemo(() => {
    return movimientos.filter(mov => {
      // Buscar por nombre o referencia
      const prod = productos.find(p => {
        const nombreMatch = p.nombre && p.nombre.trim().toLowerCase() === (filtroProducto || '').trim().toLowerCase();
        const refMatch = p.referencia && p.referencia.trim().toLowerCase() === (filtroProducto || '').trim().toLowerCase();
        return nombreMatch || refMatch;
      });
      const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
      return (
        (!filtroProducto || (mov.producto && (mov.producto.toLowerCase().includes(filtroProducto.toLowerCase()) || (prod && (prod.nombre.toLowerCase() === filtroProducto.toLowerCase() || (prod.referencia && prod.referencia.toLowerCase() === filtroProducto.toLowerCase())))))) &&
        (!filtroLote || (mov.lote && mov.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
        (!filtroFamilia || familia === filtroFamilia) &&
        (!filtroTipoMovimiento || mov.tipo === filtroTipoMovimiento) &&
        (!filtroFechaDesde || (mov.fecha && mov.fecha >= filtroFechaDesde)) &&
        (!filtroFechaHasta || (mov.fecha && mov.fecha <= filtroFechaHasta))
      );
    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [movimientos, productos, filtroProducto, filtroLote, filtroFamilia, filtroTipoMovimiento, filtroFechaDesde, filtroFechaHasta]);

  // Exportar diario de movimientos a Excel
  const exportarMovimientosExcel = () => {
    if (!movimientosFiltradosOrdenados || movimientosFiltradosOrdenados.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }
    let pesoAcumulado = 0;
    const rows = movimientosFiltradosOrdenados.map(mov => {
      const peso = Number(mov.peso) || 0;
      if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
        pesoAcumulado += peso;
      } else if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
        pesoAcumulado -= peso;
      }
      return {
        Fecha: mov.fecha ? mov.fecha.split('T')[0] : (mov.fecha ? new Date(mov.fecha).toLocaleDateString() : ''),
        Hora: mov.fecha ? (mov.fecha.split('T')[1]?.substring(0,5) || new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '',
        Producto: mov.producto || '',
        Lote: mov.lote || '',
        Cantidad: mov.cantidad ?? '',
        'Peso (kg)': mov.peso ?? '',
        'PESO TOTAL (kg)': pesoAcumulado.toFixed(2),
        Tipo: mov.tipo || '',
        Motivo: mov.motivo || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'diario_movimientos.xlsx');
  };

  // Mejorar exportación PDF: asegurar que los datos se exportan correctamente
  const exportarMovimientosPDF = async () => {
    if (!movimientosFiltradosOrdenados || movimientosFiltradosOrdenados.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }
    const doc = new jsPDF();
    await cabeceraPDF(doc);
    let y = 48;
    doc.setFontSize(15);
    doc.text('Diario de movimientos de stock', 105, y, { align: 'center' });
    y += 10;
    let pesoAcumulado = 0;
    const rows = movimientosFiltradosOrdenados.map(mov => {
      const peso = Number(mov.peso) || 0;
      if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
        pesoAcumulado += peso;
      } else if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
        pesoAcumulado -= peso;
      }
      return [
        mov.fecha ? mov.fecha.split('T')[0] : (mov.fecha ? new Date(mov.fecha).toLocaleDateString() : ''),
        mov.fecha ? (mov.fecha.split('T')[1]?.substring(0,5) || new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '',
        mov.producto || '',
        mov.lote || '',
        mov.cantidad ?? '',
        mov.peso ?? '',
        pesoAcumulado.toFixed(2),
        mov.tipo || '',
        mov.motivo || ''
      ];
    });
    doc.autoTable({
      head: [[
        'Fecha', 'Hora', 'Producto', 'Lote', 'Cantidad', 'Peso (kg)', 'PESO TOTAL (kg)', 'Tipo', 'Motivo'
      ]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [103, 58, 183] },
      margin: { top: 20 }
    });
    // Pie de página profesional
    piePDF(doc);
    doc.save('diario_movimientos.pdf');
  };

  // Determinar si mostrar la columna de PESO TOTAL (kg)
  const mostrarPesoTotal = useMemo(() => {
    if (!filtroProducto) return false;
    return productos.some(p => p.nombre && p.nombre.toLowerCase() === filtroProducto.toLowerCase());
  }, [filtroProducto, productos]);

  return (
    <div style={{
      padding: '40px 32px',
      maxWidth: 1200,
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      borderRadius: '20px',
      position: 'relative'
    }}>
      {/* Header profesional con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '32px',
        borderRadius: '20px',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Patrón decorativo */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '48px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>🏪</div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Gestión de Almacén
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '18px',
              opacity: 0.9
            }}>
              {tienda?.nombre || 'Tienda'}
            </p>
          </div>
        </div>
      </div>

      {/* Panel de navegación profesional */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#2c3e50',
          fontSize: '20px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '24px' }}>🧭</span>
          Secciones del Almacén
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', // Ajustar minmax para más botones
          gap: '16px'
        }}>
          <button 
            onClick={() => setTab('stock')} 
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: tab === 'stock' 
                ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              color: tab === 'stock' ? '#fff' : '#495057',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'stock' 
                ? '0 4px 16px rgba(0, 123, 255, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (tab !== 'stock') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={e => {
              if (tab !== 'stock') {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>📦</span>
            <span>Stock Actual</span>
          </button>

          <button 
            onClick={() => setTab('movimientos')} 
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: tab === 'movimientos' 
                ? 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)' 
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              color: tab === 'movimientos' ? '#fff' : '#495057',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'movimientos' 
                ? '0 4px 16px rgba(103, 58, 183, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (tab !== 'movimientos') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={e => {
              if (tab !== 'movimientos') {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span>Movimientos</span>
          </button>

          <button 
            onClick={() => setTab('bajas')} 
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: tab === 'bajas' 
                ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' 
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              color: tab === 'bajas' ? '#fff' : '#495057',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'bajas' 
                ? '0 4px 16px rgba(220, 53, 69, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (tab !== 'bajas') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={e => {
              if (tab !== 'bajas') {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>📉</span>
            <span>Registrar Bajas</span>
          </button>

          <button 
            onClick={() => setTab('transferencias')} 
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: tab === 'transferencias' 
                ? 'linear-gradient(135deg, #28a745 0%, #218838 100%)' 
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              color: tab === 'transferencias' ? '#fff' : '#495057',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'transferencias' 
                ? '0 4px 16px rgba(40, 167, 69, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (tab !== 'transferencias') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={e => {
              if (tab !== 'transferencias') {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>🔄</span>
            <span>Transferencias</span>
          </button>

          <button
            onClick={() => setTab('entradas')}
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: tab === 'entradas'
                ? 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)'
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              color: tab === 'entradas' ? '#fff' : '#495057',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'entradas'
                ? '0 4px 16px rgba(255, 193, 7, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (tab !== 'entradas') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={e => {
              if (tab !== 'entradas') {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>📥</span>
            <span>Registrar Entrada</span>
          </button>

          <button 
            onClick={() => navigate(`/compras-proveedor/${tienda?.id}`)} 
            style={{
              padding: '16px 20px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(255, 152, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.4)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(255, 152, 0, 0.3)';
            }}
          >
            <span style={{ fontSize: '24px' }}>🛒</span>
            <span>Compras</span>
          </button>
        </div>
      </div>

      {/* Botón adicional para volver al panel principal */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e1e8ed',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '16px', fontWeight: '600' }}>
            📋 Panel Principal de Tiendas
          </h4>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            Gestionar pedidos, historial y funciones principales
          </p>
        </div>
        <button
          onClick={() => {
            if (navigate) {
              navigate('/', { replace: true });
            } else {
              window.history.back();
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0, 123, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.35)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(0, 123, 255, 0.25)';
          }}
        >
          <span>← Volver al Panel Principal</span>
        </button>
      </div>
      {tab==='stock' && (
        <div>
          {/* Filtros de stock, ahora con checkbox para activar visualización por lotes */}
          <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center'}}>
            <input placeholder="Filtrar producto" value={filtroProducto} onChange={e=>setFiltroProducto(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              <input
                type="checkbox"
                checked={!!filtroLote}
                onChange={e => setFiltroLote(e.target.checked ? '__ALL__' : '')}
                style={{marginRight:4}}
              />
              Visualizar stock por lotes
            </label>
            <select value={filtroFamilia} onChange={e=>setFiltroFamilia(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}>
              <option value="">Todas las familias</option>
              {familias.map(([num, nombre], idx) => (
                <option key={idx} value={num}>{num} - {nombre}</option>
              ))}
            </select>
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Desde
              <input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Hasta
              <input type="date" value={filtroFechaHasta} onChange={e=>setFiltroFechaHasta(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
          </div>
          {cargando ? <p>Cargando stock...</p> : (
            <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse',background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11'}}>
              <thead>
                <tr style={{background:'#f8fafd'}}>
                  <th>Producto</th>
                  {filtroLote && <th>Lote</th>}
                  <th>Referencia</th>
                  <th>Cantidad (ud)</th>
                  <th>Unidad</th>
                  <th>Peso (kg)</th>
                  <th>Familia</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Agrupar por referencia (código de producto), y si hay visualización por lotes, por lote también
                  const agrupado = {};
                  movimientos.forEach(mov => {
                    const prod = productos.find(p => p.nombre.trim().toLowerCase() === (mov.producto || '').trim().toLowerCase());
                    const referencia = prod?.referencia || mov.producto;
                    let key = referencia;
                    if (filtroLote) key += '||' + (mov.lote || '');
                    let cantidad = mov.cantidadEnviada ?? mov.cantidad ?? 0;
                    let peso = mov.peso ?? 0;
                    if (!agrupado[key]) agrupado[key] = {
                      producto: mov.producto,
                      referencia,
                      lote: mov.lote,
                      unidad: mov.unidad || mov.formato,
                      cantidadTotal: 0,
                      pesoTotal: 0,
                      familia: prod?.familia || prod?.nombreFamilia || '-',
                    };
                    if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
                      agrupado[key].cantidadTotal += Number(cantidad) || 0;
                      agrupado[key].pesoTotal += Number(peso) || 0;
                    }
                    if (["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo)) {
                      agrupado[key].cantidadTotal -= Number(cantidad) || 0;
                      agrupado[key].pesoTotal -= Number(peso) || 0;
                    }
                  });
                  return Object.values(agrupado)
                    .filter(s => (s.cantidadTotal !== 0 || s.pesoTotal !== 0) && (!filtroProducto || s.producto.toLowerCase().includes(filtroProducto.toLowerCase())))
                    .map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.producto}</td>
                        {filtroLote && <td>{s.lote}</td>}
                        <td>{s.referencia}</td>
                        <td>{s.cantidadTotal !== undefined ? s.cantidadTotal.toFixed(2) : '-'}</td>
                        <td>{s.unidad || '-'}</td>
                        <td>{s.pesoTotal !== undefined ? s.pesoTotal.toFixed(2) : '-'}</td>
                        <td>{s.familia}</td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab==='movimientos' && (
        <div>
          <h3 style={{color:'#673ab7'}}>Diario de movimientos de almacén</h3>
          <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
            <input
              list="productos-filtro-movimientos"
              placeholder="Filtrar producto (nombre o número)"
              value={filtroProducto}
              onChange={e=>setFiltroProducto(e.target.value)}
              style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}
            />
            <datalist id="productos-filtro-movimientos">
              {productos.map((p,i) => (
                <option key={i} value={p.nombre}>{p.referencia ? `${p.referencia} - ${p.nombre}` : p.nombre}</option>
              ))}
              {productos.map((p,i) => (
                p.referencia ? <option key={i+1000} value={p.referencia}>{p.nombre}</option> : null
              ))}
            </datalist>
            <input placeholder="Filtrar lote" value={filtroLote} onChange={e=>setFiltroLote(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            <select value={filtroFamilia} onChange={e=>setFiltroFamilia(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}>
              <option value="">Todas las familias</option>
              {familias.map(([num, nombre], idx) => (
                <option key={idx} value={num}>{num} - {nombre}</option>
              ))}
            </select>
            <select value={filtroTipoMovimiento||''} onChange={e=>setFiltroTipoMovimiento(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:140}}>
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="baja">Baja</option>
              <option value="transferencia_entrada">Transferencia entrada</option>
              <option value="transferencia_salida">Transferencia salida</option>
              <option value="devolucion_entrada">Devolución entrada</option>
              <option value="devolucion_salida">Devolución salida</option>
            </select>
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Desde
              <input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
            <label style={{display:'flex',alignItems:'center',gap:4}}>
              Hasta
              <input type="date" value={filtroFechaHasta} onChange={e=>setFiltroFechaHasta(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}} />
            </label>
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}>
            <button onClick={exportarMovimientosPDF} style={{background:'#673ab7',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Exportar PDF
            </button>
            <button onClick={exportarMovimientosExcel} style={{background:'#388e3c',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Exportar Excel
            </button>
          </div>
          <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse',background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11'}}>
            <thead>
              <tr style={{background:'#ede7f6'}}>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Peso (kg)</th>
                {mostrarPesoTotal && <th>PESO TOTAL (kg)</th>}
                <th>Lote</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Mostrar absolutamente todos los movimientos recibidos, sin filtrar por producto conocido ni por tipo
                const movsFiltrados = movimientos.filter(mov => {
                  // Solo aplicar los filtros activos del usuario
                  return (
                    (!filtroProducto || (mov.producto && mov.producto.toLowerCase().includes(filtroProducto.toLowerCase()))) &&
                    (!filtroLote || (mov.lote && mov.lote.toLowerCase().includes(filtroLote.toLowerCase()))) &&
                    (!filtroFamilia || (() => {
                      const prod = productos.find(p => p.nombre && mov.producto && p.nombre.trim().toLowerCase() === mov.producto.trim().toLowerCase());
                      const familia = prod?.familia ? String(prod.familia).trim() : (prod?.nombreFamilia ? String(prod.nombreFamilia).trim() : '');
                      return familia === filtroFamilia;
                    })()) &&
                    (!filtroTipoMovimiento || mov.tipo === filtroTipoMovimiento) &&
                    (!filtroFechaDesde || (mov.fecha && mov.fecha >= filtroFechaDesde)) &&
                    (!filtroFechaHasta || (mov.fecha && mov.fecha <= filtroFechaHasta))
                  );
                }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                let saldoPeso = 0;
                return movsFiltrados.map((mov, idx) => {
                  const peso = Number(mov.peso) || 0;
                  const esBaja = ["baja","transferencia_salida","devolucion_salida"].includes(mov.tipo);
                  const esTransferenciaEntrada = mov.tipo === "transferencia_entrada";
                  const esTransferenciaSalida = mov.tipo === "transferencia_salida";
                  const esDevolucionEntrada = mov.tipo === "devolucion_entrada";
                  const esDevolucionSalida = mov.tipo === "devolucion_salida";
                  if (["entrada","transferencia_entrada","devolucion_entrada"].includes(mov.tipo)) {
                    saldoPeso += peso;
                  } else if (esBaja) {
                    saldoPeso -= peso;
                  }
                  let style = {};
                  if (esTransferenciaSalida) {
                    // transferencia_salida: morado
                    style = {color:'#8e24aa',background:'#ede7f6',fontWeight:600};
                  } else if (esDevolucionSalida) {
                    // devolucion_salida: naranja
                    style = {color:'#f57c00',background:'#fff3e0',fontWeight:600};
                  } else if (esBaja) {
                    // baja: rojo
                    style = {color:'#b71c1c',background:'#ffebee',fontWeight:600};
                  } else if (esTransferenciaEntrada) {
                    // transferencia_entrada: azul
                    style = {color:'#1565c0',background:'#e3f2fd',fontWeight:600};
                  } else if (esDevolucionEntrada) {
                    style = {color:'#00695c',background:'#e0f2f1',fontWeight:600};
                  }
                  return (
                    <tr key={idx} style={style}>
                      <td>{mov.fecha ? new Date(mov.fecha).toLocaleString() : '-'}</td>
                      <td>{mov.tipo}</td>
                      <td>{mov.producto}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.unidad}</td>
                      <td>{peso.toFixed(2)}</td>
                      {mostrarPesoTotal && <td>{saldoPeso.toFixed(2)}</td>}
                      <td>{mov.lote}</td>
                      <td>{mov.motivo}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
      {tab==='bajas' && (
        <div>
          <h3>Registrar baja de producto</h3>
          {/* Formulario individual clásico (ahora permite productos antiguos/no registrados) */}
          <div style={{display:'flex',gap:16,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
            <input
              list="productos-baja-stock"
              placeholder="Producto (puedes escribir uno antiguo)"
              value={productoBaja}
              onChange={e=>setProductoBaja(e.target.value)}
              style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}}
            />
            <datalist id="productos-baja-stock">
              {[...new Set(movimientos.map(s=>s.producto).filter(Boolean))].map((prod,idx)=>(
                <option key={idx} value={prod}>{prod}</option>
              ))}
              {productos.map((p,i) => (
                <option key={i+1000} value={p.nombre}>{p.referencia ? `${p.referencia} - ${p.nombre}` : p.nombre}</option>
              ))}
            </datalist>
            <input type="number" min="0" step="any" placeholder="Cantidad" value={cantidadBaja} onChange={e=>setCantidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <select value={unidadBaja} onChange={e=>setUnidadBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc'}}>
              <option value="kg">kg</option>
              <option value="ud">ud</option>
            </select>
            <input placeholder="Lote" value={loteBaja} onChange={e=>setLoteBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <input placeholder="Motivo de la baja" value={motivoBaja} onChange={e=>setMotivoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',minWidth:180}} />
            <input type="number" min="0" step="any" placeholder="Peso (kg)" value={pesoBaja} onChange={e=>setPesoBaja(e.target.value)} style={{padding:6,borderRadius:4,border:'1px solid #ccc',width:90}} />
            <button
              onClick={() => {
                if(!productoBaja || (!cantidadBaja && !pesoBaja) || !motivoBaja){ alert('Rellena todos los campos y al menos cantidad o peso.'); return; }
                registrarBaja(productoBaja, cantidadBaja || 0, unidadBaja, loteBaja, motivoBaja, pesoBaja || 0);
                setProductoBaja(''); setCantidadBaja(''); setUnidadBaja('kg'); setLoteBaja(''); setMotivoBaja(''); setPesoBaja('');
              }}
              style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>
              Aceptar baja
            </button>
          </div>
          <h4>Histórico de bajas</h4>
          <ul style={{background:'#fff',borderRadius:8,boxShadow:'0 2px 12px #007bff11',padding:'12px 18px'}}>
            {movimientos.filter(m => m.tipo === 'baja').map((b,idx)=>(
              <li key={idx}>{b.fecha}: {b.producto} - {b.cantidad} {b.unidad} {(b.peso ? `(${b.peso} kg)` : '')} (Lote: {b.lote}) [{b.motivo}]</li>
            ))}
          </ul>
        </div>
      )}
      {tab==='transferencias' && (
        <div>
          <TransferenciasPanel tiendas={window.tiendas || []} tiendaActual={tienda} modoFabrica={false} onTransferenciaConfirmada={refrescarMovimientos} />
        </div>
      )}
      {tab==='entradas' && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginTop: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{color:'#ff8f00', borderBottom: '2px solid #ff8f00', paddingBottom: '10px', marginBottom: '20px'}}>Registrar Nueva Compra/Entrada en Tienda</h3>
          <FormularioEntradaStock
            tiendaId={tiendaForzada?.id}
            onEntradaRegistrada={() => {
              refrescarMovimientos();
              // Opcionalmente cambiar a la pestaña de movimientos o stock para ver el resultado
              // setTab('movimientos');
            }}
            contexto="tienda"
          />
        </div>
      )}
    </div>
  );
}
