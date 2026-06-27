import { useState } from 'react';

interface PeriodFilterProps {
  onFilterChange: (fechaInicio: string, fechaFin: string) => void;
}

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PeriodFilter({ onFilterChange }: PeriodFilterProps) {
  const now = new Date();
  const [fechaInicio, setFechaInicio] = useState(
    localDate(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [fechaFin, setFechaFin] = useState(localDate());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(fechaInicio, fechaFin);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-4 mb-6">
      <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">Fecha Inicio</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">Fecha Fin</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-all active:scale-95"
      >
        Filtrar Datos
      </button>
    </form>
  );
}