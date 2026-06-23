import { useState, useCallback } from 'react';
import type { Client } from '../../types';
import { useClients } from '../../hooks/useClients';
import ClientFormModal from './ClientFormModal';
import ClientHistoryModal from './ClientHistoryModal';
import ClientRow from './ClientRow';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';
import type { ToastMessage } from '../ui/Toast';

const PAGE_SIZE = 8;
let toastId = 0;

export default function ClientTable() {
  const { filteredClients, searchQuery, setSearchQuery, addClient, updateClient, deleteClient } =
    useClients();

  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageClients = filteredClients.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleEdit(client: Client) {
    setEditTarget(client);
    setFormOpen(true);
  }

  function handleNew() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleSave(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
  }) {
    if (editTarget) {
      updateClient(editTarget.id, data);
      showToast('Cliente editado exitosamente');
    } else {
      addClient(data);
      showToast('Cliente creado exitosamente');
    }
    setFormOpen(false);
  }

  function handleDeleteConfirmed() {
    if (deleteTarget) {
      deleteClient(deleteTarget.id);
      showToast('Cliente eliminado exitosamente', 'success');
      setDeleteTarget(null);
    }
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
          />
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-purple-800 transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de registro</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Compras</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                pageClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onEdit={handleEdit}
                    onViewHistory={setHistoryClient}
                    onDelete={setDeleteTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count + pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs text-gray-400">
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
          </span>

          {totalPages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Paginación">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                &lsaquo; Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                    n === safePage
                      ? 'bg-purple-700 text-white border-purple-700 font-semibold'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente &rsaquo;
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Modals */}
      <ClientFormModal
        isOpen={formOpen}
        client={editTarget}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <ClientHistoryModal
        client={historyClient}
        onClose={() => setHistoryClient(null)}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar cliente"
        message={deleteTarget ? `Esta accion eliminara permanentemente a ${deleteTarget.firstName} ${deleteTarget.lastName}. Desea continuar?` : ''}
        confirmLabel="Si, eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
