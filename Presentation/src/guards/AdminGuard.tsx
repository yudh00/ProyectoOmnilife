// ─── AdminGuard ───────────────────────────────────────────────────────────────
// Renderiza `children` solo si el usuario autenticado tiene rol Administrador
// (IdRol = 1). Cualquier otro rol o sesión no iniciada ve el `fallback`.

import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminGuard({ children, fallback = <AccessDenied /> }: AdminGuardProps) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

function AccessDenied() {
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
          d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7a4 4 0 00-8 0v4H3a1 1 0 00-1 1v7a1 1 0 001 1h14a1 1 0 001-1v-7a1 1 0 00-1-1h-1z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-700 mb-1">Acceso restringido</h2>
      <p className="text-sm text-gray-400">Esta sección es solo para administradores.</p>
    </div>
  );
}
