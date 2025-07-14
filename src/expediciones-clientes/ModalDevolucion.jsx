import React, { useState } from 'react';

export default function ModalDevolucion({ pedido, onClose, onDevolucion }) {
  const [lineasDevueltas, setLineasDevueltas] = useState([]);
  const [motivo, setMotivo] = useState('');

  const handleCheckboxChange = (e, linea) => {
    if (e.target.checked) {
      setLineasDevueltas([...lineasDevueltas, { ...linea, cantidadDevuelta: linea.cantidad, aptoParaVenta: true }]);
    } else {
      setLineasDevueltas(lineasDevueltas.filter(l => l.producto !== linea.producto));
    }
  };

  const handleCantidadChange = (e, linea) => {
    const cantidad = parseInt(e.target.value, 10);
    setLineasDevueltas(lineasDevueltas.map(l => l.producto === linea.producto ? { ...l, cantidadDevuelta: cantidad } : l));
  };

  const handleAptoParaVentaChange = (e, linea) => {
    const apto = e.target.checked;
    setLineasDevueltas(lineasDevueltas.map(l => l.producto === linea.producto ? { ...l, aptoParaVenta: apto } : l));
  };

  const handleSubmit = () => {
    onDevolucion({ lineas: lineasDevueltas, motivo });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Devolución Parcial - Pedido {pedido.numeroPedido}</h3>
          <button onClick={onClose} className="btn-close-modal">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Motivo de la devolución</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
          <table className="tabla-devolucion">
            <thead>
              <tr>
                <th>Devolver</th>
                <th>Producto</th>
                <th>Cantidad a devolver</th>
                <th>Apto para venta</th>
              </tr>
            </thead>
            <tbody>
              {pedido.lineas.filter(l => !l.esComentario).map(linea => (
                <tr key={linea.producto}>
                  <td>
                    <input type="checkbox" onChange={e => handleCheckboxChange(e, linea)} />
                  </td>
                  <td>{linea.producto}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max={linea.cantidad}
                      defaultValue={linea.cantidad}
                      onChange={e => handleCantidadChange(e, linea)}
                      disabled={!lineasDevueltas.some(l => l.producto === linea.producto)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={e => handleAptoParaVentaChange(e, linea)}
                      disabled={!lineasDevueltas.some(l => l.producto === linea.producto)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button className="btn-default" onClick={onClose}>Cancelar</button>
          <button className="btn-success" onClick={handleSubmit} disabled={lineasDevueltas.length === 0}>Procesar Devolución</button>
        </div>
      </div>
    </div>
  );
}
