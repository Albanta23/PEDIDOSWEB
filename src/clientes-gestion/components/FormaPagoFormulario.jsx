import React, { useState, useMemo } from 'react';
import './DireccionEnvio.css';

/**
 * Componente para capturar forma de pago y vendedor
 */
const FormaPagoFormulario = ({ 
  datos, 
  onChange, 
  vendedor, 
  onVendedorChange,
  esWooCommerce = false 
}) => {
  // Formas de pago predefinidas con códigos SAGE50
  const formasPagoPredefinidas = [
    { codigo: '01', titulo: 'Transferencia Bancaria', metodo: 'bacs' },
    { codigo: '02', titulo: 'Tarjeta de Crédito', metodo: 'card' },
    { codigo: '03', titulo: 'PayPal', metodo: 'paypal' },
    { codigo: '04', titulo: 'Contra Reembolso', metodo: 'cod' },
    { codigo: '05', titulo: 'Bizum', metodo: 'bizum' },
    { codigo: '06', titulo: 'Efectivo', metodo: 'cash' },
    { codigo: '99', titulo: 'Otro', metodo: 'other' }
  ];

  // Vendedores predefinidos
  const vendedoresPredefinidos = [
    'Tienda Online',
    'Mostrador',
    'Teléfono',
    'Representante',
    'WhatsApp',
    'Email'
  ];

  const [modoAvanzado, setModoAvanzado] = useState(false);

  const handleFormaPagoChange = (tipo, valor) => {
    if (tipo === 'simple') {
      onChange(valor);
    } else {
      // Modo avanzado - objeto con código SAGE50
      const formaPagoSeleccionada = formasPagoPredefinidas.find(fp => fp.codigo === valor);
      if (formaPagoSeleccionada) {
        onChange({
          titulo: formaPagoSeleccionada.titulo,
          codigo: formaPagoSeleccionada.codigo,
          metodo: formaPagoSeleccionada.metodo
        });
      }
    }
  };

  const handleFormaPagoPersonalizada = (titulo) => {
    onChange({
      titulo: titulo,
      codigo: '99',
      metodo: 'other'
    });
  };

  // Memorizar los valores calculados para evitar re-renders infinitos
  const formaPagoActual = useMemo(() => {
    if (typeof datos === 'string') {
      return datos;
    } else if (typeof datos === 'object' && datos?.titulo) {
      return datos.titulo;
    }
    return '';
  }, [datos]);

  const codigoFormaPagoActual = useMemo(() => {
    if (typeof datos === 'object' && datos?.codigo) {
      return datos.codigo;
    }
    return '01'; // Valor por defecto
  }, [datos]);

  return (
    <div className="forma-pago-formulario">
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #16a34a',
        marginBottom: '16px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#1e293b',
          fontSize: '18px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          💳 Información de Pago y Vendedor
        </h4>

        {/* Toggle modo simple/avanzado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <input
            type="checkbox"
            id="modo-avanzado"
            checked={modoAvanzado}
            onChange={e => setModoAvanzado(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#16a34a'
            }}
          />
          <label 
            htmlFor="modo-avanzado" 
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            📊 Modo avanzado (códigos SAGE50)
          </label>
          {modoAvanzado && (
            <small style={{ color: '#6b7280', fontStyle: 'italic' }}>
              Incluye códigos para exportación a SAGE50
            </small>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: modoAvanzado ? '2fr 1fr' : '1fr 1fr',
          gap: '20px'
        }}>
          {/* Forma de Pago */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Forma de Pago
            </label>

            {modoAvanzado ? (
              /* Modo avanzado con códigos SAGE50 */
              <div>
                <select
                  value={codigoFormaPagoActual}
                  onChange={e => handleFormaPagoChange('avanzado', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    background: '#fff'
                  }}
                >
                  {formasPagoPredefinidas.map(fp => (
                    <option key={fp.codigo} value={fp.codigo}>
                      {fp.titulo} (SAGE50: {fp.codigo})
                    </option>
                  ))}
                </select>
                
                {/* Opción personalizada para "Otro" */}
                {codigoFormaPagoActual === '99' && (
                  <input
                    type="text"
                    value={typeof datos === 'object' && datos?.titulo ? datos.titulo : ''}
                    onChange={e => handleFormaPagoPersonalizada(e.target.value)}
                    placeholder="Especificar forma de pago personalizada"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      marginTop: '8px'
                    }}
                  />
                )}
                
                {/* Información del código SAGE50 */}
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '6px',
                  border: '1px solid #0ea5e9',
                  fontSize: '13px',
                  color: '#0c4a6e'
                }}>
                  <strong>📊 SAGE50:</strong> Se exportará con código {codigoFormaPagoActual}
                </div>
              </div>
            ) : (
              /* Modo simple */
              <div>
                <select
                  value={formaPagoActual}
                  onChange={e => handleFormaPagoChange('simple', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    background: '#fff'
                  }}
                >
                  <option value="">Seleccionar forma de pago</option>
                  {formasPagoPredefinidas.map(fp => (
                    <option key={fp.codigo} value={fp.titulo}>
                      {fp.titulo}
                    </option>
                  ))}
                </select>
                
                {/* Input personalizado si es "Otro" */}
                {formaPagoActual === 'Otro' && (
                  <input
                    type="text"
                    value={typeof datos === 'string' && datos !== 'Otro' ? datos : ''}
                    onChange={e => handleFormaPagoChange('simple', e.target.value)}
                    placeholder="Especificar forma de pago"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      marginTop: '8px'
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Vendedor */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Vendedor
            </label>
            
            <select
              value={vendedoresPredefinidos.includes(vendedor) ? vendedor : 'personalizado'}
              onChange={e => {
                if (e.target.value === 'personalizado') {
                  // No cambiar el valor si es personalizado
                  return;
                } else {
                  onVendedorChange(e.target.value);
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="">Seleccionar vendedor</option>
              {vendedoresPredefinidos.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value="personalizado">Vendedor personalizado...</option>
            </select>
            
            {/* Campo libre para vendedor personalizado */}
            <input
              type="text"
              value={vendedoresPredefinidos.includes(vendedor) ? '' : vendedor || ''}
              onChange={e => onVendedorChange(e.target.value)}
              placeholder="O escribir vendedor personalizado"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                marginTop: '8px',
                fontStyle: 'italic'
              }}
            />
          </div>
        </div>

        {/* Información para WooCommerce */}
        {esWooCommerce && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
            borderRadius: '8px',
            border: '1px solid #8b5cf6',
            fontSize: '14px',
            color: '#5b21b6'
          }}>
            <strong>🛒 WooCommerce:</strong> Esta información se importará automáticamente desde WooCommerce cuando sea posible.
          </div>
        )}

        {/* Información sobre SAGE50 */}
        {modoAvanzado && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
            fontSize: '14px',
            color: '#1e40af'
          }}>
            <strong>📊 Exportación SAGE50:</strong> Los códigos de forma de pago se incluirán automáticamente en la exportación a Excel para SAGE50.
          </div>
        )}
      </div>
    </div>
  );
};

export default FormaPagoFormulario;
