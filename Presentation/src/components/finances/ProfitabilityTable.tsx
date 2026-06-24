import { useState, useMemo, useEffect } from 'react';

interface ProductProfitability {
  id: number;
  nombre: string;
  categoria: 'Nutricional' | 'Cosmético';
  costo: number;
  precioVenta: number;
  gananciaNeta: number;
  margenPorcentaje: number;
}

interface ProfitabilityTableProps {
  products: ProductProfitability[];
}

type SortField = 'nombre' | 'costo' | 'precioVenta' | 'gananciaNeta' | 'margenPorcentaje';
type SortOrder = 'asc' | 'desc';

export default function ProfitabilityTable({ products }: ProfitabilityTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | 'Nutricional' | 'Cosmético'>('Todos');
  const [performanceFilter, setPerformanceFilter] = useState<'Todos' | 'Alto' | 'Bajo'>('Todos');
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInputVal, setPageInputVal] = useState('1');

  // Sincronizar input local con la página actual cuando cambia externamente
  useEffect(() => {
    setPageInputVal(currentPage.toString());
  }, [currentPage]);

  const formatCurrency = (val: number) =>
    `₡${val.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Resetear página a 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, performanceFilter, sortField, sortOrder, itemsPerPage]);

  // Filtrado y ordenamiento reactivo
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'Todos' || p.categoria === categoryFilter;
        const matchesPerformance =
          performanceFilter === 'Todos' ||
          (performanceFilter === 'Alto' && p.margenPorcentaje >= 35) ||
          (performanceFilter === 'Bajo' && p.margenPorcentaje < 35);
        return matchesSearch && matchesCategory && matchesPerformance;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        const numA = valA as number;
        const numB = valB as number;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      });
  }, [products, searchQuery, categoryFilter, performanceFilter, sortField, sortOrder]);

  // Paginación de los productos resultantes
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setPageInputVal('');
      return;
    }
    if (!/^\d+$/.test(val)) {
      return;
    }
    const pageNum = parseInt(val, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPageInputVal(val);
      setCurrentPage(pageNum);
    } else if (pageNum > totalPages) {
      setPageInputVal(totalPages.toString());
      setCurrentPage(totalPages);
    }
  };

  const handlePageInputBlur = () => {
    if (pageInputVal === '' || parseInt(pageInputVal, 10) === 0) {
      setPageInputVal(currentPage.toString());
    }
  };

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="text-purple-700 ml-1">↑</span> : <span className="text-purple-700 ml-1">↓</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6 animate-fade-in">
      {/* Encabezado de la Tabla */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Análisis de Rentabilidad por Producto</h3>
          <p className="text-xs text-gray-400">Filtra, busca y ordena los márgenes detallados de tu catálogo.</p>
        </div>
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full self-start md:self-center">
          {filteredAndSortedProducts.length} de {products.length} Productos Filtrados
        </span>
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="p-4 bg-white border-b border-gray-50 flex flex-wrap items-center gap-4">
        {/* Barra de Búsqueda */}
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro de Categoría */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Línea:</span>
          <select
            value={categoryFilter}
            onChange={(e: any) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-purple-500 transition-colors text-gray-700"
          >
            <option value="Todos">Todas las líneas</option>
            <option value="Nutricional">Nutricional</option>
            <option value="Cosmético">Cosmético</option>
          </select>
        </div>

        {/* Filtro de Rendimiento */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Rendimiento:</span>
          <select
            value={performanceFilter}
            onChange={(e: any) => setPerformanceFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-purple-500 transition-colors text-gray-700"
          >
            <option value="Todos">Todos los márgenes</option>
            <option value="Alto">Alto Margen (≥ 35%)</option>
            <option value="Bajo">Bajo Margen (&lt; 35%)</option>
          </select>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/20 select-none">
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleSort('nombre')}>
                Producto {renderSortIcon('nombre')}
              </th>
              <th className="px-5 py-3">Línea</th>
              <th className="px-5 py-3 text-right cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleSort('costo')}>
                Costo Promedio {renderSortIcon('costo')}
              </th>
              <th className="px-5 py-3 text-right cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleSort('precioVenta')}>
                Precio Venta {renderSortIcon('precioVenta')}
              </th>
              <th className="px-5 py-3 text-right cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleSort('gananciaNeta')}>
                Ganancia Neta {renderSortIcon('gananciaNeta')}
              </th>
              <th className="px-5 py-3 text-right cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleSort('margenPorcentaje')}>
                Margen {renderSortIcon('margenPorcentaje')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  Ningún producto coincide con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                let badgeColor = '';
                if (product.margenPorcentaje > 0) {
                  badgeColor = 'bg-green-50 text-green-700 border-green-200';
                } else if (product.margenPorcentaje < 0) {
                  badgeColor = 'bg-red-50 text-red-700 border-red-200';
                } else {
                  badgeColor = 'bg-gray-50 text-gray-500 border-gray-200';
                }

                return (
                  <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Nombre */}
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {product.nombre}
                    </td>

                    {/* Categoría */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${product.categoria === 'Nutricional'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        {product.categoria}
                      </span>
                    </td>

                    {/* Costo */}
                    <td className="px-5 py-3.5 text-right text-gray-500 font-mono">
                      {formatCurrency(product.costo)}
                    </td>

                    {/* Precio Venta */}
                    <td className="px-5 py-3.5 text-right text-gray-600 font-mono">
                      {formatCurrency(product.precioVenta)}
                    </td>

                    {/* Ganancia Neta */}
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900 font-mono">
                      {formatCurrency(product.gananciaNeta)}
                    </td>

                    {/* Margen Porcentaje */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                        {product.margenPorcentaje.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2.5 py-1 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>registros por página</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium transition-colors cursor-pointer disabled:cursor-not-allowed text-gray-700"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-200 rounded-xl text-gray-600 text-sm">
              <span>Pág.</span>
              <input
                type="text"
                value={pageInputVal}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                className="w-10 text-center font-bold text-gray-800 focus:outline-none"
                disabled={totalPages <= 1}
              />
              <span className="text-gray-400">/ {totalPages || 1}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium transition-colors cursor-pointer disabled:cursor-not-allowed text-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}