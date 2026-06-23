import type { ProductCategory } from '../../types';

interface FilterBarProps {
  activeCategory: ProductCategory | 'Todos';
  onCategoryChange: (category: ProductCategory | 'Todos') => void;
}

const CATEGORIES: Array<ProductCategory | 'Todos'> = [
  'Todos',
  'Nutricional',
  'Cosmético',
];

export default function FilterBar({
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeCategory === cat
              ? 'bg-purple-700 text-white border-purple-700'
              : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
          }`}
        >
          {cat === 'Todos' ? 'Todos los productos' : cat === 'Nutricional' ? 'Nutricionales OMNILIFE' : 'Cosméticos SEYTÚ'}
        </button>
      ))}
    </div>
  );
}
