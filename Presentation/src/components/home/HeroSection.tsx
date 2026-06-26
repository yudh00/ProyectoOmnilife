import { useAuth } from '../../hooks/useAuth'; // Ajusta la ruta a tu archivo useAuth
import { toast } from 'react-hot-toast'; // Asegúrate de tener instalada esta librería

interface HeroSectionProps {
  onNavigateToCatalog: () => void;
}

export default function HeroSection({ onNavigateToCatalog }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();

  // Función que decide si permite la navegación o pide login
  const handleNavigation = () => {
    if (!isAuthenticated) {
      toast.error('Por favor, inicia sesión para ver el catálogo');
      return; // No ejecutamos onNavigateToCatalog
    }
    
    // Si está autenticado, permitimos la navegación
    onNavigateToCatalog();
  };

  return (
    <div className="flex flex-col">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-purple-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 bg-purple-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Copy */}
            <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Mas de 200 productos de belleza
              </h1>
              <div className="inline-block bg-purple-700 text-white text-4xl sm:text-5xl lg:text-6xl font-bold px-4 py-1 mt-2 rounded-xl">
                y nutricion
              </div>
              <p className="mt-5 text-gray-500 text-base sm:text-lg max-w-lg mx-auto lg:mx-0">
                Elaborados con tecnologia de punta, para fomentar tu bienestar
                por dentro y por fuera.
              </p>
              <button
                onClick={handleNavigation} // Cambiado para usar el filtro
                className="mt-8 inline-block bg-purple-800 text-white font-semibold px-8 py-4 rounded-full text-base hover:bg-purple-900 active:scale-95 transition-all shadow-lg shadow-purple-200"
              >
                Ver productos
              </button>
            </div>

            {/* Hero image */}
            <div className="flex-1 order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[440px] lg:h-[440px]">
                <div className="absolute inset-0 rounded-full border-[3px] border-purple-200" />
                <div className="absolute inset-4 rounded-full bg-purple-100 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=600&fit=crop"
                    alt="Persona saludable con productos Omnilife"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-8">
          Nuestras categorias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={handleNavigation} // Cambiado para usar el filtro
            className="group relative rounded-2xl overflow-hidden h-52 shadow-md hover:shadow-xl transition-shadow text-left"
          >
            <img
              src="https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&h=400&fit=crop"
              alt="Nutricionales OMNILIFE"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-700/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">OMNILIFE</span>
              <h3 className="text-white text-xl font-bold mt-1">Nutricionales</h3>
            </div>
          </button>

          <button
            onClick={handleNavigation} // Cambiado para usar el filtro
            className="group relative rounded-2xl overflow-hidden h-52 shadow-md hover:shadow-xl transition-shadow text-left"
          >
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=400&fit=crop"
              alt="Cosmeticos SEYTU"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-700/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">SEYTU</span>
              <h3 className="text-white text-xl font-bold mt-1">Cosmeticos</h3>
            </div>
          </button>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold">Calidad garantizada</p>
              <p className="text-purple-200 text-sm">Productos certificados y de alta calidad</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-semibold">Envio rapido</p>
              <p className="text-purple-200 text-sm">Recibe tu pedido en la puerta de tu casa</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="font-semibold">Bienestar integral</p>
              <p className="text-purple-200 text-sm">Cuida tu salud por dentro y por fuera</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
