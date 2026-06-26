import type { Product } from '../../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isAdmin: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateStock: (productId: number, delta: number) => void;
  onEdit?: (productId: number) => void;
}

export default function ProductGrid({
  products,
  isAdmin,
  onAddToCart,
  onUpdateStock,
  onEdit,
}: ProductGridProps) {
  
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-sm">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isAdmin={isAdmin}
          onAddToCart={onAddToCart}
          onUpdateStock={onUpdateStock}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}