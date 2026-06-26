// Presentation/src/context/AuthContext.tsx
import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../types';

export const AUTH_STORAGE_KEY = 'omnilife_user';

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  refreshAuth: () => void;
  logout: () => void; 
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

  const refreshAuth = () => {
    setCurrentUser(readUserFromStorage());
  };

  // Función explícita para destruir la sesión localmente
  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY); // Cumple el contrato eliminando la clave
    setCurrentUser(null); // Actualiza el estado inmediatamente en la pestaña actual
  };

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
  const isAdmin = isAuthenticated && currentUser?.idRol === 1;
  const isClient = isAuthenticated && currentUser?.idRol === 2;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, isClient, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
export type { AuthContextType };