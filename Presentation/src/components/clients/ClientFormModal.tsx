import { useEffect, useState } from 'react';
import type { Client } from '../../types';
import ConfirmDialog from '../ui/ConfirmDialog';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
};

interface Props {
  client: Client | null;   // null = create mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
}

const EMPTY: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  isActive: true,
};

export default function ClientFormModal({ client, isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(
        client
          ? {
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              phone: client.phone,
              isActive: client.isActive,
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = 'Campo requerido';
    if (!form.lastName.trim()) e.lastName = 'Campo requerido';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Correo inválido';
    if (!form.phone.trim()) e.phone = 'Campo requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (client) {
      setShowConfirm(true);
    } else {
      onSave(form);
    }
  }

  function handleConfirmed() {
    setShowConfirm(false);
    onSave(form);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg">
              {client ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors"
              aria-label="Cerrar"
            >
              &times;
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nombre"
                value={form.firstName}
                error={errors.firstName}
                onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
              />
              <Field
                label="Apellidos"
                value={form.lastName}
                error={errors.lastName}
                onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
              />
            </div>
            <Field
              label="Correo electrónico"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            />
            <Field
              label="Teléfono"
              type="tel"
              value={form.phone}
              error={errors.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            />
            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  form.isActive ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-600">
                Cliente {form.isActive ? 'activo' : 'inactivo'}
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirmar cambios"
        message="Esta accion modificara los datos del cliente. Desea continuar?"
        confirmLabel="Si, guardar"
        onConfirm={handleConfirmed}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

// ── Small reusable field ──────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
