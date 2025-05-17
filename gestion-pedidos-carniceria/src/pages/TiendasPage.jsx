import React from 'react';
import Watermark from '../components/Watermark';

const TiendasPage = () => {
  const tiendas = [
    { id: 1, nombre: 'Carnicería La Tradición', ubicación: 'Calle 1, Ciudad A', estado: 'Abierta' },
    { id: 2, nombre: 'Charcutería El Sabor', ubicación: 'Calle 2, Ciudad B', estado: 'Abierta' },
    { id: 3, nombre: 'Carnicería El Buen Corte', ubicación: 'Calle 3, Ciudad C', estado: 'Cerrada' },
    { id: 4, nombre: 'Charcutería Delicias', ubicación: 'Calle 4, Ciudad D', estado: 'Abierta' },
    { id: 5, nombre: 'Carnicería La Estrella', ubicación: 'Calle 5, Ciudad E', estado: 'Abierta' },
    { id: 6, nombre: 'Charcutería Gourmet', ubicación: 'Calle 6, Ciudad F', estado: 'Cerrada' },
    { id: 7, nombre: 'Carnicería El Rincón', ubicación: 'Calle 7, Ciudad G', estado: 'Abierta' },
    { id: 8, nombre: 'Charcutería La Casa', ubicación: 'Calle 8, Ciudad H', estado: 'Abierta' },
    { id: 9, nombre: 'Carnicería El Mercado', ubicación: 'Calle 9, Ciudad I', estado: 'Cerrada' },
    { id: 10, nombre: 'Charcutería Sabores', ubicación: 'Calle 10, Ciudad J', estado: 'Abierta' },
  ];

  return (
    <div>
      <Watermark />
      <h1>Tiendas Disponibles</h1>
      <ul>
        {tiendas.map(tienda => (
          <li key={tienda.id}>
            <strong>{tienda.nombre}</strong> - {tienda.ubicación} - Estado: {tienda.estado}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TiendasPage;