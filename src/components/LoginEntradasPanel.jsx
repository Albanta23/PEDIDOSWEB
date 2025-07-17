import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Lock, User, Shield, Eye, EyeOff, XCircle } from 'lucide-react';

const LoginEntradasPanel = ({ onLogin, onClose }) => {
  const [tipoUsuario, setTipoUsuario] = useState('usuario');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // Validar credenciales
    const credencialesValidas =
      (tipoUsuario === 'usuario' && clave === 'usuario') ||
      (tipoUsuario === 'administrador' && clave === 'administrador');

    if (credencialesValidas) {
      // Simular tiempo de carga para dar sensación de autenticación real
      setTimeout(() => {
        onLogin(tipoUsuario);
        setCargando(false);
      }, 800);
    } else {
      setTimeout(() => {
        setError('Credenciales incorrectas. Verifique el tipo de usuario y la clave.');
        setCargando(false);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center">
                <Lock className="mr-2 h-6 w-6 text-blue-600" />
                Acceso a Gestión de Entradas
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Ingrese sus credenciales para acceder al panel de gestión de entradas
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de tipo de usuario */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Usuario
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoUsuario('usuario')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                    tipoUsuario === 'usuario'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setTipoUsuario('administrador')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                    tipoUsuario === 'administrador'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Administrador
                </button>
              </div>
            </div>

            {/* Campo de clave */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Clave de Acceso
              </label>
              <div className="relative">
                <input
                  type={mostrarClave ? 'text' : 'password'}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder={`Ingrese la clave para ${tipoUsuario}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarClave ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {tipoUsuario === 'usuario' ? (
                  <span>💡 Clave: "usuario"</span>
                ) : (
                  <span>🔑 Clave: "administrador"</span>
                )}
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Botón de login */}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold"
              disabled={cargando || !clave}
              variant={tipoUsuario === 'administrador' ? 'premium' : 'default'}
            >
              {cargando ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {tipoUsuario === 'usuario' ? (
                    <User className="mr-2 h-5 w-5" />
                  ) : (
                    <Shield className="mr-2 h-5 w-5" />
                  )}
                  Acceder como {tipoUsuario === 'usuario' ? 'Usuario' : 'Administrador'}
                </div>
              )}
            </Button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Usuario:</strong> Acceso completo al sistema</p>
              <p><strong>Administrador:</strong> Acceso completo con badge identificativo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginEntradasPanel;
