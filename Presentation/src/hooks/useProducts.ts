// Presentation/src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import type { Product, ProductCategory } from "../types";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=500";

interface BackendProduct {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
  categoria: string;
  stock: number;
}

function parseCategory(raw: string): ProductCategory {
  const first = raw.split(",")[0].trim();
  if (first === "Cosmético" || first === "Cosmetico") return "Cosmético";
  return "Nutricional";
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ventas/catalogo`);
      if (!response.ok) throw new Error("Error al comunicarse con el servidor");

      const data = await response.json();

      if (data.ok && Array.isArray(data.data)) {
        const adaptedProducts: Product[] = data.data.map((p: BackendProduct) => ({
          id: p.id_producto,
          name: p.nombre,
          description: p.descripcion,
          price: p.precio,
          imageUrl: p.imagen_url || FALLBACK_IMAGE,
          category: parseCategory(p.categoria),
          stock: p.stock,
        }));
        setProducts(adaptedProducts);
      } else {
        throw new Error(data.error || "Formato de catálogo no válido");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refreshProducts: fetchProducts };
}