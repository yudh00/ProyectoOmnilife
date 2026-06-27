// Presentation/src/components/finances/FinancesDashboard.tsx
import { useEffect, useState } from "react";
import { useFinances } from "../../hooks/useFinances";
import PeriodFilter from "./PeriodFilter";
import FinanceSummaryCards from "./FinanceSummaryCards";
import ProfitabilityTable from "./ProfitabilityTable";

export default function FinancesDashboard() {
  const { summary, productProfitability, loading, error, fetchFinances } = useFinances();

  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchFinances(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin, fetchFinances]);

  const handleFilterChange = (start: string, end: string) => {
    setFechaInicio(start);
    setFechaFin(end);
  };

  const formatCurrency = (val: number) =>
    `₡${val.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Resumen <span className="text-purple-700">Financiero</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Análisis de ingresos, egresos y rentabilidad comercial de la tienda.
        </p>
      </div>

      {/* Filtro de Periodo */}
      <PeriodFilter onFilterChange={handleFilterChange} />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-purple-700 font-medium animate-pulse">
          Calculando balances y flujos de caja...
        </div>
      ) : (
        <>
          {/* Tarjetas Principales (Ingresos, Gastos, Flujo) */}
          <FinanceSummaryCards data={summary} />

          {/* Grid de Estadísticas Adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">Ticket Promedio</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(summary.ticketPromedio)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">Margen Promedio</p>
              <p className="text-lg font-bold text-purple-700 mt-1">{summary.margenPromedio.toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">Pedidos Pagados</p>
              <p className="text-lg font-bold text-green-600 mt-1">{summary.pedidosCompletados}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">Pedidos Cancelados</p>
              <p className="text-lg font-bold text-red-500 mt-1">{summary.pedidosCancelados}</p>
            </div>
          </div>

          {/* Tabla de Rentabilidad */}
          <ProfitabilityTable products={productProfitability} />
        </>
      )}
    </div>
  );
}
