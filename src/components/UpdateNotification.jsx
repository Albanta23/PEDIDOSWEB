import React from 'react';
import './UpdateNotification.css';

const UpdateNotification = ({ 
  isVisible, 
  onUpdate, 
  onDismiss, 
  isOnline 
}) => {
  if (!isVisible) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-icon">🔄</div>
        <div className="update-text">
          <h3>¡Nueva versión disponible!</h3>
          <p>
            Hay una actualización de la aplicación disponible. 
            {!isOnline && ' (Se aplicará cuando tengas conexión)'}
          </p>
        </div>
        <div className="update-actions">
          <button 
            className="update-button primary"
            onClick={onUpdate}
            disabled={!isOnline}
          >
            {isOnline ? 'Actualizar Ahora' : 'Sin Conexión'}
          </button>
          <button 
            className="update-button secondary"
            onClick={onDismiss}
          >
            Más Tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
