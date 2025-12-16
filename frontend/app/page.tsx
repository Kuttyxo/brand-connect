import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white overflow-hidden relative selection:bg-[var(--color-brand-orange)] selection:text-white">
      
      {/* --- Elementos Decorativos de Fondo (Sutiles) --- */}
      {/* Círculo naranja suave arriba a la derecha */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-brand-orange)]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      {/* Círculo azul suave abajo a la izquierda */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-brand-dark)]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* --- HEADER --- */}
      <header className="w-full p-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {/* Logo Original - Al ser JPG con fondo blanco/gris, se integrará mejor aquí */}
          <Image 
            src="/logo.png" 
            alt="BrandConnect Logo"
            width={180} 
            height={100} 
            priority 
            className="w-30 md:w-30 h-30 object-contain mix-blend-multiply" // mix-blend ayuda a que el fondo del jpg se funda un poco
          />
        </div>
        
        {/* Botón de Login discreto */}
        <Link href="/auth?mode=login" className="text-sm font-semibold text-[var(--color-brand-dark)] hover:text-[var(--color-brand-orange)] transition-colors">
          Iniciar Sesión
        </Link>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 text-center mt-[-40px]">
        

        {/* Título */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[var(--color-brand-dark)] mb-6 max-w-4xl leading-[1.1]">
          El Marketplace de <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-[image:var(--image-brand-gradient)]">
            Micro-Influencers
          </span>
        </h1>
        
        {/* Subtítulo */}
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Conectamos marcas con creadores reales. 
          <span className="font-semibold text-[var(--color-brand-dark)]"> Sin agencias costosas, sin contratos complicados.</span>
          <br/> Empieza tu campaña hoy mismo.
        </p>

        {/* Botones */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <Link href="/auth?role=brand" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold text-lg hover:bg-[var(--color-brand-orange)] transition-all shadow-xl shadow-blue-900/10 transform hover:-translate-y-1">
              Soy Marca
            </button>
          </Link>
          
          <Link href="/auth?role=influencer" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 bg-white text-[var(--color-brand-dark)] border-2 border-[var(--color-brand-dark)]/10 rounded-xl font-bold text-lg hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)] transition-all transform hover:-translate-y-1">
              Soy Influencer
            </button>
          </Link>
        </div>

      </section>

    </main>
  );
}