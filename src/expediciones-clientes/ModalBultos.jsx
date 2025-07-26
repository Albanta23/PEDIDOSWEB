import React, { useState } from 'react';

export default function ModalBultos({ bultosInicial, onImprimir, onCancel }) {
  const [bultos, setBultos] = useState(bultosInicial || 1);

  const handleImprimir = () => {
    onImprimir(bultos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{width: 300}}>
        <h3 style={{marginTop:0}}>Confirmar Bultos</h3>
        <div className="form-group">
          <label>Número de Bultos:</label>
          <input
            type="number"
            min="1"
            value={bultos}
            onChange={e => setBultos(Number(e.target.value))}
            autoFocus
          />
        </div>
        <div className="modal-actions" style={{marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10}}>
          <button className="btn-default" onClick={onCancel}>Cancelar</button>
          <button className="btn-premium" onClick={handleImprimir}>Imprimir Etiquetas</button>
        </div>
      </div>
    </div>
  );
}
