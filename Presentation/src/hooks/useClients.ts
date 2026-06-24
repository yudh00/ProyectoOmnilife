// Presentation/src/hooks/useClients.ts
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import type { Client } from "../types";

// Interfaz que describe exactamente cómo viene el JSON desde PostgreSQL / Express
interface BackendClient {
  id_cliente: number;
  nombre: string;
  correo: string;
  telefono?: string;
  fecha_registro?: string;
  is_active?: boolean | number;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // GET: Obtener y adaptar los clientes del Backend
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (!response.ok) throw new Error("Error al obtener los clientes del servidor");
      
      const data = await response.json();
      
      if (data.ok && Array.isArray(data.data)) {
        // PATRÓN ADAPTADOR: Transformamos snake_case del backend a camelCase del frontend
        const adaptedClients: Client[] = data.data.map((bc: BackendClient) => {
          // Separamos el nombre completo si es posible para firstName y lastName
          const partesNombre = bc.nombre ? bc.nombre.trim().split(" ") : ["", ""];
          const firstName = partesNombre[0] || "";
          const lastName = partesNombre.slice(1).join(" ") || "";

          return {
            id: bc.id_cliente,
            firstName: firstName,
            lastName: lastName,
            email: bc.correo,
            phone: bc.telefono || "",
            isActive: bc.is_active !== undefined ? Boolean(bc.is_active) : true,
            createdAt: bc.fecha_registro || new Date().toISOString(),
            purchaseCount: 0 // Puedes conectarlo dinámicamente si tu backend lo provee
          };
        });

        setClients(adaptedClients);
      } else {
        throw new Error(data.error || "Estructura de respuesta inválida.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  // POST: Crear cliente adaptando los datos hacia el backend
  const addClient = useCallback(async (clientData: Omit<Client, "id">) => {
    try {
      const backendBody = {
        nombre: `${clientData.firstName} ${clientData.lastName}`.trim(),
        correo: clientData.email,
        telefono: clientData.phone,
        is_active: clientData.isActive
      };

      const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendBody),
      });
      
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Error al insertar");
      
      await fetchClients();
    } catch (err) {
      console.error("Error en addClient:", err);
    }
  }, [fetchClients]);

  // PUT: Actualizar cliente adaptando los datos
  const updateClient = useCallback(async (id: number, clientData: Partial<Client>) => {
    try {
      const backendBody = {
        nombre: clientData.firstName && clientData.lastName ? `${clientData.firstName} ${clientData.lastName}`.trim() : undefined,
        correo: clientData.email,
        telefono: clientData.phone,
        is_active: clientData.isActive
      };

      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendBody),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Error al actualizar");

      await fetchClients();
    } catch (err) {
      console.error("Error en updateClient:", err);
    }
  }, [fetchClients]);

  // DELETE: Eliminar cliente
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
    addClient,
    updateClient,
    deleteClient
  };
}