import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export interface Order {
  idPedido: number;
  numeroPedido: string;
  idCliente: number;
  nombreCliente: string;
  fechaPedido: string;
  estado: string;
  total: number;
  cantidadProductos: number;
}

export interface EstadoPedido {
  idestado: number;
  estado: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [estados, setEstados] = useState<EstadoPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/ventas/pedidos/admin`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar pedidos');
      const mapped: Order[] = (data.data as any[]).map((o) => ({
        idPedido:          o.idpedido,
        numeroPedido:      o.numeropedido,
        idCliente:         o.idcliente,
        nombreCliente:     o.nombrecliente || 'Cliente desconocido',
        fechaPedido:       o.fechapedido,
        estado:            o.estado,
        total:             parseFloat(o.total),
        cantidadProductos: parseInt(o.cantidadproductos, 10),
      }));
      setOrders(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ventas/estados-pedido`);
      const data = await res.json();
      if (data.ok) setEstados(data.data);
    } catch {}
  }, []);

  const updateEstado = useCallback(async (idPedido: number, idEstado: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/ventas/pedidos/${idPedido}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idEstado }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error al actualizar estado');
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
    fetchEstados();
  }, [fetchOrders, fetchEstados]);

  return { orders, estados, loading, error, updateEstado, refresh: fetchOrders };
}
