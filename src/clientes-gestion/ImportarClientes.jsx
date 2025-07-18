import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ImportarClientes = ({ onClose, API_URL }) => {
  const [step, setStep] = useState(1); // 1: selección de archivo, 2: previsualización, 3: resultados
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState(''); // csv, excel, json
  const [preview, setPreview] = useState([]);
  const [mappings, setMappings] = useState({});
  const [results, setResults] = useState({
    total: 0,
    creados: 0,
    actualizados: 0,
    errores: 0,
    clientesConError: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [shouldUpdate, setShouldUpdate] = useState(false);

  // Campos del sistema para mapear
  const systemFields = [
    { id: 'nombre', label: 'Nombre', required: true },
    { id: 'email', label: 'Email', required: false },
    { id: 'telefono', label: 'Teléfono', required: false },
    { id: 'direccion', label: 'Dirección', required: false },
    { id: 'cif', label: 'CIF/NIF', required: false },
    { id: 'codigoPostal', label: 'Código Postal', required: false },
    { id: 'poblacion', label: 'Población', required: false },
    { id: 'provincia', label: 'Provincia', required: false },
    { id: 'activo', label: 'Activo', required: false },
    { id: 'tipoCliente', label: 'Tipo de Cliente', required: false },
    { id: 'exentoIVA', label: 'Exento de IVA', required: false },
    { id: 'formaPago', label: 'Forma de Pago', required: false },
    { id: 'recargoEquiv', label: 'Recargo de Equivalencia', required: false },
    { id: 'descuento1', label: 'Descuento 1', required: false },
    { id: 'descuento2', label: 'Descuento 2', required: false },
    { id: 'descuento3', label: 'Descuento 3', required: false },
    { id: 'numCliente', label: 'Número de Cliente', required: false },
    { id: 'esCestaNavidad', label: 'Es Cliente de Cestas de Navidad', required: false }
  ];

  // Función para detectar automáticamente las columnas
  const autoDetectColumns = (headers) => {
    const newMappings = {};
    const columnNameMappings = {
      // Mapeos para nombre
      'nombre': 'nombre',
      'razonsocial': 'nombre',
      'razon social': 'nombre',
      'razón social': 'nombre',
      'nomcomercial': 'nombre',
      'nombre comercial': 'nombre',
      'nombrenegocio': 'nombre',
      'cliente': 'nombre',
      'nombrecliente': 'nombre',
      'nomcliente': 'nombre',
      'company': 'nombre',
      'empresa': 'nombre',
      
      // Mapeos para email
      'email': 'email',
      'correo': 'email',
      'correoelectronico': 'email',
      'correo electronico': 'email',
      'e-mail': 'email',
      'mail': 'email',
      
      // Mapeos para teléfono
      'telefono': 'telefono',
      'teléfono': 'telefono',
      'tel': 'telefono',
      'phone': 'telefono',
      'tel1': 'telefono',
      'telefono1': 'telefono',
      'teléfono1': 'telefono',
      'movil': 'telefono',
      'móvil': 'telefono',
      'tel.': 'telefono',
      
      // Mapeos para dirección
      'direccion': 'direccion',
      'dirección': 'direccion',
      'dir': 'direccion',
      'domicilio': 'direccion',
      'calle': 'direccion',
      'address': 'direccion',
      
      // Mapeos para CIF/NIF
      'cif': 'cif',
      'nif': 'cif',
      'documento': 'cif',
      'dni': 'cif',
      'identificacion': 'cif',
      'identificación': 'cif',
      'id fiscal': 'cif',
      'idfiscal': 'cif',
      
      // Mapeos para código postal
      'cp': 'codigoPostal',
      'codpostal': 'codigoPostal',
      'cod postal': 'codigoPostal',
      'cod. postal': 'codigoPostal',
      'codigo postal': 'codigoPostal',
      'código postal': 'codigoPostal',
      'codigopostal': 'codigoPostal',
      'postal': 'codigoPostal',
      'zip': 'codigoPostal',
      'zipcode': 'codigoPostal',
      'c.postal': 'codigoPostal',
      
      // Mapeos para población
      'poblacion': 'poblacion',
      'población': 'poblacion',
      'localidad': 'poblacion',
      'ciudad': 'poblacion',
      'city': 'poblacion',
      'town': 'poblacion',
      
      // Mapeos para provincia
      'provincia': 'provincia',
      'state': 'provincia',
      'region': 'provincia',
      'región': 'provincia',
      'comunidad': 'provincia',
      
      // Mapeos para activo
      'activo': 'activo',
      'active': 'activo',
      'estado': 'activo',
      'status': 'activo',
      
      // Mapeos para tipo de cliente
      'tipocliente': 'tipoCliente',
      'tipo cliente': 'tipoCliente',
      'tipo de cliente': 'tipoCliente',
      'tipo': 'tipoCliente',
      'category': 'tipoCliente',
      'categoría': 'tipoCliente',
      'categoria': 'tipoCliente',
      
      // Mapeos para exento de IVA
      'exentoiva': 'exentoIVA',
      'exento iva': 'exentoIVA',
      'exento de iva': 'exentoIVA',
      'sin iva': 'exentoIVA',
      'iva exento': 'exentoIVA',
      'tax exempt': 'exentoIVA',
      
      // Mapeos para forma de pago
      'formapago': 'formaPago',
      'forma pago': 'formaPago',
      'forma de pago': 'formaPago',
      'metodopago': 'formaPago',
      'metodo pago': 'formaPago',
      'método de pago': 'formaPago',
      'payment': 'formaPago',
      'payment method': 'formaPago',
      
      // Mapeos para recargo de equivalencia
      'recargoequiv': 'recargoEquiv',
      'recargo equiv': 'recargoEquiv',
      'recargo': 'recargoEquiv',
      'recargo de equivalencia': 'recargoEquiv',
      'surcharge': 'recargoEquiv',
      
      // Mapeos para descuentos
      'descuento1': 'descuento1',
      'descuento 1': 'descuento1',
      'descuento uno': 'descuento1',
      'dto1': 'descuento1',
      'dto 1': 'descuento1',
      'discount1': 'descuento1',
      
      'descuento2': 'descuento2',
      'descuento 2': 'descuento2',
      'descuento dos': 'descuento2',
      'dto2': 'descuento2',
      'dto 2': 'descuento2',
      'discount2': 'descuento2',
      
      'descuento3': 'descuento3',
      'descuento 3': 'descuento3',
      'descuento tres': 'descuento3',
      'dto3': 'descuento3',
      'dto 3': 'descuento3',
      'discount3': 'descuento3',
      
      // Mapeos para número de cliente
      'numcliente': 'numCliente',
      'num cliente': 'numCliente',
      'número cliente': 'numCliente',
      'número de cliente': 'numCliente',
      'numero de cliente': 'numCliente',
      'id cliente': 'numCliente',
      'idcliente': 'numCliente',
      'código cliente': 'numCliente',
      'codigo cliente': 'numCliente',
      'customer id': 'numCliente',
      'customerid': 'numCliente',
      'customer number': 'numCliente',
      'customernumber': 'numCliente',
      'código': 'numCliente',
      'codigo': 'numCliente',
      
      // Mapeos para cestas de navidad
      'cestasnavidad': 'esCestaNavidad',
      'cestas navidad': 'esCestaNavidad',
      'cestas de navidad': 'esCestaNavidad',
      'cesta navidad': 'esCestaNavidad',
      'es cesta navidad': 'esCestaNavidad',
      'cliente cestas': 'esCestaNavidad',
      'navidad': 'esCestaNavidad',
      'christmas basket': 'esCestaNavidad'
    };

    headers.forEach(header => {
      const headerLower = header.toString().toLowerCase().trim();
      
      if (columnNameMappings[headerLower]) {
        newMappings[header] = columnNameMappings[headerLower];
      }
    });

    return newMappings;
  };

  // Función para cargar archivo
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrorMessage('');
    
    try {
      // Determinar formato de archivo
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'txt'].includes(extension)) {
        setFileFormat('csv');
        handleCSVFile(selectedFile);
      } else if (['xlsx', 'xls'].includes(extension)) {
        setFileFormat('excel');
        handleExcelFile(selectedFile);
      } else if (extension === 'json') {
        setFileFormat('json');
        handleJSONFile(selectedFile);
      } else {
        setErrorMessage('Formato de archivo no soportado. Por favor usa CSV, Excel o JSON.');
      }
    } catch (error) {
      console.error('Error procesando archivo:', error);
      setErrorMessage('Error al procesar el archivo. Por favor verifica que el formato sea correcto.');
    }
  };

  // Procesar archivo CSV
  const handleCSVFile = async (file) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      
      // Detectar separador (coma, punto y coma, tabulador)
      const separadores = [',', ';', '\t'];
      let separador = ',';
      let maxColumnas = 0;
      
      for (const sep of separadores) {
        const columnas = text.split('\n')[0].split(sep).length;
        if (columnas > maxColumnas) {
          maxColumnas = columnas;
          separador = sep;
        }
      }
      
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        setErrorMessage('El archivo CSV está vacío o no tiene datos.');
        setIsLoading(false);
        return;
      }
      
      // Obtener encabezados y datos
      const headers = lines[0].split(separador).map(h => h.trim().replace(/^"(.+)"$/, '$1'));
      setAvailableFields(headers);
      
      // Obtener una muestra de los datos para previsualización
      const sampleData = [];
      const maxRows = Math.min(5, lines.length - 1);
      
      for (let i = 1; i <= maxRows; i++) {
        if (lines[i]) {
          const row = {};
          const cols = lines[i].split(separador).map(col => col.trim().replace(/^"(.+)"$/, '$1'));
          
          headers.forEach((header, index) => {
            row[header] = cols[index] || '';
          });
          
          sampleData.push(row);
        }
      }
      
      setPreview(sampleData);
      
      // Auto-detectar columnas
      const detectedMappings = autoDetectColumns(headers);
      setMappings(detectedMappings);
      
      setStep(2);
    } catch (error) {
      console.error('Error procesando CSV:', error);
      setErrorMessage('Error al procesar el archivo CSV. Verifica que el formato sea correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Procesar archivo Excel
  const handleExcelFile = async (file) => {
    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Obtener la primera hoja
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        setErrorMessage('El archivo Excel está vacío o no tiene datos.');
        setIsLoading(false);
        return;
      }
      
      // Obtener encabezados
      const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
      setAvailableFields(headers);
      
      // Obtener una muestra de los datos para previsualización
      const sampleData = [];
      const maxRows = Math.min(5, jsonData.length - 1);
      
      for (let i = 1; i <= maxRows; i++) {
        if (jsonData[i]) {
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = jsonData[i][index] !== undefined ? jsonData[i][index].toString() : '';
          });
          
          sampleData.push(row);
        }
      }
      
      setPreview(sampleData);
      
      // Auto-detectar columnas
      const detectedMappings = autoDetectColumns(headers);
      setMappings(detectedMappings);
      
      setStep(2);
    } catch (error) {
      console.error('Error procesando Excel:', error);
      setErrorMessage('Error al procesar el archivo Excel. Verifica que el formato sea correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Procesar archivo JSON
  const handleJSONFile = async (file) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        setErrorMessage('El archivo JSON debe contener un array de objetos.');
        setIsLoading(false);
        return;
      }
      
      // Obtener encabezados de las propiedades del primer objeto
      const headers = Object.keys(jsonData[0]);
      setAvailableFields(headers);
      
      // Obtener una muestra de los datos para previsualización
      const sampleData = jsonData.slice(0, 5).map(item => {
        const row = {};
        headers.forEach(header => {
          row[header] = item[header] !== undefined ? item[header].toString() : '';
        });
        return row;
      });
      
      setPreview(sampleData);
      
      // Auto-detectar columnas
      const detectedMappings = autoDetectColumns(headers);
      setMappings(detectedMappings);
      
      setStep(2);
    } catch (error) {
      console.error('Error procesando JSON:', error);
      setErrorMessage('Error al procesar el archivo JSON. Verifica que el formato sea correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar cambios en el mapeo
  const handleMappingChange = (columnName, systemField) => {
    setMappings(prev => ({
      ...prev,
      [columnName]: systemField
    }));
  };

  // Función para validar que el mapeo tiene todos los campos requeridos
  const validateMappings = () => {
    const requiredFields = systemFields.filter(field => field.required).map(field => field.id);
    const mappedFields = Object.values(mappings);
    
    return requiredFields.every(field => mappedFields.includes(field));
  };

  // Función para procesar los datos y enviarlos al servidor
  const handleImport = async () => {
    if (!validateMappings()) {
      setErrorMessage('Por favor mapea todos los campos requeridos (Nombre es obligatorio).');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      let allData = [];
      
      // Procesar el archivo según el formato
      if (fileFormat === 'csv') {
        const text = await file.text();
        const separadores = [',', ';', '\t'];
        let separador = ',';
        let maxColumnas = 0;
        
        for (const sep of separadores) {
          const columnas = text.split('\n')[0].split(sep).length;
          if (columnas > maxColumnas) {
            maxColumnas = columnas;
            separador = sep;
          }
        }
        
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const headers = lines[0].split(separador).map(h => h.trim().replace(/^"(.+)"$/, '$1'));
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i]) {
            const data = {};
            const cols = lines[i].split(separador).map(col => col.trim().replace(/^"(.+)"$/, '$1'));
            
            // Aplicar mapeo
            headers.forEach((header, index) => {
              const systemField = mappings[header];
              if (systemField) {
                data[systemField] = cols[index] || '';
              }
            });
            
            if (data.nombre) {
              allData.push(data);
            }
          }
        }
      } 
      else if (fileFormat === 'excel') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
        
        for (let i = 1; i < jsonData.length; i++) {
          if (jsonData[i]) {
            const data = {};
            
            // Aplicar mapeo
            headers.forEach((header, index) => {
              const systemField = mappings[header];
              if (systemField) {
                data[systemField] = jsonData[i][index] !== undefined ? jsonData[i][index].toString() : '';
              }
            });
            
            if (data.nombre) {
              allData.push(data);
            }
          }
        }
      } 
      else if (fileFormat === 'json') {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        jsonData.forEach(item => {
          const data = {};
          
          // Aplicar mapeo
          Object.keys(item).forEach(key => {
            const systemField = mappings[key];
            if (systemField) {
              data[systemField] = item[key] !== undefined ? item[key].toString() : '';
            }
          });
          
          if (data.nombre) {
            allData.push(data);
          }
        });
      }
      
      // Procesar los datos
      const processedData = allData.map(item => {
        // Procesamiento de datos según el tipo
        const processedItem = { ...item };
        
        // Si hay dirección completa y campos individuales, combinarlos
        if (!processedItem.direccion && (processedItem.calle || processedItem.codigoPostal || processedItem.poblacion || processedItem.provincia)) {
          processedItem.direccion = [
            processedItem.calle, 
            processedItem.codigoPostal, 
            processedItem.poblacion, 
            processedItem.provincia
          ].filter(Boolean).join(', ');
        }
        
        // Convertir campos booleanos
        ['activo', 'exentoIVA', 'recargoEquiv', 'esCestaNavidad'].forEach(field => {
          if (processedItem[field] !== undefined) {
            const value = processedItem[field].toString().toLowerCase();
            processedItem[field] = ['true', 'yes', 'si', 'sí', '1', 'verdadero', 'activo', 'activado'].includes(value);
          }
        });
        
        // Convertir campos numéricos
        ['descuento1', 'descuento2', 'descuento3'].forEach(field => {
          if (processedItem[field] !== undefined) {
            processedItem[field] = parseFloat(processedItem[field].toString().replace(',', '.')) || 0;
          }
        });
        
        if (processedItem.numCliente !== undefined) {
          processedItem.numCliente = processedItem.numCliente.toString();
        }
        
        return processedItem;
      });
      
      // Enviar al servidor
      const response = await axios.post(`${API_URL}/clientes/importar`, {
        clientes: processedData,
        actualizarExistentes: shouldUpdate
      });
      
      setResults({
        total: processedData.length,
        creados: response.data.creados || 0,
        actualizados: response.data.actualizados || 0,
        errores: response.data.errores || 0,
        clientesConError: response.data.clientesConError || []
      });
      
      setStep(3);
    } catch (error) {
      console.error('Error importando clientes:', error);
      setErrorMessage(error.response?.data?.mensaje || 'Error al importar clientes. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para reiniciar el proceso
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileFormat('');
    setPreview([]);
    setMappings({});
    setResults({
      total: 0,
      creados: 0,
      actualizados: 0,
      errores: 0,
      clientesConError: []
    });
    setIsLoading(false);
    setErrorMessage('');
    setAvailableFields([]);
    setShouldUpdate(false);
    setStep(1);
  };

  // UI para el paso 1: Selección de archivo
  const renderStep1 = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '20px', color: '#2c3e50' }}>
          Paso 1: Selecciona un archivo
        </h3>
        
        <div style={{ 
          border: '2px dashed #cbd5e0', 
          borderRadius: '10px', 
          padding: '40px 20px',
          textAlign: 'center',
          marginBottom: '20px',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px', color: '#4a5568' }}>
            🗂️ Selecciona un archivo CSV, Excel o JSON con los datos de los clientes
          </div>
          
          <div style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
            Formatos soportados: .csv, .txt, .xlsx, .xls, .json
          </div>
          
          <label style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)',
            transition: 'all 0.3s ease'
          }}>
            Seleccionar Archivo
            <input 
              type="file" 
              accept=".csv,.txt,.xlsx,.xls,.json" 
              onChange={handleFileChange}
              style={{ display: 'none' }} 
            />
          </label>
          
          {fileName && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              background: '#ebf4ff', 
              borderRadius: '6px',
              color: '#4c51bf',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{ fontWeight: 'bold' }}>📄</span>
              {fileName}
              {isLoading && <span>🔄 Procesando...</span>}
            </div>
          )}
        </div>
        
        <div style={{ fontSize: '14px', color: '#718096', marginBottom: '10px' }}>
          <strong>Recomendaciones:</strong>
          <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
            <li>Asegúrate de que tu archivo tiene una fila de encabezados.</li>
            <li>Para CSV, usa comas, punto y coma o tabuladores como separadores.</li>
            <li>El campo 'Nombre' es obligatorio para cada cliente.</li>
            <li>Incluye información de contacto como email y teléfono para facilitar la comunicación.</li>
          </ul>
        </div>
        
        {errorMessage && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#fed7d7', 
            borderRadius: '6px',
            color: '#c53030',
            fontSize: '14px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
      </div>
    );
  };

  // UI para el paso 2: Mapeo de campos
  const renderStep2 = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '20px', color: '#2c3e50' }}>
          Paso 2: Mapeo de campos
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            padding: '10px',
            background: '#e6fffa',
            borderRadius: '6px',
            color: '#2c7a7b',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            <strong>📋 Previsualización:</strong> Los primeros {preview.length} registros del archivo.
          </div>
          
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {availableFields.map((field, index) => (
                    <th key={index} style={{ 
                      padding: '10px', 
                      borderBottom: '2px solid #cbd5e0',
                      textAlign: 'left',
                      color: '#4a5568'
                    }}>
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ 
                    borderBottom: '1px solid #e2e8f0',
                    background: rowIndex % 2 === 0 ? 'white' : '#f7fafc'
                  }}>
                    {availableFields.map((field, colIndex) => (
                      <td key={colIndex} style={{ 
                        padding: '8px', 
                        color: '#4a5568',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {row[field] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ 
            padding: '10px',
            background: '#ebf8ff',
            borderRadius: '6px',
            color: '#2b6cb0',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            <strong>🔄 Mapeo de campos:</strong> Asocia cada columna del archivo a un campo del sistema.
          </div>
          
          <div style={{ 
            marginBottom: '15px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ fontSize: '14px', color: '#4a5568' }}>
              <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Columnas detectadas:</span> {availableFields.length}
            </div>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#4a5568',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={shouldUpdate} 
                onChange={(e) => setShouldUpdate(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Actualizar clientes existentes
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {availableFields.map((field, index) => (
              <div key={index} style={{ 
                padding: '10px', 
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white',
                marginBottom: '5px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#4a5568', fontSize: '14px' }}>
                    {field}
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {preview[0] && preview[0][field] ? `Ej: ${preview[0][field]}` : ''}
                  </div>
                </div>
                
                <select 
                  value={mappings[field] || ''} 
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e0',
                    color: '#4a5568',
                    backgroundColor: mappings[field] ? '#ebf8ff' : 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- No mapear --</option>
                  {systemFields.map((sysField) => (
                    <option key={sysField.id} value={sysField.id}>
                      {sysField.label} {sysField.required ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        
        {errorMessage && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#fed7d7', 
            borderRadius: '6px',
            color: '#c53030',
            fontSize: '14px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button 
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: '#e2e8f0',
              border: 'none',
              color: '#4a5568',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Volver
          </button>
          
          <button 
            onClick={handleImport}
            disabled={isLoading || !validateMappings()}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: validateMappings() 
                ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                : '#cbd5e0',
              border: 'none',
              color: validateMappings() ? 'white' : '#a0aec0',
              fontWeight: 'bold',
              cursor: validateMappings() ? 'pointer' : 'not-allowed',
              boxShadow: validateMappings() ? '0 4px 6px rgba(102, 126, 234, 0.25)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? '🔄 Procesando...' : 'Importar Clientes →'}
          </button>
        </div>
      </div>
    );
  };

  // UI para el paso 3: Resultados
  const renderStep3 = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '20px', color: '#2c3e50' }}>
          Paso 3: Resultados de la Importación
        </h3>
        
        <div style={{ 
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '10px',
            color: results.errores === 0 ? '#38a169' : '#dd6b20'
          }}>
            {results.errores === 0 ? '✅' : '⚠️'}
          </div>
          
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: results.errores === 0 ? '#2f855a' : '#c05621',
            marginBottom: '5px'
          }}>
            {results.errores === 0 
              ? 'Importación completada con éxito' 
              : `Importación completada con ${results.errores} errores`}
          </div>
          
          <div style={{ fontSize: '14px', color: '#718096' }}>
            Se procesaron {results.total} registros del archivo
          </div>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            padding: '15px',
            borderRadius: '8px',
            background: '#e6fffa',
            textAlign: 'center',
            border: '1px solid #b2f5ea'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c7a7b' }}>
              {results.creados}
            </div>
            <div style={{ fontSize: '14px', color: '#319795' }}>
              Clientes Creados
            </div>
          </div>
          
          <div style={{ 
            padding: '15px',
            borderRadius: '8px',
            background: '#ebf8ff',
            textAlign: 'center',
            border: '1px solid #bee3f8'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2b6cb0' }}>
              {results.actualizados}
            </div>
            <div style={{ fontSize: '14px', color: '#3182ce' }}>
              Clientes Actualizados
            </div>
          </div>
          
          <div style={{ 
            padding: '15px',
            borderRadius: '8px',
            background: results.errores > 0 ? '#fff5f5' : '#f7fafc',
            textAlign: 'center',
            border: `1px solid ${results.errores > 0 ? '#fed7d7' : '#e2e8f0'}`
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: results.errores > 0 ? '#c53030' : '#718096' 
            }}>
              {results.errores}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: results.errores > 0 ? '#e53e3e' : '#718096' 
            }}>
              Errores
            </div>
          </div>
        </div>
        
        {results.errores > 0 && results.clientesConError && results.clientesConError.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#4a5568',
              marginBottom: '10px'
            }}>
              📋 Detalles de los errores:
            </div>
            
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #fed7d7',
              borderRadius: '6px',
              background: '#fff5f5'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#fed7d7' }}>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'left',
                      color: '#c53030'
                    }}>
                      Cliente
                    </th>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'left',
                      color: '#c53030'
                    }}>
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.clientesConError.map((error, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #fed7d7'
                    }}>
                      <td style={{ 
                        padding: '8px', 
                        color: '#c53030',
                        fontWeight: 'bold'
                      }}>
                        {error.nombre || 'Cliente sin nombre'}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        color: '#e53e3e'
                      }}>
                        {error.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div style={{ 
          padding: '15px',
          borderRadius: '8px',
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          color: '#4a5568',
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            ✨ ¿Qué sigue?
          </div>
          <ul style={{ paddingLeft: '20px', margin: '0' }}>
            <li>Los clientes han sido importados y están listos para usar.</li>
            <li>Puedes revisar y editar la información de los clientes desde la lista principal.</li>
            <li>Para importar más clientes, haz clic en "Importar Otro Archivo".</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)',
              transition: 'all 0.3s ease'
            }}
          >
            Finalizar
          </button>
          
          <button 
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: '#e2e8f0',
              border: 'none',
              color: '#4a5568',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Importar Otro Archivo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#2d3748' }}>
            📂 Importar Clientes
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '14px', color: '#718096' }}>
              Paso {step} de 3
            </div>
            
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '5px',
                color: '#718096',
                transition: 'all 0.2s ease'
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Progreso de pasos */}
        <div style={{ 
          display: 'flex', 
          padding: '15px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f7fafc'
        }}>
          {[1, 2, 3].map((stepNumber) => (
            <div 
              key={stepNumber}
              style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              <div 
                style={{ 
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: step >= stepNumber 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                    : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '5px',
                  zIndex: 2
                }}
              >
                {stepNumber}
              </div>
              
              <div style={{ 
                fontSize: '12px',
                color: step >= stepNumber ? '#4a5568' : '#a0aec0',
                fontWeight: step === stepNumber ? 'bold' : 'normal'
              }}>
                {stepNumber === 1 ? 'Seleccionar Archivo' : 
                 stepNumber === 2 ? 'Mapear Campos' : 'Resultados'}
              </div>
              
              {stepNumber < 3 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  width: '100%',
                  height: '2px',
                  background: step > stepNumber ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e2e8f0',
                  zIndex: 1
                }} />
              )}
            </div>
          ))}
        </div>
        
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default ImportarClientes;
