import type { CartItem as CartItemType } from '../../types';
import CartItem from './CartItem';

interface CartSidebarProps {
  isOpen: boolean;
  items: CartItemType[];
  totalPrice: number;
  onClose: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onConfirmOrder: () => void;
}

export default function CartSidebar({
  isOpen,
  items,
  totalPrice,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmOrder,
}: CartSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mi Carrito"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100">
          <h2 className="text-lg font-bold text-gray-800">Mi Carrito</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 text-xl"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {/* Items list or empty state */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-12">
              <svg
                className="w-14 h-14 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
                />
              </svg>
              <p className="text-sm text-gray-400">Tu carrito está vacío</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {/* Totals */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-medium text-gray-700">
              ₡{totalPrice.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center font-bold text-base">
            <span className="text-gray-800">Total</span>
            <span className="text-purple-700">
              ₡{totalPrice.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action buttons */}
          <button
            onClick={onConfirmOrder}
            disabled={items.length === 0}
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Confirmar Orden
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 border border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
          >
            Seguir comprando
          </button>
        </div>
      </aside>
    </>
  );
}
