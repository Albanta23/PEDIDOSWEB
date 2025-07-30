import React from 'react';
import { obtenerDireccionEnvio } from '../utils/formatDireccion';
import './DireccionEnvio.css';

/**
 * Componente para mostrar información de dirección de envío
 * Muestra la dirección de facturación o la de envío alternativa según corresponda
 */
const DireccionEnvioInfo = ({ pedido, showTitle = true, compact = false }) => {
  if (!pedido) return null;
  
  const direccionEnvio = obtenerDireccionEnvio(pedido);
  if (!direccionEnvio) return null;
  
  const esEnvioAlternativo = direccionEnvio.tipo === 'envio_alternativo';
  
  return (
    <div className={`direccion-envio-info ${compact ? 'compact' : ''}`}>
      {showTitle && (
        <div className="direccion-envio-titulo">
          <span className={`badge ${esEnvioAlternativo ? 'badge-warning' : 'badge-info'}`}>
            {esEnvioAlternativo ? '📦 Envío Alternativo' : '📦 Envío a Facturación'}
          </span>
        </div>
      )}
      
      <div className="direccion-envio-contenido">
        {/* Nombre y empresa */}
        <div className="direccion-destinatario">
          <strong>{direccionEnvio.nombre}</strong>
          {direccionEnvio.empresa && (
            <div className="empresa-envio">
              <small>{direccionEnvio.empresa}</small>
            </div>
          )}
        </div>
        
        {/* Dirección completa */}
        <div className="direccion-postal">
          <div>{direccionEnvio.direccionCompleta}</div>
          <div>
            {direccionEnvio.codigoPostal} {direccionEnvio.ciudad}
            {direccionEnvio.provincia && `, ${direccionEnvio.provincia}`}
          </div>
        </div>
        
        {/* Teléfono si está disponible */}
        {direccionEnvio.telefono && (
          <div className="telefono-envio">
            <small>📞 {direccionEnvio.telefono}</small>
          </div>
        )}
        
        {/* País si no es España */}
        {direccionEnvio.pais && direccionEnvio.pais !== 'ES' && (
          <div className="pais-envio">
            <small>🌍 {direccionEnvio.pais}</small>
          </div>
        )}
      </div>
      
      {/* Alerta si es envío alternativo */}
      {esEnvioAlternativo && !compact && (
        <div className="alert alert-warning mt-2" style={{ fontSize: '0.85em', padding: '8px' }}>
          <strong>⚠️ Atención:</strong> Esta dirección es diferente a la de facturación.
          Usar esta dirección para etiquetas de envío.
        </div>
      )}
    </div>
  );
};

export default DireccionEnvioInfo;
