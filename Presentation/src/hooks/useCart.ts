import { useCallback, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import type { CartItem, Product } from '../types';

// Sin autenticación implementada se usa un cliente de demo.
// Reemplazar con el id del usuario autenticado cuando haya login.
const DEMO_CLIENT_ID = 1;

export interface OrderResult {
  numeroPedido: string;
  total: number;
  mensaje: string;
}

export interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  confirmOrder: () => Promise<OrderResult>;
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product) => {
    if (product.stock === 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(quantity, i.product.stock) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const confirmOrder = useCallback(async (): Promise<OrderResult> => {
    if (items.length === 0) throw new Error('El carrito está vacío');

    // Sincroniza cada item al carrito en la BD y obtiene el idCarrito
    let idCarrito: number | null = null;
    for (const item of items) {
      const res = await fetch(`${API_BASE_URL}/ventas/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCliente: DEMO_CLIENT_ID,
          idProducto: item.product.id,
          cantidad: item.quantity,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al sincronizar carrito');
      idCarrito = json.data.idcarrito;
    }

    // Crea el pedido desde el carrito en la BD
    const res = await fetch(`${API_BASE_URL}/ventas/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idCliente: DEMO_CLIENT_ID, idCarrito }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al confirmar pedido');

    clearCart();
    return {
      numeroPedido: json.data.numeroPedido,
      total: json.data.total,
      mensaje: json.data.mensaje,
    };
  }, [items, clearCart]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  return {
    items,
    totalItems,
    totalPrice,
    isOpen,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    confirmOrder,
  };
}
