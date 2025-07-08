import React, { useState, useEffect } from 'react';
import { useData, BatchOrder } from '../../contexts/DataContext';
import Input from '../shared/forms/Input';
import Button from '../shared/Button';

interface BatchOrderFormProps {
  order?: BatchOrder | null;
  onSave: (order: Partial<BatchOrder>) => void;
  onCancel: () => void;
}

const emptyLine = { cestaId: '', nombreCesta: '', cantidad: 1, precioUnitario: 0, comentario: '' };

const BatchOrderForm: React.FC<BatchOrderFormProps> = ({ order, onSave, onCancel }) => {
  const { customers, hampers } = useData();
  const [form, setForm] = useState<Partial<BatchOrder>>({
    clienteId: '',
    direccion: '',
    estado: 'pendiente',
    lineas: [{ ...emptyLine }],
    fechaPedido: new Date().toISOString().slice(0, 10),
    notas: '',
  });

  useEffect(() => {
    if (order) setForm(order);
  }, [order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const newLines = [...(form.lineas || [])];
    newLines[idx] = { ...newLines[idx], [field]: value };
    setForm({ ...form, lineas: newLines });
  };

  const addLine = () => setForm({ ...form, lineas: [...(form.lineas || []), { ...emptyLine }] });
  const removeLine = (idx: number) => setForm({ ...form, lineas: (form.lineas || []).filter((_, i) => i !== idx) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <select name="clienteId" value={form.clienteId || ''} onChange={handleChange} className="w-full border rounded p-2">
            <option value="">Selecciona un cliente</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <Input name="direccion" value={form.direccion || ''} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select name="estado" value={form.estado || ''} onChange={handleChange} className="w-full border rounded p-2">
            <option value="pendiente">Pendiente</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Pedido</label>
          <Input type="date" name="fechaPedido" value={form.fechaPedido?.slice(0,10) || ''} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Líneas de Cesta/Lote</label>
        <div className="space-y-2">
          {(form.lineas || []).map((line, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select value={line.cestaId} onChange={e => handleLineChange(idx, 'cestaId', e.target.value)} className="border rounded p-2">
                <option value="">Selecciona cesta/lote</option>
                {hampers.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <Input type="text" placeholder="Nombre" value={line.nombreCesta} onChange={e => handleLineChange(idx, 'nombreCesta', e.target.value)} />
              <Input type="number" min={1} placeholder="Cantidad" value={line.cantidad} onChange={e => handleLineChange(idx, 'cantidad', Number(e.target.value))} />
              <Input type="number" min={0} step={0.01} placeholder="Precio Unitario" value={line.precioUnitario} onChange={e => handleLineChange(idx, 'precioUnitario', Number(e.target.value))} />
              <Input type="text" placeholder="Comentario" value={line.comentario || ''} onChange={e => handleLineChange(idx, 'comentario', e.target.value)} />
              <Button type="button" variant="danger" size="sm" onClick={() => removeLine(idx)}>-</Button>
            </div>
          ))}
          <Button type="button" variant="primary" size="sm" onClick={addLine}>+ Añadir línea</Button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea name="notas" value={form.notas || ''} onChange={handleChange} className="w-full border rounded p-2" rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar</Button>
      </div>
    </form>
  );
};

export default BatchOrderForm;
