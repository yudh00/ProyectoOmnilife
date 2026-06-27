import { useState, useEffect } from 'react';
import { authApiService } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';
import { AUTH_STORAGE_KEY } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type RegisterFormData = {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
};

const EMPTY_FORM: RegisterFormData = {
  nombre: '',
  apellidos: '',
  email: '',
  password: '',
  confirmPassword: '',
  telefono: '',
};

const PHONE_REGEX = /^\d{8}$/;

export default function RegisterFormModal({ isOpen, onClose, onSwitchToLogin }: Props) {
  const { refreshAuth } = useAuth();
  const [form, setForm] = useState<RegisterFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    const e: Partial<RegisterFormData> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.apellidos.trim()) e.apellidos = 'El apellido es requerido';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (form.password.length < 6) e.password = 'Debe tener al menos 6 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!PHONE_REGEX.test(form.telefono.trim())) e.telefono = 'Debe tener exactamente 8 dígitos';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const newUser = await authApiService.register({
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email,
        password: form.password,
        telefono: form.telefono.trim(),
      });

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      refreshAuth();
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, email: err.message || 'Error al registrar' }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Crear Cuenta</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Juan"
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.nombre ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>

          {/* Apellidos */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Apellido</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={(e) => setForm(p => ({ ...p, apellidos: e.target.value }))}
              placeholder="Pérez García"
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.apellidos ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Correo electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="juan@correo.com"
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
              placeholder="8 dígitos"
              maxLength={8}
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.telefono ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Confirmar Contraseña</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repite tu contraseña"
              className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 font-medium text-center">
              ¡Registro exitoso! Iniciando sesión...
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3 border-t border-gray-100 mt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
            <p className="text-xs text-center text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={onSwitchToLogin} className="text-purple-700 font-semibold hover:underline">
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}