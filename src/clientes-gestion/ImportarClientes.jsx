import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import clientesService from '../services/clientesService';
import { toast } from 'react-toastify';

const ImportarClientes = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('El archivo está vacío o no tiene el formato correcto.');
        setIsLoading(false);
        return;
      }

      const response = await clientesService.importarClientes(jsonData);

      if (response.ok) {
        toast.success(response.mensaje);
        navigate('/clientes');
      } else {
        toast.error(response.error || 'Error al importar clientes');
      }
    } catch (error) {
      console.error('Error en la importación:', error);
      toast.error('Error al importar clientes. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Importar Clientes</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
            Archivo de Clientes (Excel)
          </label>
          <input
            type="file"
            id="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isLoading ? 'Importando...' : 'Importar'}
          </button>
          <button
            onClick={() => navigate('/clientes')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportarClientes;
