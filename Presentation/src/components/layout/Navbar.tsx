// Presentation/src/components/layout/Navbar.tsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import LoginFormModal from "../auth/loginForm";
import RegisterFormModal from "../auth/registerForm";

interface NavbarProps {
  totalItems: number;
  onCartOpen: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  currentPage: "home" | "catalog" | "clients" | "finances" | "orders";
  onNavigate: (page: "home" | "catalog" | "clients" | "finances" | "orders") => void;
}

export default function Navbar({
  totalItems,
  onCartOpen,
  searchQuery,
  onSearchChange,
  currentPage,
  onNavigate,
}: NavbarProps) {
  const { isAdmin, isAuthenticated, currentUser, logout } = useAuth();

  // Estados locales para controlar la visibilidad de los modales de Auth
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Funciones fluidas para saltar de un modal a otro sin dejar capas encimadas
  const openLoginAndCloseRegister = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterAndCloseLogin = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleLogout = () => {
  logout();
  onNavigate("home");
};

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Top bar */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Ir al inicio"
          >
            <img
              src="https://www.omnilife.com/assets/images/logo-omnilife.svg"
              alt="OMNILIFE"
              className="h-8 w-auto"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = "none";
                const next = t.nextElementSibling as HTMLElement | null;
                if (next) next.style.display = "block";
              }}
            />
            <span
              className="hidden font-extrabold text-purple-700 text-xl tracking-tight leading-none"
              style={{ display: "none" }}
            >
              OMNI<span className="text-orange-500">LIFE</span><br />
              <span className="text-[10px] font-normal text-gray-400 tracking-widest">STORE</span>
            </span>
          </button>

          {/* Search bar — siempre ocupa el espacio, solo visible en catálogo */}
          <div className="flex-1 relative max-w-xl">
            {currentPage === "catalog" && (
              <>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 transition-colors"
                />
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center hover:bg-purple-800 transition-colors"
                  aria-label="Buscar"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </button>
              </>
            )}
          </div>

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* EL CARRITO AHORA SOLO APARECE SI ESTÁ LOGEADO Y NO ES ADMIN */}
            {isAuthenticated && !isAdmin && (
              <button
                onClick={onCartOpen}
                className="relative p-2 hover:bg-purple-50 rounded-full transition-colors"
                aria-label={`Carrito, ${totalItems} artículos`}
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Botones de sesión con triggers para abrir los modales correspondientes */}
            {!isAuthenticated && (
              <>
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="hidden sm:block text-sm text-purple-700 font-medium border border-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors whitespace-nowrap"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="hidden md:block text-sm text-white font-medium bg-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-800 transition-colors whitespace-nowrap"
                >
                  Registrarse
                </button>
              </>
            )}

            {isAuthenticated && currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {currentUser.nombreRol}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="bg-purple-700">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center gap-1 text-white text-sm">
              {/* 1. INICIO: Siempre visible para todos */}
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className={`flex items-center gap-1.5 px-4 py-3 transition-colors whitespace-nowrap font-medium ${
                    currentPage === "home" ? "bg-purple-900" : "hover:bg-purple-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 3 11h1v6a1 1 0 0 0 1 1h4v-4h2v4h4a1 1 0 0 0 1-1v-6h1a1 1 0 0 0 .707-1.707l-7-7z" />
                  </svg>
                  Inicio
                </button>
              </li>

              {/* 2. CATÁLOGO: Solo si está autenticado (Cliente o Admin) */}
              {isAuthenticated && (
                <li>
                  <button
                    onClick={() => onNavigate("catalog")}
                    className={`px-4 py-3 transition-colors whitespace-nowrap font-medium block ${
                      currentPage === "catalog" ? "bg-purple-900" : "hover:bg-purple-800"
                    }`}
                  >
                    Catálogo
                  </button>
                </li>
              )}
              
              {/* 3. MODULOS DE ADMIN: Solo si está autenticado Y además es Administrador */}
              {isAuthenticated && isAdmin && (
                <>
                  <li>
                    <button
                      onClick={() => onNavigate("clients")}
                      className={`flex items-center gap-1.5 px-4 py-3 transition-colors whitespace-nowrap font-medium ${
                        currentPage === "clients" ? "bg-purple-900" : "hover:bg-purple-800"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-2 0" />
                      </svg>
                      Clientes
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("finances")}
                      className={`flex items-center gap-1.5 px-4 py-3 transition-colors whitespace-nowrap font-medium ${
                        currentPage === "finances" ? "bg-purple-900" : "hover:bg-purple-800"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Finanzas
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("orders")}
                      className={`flex items-center gap-1.5 px-4 py-3 transition-colors whitespace-nowrap font-medium ${
                        currentPage === "orders" ? "bg-purple-900" : "hover:bg-purple-800"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Pedidos
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
      </header>

      {/* Renderizado de los componentes Modales acoplados al DOM */}
      <LoginFormModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSwitchToRegister={openRegisterAndCloseLogin}
      />
      
      <RegisterFormModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSwitchToLogin={openLoginAndCloseRegister}
      />
    </>
  );
}