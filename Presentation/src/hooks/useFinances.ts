// Presentation/src/hooks/useFinances.ts
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../config/api";

export interface FinanceSummary {
  ingresos: number;
  gastos: number;
  flujoNeto: number;
}

export function useFinances() {
  const [summary, setSummary] = useState<FinanceSummary>({ ingresos: 0, gastos: 0, flujoNeto: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinances = useCallback(async (fechaInicio: string, fechaFin: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/financiero/ingresos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      if (!response.ok) throw new Error("Error al obtener los balances financieros");
      
      const data = await response.json();
      
      if (data.ok) {
        // Extraemos las sumas de los procedimientos almacenados de tu bd
        const totalIngresos = parseFloat(data.total_ingresos || data.data?.total_ingresos || 0);
        const totalGastos = parseFloat(data.total_gastos || data.data?.total_gastos || 0);
        
        setSummary({
          ingresos: totalIngresos,
          gastos: totalGastos,
          flujoNeto: totalIngresos - totalGastos
        });
      } else {
        throw new Error(data.error || "Error en la consulta financiera");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error financiero inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, fetchFinances };
}