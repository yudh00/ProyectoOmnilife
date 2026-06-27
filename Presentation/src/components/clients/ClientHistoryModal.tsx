import { useEffect, useState } from 'react';
import type { Client, TransactionHistory } from '../../types';

interface Props {
  client: Client | null;
  onClose: () => void;
  fetchHistorial: (id: number) => Promise<TransactionHistory[]>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCRC(amount: number) {
  return '\u20a1' + amount.toLocaleString('es-CR', { minimumFractionDigits: 2 });
}

function estadoBadgeClasses(estado: string) {
  switch (estado) {
    case 'Entregado':
      return 'text-green-700 bg-green-50';
    case 'Enviado':
      return 'text-blue-700 bg-blue-50';
    default: // Pagado
      return 'text-purple-600 bg-purple-50';
  }
}

export default function ClientHistoryModal({ client, onClose, fetchHistorial }: Props) {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    fetchHistorial(client.id)
      .then(setTransactions)
      .catch((err) => setError(err.message || 'No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, [client, fetchHistorial]);

  if (!client) return null;

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              Historial de compras
            </h2>
            <p className="text-sm text-gray-400">
              {client.firstName} {client.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-purple-700 text-sm animate-pulse">
              Cargando historial...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm">{error}</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Este cliente no tiene compras registradas.
            </div>
          ) : (
            sorted.map((tx) => (
              <div key={tx.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      Orden #{tx.id}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoBadgeClasses(tx.estado)}`}>
                      {tx.estado}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(tx.date)}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                      <th className="pb-1 font-medium">Producto</th>
                      <th className="pb-1 font-medium text-center w-14">Cant.</th>
                      <th className="pb-1 font-medium text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-700">{item.productName}</td>
                        <td className="py-1.5 text-center text-gray-500">{item.quantity}</td>
                        <td className="py-1.5 text-right text-gray-700">
                          {formatCRC(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-3 pt-2 border-t border-gray-100">
                  <span className="font-bold text-purple-700 text-sm">
                    Total: {formatCRC(tx.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
