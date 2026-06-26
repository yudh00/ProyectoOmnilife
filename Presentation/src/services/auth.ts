// Presentation/src/services/auth.ts
import type { AuthUser, LoginCredentials, RegisterCredentials } from '../types';

const API_BASE_URL = 'http://localhost:3000/api'; 

export const authApiService = {
  /**
   * Envía las credenciales al backend para autenticar al usuario
   */
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al iniciar sesión');
    }

    const jsonResponse = await response.json();
    return jsonResponse.data;
  },

  /**
   * Registra un nuevo usuario cliente en la base de datos
   */
  register: async (data: RegisterCredentials): Promise<AuthUser> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar usuario');
    }

    const jsonResponse = await response.json();
    return jsonResponse.data;
  },
};