import { useEffect, useState } from 'react';
import type { OrderDetail } from '../../hooks/useOrders';

interface OrderSummary {
  idPedido: number;
  numeroPedido: string;
  nombreCliente?: string;
}

interface Props {
  order: OrderSummary | null;
  onClose: () => void;
  fetchDetalle: (idPedido: number) => Promise<OrderDetail>;
}

const ESTADO_BADGE: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Pagado:    'bg-blue-100 text-blue-700',
  Enviado:   'bg-orange-100 text-orange-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-gray-100 text-gray-500',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCRC(amount: number) {
  return '₡' + amount.toLocaleString('es-CR', { minimumFractionDigits: 2 });
}

export default function OrderDetailModal({ order, onClose, fetchDetalle }: Props) {
  const [detalle, setDetalle] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    setDetalle(null);
    setLoading(true);
    setError(null);
    fetchDetalle(order.idPedido)
      .then(setDetalle)
      .catch((err) => setError(err.message || 'No se pudo cargar el detalle del pedido'))
      .finally(() => setLoading(false));
  }, [order, fetchDetalle]);

  if (!order) return null;

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
              Pedido {order.numeroPedido}
            </h2>
            {order.nombreCliente && (
              <p className="text-sm text-gray-400">{order.nombreCliente}</p>
            )}
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
              Cargando detalle del pedido...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm">{error}</div>
          ) : detalle ? (
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[detalle.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                  {detalle.estado}
                </span>
                <span className="text-xs text-gray-400">{formatDate(detalle.fechaPedido)}</span>
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
                  {detalle.lineas.map((linea) => (
                    <tr key={linea.idProducto} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 text-gray-700">{linea.nombreProducto}</td>
                      <td className="py-1.5 text-center text-gray-500">{linea.cantidad}</td>
                      <td className="py-1.5 text-right text-gray-700">
                        {formatCRC(linea.subtotalLinea)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col items-end gap-0.5 mt-3 pt-2 border-t border-gray-100 text-sm">
                <span className="text-gray-500">Subtotal: {formatCRC(detalle.subtotal)}</span>
                <span className="text-gray-500">Impuestos: {formatCRC(detalle.impuestos)}</span>
                <span className="font-bold text-purple-700">Total: {formatCRC(detalle.total)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
