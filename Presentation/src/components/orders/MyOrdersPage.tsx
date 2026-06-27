import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMyOrders } from '../../hooks/useMyOrders';
import type { MyOrder } from '../../hooks/useMyOrders';
import OrderDetailModal from './OrderDetailModal';

const ESTADO_BADGE: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Pagado:    'bg-blue-100 text-blue-700',
  Enviado:   'bg-orange-100 text-orange-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-gray-100 text-gray-500',
};

function formatCRC(amount: number) {
  return '₡' + amount.toLocaleString('es-CR', { minimumFractionDigits: 2 });
}

export default function MyOrdersPage() {
  const { currentUser } = useAuth();
  const { orders, loading, error, fetchDetalle } = useMyOrders(currentUser?.idCliente);
  const [detailOrder, setDetailOrder] = useState<MyOrder | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Mis <span className="text-purple-700">Pedidos</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Aquí puedes ver el estado de todas tus compras.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-purple-700 font-medium animate-pulse">
          Cargando tus pedidos...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-medium">Todavía no tienes pedidos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Prods.</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.idPedido} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.numeroPedido}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(order.fechaPedido).toLocaleDateString('es-CR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[order.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                        {order.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{order.cantidadProductos}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {formatCRC(order.total)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="Ver detalle del pedido"
                        aria-label={`Ver detalle de ${order.numeroPedido}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        fetchDetalle={fetchDetalle}
      />
    </div>
  );
}
