import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateStock: (productId: number, delta: number) => void;
  onEdit?: (productId: number) => void;
}

export default function ProductCard({ product, isAdmin, onAddToCart, onUpdateStock, onEdit }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Product image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-purple-700 text-[11px] font-semibold px-2 py-1 rounded-full border border-purple-100">
          {product.category === 'Nutricional' ? '● Nutricional' : '● Cosmético'}
        </span>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
              AGOTADO
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>

        <p className="text-purple-700 font-bold text-lg">
          ₡{product.price.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
        </p>

        {/* Lógica condicional: Admin vs Cliente */}
        {isAdmin ? (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
              <button
                onClick={() => onUpdateStock(product.id, -1)}
                className="w-10 h-10 flex items-center justify-center bg-white text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border shadow-sm"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-lg text-purple-700">
                {product.stock}
              </span>
              <button
                onClick={() => onUpdateStock(product.id, 1)}
                className="w-10 h-10 flex items-center justify-center bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors shadow-sm"
              >
                +
              </button>
            </div>
            <button
              onClick={() => onEdit?.(product.id)}
              className="w-full py-2 rounded-xl text-sm font-semibold border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            >
              Editar producto
            </button>
          </div>
        ) : (
          <button
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-700 text-white hover:bg-purple-800 active:scale-95'
            }`}
          >
            {isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
          </button>
        )}
      </div>
    </article>
  );
}