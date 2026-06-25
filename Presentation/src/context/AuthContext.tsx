// ─── AuthContext ──────────────────────────────────────────────────────────────
// Provee el usuario autenticado y helpers de rol a toda la app.
//
// CONTRATO CON EL MÓDULO DE SEGURIDAD (compañero responsable de auth):
//   - Al hacer login  → guardar en localStorage la clave STORAGE_KEY con el
//     objeto AuthUser serializado como JSON.
//   - Al hacer logout → eliminar la clave STORAGE_KEY del localStorage.
//   - El contexto detecta cambios automáticamente vía StorageEvent.
//
// Roles (tabla Rol en BD):
//   IdRol 1 = Administrador
//   IdRol 2 = Cliente

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../types';

// Clave acordada con el módulo de seguridad para el localStorage
export const AUTH_STORAGE_KEY = 'omnilife_user';

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(readUserFromStorage);

  // Detecta cuando el módulo de seguridad escribe/borra el usuario en localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        try {
          setCurrentUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
        } catch {
          setCurrentUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAuthenticated = currentUser !== null;
  // DEV BYPASS: en desarrollo se tratan todas las rutas como admin hasta que
  // el módulo de Auth esté implementado. En producción usa el rol real.
  const isAdmin = import.meta.env.DEV ? true : currentUser?.idRol === 1;
  const isClient = import.meta.env.DEV ? true : currentUser?.idRol === 2;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
export type { AuthContextType };
