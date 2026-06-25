// Presentation/src/hooks/useFinances.ts
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../config/api";

export interface FinanceSummary {
  ingresos: number;
  gastos: number;
  flujoNeto: number;
  ticketPromedio: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
  gastoPromedioPedido: number;
  rentabilidadPromedio: number;
  margenPromedio: number;
}

export interface ProductProfitability {
  id: number;
  nombre: string;
  categoria: 'Nutricional' | 'Cosmético';
  costo: number;
  precioVenta: number;
  gananciaNeta: number;
  margenPorcentaje: number;
}

export function useFinances() {
  const [summary, setSummary] = useState<FinanceSummary>({
    ingresos: 0,
    gastos: 0,
    flujoNeto: 0,
    ticketPromedio: 0,
    pedidosCompletados: 0,
    pedidosCancelados: 0,
    gastoPromedioPedido: 0,
    rentabilidadPromedio: 0,
    margenPromedio: 0,
  });
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinances = useCallback(async (fechaInicio: string, fechaFin: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener flujo de caja y estadísticas en paralelo
      const [resFlujo, resEstadisticas, resCatalogo] = await Promise.all([
        fetch(`${API_BASE_URL}/financiero/flujo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        fetch(`${API_BASE_URL}/financiero/estadisticas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        fetch(`${API_BASE_URL}/ventas/catalogo`),
      ]);

      if (!resFlujo.ok || !resEstadisticas.ok || !resCatalogo.ok) {
        throw new Error("Error al comunicarse con los servicios financieros o de catálogo");
      }

      const [dataFlujo, dataEstadisticas, dataCatalogo] = await Promise.all([
        resFlujo.json(),
        resEstadisticas.json(),
        resCatalogo.json(),
      ]);

      if (!dataFlujo.ok || !dataEstadisticas.ok) {
        throw new Error(dataFlujo.error || dataEstadisticas.error || "Error en consulta financiera");
      }

      // Consolidar datos de flujo y estadísticas
      const f = dataFlujo.data || {};
      const s = dataEstadisticas.data || {};

      setSummary({
        ingresos: parseFloat(f.totalIngresos || f.totalingresos || 0),
        gastos: parseFloat(f.totalEgresos || f.totalegresos || 0),
        flujoNeto: parseFloat(f.flujoCajaNeto || f.flujocajaneto || 0),
        ticketPromedio: parseFloat(s.ticketPromedio || s.ticketpromedio || 0),
        pedidosCompletados: parseInt(s.pedidosCompletados || s.pedidoscompletados || 0, 10),
        pedidosCancelados: parseInt(s.pedidosCancelados || s.pedidoscancelados || 0, 10),
        gastoPromedioPedido: parseFloat(s.gastoPromedioPorPedido || s.gastopromedioporpedido || 0),
        rentabilidadPromedio: parseFloat(s.rentabilidadPromedioProductos || s.rentabilidadpromedioproductos || 0),
        margenPromedio: parseFloat(s.margenPromedioPorcentual || s.margenpromedioporcentual || 0),
      });

      // 2. Obtener rentabilidad por cada producto del catálogo en paralelo
      if (dataCatalogo.ok && Array.isArray(dataCatalogo.data)) {
        const prodRentPromises = dataCatalogo.data.map(async (p: any) => {
          try {
            const resRent = await fetch(`${API_BASE_URL}/financiero/producto/${p.id_producto}/rentabilidad`);
            if (resRent.ok) {
              const rentJson = await resRent.json();
              if (rentJson.ok && rentJson.data) {
                const r = rentJson.data;
                const catParsed = p.categoria && (p.categoria.includes("Cosmético") || p.categoria.includes("Cosmetico"))
                  ? "Cosmético"
                  : "Nutricional";
                return {
                  id: p.id_producto,
                  nombre: p.nombre,
                  categoria: catParsed as 'Nutricional' | 'Cosmético',
                  costo: parseFloat(r.costoAdquisicion || r.costoadquisicion || 0),
                  precioVenta: parseFloat(r.precioVenta || r.precioventaproducto || 0),
                  gananciaNeta: parseFloat(r.rentabilidadUnitaria || r.rentabilidadunitaria || 0),
                  margenPorcentaje: parseFloat(r.margenPorcentual || r.margenporcentual || 0),
                };
              }
            }
          } catch (err) {
            console.warn(`No se pudo obtener rentabilidad para el producto ${p.id_producto}:`, err);
          }
          return null;
        });

        const rentResults = await Promise.all(prodRentPromises);
        setProductProfitability(rentResults.filter(Boolean) as ProductProfitability[]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error financiero inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, productProfitability, loading, error, fetchFinances };
}