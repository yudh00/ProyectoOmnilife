import { useCallback, useMemo, useState } from 'react';
import { MOCK_CLIENTS } from '../types';
import type { Client } from '../types';

export interface UseClientsReturn {
  clients: Client[];
  filteredClients: Client[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addClient: (data: Omit<Client, 'id' | 'registeredAt' | 'transactions'>) => void;
  updateClient: (id: number, data: Partial<Omit<Client, 'id' | 'registeredAt' | 'transactions'>>) => void;
  deleteClient: (id: number) => void;
  getClientById: (id: number) => Client | undefined;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [clients, searchQuery]);

  const addClient = useCallback(
    (data: Omit<Client, 'id' | 'registeredAt' | 'transactions'>) => {
      setClients((prev) => [
        ...prev,
        {
          ...data,
          id: Date.now(),
          registeredAt: new Date().toISOString(),
          transactions: [],
        },
      ]);
    },
    []
  );

  const updateClient = useCallback(
    (id: number, data: Partial<Omit<Client, 'id' | 'registeredAt' | 'transactions'>>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    },
    []
  );

  const getClientById = useCallback(
    (id: number) => clients.find((c) => c.id === id),
    [clients]
  );

  const deleteClient = useCallback((id: number) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    clients,
    filteredClients,
    searchQuery,
    setSearchQuery,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
  };
}
