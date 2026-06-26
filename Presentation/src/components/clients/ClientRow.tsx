import type { Client } from '../../types';

interface Props {
  client: Client;
  onEdit: (client: Client) => void;
  onViewHistory: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ClientRow({ client, onEdit, onViewHistory, onDelete }: Props) {
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();

  return (
    <tr className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
      {/* Name + avatar */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-purple-700">{initials}</span>
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">
              {client.firstName} {client.lastName}
            </p>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                client.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {client.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{client.email}</p>
        <p className="text-xs text-gray-400">{client.phone}</p>
      </td>

      {/* Registered */}
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(client.registeredAt)}
      </td>

      {/* Purchases count */}
      <td className="px-4 py-3 text-sm text-center text-gray-600">
        {client.totalTransactions ?? client.transactions.length}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onEdit(client)}
            className="p-2 rounded-lg text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
            title="Editar cliente"
            aria-label={`Editar ${client.firstName}`}
          >
            {/* Pencil icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onViewHistory(client)}
            className="p-2 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
            title="Ver historial de compras"
            aria-label={`Ver historial de ${client.firstName}`}
          >
            {/* Eye icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(client)}
            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar cliente"
            aria-label={`Eliminar ${client.firstName}`}
          >
            {/* Trash icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
