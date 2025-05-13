import React from 'react';

const tiendas = [
  { id: 1, nombre: 'Carnicería La Tradición' },
  { id: 2, nombre: 'Charcutería El Sabor' },
  { id: 3, nombre: 'Carnicería El Buen Corte' },
  { id: 4, nombre: 'Charcutería Delicias' },
  { id: 5, nombre: 'Carnicería La Excelencia' },
  { id: 6, nombre: 'Charcutería Gourmet' },
  { id: 7, nombre: 'Carnicería El Rincón' },
  { id: 8, nombre: 'Charcutería Sabores' },
  { id: 9, nombre: 'Carnicería La Calidad' },
  { id: 10, nombre: 'Charcutería Artesanal' },
];

const TiendaSelector = ({ onSelect }) => {
  return (
    <div>
      <h2>Selecciona una Tienda</h2>
      <select onChange={(e) => onSelect(e.target.value)}>
        <option value="">--Seleccione--</option>
        {tiendas.map((tienda) => (
          <option key={tienda.id} value={tienda.id}>
            {tienda.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TiendaSelector;