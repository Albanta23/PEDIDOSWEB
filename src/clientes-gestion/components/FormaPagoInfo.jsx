import React from 'react';
import { formatearFormaPago, obtenerCodigoFormaPago } from '../utils/formatDireccion';
import './DireccionEnvio.css';

/**
 * Componente para mostrar información de forma de pago
 * Incluye información relevante para SAGE50
 */
const FormaPagoInfo = ({ pedido, showTitle = true, showSageCode = true }) => {
  if (!pedido) return null;
  
  const formaPago = pedido.formaPago || pedido.datosWooCommerce?.formaPago;
  const vendedor = pedido.vendedor || pedido.datosWooCommerce?.vendedor;
  
  // Si no hay ninguna información relevante, no mostrar nada
  if (!formaPago && !vendedor) return null;
  
  const formaPagoFormateada = formatearFormaPago(formaPago);
  const codigoSage = obtenerCodigoFormaPago(formaPago);
  
  return (
    <div className="forma-pago-info">
      {showTitle && (
        <div className="forma-pago-titulo mb-2">
          <h6 className="mb-1">💳 Información de Pago</h6>
        </div>
      )}
      
      <div className="forma-pago-contenido">
        {/* Forma de Pago */}
        {formaPago && (
          <div className="forma-pago-detalle mb-2">
            <strong>Forma de Pago:</strong>
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-primary">{formaPagoFormateada}</span>
              {showSageCode && (
                <small className="text-muted">(SAGE50: {codigoSage})</small>
              )}
            </div>
          </div>
        )}
        
        {/* Vendedor */}
        {vendedor && (
          <div className="vendedor-detalle mb-2">
            <strong>Vendedor:</strong>
            <div>
              <span className="badge badge-info">{vendedor}</span>
            </div>
          </div>
        )}
        
        {/* Información adicional para SAGE50 */}
        {showSageCode && (formaPago || vendedor) && (
          <div className="sage-info mt-2">
            <small className="text-muted">
              <strong>📊 SAGE50:</strong> Esta información se incluirá en la exportación a Excel
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormaPagoInfo;
