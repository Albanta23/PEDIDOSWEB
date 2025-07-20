import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaArrowLeft, FaArrowRight, FaCheck, FaSpinner, FaFileExcel, FaFileCsv, FaFileCode } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import clientesService from '../services/clientesService';
import { toast } from 'react-toastify';

/**
 * Componente para importar clientes desde diferentes formatos de archivo
 */
const ImportarClientes = () => {
  const navigate = useNavigate();
  
  // Estados para manejar el proceso de importación
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState('');
  const [step, setStep] = useState(1);
  const [availableFields, setAvailableFields] = useState([]);
  const [mappings, setMappings] = useState({});
  const [preview, setPreview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Campos del sistema para mapeo
  const systemFields = [
    { id: 'nombre', label: 'Nombre', required: true },
    { id: 'apellidos', label: 'Apellidos', required: false },
    { id: 'razonSocial', label: 'Razón Social', required: false },
    { id: 'nombreComercial', label: 'Nombre Comercial', required: false },
    { id: 'nif', label: 'NIF/CIF', required: false },
    { id: 'direccion', label: 'Dirección', required: false },
    { id: 'codigoPostal', label: 'Código Postal', required: false },
    { id: 'poblacion', label: 'Población', required: false },
    { id: 'provincia', label: 'Provincia', required: false },
    { id: 'telefono', label: 'Teléfono', required: false },
    { id: 'email', label: 'Email', required: false },
    { id: 'observaciones', label: 'Observaciones', required: false },
    { id: 'personaContacto', label: 'Persona de Contacto', required: false },
    { id: 'formaPago', label: 'Forma de Pago', required: false },
    { id: 'descuento1', label: 'Descuento 1', required: false },
    { id: 'descuento2', label: 'Descuento 2', required: false },
    { id: 'descuento3', label: 'Descuento 3', required: false },
    { id: 'recargoEquiv', label: 'Recargo de Equivalencia', required: false },
    { id: 'numCliente', label: 'Número de Cliente', required: false },
    { id: 'codigoSage', label: 'Código SAGE', required: false },
    { id: 'esCestaNavidad', label: 'Es Cliente de Cestas de Navidad', required: false },
  ];
  
  // Efecto para limpiar cuando el componente se desmonta
  useEffect(() => {
    return () => {
      setFile(null);
      setFileName('');
    };
  }, []);
  
  // Función para detectar automáticamente las columnas
  const autoDetectColumns = (headers) => {
    const newMappings = {};
    
    // Mapeo de nombres de columnas comunes
    const columnNameMappings = {
      // Mapeos para nombre
      'nombre': 'nombre',
      'name': 'nombre',
      'customer': 'nombre',
      'client': 'nombre',
      'cliente': 'nombre',
      'nombres': 'nombre',
      'nom': 'nombre',
      'first name': 'nombre',
      'firstname': 'nombre',
      'contacto': 'nombre',
      'contact': 'nombre',
      'nombres y apellidos': 'nombre',
      'fullname': 'nombre',
      'full name': 'nombre',
      'name and surname': 'nombre',
      
      // Mapeos para apellidos
      'apellidos': 'apellidos',
      'apellido': 'apellidos',
      'surname': 'apellidos',
      'surnames': 'apellidos',
      'lastname': 'apellidos',
      'last name': 'apellidos',
      'family name': 'apellidos',
      
      // Mapeos para razón social
      'razonsocial': 'razonSocial',
      'razón social': 'razonSocial',
      'razon social': 'razonSocial',
      'empresa': 'razonSocial',
      'compañía': 'razonSocial',
      'compania': 'razonSocial',
      'company': 'razonSocial',
      'company name': 'razonSocial',
      'legal name': 'razonSocial',
      'business name': 'razonSocial',
      'organization': 'razonSocial',
      
      // Mapeos para nombre comercial
      'nombrecomercial': 'nombreComercial',
      'nombre comercial': 'nombreComercial',
      'commercial name': 'nombreComercial',
      'trading name': 'nombreComercial',
      'brand name': 'nombreComercial',
      'trade name': 'nombreComercial',
      'marca': 'nombreComercial',
      
      // Mapeos para NIF/CIF
      'nif': 'nif',
      'cif': 'nif',
      'documento': 'nif',
      'identificación': 'nif',
      'identificacion': 'nif',
      'id': 'nif',
      'tax id': 'nif',
      'vat': 'nif',
      'vat number': 'nif',
      'tax number': 'nif',
      'fiscal number': 'nif',
      'documento fiscal': 'nif',
      'número fiscal': 'nif',
      'numero fiscal': 'nif',
      'dni': 'nif',
      'tax identification': 'nif',
      
      // Mapeos para dirección
      'direccion': 'direccion',
      'dirección': 'direccion',
      'address': 'direccion',
      'street': 'direccion',
      'location': 'direccion',
      'calle': 'direccion',
      'domicilio': 'direccion',
      
      // Mapeos para código postal
      'codigopostal': 'codigoPostal',
      'código postal': 'codigoPostal',
      'codigo postal': 'codigoPostal',
      'cp': 'codigoPostal',
      'zip': 'codigoPostal',
      'zipcode': 'codigoPostal',
      'postal code': 'codigoPostal',
      'post code': 'codigoPostal',
      
      // Mapeos para población
      'poblacion': 'poblacion',
      'población': 'poblacion',
      'localidad': 'poblacion',
      'ciudad': 'poblacion',
      'city': 'poblacion',
      'town': 'poblacion',
      'village': 'poblacion',
      'city name': 'poblacion',
      'municipality': 'poblacion',
      'municipio': 'poblacion',
      
      // Mapeos para provincia
      'provincia': 'provincia',
      'state': 'provincia',
      'region': 'provincia',
      'province': 'provincia',
      'county': 'provincia',
      'departamento': 'provincia',
      
      // Mapeos para teléfono
      'telefono': 'telefono',
      'teléfono': 'telefono',
      'tel': 'telefono',
      'phone': 'telefono',
      'phone number': 'telefono',
      'telephone': 'telefono',
      'movil': 'telefono',
      'móvil': 'telefono',
      'mobile': 'telefono',
      'celular': 'telefono',
      'cell': 'telefono',
      'cell phone': 'telefono',
      
      // Mapeos para email
      'email': 'email',
      'correo': 'email',
      'correo electrónico': 'email',
      'correo electronico': 'email',
      'e-mail': 'email',
      'mail': 'email',
      'electronic mail': 'email',
      'emailaddress': 'email',
      'email address': 'email',
      
      // Mapeos para observaciones
      'observaciones': 'observaciones',
      'observacion': 'observaciones',
      'observación': 'observaciones',
      'notes': 'observaciones',
      'note': 'observaciones',
      'comments': 'observaciones',
      'comment': 'observaciones',
      'remarks': 'observaciones',
      'notas': 'observaciones',
      'anotaciones': 'observaciones',
      'comentarios': 'observaciones',
      
      // Mapeos para persona de contacto
      'personacontacto': 'personaContacto',
      'persona contacto': 'personaContacto',
      'persona de contacto': 'personaContacto',
      'contact person': 'personaContacto',
      'contacto principal': 'personaContacto',
      'primary contact': 'personaContacto',
      'main contact': 'personaContacto',
      'contacto empresa': 'personaContacto',
      'business contact': 'personaContacto',
      
      // Mapeos para código SAGE
      'codigosage': 'codigoSage',
      'código sage': 'codigoSage',
      'codigo sage': 'codigoSage',
      'sage': 'codigoSage',
      'sage id': 'codigoSage',
      'sage code': 'codigoSage',
      'id sage': 'codigoSage',
      'code sage': 'codigoSage',
      'sageref': 'codigoSage',
      'sage ref': 'codigoSage',
      'reference sage': 'codigoSage',
      'refsage': 'codigoSage',
      
      // Mapeos para forma de pago
      'formapago': 'formaPago',
      'forma pago': 'formaPago',
      'forma de pago': 'formaPago',
      'metodo pago': 'formaPago',
      'método pago': 'formaPago',
      'metodo de pago': 'formaPago',
      'método de pago': 'formaPago',
      'payment': 'formaPago',
      
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
      'customer id': 'numCliente',
      'customerid': 'numCliente',
      'customer number': 'numCliente',
      'customernumber': 'numCliente',
      
      // Mapeos para cestas de navidad
      'cestasnavidad': 'esCestaNavidad',
      'cestas navidad': 'esCestaNavidad',
      'cestas de navidad': 'esCestaNavidad',
      'cesta navidad': 'esCestaNavidad',
      'es cesta navidad': 'esCestaNavidad',
      'cliente cestas': 'esCestaNavidad',
      'navidad': 'esCestaNavidad',
      'christmas basket': 'esCestaNavidad',
      
      // Mapeos específicos para _TabClientes__202506221857.csv
      'codigo': 'codigoSage',
      'nombrefiscal': 'razonSocial',
      'nomcomercial': 'nombreComercial',
      'direccioncomercial': 'direccion',
      'direccionfiscal': 'direccion',
      'cpcomercial': 'codigoPostal',
      'cpfiscal': 'codigoPostal',
      'poblacioncomercial': 'poblacion',
      'poblacionfiscal': 'poblacion',
      'provinciacomercial': 'provincia',
      'provinciafiscal': 'provincia',
      'telefonocomercial': 'telefono',
      'telefonofiscal': 'telefono',
      'emailcomercial': 'email',
      'emailfiscal': 'email'
    };

    // Mapeo especial para el formato "_TabClientes__202506221857.csv"
    const isTabClientesFile = headers.some(h => {
      return h.includes('Codigo') || h.includes('NomFiscal') || h.includes('NomComercial');
    });

    if (isTabClientesFile) {
      console.log('[MAPEO] Detectado formato de archivo _TabClientes__, aplicando mapeo específico');
      headers.forEach(header => {
        if (header.includes('Codigo')) newMappings[header] = 'codigoSage';
        else if (header.includes('NomFiscal')) newMappings[header] = 'razonSocial';
        else if (header.includes('NomComercial')) newMappings[header] = 'nombreComercial';
        else if (header.includes('DireccionComercial')) newMappings[header] = 'direccion';
        else if (header.includes('DireccionFiscal')) newMappings[header] = 'direccion';
        else if (header.includes('CPComercial')) newMappings[header] = 'codigoPostal';
        else if (header.includes('CPFiscal')) newMappings[header] = 'codigoPostal';
        else if (header.includes('PoblacionComercial')) newMappings[header] = 'poblacion';
        else if (header.includes('PoblacionFiscal')) newMappings[header] = 'poblacion';
        else if (header.includes('ProvinciaComercial')) newMappings[header] = 'provincia';
        else if (header.includes('ProvinciaFiscal')) newMappings[header] = 'provincia';
        else if (header.includes('TelefonoComercial')) newMappings[header] = 'telefono';
        else if (header.includes('TelefonoFiscal')) newMappings[header] = 'telefono';
        else if (header.includes('EmailComercial')) newMappings[header] = 'email';
        else if (header.includes('EmailFiscal')) newMappings[header] = 'email';
        else if (header.includes('CIF')) newMappings[header] = 'nif';
        else if (header.includes('RazonSocial')) newMappings[header] = 'nombre';
      });
      
      return newMappings;
    }

    headers.forEach(header => {
      if (!header) return;
      
      const headerLower = header.toString().toLowerCase().trim();
      
      if (columnNameMappings[headerLower]) {
        newMappings[header] = columnNameMappings[headerLower];
        console.log(`[MAPEO] Mapeando columna '${header}' a campo '${columnNameMappings[headerLower]}'`);
      } else {
        console.log(`[MAPEO] No se encontró mapeo para la columna '${header}'`);
      }
    });

    console.log('[MAPEO] Mapeos detectados:', newMappings);
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
      
      // Verificar si es un archivo específico de clientes
      const isTabClientesFile = headers.some(h => {
        return h.includes('Codigo') || h.includes('NomFiscal') || h.includes('NomComercial');
      });
      
      if (isTabClientesFile) {
        console.log('[CSV] Detectado formato específico de clientes, aplicando mapeo automático');
      }
      
      setMappings(detectedMappings);
      
      // Calcular el % de columnas mapeadas automáticamente
      const mappedColumns = Object.keys(detectedMappings).length;
      const mappingPercentage = (mappedColumns / headers.length) * 100;
      console.log(`[CSV] Mapeo automático: ${mappedColumns}/${headers.length} columnas (${mappingPercentage.toFixed(1)}%)`);
      
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
      const headers = jsonData[0].map(h => h !== null && h !== undefined ? h.toString().trim() : '').filter(Boolean);
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
      
      // Verificar si es un archivo específico de clientes
      const isTabClientesFile = headers.some(h => {
        return h.includes('Codigo') || h.includes('NomFiscal') || h.includes('NomComercial');
      });
      
      if (isTabClientesFile) {
        console.log('[EXCEL] Detectado formato específico de clientes, aplicando mapeo automático');
      }
      
      setMappings(detectedMappings);
      
      // Calcular el % de columnas mapeadas automáticamente
      const mappedColumns = Object.keys(detectedMappings).length;
      const mappingPercentage = (mappedColumns / headers.length) * 100;
      console.log(`[EXCEL] Mapeo automático: ${mappedColumns}/${headers.length} columnas (${mappingPercentage.toFixed(1)}%)`);
      
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
            
            // Verificación adicional para el archivo _TabClientes
            if (headers.some(h => h.includes('Codigo') || h.includes('NomFiscal'))) {
              // Si no tenemos nombre pero tenemos razón social, usamos razón social como nombre
              if (!data.nombre && data.razonSocial) {
                data.nombre = data.razonSocial;
              }
              
              // Si no tenemos NIF pero tenemos CIF, usamos CIF como NIF
              if (data.nif && !data.nif.trim()) {
                headers.forEach((header, index) => {
                  if (header.includes('CIF') || header.includes('Cif')) {
                    data.nif = cols[index] || '';
                  }
                });
              }
            }
            
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
        
        const headers = jsonData[0].map(h => h !== null && h !== undefined ? h.toString().trim() : '').filter(Boolean);
        
        for (let i = 1; i < jsonData.length; i++) {
          if (jsonData[i] && jsonData[i].length > 0) {
            const data = {};
            
            // Aplicar mapeo
            headers.forEach((header, index) => {
              const systemField = mappings[header];
              if (systemField) {
                const cellValue = jsonData[i][index];
                data[systemField] = cellValue !== undefined ? cellValue.toString() : '';
              }
            });
            
            // Verificación adicional para el archivo _TabClientes
            if (headers.some(h => h.includes('Codigo') || h.includes('NomFiscal'))) {
              // Si no tenemos nombre pero tenemos razón social, usamos razón social como nombre
              if (!data.nombre && data.razonSocial) {
                data.nombre = data.razonSocial;
              }
              
              // Si no tenemos NIF pero tenemos CIF, usamos CIF como NIF
              if (!data.nif || !data.nif.trim()) {
                headers.forEach((header, index) => {
                  if (header.includes('CIF') || header.includes('Cif')) {
                    const cellValue = jsonData[i][index];
                    data.nif = cellValue !== undefined ? cellValue.toString() : '';
                  }
                });
              }
            }
            
            // Asegurar que tenemos un nombre (requerido)
            if (!data.nombre && data.razonSocial) {
              data.nombre = data.razonSocial;
            } else if (!data.nombre && data.nombreComercial) {
              data.nombre = data.nombreComercial;
            }
            
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
      
      // Validar que tenemos datos
      if (allData.length === 0) {
        throw new Error('No se encontraron datos válidos para importar. Asegúrate de que el archivo tiene el formato correcto y de mapear al menos la columna de nombre.');
      }
      
      // Enviar datos al servidor
      console.log(`[IMPORT] Enviando ${allData.length} clientes al servidor`);
      
      // Verificar datos antes de enviar
      allData.forEach((cliente, index) => {
        // Asegurar que los campos numéricos son números o cadenas vacías
        ['descuento1', 'descuento2', 'descuento3', 'recargoEquiv'].forEach(campo => {
          if (cliente[campo]) {
            cliente[campo] = cliente[campo].toString().replace(',', '.');
            
            if (isNaN(parseFloat(cliente[campo]))) {
              cliente[campo] = '';
            }
          }
        });
        
        // Convertir boolean a string para el campo esCestaNavidad
        if (cliente.esCestaNavidad !== undefined) {
          const valor = cliente.esCestaNavidad.toString().toLowerCase();
          cliente.esCestaNavidad = ['true', 'si', 'sí', 's', 'y', 'yes', '1'].includes(valor) ? 'true' : 'false';
        }
        
        console.log(`[IMPORT] Cliente ${index + 1}: ${cliente.nombre}, NIF: ${cliente.nif || 'No especificado'}, Código SAGE: ${cliente.codigoSage || 'No especificado'}`);
      });
      
      const response = await clientesService.importarClientes(allData);
      
      if (response.success) {
        setImportResults(response);
        setStep(3);
        toast.success(`Importación completada con éxito. ${response.insertados} clientes añadidos, ${response.actualizados} actualizados.`);
      } else {
        throw new Error(response.message || 'Error desconocido al importar clientes');
      }
    } catch (error) {
      console.error('Error en la importación:', error);
      setErrorMessage(error.message || 'Error al importar clientes. Por favor, inténtalo de nuevo.');
      toast.error('Error en la importación de clientes');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para volver a la gestión de clientes
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/clientes');
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Importar Clientes</h1>
      
      {/* Pasos de importación */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <p>Seleccionar archivo</p>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <p>Mapear columnas</p>
          </div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <p>Resultados</p>
          </div>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Paso 1: Seleccionar archivo */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Selecciona un archivo para importar</h2>
          
          <div className="mb-6">
            <p className="mb-4 text-gray-700">
              Formatos soportados: CSV, Excel (.xlsx, .xls) y JSON. 
              El archivo debe contener al menos una columna con los nombres de los clientes.
            </p>
            
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="mb-4">
                {fileFormat === 'csv' && <FaFileCsv className="text-4xl text-blue-500" />}
                {fileFormat === 'excel' && <FaFileExcel className="text-4xl text-green-500" />}
                {fileFormat === 'json' && <FaFileCode className="text-4xl text-orange-500" />}
                {!fileFormat && <FaUpload className="text-4xl text-gray-400" />}
              </div>
              
              <p className="text-gray-600 mb-4">
                {fileName || 'Arrastra un archivo aquí o haz clic para seleccionarlo'}
              </p>
              
              <label className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer">
                Seleccionar archivo
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls,.json,.txt" 
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              <FaArrowLeft className="inline mr-2" /> Volver
            </button>
            
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!fileName || isLoading}
            >
              {isLoading ? <FaSpinner className="inline mr-2 animate-spin" /> : <FaArrowRight className="inline mr-2" />}
              Continuar
            </button>
          </div>
        </div>
      )}
      
      {/* Paso 2: Mapear columnas */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Mapear columnas</h2>
          
          <div className="mb-6">
            <p className="mb-4 text-gray-700">
              Asigna cada columna del archivo a un campo del sistema. Las columnas han sido mapeadas automáticamente cuando ha sido posible.
              <strong> El campo Nombre es obligatorio.</strong>
            </p>
            
            {/* Vista previa de datos */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Vista previa</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      {availableFields.map((field, index) => (
                        <th key={index} className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {field}
                          {mappings[field] && (
                            <span className="ml-1 text-blue-600">
                              ({systemFields.find(f => f.id === mappings[field])?.label})
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {availableFields.map((field, fieldIndex) => (
                          <td key={fieldIndex} className="py-2 px-3 border-b border-gray-200 text-sm">
                            {row[field] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mapeo de columnas */}
            <div>
              <h3 className="text-lg font-medium mb-2">Asignar campos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFields.map((field, index) => (
                  <div key={index} className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {field}
                    </label>
                    <select
                      value={mappings[field] || ''}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">No mapear</option>
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
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              <FaArrowLeft className="inline mr-2" /> Volver
            </button>
            
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isLoading || !validateMappings()}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="inline mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <FaCheck className="inline mr-2" /> Importar
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Paso 3: Resultados */}
      {step === 3 && importResults && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resultados de la importación</h2>
          
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-around text-center mb-6">
              <div className="bg-green-100 rounded-lg p-4 mb-4 md:mb-0 md:mr-4 flex-1">
                <p className="text-3xl font-bold text-green-600">{importResults.insertados}</p>
                <p className="text-gray-700">Clientes añadidos</p>
              </div>
              
              <div className="bg-blue-100 rounded-lg p-4 mb-4 md:mb-0 md:mr-4 flex-1">
                <p className="text-3xl font-bold text-blue-600">{importResults.actualizados}</p>
                <p className="text-gray-700">Clientes actualizados</p>
              </div>
              
              <div className="bg-yellow-100 rounded-lg p-4 flex-1">
                <p className="text-3xl font-bold text-yellow-600">{importResults.errores || 0}</p>
                <p className="text-gray-700">Errores</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">
              La importación se ha completado {importResults.errores === 0 ? 'sin errores' : 'con algunos errores'}.
              {importResults.errores > 0 && ' Revisa los registros para ver más detalles.'}
            </p>
            
            {importResults.detalles && importResults.detalles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Detalles</h3>
                <ul className="list-disc pl-5">
                  {importResults.detalles.map((detalle, index) => (
                    <li key={index} className="text-gray-700 mb-1">{detalle}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate('/clientes')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              <FaArrowLeft className="inline mr-2" /> Volver a clientes
            </button>
            
            <button
              onClick={() => {
                setFile(null);
                setFileName('');
                setFileFormat('');
                setPreview([]);
                setAvailableFields([]);
                setMappings({});
                setImportResults(null);
                setErrorMessage('');
                setStep(1);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaUpload className="inline mr-2" /> Nueva importación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportarClientes;
