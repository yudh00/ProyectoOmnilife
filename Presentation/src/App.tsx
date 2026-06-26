// Presentation/src/App.tsx
import { useCallback, useState, useEffect } from "react";
import "./App.css";
import CartSidebar from "./components/cart/CartSidebar";
import FilterBar from "./components/catalog/FilterBar";
import ProductGrid from "./components/catalog/ProductGrid";
import ClientTable from "./components/clients/ClientTable";
import FinancesDashboard from "./components/finances/FinancesDashboard"; 
import HeroSection from "./components/home/HeroSection";
import Navbar from "./components/layout/Navbar";
import Toast from "./components/ui/Toast";
import type { ToastMessage } from "./components/ui/Toast";
import { useCart } from "./hooks/useCart";
import { useProducts } from "./hooks/useProducts"; 
import { useAuth } from "./hooks/useAuth";
import type { Product, ProductCategory } from "./types";
import AdminGuard from "./guards/AdminGuard";

type Page = "home" | "catalog" | "clients" | "finances";
let toastIdCounter = 0;

function App() {
  const cart = useCart();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "Todos">("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  // Obtenemos los estados necesarios del contexto
  const { isAuthenticated, isAdmin } = useAuth();

  // Obtenemos productos y la función para actualizar stock
  const { products, loading: loadingProducts, error: errorProducts, updateStock } = useProducts();

  // Efecto de seguridad para vistas protegidas
  useEffect(() => {
    if ((currentPage === "clients" || currentPage === "finances") && (!isAuthenticated || !isAdmin)) {
      setCurrentPage("home");
    }
  }, [isAuthenticated, isAdmin, currentPage]);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "success") => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      showToast(`"${product.name}" añadido al carrito`);
    },
    [cart, showToast]
  );

  const handleUpdateStock = useCallback((productId: number, delta: number) => {
    updateStock(productId, delta);
  }, [updateStock]);

  const handleConfirmOrder = useCallback(async () => {
    setConfirmingOrder(true);
    try {
      const result = await cart.confirmOrder();
      cart.closeCart();
      showToast(`Pedido ${result.numeroPedido} confirmado. Total: ₡${result.total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`);
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar el pedido', 'error');
    } finally {
      setConfirmingOrder(false);
    }
  }, [cart, showToast]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
    const matchesSearch = searchQuery.trim() === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        totalItems={cart.totalItems}
        onCartOpen={cart.openCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        onNavigate={navigate}
      />

      <main>
        {currentPage === "home" && (
          <HeroSection onNavigateToCatalog={() => navigate("catalog")} />
        )}

        {currentPage === "catalog" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
              Todos los <span className="text-purple-700">productos</span>
            </h1>
            
            {errorProducts && (
              <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm">
                <strong>Error:</strong> {errorProducts}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <FilterBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              <p className="text-sm text-gray-400 pb-4 sm:pb-0 flex-shrink-0">
                {filteredProducts.length} {filteredProducts.length !== 1 ? "productos" : "producto"}
              </p>
            </div>

            {loadingProducts ? (
              <div className="py-20 text-center text-purple-700 font-medium animate-pulse">
                Cargando catálogo...
              </div>
            ) : (
              <ProductGrid
                products={filteredProducts}
                isAdmin={!!isAdmin} // Convertimos a booleano explícito
                onAddToCart={handleAddToCart}
                onUpdateStock={handleUpdateStock} // Pasamos la función al grid
              />
            )}
          </div>
        )}

        {currentPage === "clients" && (
          <AdminGuard>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
              <ClientTable />
            </div>
          </AdminGuard>
        )}

        {currentPage === "finances" && (
          <AdminGuard>
            <FinancesDashboard />
          </AdminGuard>
        )}
      </main>

      <CartSidebar
        isOpen={cart.isOpen}
        items={cart.items}
        totalPrice={cart.totalPrice}
        onClose={cart.closeCart}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onConfirmOrder={handleConfirmOrder}
        isConfirming={confirmingOrder}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;