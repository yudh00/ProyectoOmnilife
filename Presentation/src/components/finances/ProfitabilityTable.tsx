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

export default function ProfitabilityTable({ products }: ProfitabilityTableProps) {
  const formatCurrency = (val: number) =>
    `₡${val.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6 animate-fade-in">
      {/* Encabezado de la Tabla */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Análisis de Rentabilidad por Producto</h3>
          <p className="text-xs text-gray-400">Margen detallado basado en costos de adquisición y precios de catálogo.</p>
        </div>
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full self-start sm:self-center">
          {products.length} Productos Evaluados
        </span>
      </div>

      {/* Contenedor con Scroll Horizontal Seguro para Móviles (Mobile-First) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/20">
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Línea</th>
              <th className="px-5 py-3 text-right">Costo Promedio</th>
              <th className="px-5 py-3 text-right">Precio Venta</th>
              <th className="px-5 py-3 text-right">Ganancia Neta</th>
              <th className="px-5 py-3 text-right">Margen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No hay datos de rentabilidad disponibles para este periodo.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                // Determinar el color del badge del margen según su rendimiento financiero
                const isHighMargin = product.margenPorcentaje >= 35;
                const badgeColor = isHighMargin 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Nombre */}
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {product.nombre}
                    </td>
                    
                    {/* Categoría */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        product.categoria === 'Nutricional' 
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
    </div>
  );
}