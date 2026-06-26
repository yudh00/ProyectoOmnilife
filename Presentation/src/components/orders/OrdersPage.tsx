import { useMemo, useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../hooks/useOrders';

const ESTADO_BADGE: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Pagado:    'bg-blue-100 text-blue-700',
  Enviado:   'bg-orange-100 text-orange-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-gray-100 text-gray-500',
};

const NEXT_ESTADOS: Record<string, string[]> = {
  Pendiente: ['Pagado', 'Cancelado'],
  Pagado:    ['Enviado', 'Cancelado'],
  Enviado:   ['Entregado'],
};

const BTN_STYLE: Record<string, string> = {
  Pagado:    'bg-blue-600 hover:bg-blue-700 text-white',
  Enviado:   'bg-orange-500 hover:bg-orange-600 text-white',
  Entregado: 'bg-green-600 hover:bg-green-700 text-white',
  Cancelado: 'border border-red-300 text-red-500 hover:bg-red-50',
};

const ALL_ESTADOS = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];

interface ClientGroup {
  idCliente: number;
  nombreCliente: string;
  orders: Order[];
  totalValue: number;
}

export default function OrdersPage() {
  const { orders, estados, loading, error, updateEstado, refresh } = useOrders();
  const [filterEstado, setFilterEstado]   = useState('Todos');
  const [filterCliente, setFilterCliente] = useState('');
  const [updating, setUpdating]           = useState<number | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpdate(idPedido: number, estadoName: string) {
    const est = estados.find((e) => e.estado === estadoName);
    if (!est) return;
    setUpdating(idPedido);
    try {
      await updateEstado(idPedido, est.idestado);
      showToast(`Pedido actualizado a "${estadoName}"`);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setUpdating(null);
    }
  }

  const groups = useMemo<ClientGroup[]>(() => {
    const filtered = orders.filter((o) => {
      const matchEstado   = filterEstado === 'Todos' || o.estado === filterEstado;
      const matchCliente  = o.nombreCliente.toLowerCase().includes(filterCliente.toLowerCase().trim());
      return matchEstado && matchCliente;
    });

    const map = new Map<number, ClientGroup>();
    for (const o of filtered) {
      if (!map.has(o.idCliente)) {
        map.set(o.idCliente, { idCliente: o.idCliente, nombreCliente: o.nombreCliente, orders: [], totalValue: 0 });
      }
      const g = map.get(o.idCliente)!;
      g.orders.push(o);
      g.totalValue += o.total;
    }

    return Array.from(map.values())
      .map((g) => ({
        ...g,
        orders: [...g.orders].sort(
          (a, b) => new Date(a.fechaPedido + 'T12:00:00').getTime() - new Date(b.fechaPedido + 'T12:00:00').getTime()
        ),
      }))
      .sort(
        (a, b) => new Date(a.orders[0].fechaPedido + 'T12:00:00').getTime() - new Date(b.orders[0].fechaPedido + 'T12:00:00').getTime()
      );
  }, [orders, filterEstado, filterCliente]);

  const estadoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.estado] = (counts[o.estado] ?? 0) + 1;
    return counts;
  }, [orders]);

  const totalVisible = groups.reduce((s, g) => s + g.orders.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de <span className="text-purple-700">Pedidos</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalVisible} pedido{totalVisible !== 1 ? 's' : ''} encontrado{totalVisible !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Chips de conteo por estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_ESTADOS.filter((e) => estadoCounts[e]).map((e) => (
          <button
            key={e}
            onClick={() => setFilterEstado(filterEstado === e ? 'Todos' : e)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all
              ${ESTADO_BADGE[e]}
              ${filterEstado === e ? 'ring-2 ring-offset-1 ring-purple-400' : 'opacity-80 hover:opacity-100'}`}
          >
            {e}: {estadoCounts[e]}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filtro 1: estado */}
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:border-purple-400 focus:ring-purple-200"
        >
          <option value="Todos">Todos los estados</option>
          {ALL_ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        {/* Filtro 2: nombre de cliente */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:border-purple-400 focus:ring-purple-200"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {/* Cargando */}
      {loading && !orders.length && (
        <div className="py-20 text-center text-purple-700 font-medium animate-pulse">Cargando pedidos...</div>
      )}

      {/* Sin resultados */}
      {!loading && groups.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-medium">No hay pedidos con esos filtros.</p>
        </div>
      )}

      {/* Grupos por cliente */}
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.idCliente} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Cabecera de cliente */}
            <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 border-b border-purple-100">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {group.nombreCliente.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 font-semibold text-gray-800 text-sm truncate">{group.nombreCliente}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-semibold text-purple-700 flex-shrink-0">
                ₡{group.totalValue.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Tabla de pedidos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-2 text-left font-medium">Pedido</th>
                    <th className="px-4 py-2 text-left font-medium">Fecha</th>
                    <th className="px-4 py-2 text-left font-medium">Estado</th>
                    <th className="px-4 py-2 text-right font-medium">Prods.</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                    <th className="px-5 py-2 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {group.orders.map((order) => {
                    const nexts      = NEXT_ESTADOS[order.estado] ?? [];
                    const isUpdating = updating === order.idPedido;
                    return (
                      <tr key={order.idPedido} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.numeroPedido}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(order.fechaPedido + 'T12:00:00').toLocaleDateString('es-CR', {
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
                          ₡{order.total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {isUpdating ? (
                              <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
                            ) : nexts.map((next) => (
                              <button
                                key={next}
                                onClick={() => handleUpdate(order.idPedido, next)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${BTN_STYLE[next]}`}
                              >
                                {next}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 text-white transition-all
          ${toast.ok ? 'bg-gray-800' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
