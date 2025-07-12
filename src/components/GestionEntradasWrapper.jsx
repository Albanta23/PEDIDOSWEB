import React, { useState } from 'react';
import LoginEntradasPanel from './LoginEntradasPanel';
import GestionEntradasFabricaPanel from './GestionEntradasFabricaPanel';

const GestionEntradasWrapper = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const handleClose = () => {
    handleLogout();
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <LoginEntradasPanel 
        onLogin={handleLogin} 
        onClose={onClose}
      />
    );
  }

  return (
    <GestionEntradasFabricaPanel 
      onClose={handleClose} 
      userRole={userRole}
    />
  );
};

export default GestionEntradasWrapper;
