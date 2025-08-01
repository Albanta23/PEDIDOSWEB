import React, { useState, useEffect } from 'react';
import { formatearFormaPago, obtenerCodigoFormaPago } from '../utils/formatDireccion';
import SageDataService from '../services/sageDataService';
import './DireccionEnvio.css';

/**
 * Componente mejorado para mostrar información de forma de pago, vendedor, almacén y serie
 * Integra datos de SAGE50 para mostrar información completa
 */
const FormaPagoVendedorInfo = ({ pedido, showTitle = true, showSageCode = true }) => {
  const [vendedorInfo, setVendedorInfo] = useState(null);
  const [formaPagoInfo, setFormaPagoInfo] = useState(null);
  const [almacenInfo, setAlmacenInfo] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!pedido) return;
    
    const cargarDatosSage = async () => {
      setCargando(true);
      
      try {
        // Obtener información del vendedor
        const vendedor = pedido.vendedor || pedido.datosWooCommerce?.vendedor;
        if (vendedor) {
          const infoVendedor = await SageDataService.obtenerInfoVendedor(vendedor);
          setVendedorInfo(infoVendedor);
        }
        
        // Obtener información de forma de pago
        const formaPago = pedido.formaPago || pedido.datosWooCommerce?.formaPago;
        if (formaPago) {
          const infoFormaPago = await SageDataService.obtenerInfoFormaPago(formaPago);
          setFormaPagoInfo(infoFormaPago);
        }
        
        // Obtener información del almacén
        const almacen = pedido.almacenExpedicion;
        if (almacen) {
          const infoAlmacen = await SageDataService.obtenerInfoAlmacen(almacen);
          setAlmacenInfo(infoAlmacen);
        }
      } catch (error) {
        console.error('Error al cargar datos de SAGE50:', error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatosSage();
  }, [pedido]);

  // Si no hay información relevante, no mostrar nada
  if (!pedido || (!pedido.formaPago && !pedido.datosWooCommerce?.formaPago && !pedido.vendedor && !pedido.datosWooCommerce?.vendedor && !pedido.almacenExpedicion && !pedido.serieFacturacion)) {
    return null;
  }

  const formaPago = pedido.formaPago || pedido.datosWooCommerce?.formaPago;
  const vendedor = pedido.vendedor || pedido.datosWooCommerce?.vendedor;
  const almacen = pedido.almacenExpedicion;
  const serie = pedido.serieFacturacion || 'A';
  const formaPagoFormateada = formatearFormaPago(formaPago);
  const codigoSageFormaPago = obtenerCodigoFormaPago(formaPago);

  return (
    <div className="forma-pago-info">
      {showTitle && (
        <div className="forma-pago-titulo mb-3">
          <h6 className="mb-0 d-flex align-items-center">
                        <span style={{ fontSize: '1.2em', marginRight: '8px' }}>💳</span>
            Información de Pago, Vendedor y Expedición
            {cargando && (
              <span className="ml-2" style={{ fontSize: '0.8em', color: '#6c757d' }}>
                🔄 Cargando datos SAGE50...
              </span>
            )}
          </h6>
        </div>
      )}
      
      <div className="forma-pago-contenido">
        <div className="row">
          {/* Forma de Pago */}
          {formaPago && (
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <div className="info-header">
                  <strong>💰 Forma de Pago</strong>
                </div>
                <div className="info-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge badge-primary" style={{ fontSize: '0.9em' }}>
                      {formaPagoInfo?.nombre || formaPagoFormateada}
                    </span>
                    {showSageCode && formaPagoInfo?.codigo && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.8em' }}>
                        SAGE: {formaPagoInfo.codigo}
                      </span>
                    )}
                  </div>
                  
                  {/* Información adicional de WooCommerce */}
                  {typeof formaPago === 'object' && formaPago.metodo && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <strong>Método:</strong> {formaPago.metodo}
                        {formaPago.detalles && (
                          <span className="ml-2">
                            | <strong>Proveedor:</strong> {formaPago.detalles.proveedor || 'No especificado'}
                          </span>
                        )}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Vendedor */}
          {vendedor && (
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <div className="info-header">
                  <strong>👤 Vendedor</strong>
                </div>
                <div className="info-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge badge-info" style={{ fontSize: '0.9em' }}>
                      {vendedorInfo?.nombre || vendedor}
                    </span>
                    {showSageCode && vendedorInfo?.codigo && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.8em' }}>
                        SAGE: {vendedorInfo.codigo}
                      </span>
                    )}
                  </div>
                  
                  {/* Información adicional del vendedor */}
                  {vendedorInfo?.email && (
                    <div className="mt-1">
                      <small className="text-muted">
                        📧 {vendedorInfo.email}
                      </small>
                    </div>
                  )}
                  {vendedorInfo?.telefono && (
                    <div className="mt-1">
                      <small className="text-muted">
                        📞 {vendedorInfo.telefono}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Almacén de Expedición */}
          {almacen && (
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <div className="info-header">
                  <strong>📦 Almacén Expedición</strong>
                </div>
                <div className="info-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge badge-success" style={{ fontSize: '0.9em' }}>
                      {almacenInfo?.nombre || almacen}
                    </span>
                    {showSageCode && almacenInfo?.codigo && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.8em' }}>
                        SAGE: {almacenInfo.codigo}
                      </span>
                    )}
                  </div>
                  
                  {/* Información adicional del almacén */}
                  {almacenInfo?.direccion && (
                    <div className="mt-1">
                      <small className="text-muted">
                        📍 {almacenInfo.direccion}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Serie de Facturación */}
          {serie && (
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <div className="info-header">
                  <strong>📄 Serie Facturación</strong>
                </div>
                <div className="info-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className={`badge ${serie === 'A' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.9em' }}>
                      Serie {serie}
                    </span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.8em' }}>
                      {serie === 'A' ? 'Normal' : 'Transitoria'}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <small className="text-muted">
                      {serie === 'A' ? '📋 Facturación normal' : '⚡ Facturación transitoria'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Información adicional para SAGE50 */}
        {showSageCode && (formaPagoInfo || vendedorInfo || almacenInfo || serie) && (
          <div className="sage-info mt-3 p-3" style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div className="d-flex align-items-center mb-2">
              <span style={{ fontSize: '1.1em', marginRight: '8px' }}>📊</span>
              <strong style={{ color: '#495057' }}>Integración SAGE50</strong>
            </div>
            <div className="row">
              {formaPagoInfo && (
                <div className="col-md-6 col-lg-3">
                  <small className="text-muted">
                    <strong>Forma de Pago:</strong> {formaPagoInfo.codigo} - {formaPagoInfo.nombre}
                  </small>
                </div>
              )}
              {vendedorInfo && (
                <div className="col-md-6 col-lg-3">
                  <small className="text-muted">
                    <strong>Vendedor:</strong> {vendedorInfo.codigo} - {vendedorInfo.nombre}
                  </small>
                </div>
              )}
              {almacenInfo && (
                <div className="col-md-6 col-lg-3">
                  <small className="text-muted">
                    <strong>Almacén:</strong> {almacenInfo.codigo} - {almacenInfo.nombre}
                  </small>
                </div>
              )}
              {serie && (
                <div className="col-md-6 col-lg-3">
                  <small className="text-muted">
                    <strong>Serie:</strong> {serie} - {serie === 'A' ? 'Normal' : 'Transitoria'}
                  </small>
                </div>
              )}
            </div>
            <div className="mt-2">
              <small className="text-muted" style={{ fontStyle: 'italic' }}>
                Esta información se incluirá automáticamente en la exportación a SAGE50
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormaPagoVendedorInfo;
