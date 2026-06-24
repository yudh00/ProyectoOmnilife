interface SummaryData {
  ingresos: number;
  gastos: number;
  flujoNeto: number;
}

interface FinanceSummaryCardsProps {
  data: SummaryData;
}

export default function FinanceSummaryCards({ data }: FinanceSummaryCardsProps) {
  const formatCurrency = (val: number) =>
    `₡${val.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Ingresos */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Ingresos</span>
        <span className="text-2xl font-black text-green-600">{formatCurrency(data.ingresos)}</span>
      </div>

      {/* Gastos */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Gastos</span>
        <span className="text-2xl font-black text-red-500">{formatCurrency(data.gastos)}</span>
      </div>

      {/* Flujo Neto */}
      <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-1 bg-gradient-to-br from-purple-50/30 to-white">
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Flujo de Caja Neto</span>
        <span className={`text-2xl font-black ${data.flujoNeto >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
          {formatCurrency(data.flujoNeto)}
        </span>
      </div>
    </div>
  );
}