import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
        {/* Category badge */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-purple-700 text-[11px] font-semibold px-2 py-1 rounded-full border border-purple-100">
          {product.category === 'Nutricional' ? '● Nutricional' : '● Cosmético'}
        </span>
        {/* Out-of-stock overlay */}
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
        <p className="text-xs text-gray-500 line-clamp-2 flex-1">
          {product.description}
        </p>
        <p className="text-purple-700 font-bold text-lg">
          ₡{product.price.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
        </p>

        {/* Add to cart button */}
        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          aria-disabled={isOutOfStock}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isOutOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-700 text-white hover:bg-purple-800 active:scale-95 focus:ring-purple-400'
          }`}
        >
          {isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
        </button>
      </div>
    </article>
  );
}
