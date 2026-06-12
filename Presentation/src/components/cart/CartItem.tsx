import type { CartItem as CartItemType } from '../../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const subtotal = item.product.price * item.quantity;

  return (
    <li className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {/* Thumbnail */}
      <img
        src={item.product.imageUrl}
        alt={item.product.name}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
          {item.product.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{item.product.category}</p>

        <div className="flex items-center justify-between mt-2 gap-2">
          {/* Quantity stepper */}
          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
            <button
              onClick={() =>
                item.quantity === 1
                  ? onRemove(item.product.id)
                  : onUpdateQuantity(item.product.id, item.quantity - 1)
              }
              className="w-7 h-7 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-colors text-lg"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-7 text-center text-sm font-medium text-gray-700">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity + 1)
              }
              disabled={item.quantity >= item.product.stock}
              className="w-7 h-7 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-30 text-lg"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-bold text-purple-700 flex-shrink-0">
            ₡{subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.product.id)}
        className="self-start p-1 text-gray-300 hover:text-red-400 transition-colors"
        aria-label={`Eliminar ${item.product.name}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </li>
  );
}
