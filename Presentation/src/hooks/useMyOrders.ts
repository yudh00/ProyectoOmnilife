import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import type { OrderDetail } from './useOrders';

export interface MyOrder {
  idPedido: number;
  numeroPedido: string;
  fechaPedido: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  cantidadProductos: number;
}

export function useMyOrders(idCliente: number | null | undefined) {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!idCliente) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/ventas/pedidos/cliente/${idCliente}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar tus pedidos');

      const mapped: MyOrder[] = (data.data as any[]).map((o) => ({
        idPedido: o.idpedido,
        numeroPedido: o.numeropedido,
        fechaPedido: o.fechapedido,
        estado: o.estado,
        subtotal: parseFloat(o.subtotal),
        impuestos: parseFloat(o.impuestos),
        total: parseFloat(o.total),
        cantidadProductos: parseInt(o.cantidadproductos, 10),
      }));
      setOrders(mapped);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  }, [idCliente]);

  // El detalle completo (líneas con producto/cantidad/precio) solo se pide
  // bajo demanda — el listado no lo incluye.
  const fetchDetalle = useCallback(async (idPedido: number): Promise<OrderDetail> => {
    const res = await fetch(`${API_BASE_URL}/ventas/pedidos/${idPedido}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar el detalle del pedido');
    return data.data as OrderDetail;
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, fetchDetalle, refresh: fetchOrders };
}
