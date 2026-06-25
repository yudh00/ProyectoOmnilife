// ─── ClientGuard ─────────────────────────────────────────────────────────────
// Renderiza `children` solo si el usuario autenticado tiene rol Cliente
// (IdRol = 2). Cualquier otro rol o sesión no iniciada ve el `fallback`.

import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ClientGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ClientGuard({ children, fallback = <ClientOnly /> }: ClientGuardProps) {
  const { isClient } = useAuth();
  return isClient ? <>{children}</> : <>{fallback}</>;
}

function ClientOnly() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <svg
        className="w-16 h-16 text-purple-200 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-700 mb-1">Solo para clientes</h2>
      <p className="text-sm text-gray-400">Inicia sesión con una cuenta de cliente para acceder.</p>
    </div>
  );
}
