import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PedidoClienteDetalle from './PedidoClienteDetalle';
import { formatearDireccionCompletaPedido } from './utils/formatDireccion';
import { formatearNombreClientePedido } from '../utils/formatNombreCompleto';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_URL_CORRECTO = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

import ModalDevolucion from '../expediciones-clientes/ModalDevolucion';
import { registrarDevolucionParcial, registrarDevolucionTotal } from '../expediciones-clientes/pedidosClientesExpedicionService';

export default function HistorialPedidosClientes({ soloPreparados }) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(formatDateInput(getMonday(new Date())));
  const [fechaFin, setFechaFin] = useState(formatDateInput(new Date()));
  const [pedidosAbiertos, setPedidosAbiertos] = useState([]);
  const [pedidosCerrados, setPedidosCerrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [showModalDevolucion, setShowModalDevolucion] = useState(false);
  const [pedidoDevolucion, setPedidoDevolucion] = useState(null);
  const [enviandoId, setEnviandoId] = useState(null);

  const handleDevolucionParcial = (pedido) => {
    setPedidoDevolucion(pedido);
    setShowModalDevolucion(true);
  };

  const handleDevolucionTotal = async (pedido) => {
    const motivo = prompt('Introduce el motivo de la devolución total:');
    if (!motivo) return;

    const aptoParaVenta = window.confirm('¿Los productos son aptos para la venta?');

    try {
      await registrarDevolucionTotal(pedido._id, motivo, aptoParaVenta);
      // Recargar pedidos
    } catch (error) {
      alert('Error al registrar la devolución total');
    }
  };

  const procesarDevolucionParcial = async (devolucion) => {
    try {
      await registrarDevolucionParcial(pedidoDevolucion._id, devolucion);
      setShowModalDevolucion(false);
      setPedidoDevolucion(null);
      // Recargar pedidos
    } catch (error) {
      alert('Error al registrar la devolución parcial');
    }
  };

  const marcarComoEnviado = async (pedido) => {
    if (!window.confirm('¿Confirmar que este pedido ha sido enviado?')) return;
    setEnviandoId(pedido._id);
    try {
      await axios.put(`${API_URL_CORRECTO}/pedidos-clientes/${pedido._id}`, {
        ...pedido,
        estado: 'enviado',
        usuarioTramitando: 'usuario',
      });
      setEnviandoId(null);
      // Refrescar pedidos
      let params = [];
      if (clienteId) params.push(`clienteId=${clienteId}`);
      if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
      if (fechaFin) params.push(`fechaFin=${fechaFin}`);
      const query = params.length ? '?' + params.join('&') : '';
      const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes${query}`);
      const pedidos = res.data || [];
      setPedidosAbiertos(pedidos.filter(p => p.estado !== 'preparado' && p.estado !== 'cancelado' && p.estado !== 'enviado'));
      setPedidosCerrados(pedidos.filter(p => p.estado === 'preparado' || p.estado === 'enviado'));
    } catch (e) {
      setEnviandoId(null);
      alert('Error al marcar como enviado');
    }
  };

  const cancelarPedido = async (pedido) => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;
    setCancelandoId(pedido._id);
    try {
      await axios.put(`${API_URL_CORRECTO}/pedidos-clientes/${pedido._id}`, {
        ...pedido,
        estado: 'cancelado',
        usuarioTramitando: 'usuario',
      });
      // Opcional: lógica para reponer stock aquí si es necesario
      setCancelandoId(null);
      // Refrescar pedidos
      let params = [];
      if (clienteId) params.push(`clienteId=${clienteId}`);
      if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
      if (fechaFin) params.push(`fechaFin=${fechaFin}`);
      const query = params.length ? '?' + params.join('&') : '';
      const res = await axios.get(`${API_URL_CORRECTO}/pedidos-clientes${query}`);
      const pedidos = res.data || [];
      setPedidosAbiertos(pedidos.filter(p => p.estado !== 'preparado' && p.estado !== 'cancelado' && p.estado !== 'enviado'));
      setPedidosCerrados(pedidos.filter(p => p.estado === 'preparado' || p.estado === 'enviado'));
    } catch (e) {
      setCancelandoId(null);
      alert('Error al cancelar el pedido');
    }
  };

  useEffect(() => {
    axios.get(`${API_URL_CORRECTO}/clientes`).then(res => setClientes(res.data)).catch(()=>setClientes([]));
  }, []);

  useEffect(() => {
    setCargando(true);
    let params = [];
    if (clienteId) params.push(`clienteId=${clienteId}`);
    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);

    // Excluir pedidos en historial de devoluciones
    params.push('enHistorialDevoluciones=false');

    const query = params.length ? '?' + params.join('&') : '';
    axios.get(`${API_URL_CORRECTO}/pedidos-clientes${query}`)
      .then(res => {
        const pedidos = res.data || [];
        
        // 🧪 DATOS DE PRUEBA TEMPORALES PARA PROBAR DIRECCIONES DE ENVÍO
        const pedidosPrueba = [
          {
            _id: 'test-envio-alternativo-001',
            numeroPedido: 'TEST-2025-001',
            clienteNombre: 'Cliente Prueba Envío Alternativo',
            clienteNif: '12345678A',
            telefono: '911234567',
            direccion: 'Calle Facturación 123',
            codigoPostal: '28001',
            poblacion: 'Madrid',
            provincia: 'Madrid',
            estado: 'en_preparacion',
            fechaPedido: new Date().toISOString(),
            usuarioTramitando: 'operario_test',
            bultos: 2,
            
            // ⭐ DATOS NUEVOS DE ENVÍO ALTERNATIVO
            datosEnvioWoo: {
              esEnvioAlternativo: true,
              nombre: 'María López Destinataria',
              empresa: 'Oficinas Centrales S.L.',
              direccion1: 'Avenida del Envío 456',
              direccion2: 'Oficina 301 - 3ª Planta',
              codigoPostal: '28080',
              ciudad: 'Madrid',
              provincia: 'Madrid',
              telefono: '917654321',
              pais: 'ES'
            },
            
            // ⭐ DATOS NUEVOS DE FORMA DE PAGO
            datosWooCommerce: {
              formaPago: {
                titulo: 'Transferencia Bancaria',
                codigo: '01',
                metodo: 'bacs'
              },
              vendedor: 'Tienda Online'
            },
            
            formaPago: 'Transferencia Bancaria',
            vendedor: 'Tienda Online',
            
            lineas: [
              {
                producto: 'Producto Test Envío Alternativo',
                cantidad: 2,
                formato: 'ud',
                peso: 1.5,
                lote: 'L2025001',
                comentario: 'Producto especial para prueba'
              },
              {
                esComentario: true,
                comentario: 'IMPORTANTE: Entregar en horario de oficina (9:00-17:00)'
              }
            ],
            
            historialEstados: [
              {
                estado: 'en_espera',
                usuario: 'operario_test',
                fecha: new Date(Date.now() - 3600000).toISOString(),
                tipo: 'estado'
              },
              {
                estado: 'en_preparacion',
                usuario: 'operario_test',
                fecha: new Date().toISOString(),
                tipo: 'estado'
              }
            ]
          },
          {
            _id: 'test-normal-002',
            numeroPedido: 'TEST-2025-002',
            clienteNombre: 'Cliente Prueba Normal',
            clienteNif: '87654321B',
            telefono: '983111222',
            direccion: 'Plaza Mayor 1',
            codigoPostal: '47001',
            poblacion: 'Valladolid',
            provincia: 'Valladolid',
            estado: 'preparado',
            fechaPedido: new Date().toISOString(),
            usuarioTramitando: 'operario_test',
            bultos: 1,
            
            // Sin envío alternativo
            datosEnvioWoo: {
              esEnvioAlternativo: false
            },
            
            formaPago: 'Contra reembolso',
            vendedor: 'Mostrador',
            
            lineas: [
              {
                producto: 'Producto Test Normal',
                cantidad: 1,
                formato: 'kg',
                peso: 0.5
              }
            ],
            
            historialEstados: [
              {
                estado: 'en_espera',
                usuario: 'operario_test',
                fecha: new Date(Date.now() - 7200000).toISOString(),
                tipo: 'estado'
              },
              {
                estado: 'preparado',
                usuario: 'operario_test',
                fecha: new Date().toISOString(),
                tipo: 'estado'
              }
            ]
          }
        ];
        
        // Combinar pedidos reales con pedidos de prueba
        const todosPedidos = [...pedidosPrueba, ...pedidos];
        const pedidosFiltrados = todosPedidos.filter(p => !p.enHistorialDevoluciones);

        if (soloPreparados) {
          setPedidosAbiertos([]);
          setPedidosCerrados(pedidosFiltrados.filter(p => p.estado === 'preparado' || p.estado === 'enviado'));
        } else {
          setPedidosAbiertos(pedidosFiltrados.filter(p => p.estado !== 'preparado' && p.estado !== 'cancelado' && p.estado !== 'enviado'));
          setPedidosCerrados(pedidosFiltrados.filter(p => p.estado === 'preparado' || p.estado === 'enviado'));
        }
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [clienteId, fechaInicio, fechaFin, soloPreparados]);

  const colorEstado = estado => {
    if (estado === 'en_espera') return '#d32f2f';
    if (estado === 'en_preparacion') return '#388e3c';
    if (estado === 'preparado') return '#1976d2';
    if (estado === 'enviado') return '#4caf50';
    if (estado === 'cancelado') return '#888';
    return '#1976d2';
  };

  return (
    <div style={{ 
      marginTop: 32, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      {/* Header profesional con iconos */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '24px 32px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
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
        }}>📊</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            Historial de Pedidos de Clientes
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
            Gestión completa del historial de pedidos y estados
          </p>
        </div>
      </div>

      {/* Panel de filtros mejorado */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e1e8ed'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '20px',
            color: '#667eea',
            fontWeight: '600'
          }}>🔍</div>
          <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
            Filtros de búsqueda
          </h3>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontWeight: '600',
              color: '#34495e',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>👤</span> Cliente
            </label>
            <select 
              value={clienteId} 
              onChange={e=>setClienteId(e.target.value)} 
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e1e8ed',
                fontSize: '14px',
                background: '#fff',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e1e8ed'}
            >
              <option value="">Todos los clientes</option>
              {clientes.map(c=>(<option key={c._id||c.id||c.codigo} value={c._id||c.id||c.codigo}>{c.nombre}</option>))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontWeight: '600',
              color: '#34495e',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>📅</span> Fecha inicio
            </label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e=>setFechaInicio(e.target.value)} 
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e1e8ed',
                fontSize: '14px',
                background: '#fff',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontWeight: '600',
              color: '#34495e',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>📅</span> Fecha fin
            </label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e=>setFechaFin(e.target.value)} 
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e1e8ed',
                fontSize: '14px',
                background: '#fff',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>
        </div>
      </div>
      {cargando ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: '#667eea', fontSize: '16px', fontWeight: '600' }}>
            Cargando historial de pedidos...
          </p>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      ) : (
        <>
          {/* Sección de pedidos abiertos */}
          {!soloPreparados && (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e1e8ed',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '24px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>⏳</div>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                    Pedidos Abiertos
                  </h4>
                  <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                    {pedidosAbiertos.length} pedido{pedidosAbiertos.length !== 1 ? 's' : ''} pendiente{pedidosAbiertos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Nº Pedido</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '300px' }}>Cliente y Dirección</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>Bultos</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Fecha</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosAbiertos.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ 
                          textAlign: 'center', 
                          color: '#94a3b8', 
                          padding: '48px',
                          fontSize: '16px',
                          fontStyle: 'italic'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '48px', opacity: 0.5 }}>📝</span>
                            Sin pedidos abiertos en este período
                          </div>
                        </td>
                      </tr>
                    )}
                    {pedidosAbiertos.map((p, index) => (
                      <tr key={p._id || p.id} style={{
                        background: index % 2 === 0 ? '#fff' : '#f8fafc',
                        transition: 'background-color 0.2s ease',
                        ':hover': { background: '#f1f5f9' }
                      }}
                      onMouseEnter={e => e.target.parentElement.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.target.parentElement.style.background = index % 2 === 0 ? '#fff' : '#f8fafc'}
                      >
                        <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>
                          #{p.numeroPedido || p.id}
                        </td>
                        <td style={{ padding: '16px', color: '#475569' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>👤</span>
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatearNombreClientePedido(p)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px' }}>📍</span>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>{formatearDireccionCompletaPedido(p)}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            background: '#f0f9ff',
                            color: '#0369a1',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: '1px solid #7dd3fc'
                          }}>
                            {p.bultos !== undefined && p.bultos !== null ? p.bultos : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            background: colorEstado(p.estado) + '20',
                            color: colorEstado(p.estado),
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            border: `2px solid ${colorEstado(p.estado)}30`
                          }}>
                            {p.estado?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {p.fechaPedido ? new Date(p.fechaPedido).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={()=>setPedidoDetalle(p)} 
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                              }}
                              onMouseEnter={e => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                              }}
                              onMouseLeave={e => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                              }}
                            >
                              👁️ Ver detalle
                            </button>
                            <button 
                              onClick={()=>cancelarPedido(p)} 
                              disabled={cancelandoId===p._id}
                              style={{
                                padding: '8px 16px',
                                background: cancelandoId===p._id ? '#94a3b8' : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: cancelandoId===p._id ? 'not-allowed' : 'pointer',
                                opacity: cancelandoId===p._id ? 0.7 : 1,
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                              }}
                              onMouseEnter={e => {
                                if (cancelandoId!==p._id) {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.4)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (cancelandoId!==p._id) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)';
                                }
                              }}
                            >
                              {cancelandoId===p._id ? '⏳ Cancelando...' : '❌ Cancelar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sección de pedidos cerrados */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e1e8ed',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                fontSize: '24px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>✅</div>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                  Pedidos Completados y Enviados
                </h4>
                <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  {pedidosCerrados.length} pedido{pedidosCerrados.length !== 1 ? 's' : ''} preparado{pedidosCerrados.length !== 1 ? 's' : ''}/enviado{pedidosCerrados.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Nº Pedido</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '300px' }}>Cliente y Dirección</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>Bultos</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Fecha</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosCerrados.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ 
                        textAlign: 'center', 
                        color: '#94a3b8', 
                        padding: '48px',
                        fontSize: '16px',
                        fontStyle: 'italic'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '48px', opacity: 0.5 }}>📦</span>
                          Sin pedidos completados en este período
                        </div>
                      </td>
                    </tr>
                  )}
                  {pedidosCerrados.map((p, index) => (
                    <tr key={p._id || p.id} style={{
                      background: index % 2 === 0 ? '#fff' : '#f8fafc',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.parentElement.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.target.parentElement.style.background = index % 2 === 0 ? '#fff' : '#f8fafc'}
                    >
                      <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>
                        #{p.numeroPedido || p.id}
                      </td>
                      <td style={{ padding: '16px', color: '#475569' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>👤</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatearNombreClientePedido(p)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>📍</span>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>{formatearDireccionCompletaPedido(p)}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          background: '#f0f9ff',
                          color: '#0369a1',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '700',
                          border: '1px solid #7dd3fc'
                        }}>
                          {p.bultos !== undefined && p.bultos !== null ? p.bultos : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: colorEstado(p.estado) + '20',
                          color: colorEstado(p.estado),
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          border: `2px solid ${colorEstado(p.estado)}30`
                        }}>
                          {p.estado?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>
                        {p.fechaPedido ? new Date(p.fechaPedido).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={()=>setPedidoDetalle(p)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={e => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseLeave={e => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                            }}
                          >
                            👁️ Ver detalle
                          </button>
                          {p.estado === 'preparado' && (
                            <button
                              onClick={() => marcarComoEnviado(p)}
                              disabled={enviandoId === p._id}
                              style={{
                                padding: '8px 16px',
                                background: enviandoId === p._id ? '#94a3b8' : 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: enviandoId === p._id ? 'not-allowed' : 'pointer',
                                opacity: enviandoId === p._id ? 0.7 : 1,
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                              }}
                              onMouseEnter={e => {
                                if (enviandoId !== p._id) {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (enviandoId !== p._id) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                                }
                              }}
                            >
                              {enviandoId === p._id ? '⏳ Enviando...' : '📦 Marcar como Enviado'}
                            </button>
                          )}
                          <button className="btn-warning" onClick={() => handleDevolucionParcial(p)}>Devolución Parcial</button>
                          <button className="btn-danger" onClick={() => handleDevolucionTotal(p)}>Devolución Total</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {pedidoDetalle && <PedidoClienteDetalle pedido={pedidoDetalle} onClose={()=>setPedidoDetalle(null)} />}
          {showModalDevolucion && <ModalDevolucion pedido={pedidoDevolucion} onClose={() => setShowModalDevolucion(false)} onDevolucion={procesarDevolucionParcial} />}
        </>
      )}
    </div>
  );
}
