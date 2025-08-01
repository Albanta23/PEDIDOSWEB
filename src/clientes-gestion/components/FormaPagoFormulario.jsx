import React, { useState, useEffect, useMemo } from 'react';
import SageDataService from '../services/sageDataService';
import './DireccionEnvio.css';

/**
 * Componente para capturar forma de pago y vendedor
 */
const FormaPagoFormulario = ({ 
  datos, 
  onChange, 
  vendedor, 
  onVendedorChange,
  almacenExpedicion,
  onAlmacenChange,
  serieFacturacion,
  onSerieChange,
  esWooCommerce = false 
}) => {
  const [formasPagoSage, setFormasPagoSage] = useState([]);
  const [vendedoresSage, setVendedoresSage] = useState([]);
  const [almacenesSage, setAlmacenesSage] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [modoAvanzado, setModoAvanzado] = useState(false);

  // Cargar datos de SAGE50 al montar el componente
  useEffect(() => {
    const cargarDatosSage = async () => {
      setCargandoDatos(true);
      try {
        const [formasPago, vendedores, almacenes] = await Promise.all([
          SageDataService.obtenerFormasPago(),
          SageDataService.obtenerVendedores(),
          SageDataService.obtenerAlmacenes()
        ]);
        
        setFormasPagoSage(formasPago.filter(fp => fp.activo));
        setVendedoresSage(vendedores.filter(v => v.activo));
        setAlmacenesSage(almacenes.filter(a => a.activo));
      } catch (error) {
        console.error('Error al cargar datos de SAGE50:', error);
      } finally {
        setCargandoDatos(false);
      }
    };
    
    cargarDatosSage();
  }, []);

  // Formas de pago predefinidas con códigos SAGE50 (fallback)
  const formasPagoPredefinidas = [
    { codigo: '01', titulo: 'Transferencia Bancaria', metodo: 'bacs' },
    { codigo: '02', titulo: 'Tarjeta de Crédito', metodo: 'card' },
    { codigo: '03', titulo: 'PayPal', metodo: 'paypal' },
    { codigo: '04', titulo: 'Contra Reembolso', metodo: 'cod' },
    { codigo: '05', titulo: 'Bizum', metodo: 'bizum' },
    { codigo: '06', titulo: 'Efectivo', metodo: 'cash' },
    { codigo: '99', titulo: 'Otro', metodo: 'other' }
  ];

  // Vendedores predefinidos (fallback)
  const vendedoresPredefinidos = [
    'Tienda Online',
    'Mostrador',
    'Teléfono',
    'Representante',
    'WhatsApp',
    'Email'
  ];

  const handleFormaPagoChange = (tipo, valor) => {
    if (tipo === 'simple') {
      onChange(valor);
    } else {
      // Modo avanzado - objeto con código SAGE50
      const formaPagoSeleccionada = formasPagoSage.find(fp => fp.codigo === valor) ||
                                   formasPagoPredefinidas.find(fp => fp.codigo === valor);
      if (formaPagoSeleccionada) {
        onChange({
          titulo: formaPagoSeleccionada.nombre || formaPagoSeleccionada.titulo,
          codigo: formaPagoSeleccionada.codigo,
          metodo: formaPagoSeleccionada.metodo || 'other'
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
          💳 Información de Pago, Vendedor y Expedición
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
          gridTemplateColumns: modoAvanzado ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
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
                {cargandoDatos ? (
                  <div style={{ 
                    padding: '10px 12px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px'
                  }}>
                    🔄 Cargando formas de pago de SAGE50...
                  </div>
                ) : (
                  <>
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
                      <option value="">Seleccionar forma de pago</option>
                      {formasPagoSage.length > 0 ? 
                        formasPagoSage.map(fp => (
                          <option key={fp.codigo} value={fp.codigo}>
                            {fp.nombre} (SAGE50: {fp.codigo})
                          </option>
                        )) :
                        formasPagoPredefinidas.map(fp => (
                          <option key={fp.codigo} value={fp.codigo}>
                            {fp.titulo} (SAGE50: {fp.codigo})
                          </option>
                        ))
                      }
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
                  </>
                )}
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
            
            {cargandoDatos ? (
              <div style={{ 
                padding: '10px 12px', 
                textAlign: 'center', 
                color: '#6b7280',
                border: '2px solid #e2e8f0',
                borderRadius: '6px'
              }}>
                🔄 Cargando vendedores de SAGE50...
              </div>
            ) : (
              <>
                <select
                  value={
                    // Buscar en vendedores SAGE50 primero
                    vendedoresSage.find(v => v.nombre === vendedor || v.codigo === vendedor) ? vendedor :
                    // Luego en predefinidos
                    vendedoresPredefinidos.includes(vendedor) ? vendedor : 
                    'personalizado'
                  }
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
                  
                  {/* Vendedores de SAGE50 */}
                  {vendedoresSage.length > 0 && (
                    <optgroup label="📊 Vendedores SAGE50">
                      {vendedoresSage.map(v => (
                        <option key={v._id} value={v.nombre}>
                          {v.nombre} (Código: {v.codigo})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Vendedores predefinidos */}
                  <optgroup label="⚡ Acceso Rápido">
                    {vendedoresPredefinidos.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </optgroup>
                  
                  <option value="personalizado">Vendedor personalizado...</option>
                </select>
                
                {/* Campo libre para vendedor personalizado */}
                <input
                  type="text"
                  value={
                    vendedoresSage.find(v => v.nombre === vendedor || v.codigo === vendedor) ? '' :
                    vendedoresPredefinidos.includes(vendedor) ? '' : 
                    vendedor || ''
                  }
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
                
                {/* Mostrar información del vendedor SAGE50 si está seleccionado */}
                {(() => {
                  const vendedorSage = vendedoresSage.find(v => v.nombre === vendedor || v.codigo === vendedor);
                  return vendedorSage && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '6px',
                      border: '1px solid #0ea5e9',
                      fontSize: '13px',
                      color: '#0c4a6e'
                    }}>
                      <strong>📊 SAGE50:</strong> {vendedorSage.codigo} - {vendedorSage.nombre}
                      {vendedorSage.email && (
                        <div style={{ marginTop: '4px' }}>
                          📧 {vendedorSage.email}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Almacén de Expedición */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Almacén de Expedición
            </label>
            
            {cargandoDatos ? (
              <div style={{ 
                padding: '10px 12px', 
                textAlign: 'center', 
                color: '#6b7280',
                border: '2px solid #e2e8f0',
                borderRadius: '6px'
              }}>
                🔄 Cargando almacenes de SAGE50...
              </div>
            ) : (
              <>
                <select
                  value={almacenExpedicion || ''}
                  onChange={e => onAlmacenChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    background: '#fff'
                  }}
                >
                  <option value="">Seleccionar almacén</option>
                  
                  {/* Almacenes de SAGE50 */}
                  {almacenesSage.length > 0 && almacenesSage.map(a => (
                    <option key={a._id} value={a.nombre}>
                      {a.nombre} (Código: {a.codigo})
                    </option>
                  ))}
                </select>
                
                {/* Mostrar información del almacén SAGE50 si está seleccionado */}
                {(() => {
                  const almacenSage = almacenesSage.find(a => a.nombre === almacenExpedicion || a.codigo === almacenExpedicion);
                  return almacenSage && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '6px',
                      border: '1px solid #0ea5e9',
                      fontSize: '13px',
                      color: '#0c4a6e'
                    }}>
                      <strong>📊 SAGE50:</strong> {almacenSage.codigo} - {almacenSage.nombre}
                      {almacenSage.direccion && (
                        <div style={{ marginTop: '4px' }}>
                          📍 {almacenSage.direccion}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Serie de Facturación */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Serie de Facturación
            </label>
            
            <select
              value={serieFacturacion || 'A'}
              onChange={e => onSerieChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="A">Serie A - Normal</option>
              <option value="T">Serie T - Transitoria</option>
            </select>
            
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: serieFacturacion === 'T' ? 
                'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)' : 
                'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '6px',
              border: `1px solid ${serieFacturacion === 'T' ? '#f59e0b' : '#0ea5e9'}`,
              fontSize: '13px',
              color: serieFacturacion === 'T' ? '#92400e' : '#0c4a6e'
            }}>
              <strong>📄 Serie {serieFacturacion || 'A'}:</strong> {(serieFacturacion || 'A') === 'A' ? 'Facturación normal' : 'Facturación transitoria'}
            </div>
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
