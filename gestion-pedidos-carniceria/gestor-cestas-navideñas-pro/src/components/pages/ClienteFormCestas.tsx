import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Gift, UserCheck, AlertCircle } from 'lucide-react';

interface ClienteFormProps {
  cliente?: any;
  onSuccess: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ cliente, onSuccess, onCancel, readOnly }) => {
  const [form, setForm] = useState({
    nombre: cliente?.nombre || '',
    email: cliente?.email || '',
    telefono: cliente?.telefono || '',
    nif: cliente?.nif || '',
    direccion: cliente?.direccion || '',
    esCestaNavidad: cliente?.esCestaNavidad ?? true,
    activo: cliente?.activo ?? true,
    observaciones: cliente?.observaciones || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (cliente && cliente._id) {
        res = await fetch(`${API_ENDPOINTS.clientes.getAll}/${cliente._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(API_ENDPOINTS.clientes.create, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) throw new Error('Error al guardar el cliente');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!cliente || !cliente._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_ENDPOINTS.clientes.getAll}/${cliente._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al borrar el cliente');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Card variant="premium" className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{cliente ? (readOnly ? 'Ver Cliente' : 'Editar Cliente') : 'Nuevo Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input variant="premium" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required disabled={readOnly} />
          <Input variant="premium" placeholder="Email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={readOnly} />
          <Input variant="premium" placeholder="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} disabled={readOnly} />
          <Input variant="premium" placeholder="NIF" name="nif" value={form.nif} onChange={handleChange} disabled={readOnly} />
          <Input variant="premium" placeholder="Dirección" name="direccion" value={form.direccion} onChange={handleChange} disabled={readOnly} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="esCestaNavidad" checked={form.esCestaNavidad} onChange={handleCheckbox} disabled={readOnly} />
              <Badge variant={form.esCestaNavidad ? 'default' : 'outline'}>
                <Gift className="h-4 w-4 mr-1" /> Cliente de Cesta
              </Badge>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="activo" checked={form.activo} onChange={handleCheckbox} disabled={readOnly} />
              <Badge variant={form.activo ? 'success' : 'destructive'}>
                <UserCheck className="h-4 w-4 mr-1" /> Activo
              </Badge>
            </label>
          </div>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones"
            className="w-full border border-gray-200 rounded-lg p-2"
            disabled={readOnly}
          />
          {error && (
            <div className="flex items-center text-red-600 gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            {!readOnly && cliente && cliente._id && (
              <>
                {confirmDelete ? (
                  <>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>Confirmar Borrado</Button>
                    <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>Cancelar</Button>
                  </>
                ) : (
                  <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={loading}>Borrar</Button>
                )}
              </>
            )}
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cerrar</Button>
            {!readOnly && (
              <Button type="submit" variant="premium" disabled={loading}>{loading ? (cliente ? 'Guardando...' : 'Guardando...') : (cliente ? 'Guardar Cambios' : 'Guardar Cliente')}</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClienteForm;
