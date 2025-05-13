export interface Pedido {
  id: number;
  tiendaId: number;
  producto: string;
  cantidad: number;
  fecha: Date;
}

export interface Tienda {
  id: number;
  nombre: string;
  ubicacion: string;
  estado: 'abierta' | 'cerrada';
}