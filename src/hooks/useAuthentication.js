import { useState } from 'react';

export const useAuthentication = (initialModo = null) => {
  const [modo, setModoState] = useState(initialModo);
  const [logueado, setLogueado] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);

  const handleLogin = (usuario, tiendaIdCallback) => {
    setLogueado(true);
    // Si el modo es 'tienda', la tiendaIdCallback es el ID de la tienda.
    // Si el modo es 'fabrica', tiendaIdCallback podría no usarse o ser undefined.
    if (modo === 'tienda' && tiendaIdCallback) {
      setTiendaSeleccionada(tiendaIdCallback);
    }
    // Si es otro modo (ej. 'fabrica'), tiendaSeleccionada permanece null o como esté.
  };

  const handleLogout = () => {
    setLogueado(false);
    setTiendaSeleccionada(null);
    // Opcionalmente, podríamos resetear el modo también,
    // pero en App.jsx el modo se selecciona antes del login.
    // setModoState(null);
  };

  // Permitir que el modo se establezca desde fuera, por ejemplo, desde SeleccionModo
  const setModo = (newModo) => {
    setModoState(newModo);
    // Resetear logueado y tienda si el modo cambia,
    // excepto si se está cambiando a un modo que no requiere login inmediato.
    if (newModo !== modo) {
        setLogueado(false);
        setTiendaSeleccionada(null);
    }
  };

  return {
    modo,
    setModo,
    logueado,
    tiendaSeleccionada,
    handleLogin,
    handleLogout
    // setTiendaSeleccionada no se expone ya que handleLogin la gestiona
    // y no hay otros casos de uso identificados en App.jsx para modificarla externamente.
  };
};
