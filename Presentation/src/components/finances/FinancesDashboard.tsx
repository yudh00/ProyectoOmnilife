// Presentation/src/components/finances/FinancesDashboard.tsx
import { useEffect, useState } from "react";
import { useFinances } from "../../hooks/useFinances";

export default function FinancesDashboard() {
  const { summary, loading, error, fetchFinances } = useFinances();
  
  // Rango de fechas por defecto (primer día del mes actual hasta el día de hoy)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Ejecutar la consulta cada vez que las fechas cambien
  useEffect(() => {
    fetchFinances(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin, fetchFinances]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Resumen <span className="text-purple-700">Financiero</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Análisis de ingresos y rendimientos comerciales del periodo.
          </p>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm text-sm">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="focus:outline-none text-gray-700 px-2"
          />
          <span className="text-gray-300">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="focus:outline-none text-gray-700 px-2"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-purple-700 font-medium">
          Calculando balances y flujos de caja...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta Ingresos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Ingresos</p>
            <p className="text-2xl sm:text-3xl font-black text-green-600 mt-2">
              ₡{summary.ingresos.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Tarjeta Gastos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Egresos</p>
            <p className="text-2xl sm:text-3xl font-black text-red-500 mt-2">
              ₡{summary.gastos.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Tarjeta Utilidad Neta */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flujo de Caja Neto</p>
            <p className={`text-2xl sm:text-3xl font-black mt-2 ${summary.flujoNeto >= 0 ? "text-purple-700" : "text-amber-600"}`}>
              ₡{summary.flujoNeto.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}