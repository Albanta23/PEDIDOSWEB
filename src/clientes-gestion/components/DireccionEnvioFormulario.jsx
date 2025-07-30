import React, { useState } from 'react';
import './DireccionEnvio.css';

/**
 * Componente para capturar dirección de envío alternativa
 */
const DireccionEnvioFormulario = ({ 
  datosEnvio, 
  onDatosEnvioChange, 
  direccionFacturacion,
  mostrarFormulario = false,
  onToggleFormulario 
}) => {
  const [envioAlternativo, setEnvioAlternativo] = useState(
    datosEnvio?.esEnvioAlternativo || false
  );

  const handleToggleEnvioAlternativo = (activar) => {
    setEnvioAlternativo(activar);
    
    if (!activar) {
      // Si se desactiva, limpiar datos de envío alternativo
      onDatosEnvioChange({
        esEnvioAlternativo: false
      });
    } else {
      // Si se activa, inicializar con datos básicos
      onDatosEnvioChange({
        esEnvioAlternativo: true,
        nombre: datosEnvio?.nombre || '',
        empresa: datosEnvio?.empresa || '',
        direccion1: datosEnvio?.direccion1 || '',
        direccion2: datosEnvio?.direccion2 || '',
        codigoPostal: datosEnvio?.codigoPostal || '',
        ciudad: datosEnvio?.ciudad || '',
        provincia: datosEnvio?.provincia || '',
        telefono: datosEnvio?.telefono || '',
        pais: datosEnvio?.pais || 'ES'
      });
    }
  };

  const handleInputChange = (campo, valor) => {
    onDatosEnvioChange({
      ...datosEnvio,
      [campo]: valor
    });
  };

  return (
    <div className="direccion-envio-formulario">
      {/* Toggle para activar/desactivar envío alternativo */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #0ea5e9',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: envioAlternativo ? '16px' : '0'
        }}>
          <input
            type="checkbox"
            id="envio-alternativo"
            checked={envioAlternativo}
            onChange={e => handleToggleEnvioAlternativo(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: '#0ea5e9'
            }}
          />
          <label 
            htmlFor="envio-alternativo" 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#0c4a6e',
              cursor: 'pointer'
            }}
          >
            📦 Dirección de envío diferente a la de facturación
          </label>
        </div>

        {/* Información de la dirección de facturación */}
        {!envioAlternativo && direccionFacturacion && (
          <div style={{
            background: '#fff',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '14px'
          }}>
            <strong>Se usará la dirección de facturación:</strong><br/>
            {direccionFacturacion}
          </div>
        )}

        {/* Formulario de dirección alternativa */}
        {envioAlternativo && (
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#1e293b',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              📍 Datos de envío alternativo
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Nombre completo */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={datosEnvio?.nombre || ''}
                  onChange={e => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre del destinatario"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              {/* Empresa (opcional) */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={datosEnvio?.empresa || ''}
                  onChange={e => handleInputChange('empresa', e.target.value)}
                  placeholder="Nombre de la empresa"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Dirección */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Dirección línea 1 *
              </label>
              <input
                type="text"
                value={datosEnvio?.direccion1 || ''}
                onChange={e => handleInputChange('direccion1', e.target.value)}
                placeholder="Calle, número..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Dirección línea 2 (opcional)
              </label>
              <input
                type="text"
                value={datosEnvio?.direccion2 || ''}
                onChange={e => handleInputChange('direccion2', e.target.value)}
                placeholder="Piso, oficina, apartamento..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Código Postal */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  C.P. *
                </label>
                <input
                  type="text"
                  value={datosEnvio?.codigoPostal || ''}
                  onChange={e => handleInputChange('codigoPostal', e.target.value)}
                  placeholder="28001"
                  maxLength="5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              {/* Ciudad */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={datosEnvio?.ciudad || ''}
                  onChange={e => handleInputChange('ciudad', e.target.value)}
                  placeholder="Madrid"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              {/* Provincia */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Provincia *
                </label>
                <input
                  type="text"
                  value={datosEnvio?.provincia || ''}
                  onChange={e => handleInputChange('provincia', e.target.value)}
                  placeholder="Madrid"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={datosEnvio?.telefono || ''}
                onChange={e => handleInputChange('telefono', e.target.value)}
                placeholder="911234567"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Alerta informativa */}
            <div style={{
              marginTop: '16px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 30%)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #f59e0b',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <strong>⚠️ Importante:</strong> Esta dirección se usará para las etiquetas de envío y será diferente a la dirección de facturación.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DireccionEnvioFormulario;
