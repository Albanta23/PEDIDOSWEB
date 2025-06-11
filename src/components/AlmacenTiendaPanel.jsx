import React from 'react';

export default function AlmacenTiendaPanel({ tiendaActual }) {
  // Aquí irá la lógica de stock, movimientos, bajas y caducidades
  return (
    <div style={{padding:32}}>
      <h2>Gestión de almacén de {tiendaActual?.nombre || 'Tienda'}</h2>
      <p>Próximamente: control de stock, registro de bajas/caducidades y movimientos de almacén.</p>
    </div>
  );
}
