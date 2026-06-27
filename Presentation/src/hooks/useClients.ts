// Presentation/src/hooks/useClients.ts
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import type { Client, TransactionHistory } from "../types";

// El backend (clientes.service.js → mapearCliente) YA responde en el mismo
// formato que la interfaz `Client` del front (camelCase). A diferencia del
// módulo de catálogo, aquí no hace falta un adaptador snake_case → camelCase:
// el adaptador ya vive en el servidor.
interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive?: boolean;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // GET: Obtener clientes del backend (ya vienen adaptados a camelCase)
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Error al obtener los clientes del servidor");
      }
      if (!Array.isArray(data.data)) {
        throw new Error("Estructura de respuesta inválida.");
      }

      setClients(data.data as Client[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  // GET: Historial de compras de un cliente (la lista no trae el detalle)
  const fetchHistorial = useCallback(async (id: number): Promise<TransactionHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}/historial`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Error al obtener el historial del cliente");
    }
    return data.data as TransactionHistory[];
  }, []);

  // PUT: Actualizar cliente — mismo contrato camelCase que espera el controller
  const updateClient = useCallback(async (id: number, clientData: ClientFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          isActive: clientData.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Error al actualizar");

      await fetchClients();
    } catch (err) {
      console.error("Error en updateClient:", err);
      throw err;
    }
  }, [fetchClients]);

  // DELETE: Desactivar cliente (soft delete en el backend)
  const deleteClient = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Error al eliminar");

      await fetchClients();
    } catch (err) {
      console.error("Error en deleteClient:", err);
      throw err;
    }
  }, [fetchClients]);

  // Filtrado local en base al estado de búsqueda
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.firstName.toLowerCase().includes(query) ||
      c.lastName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    filteredClients,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    updateClient,
    deleteClient,
    fetchHistorial,
  };
}
