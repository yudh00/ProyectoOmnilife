import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AUTH_STORAGE_KEY } from '../../context/AuthContext';
import type { AuthUser } from '../../types'; // Importación de tus tipos del index.ts

interface LoginFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginFormModal({ isOpen, onClose, onSwitchToRegister }: LoginFormModalProps) {
  const { refreshAuth } = useAuth(); // Hook nativo que lee tu contexto modificado
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Petición HTTP directa al Endpoint que registramos en server.js
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email, 
          password: password 
        }),
      });

      const jsonResponse = await response.json();

      if (!response.ok) {
        // Captura los errores controlados de tu AppError en Node (ej: "Credenciales incorrectas")
        throw new Error(jsonResponse.error || 'Error al iniciar sesión');
      }

      // 2. Extracción segura del DTO AuthUser tipado
      const authUserData = jsonResponse.data as AuthUser;

      // 3. Guardar en almacenamiento local respetando el contrato acordado con Seguridad
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUserData));

      // 4. Forzar la re-lectura del estado global en React para activar la barra responsive del Navbar
      refreshAuth();

      // 5. Limpieza exitosa del flujo
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      // Muestra en la alerta el error real enviado por las capas del Backend
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl relative animate-fade-in">
        
        {/* Botón Cerrar Modal */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-purple-700 text-center mb-6">Iniciar Sesión</h2>

        {/* Alerta dinámica de errores de autenticación o formato */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm text-gray-900"
              placeholder="ejemplo@omni.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm text-gray-900"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-700 text-white font-medium py-2.5 rounded-lg hover:bg-purple-800 transition-colors text-sm shadow-md disabled:bg-purple-400 font-semibold"
          >
            {isLoading ? 'Autenticando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿No tenés una cuenta?{' '}
          <button 
            onClick={onSwitchToRegister} 
            className="text-purple-700 font-semibold hover:underline"
            type="button"
          >
            Registrate aquí
          </button>
        </div>
      </div>
    </div>
  );
}