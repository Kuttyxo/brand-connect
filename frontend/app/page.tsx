import Image from "next/image";
import Link from "next/link";
import SplitText from "@/components/SplitText";
import TextType from "@/components/TextType";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white overflow-hidden relative selection:bg-[var(--color-brand-orange)] selection:text-white">
      
      {/* --- Elementos Decorativos de Fondo (Sutiles) --- */}
      <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[var(--color-brand-orange)]/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[var(--color-brand-dark)]/5 rounded-full blur-[80px] md:blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* --- HEADER (FIX: Absolute para pegarlo arriba sin empujar el resto) --- */}
      <header className="absolute top-0 left-0 w-full px-6 py-4 md:px-12 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo-real.png" 
            alt="BrandConnect Logo"
            width={180} 
            height={100} 
            priority 
            className="w-32 md:w-40 h-auto object-contain mix-blend-multiply" 
          />
        </div>
        
        <Link href="/auth?mode=login" className="text-sm md:text-base font-bold text-[var(--color-brand-dark)] hover:text-[var(--color-brand-orange)] transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg">
          Iniciar Sesión
        </Link>
      </header>

      {/* --- HERO SECTION --- */}
      {/* Al ser el header absoluto, esto ocupará toda la pantalla y se centrará perfecto */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 text-center w-full h-full pt-20">
        
        {/* Título */}
        <h1 className="flex flex-col items-center justify-center text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-6 max-w-6xl leading-[1.1] md:leading-[1.05]">
          
          <div className="block">
            <SplitText 
              text="El Marketplace de" 
              className="text-[var(--color-brand-dark)]"
              delay={50} 
              animationFrom={{ opacity: 0, y: 30 }} 
              animationTo={{ opacity: 1, y: 0 }}
            />
          </div>
          
          <div className="block mt-2 md:mt-0">
            <SplitText 
              text="Micro-Influencers" 
              className="bg-clip-text text-transparent bg-[image:var(--image-brand-gradient)] pb-2"
              delay={150} 
              split={false} 
              animationFrom={{ opacity: 0, y: 30 }} 
              animationTo={{ opacity: 1, y: 0 }}
            />
          </div>

        </h1>
        
        {/* Subtítulo */}
        <div className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed flex flex-col items-center gap-1">
          <div>
            <TextType 
              text="Conectamos marcas con creadores reales."
              delay={1000} 
              speed={20}
            />
          </div>

          <div className="font-semibold text-[var(--color-brand-dark)]">
            <TextType 
              text="Sin agencias costosas, sin contratos complicados."
              delay={1800} 
              speed={30}
            />
          </div>

          <div className="mt-2 text-[var(--color-brand-orange)] font-bold hidden sm:block">
            <TextType 
               text="Empieza tu campaña hoy mismo."
               delay={3200}
               speed={30}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-5 w-full max-w-md justify-center px-4 sm:px-0">
          <Link href="/auth?role=brand" className="w-full sm:w-auto group">
            <button className="w-full px-8 py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold text-lg hover:bg-[var(--color-brand-orange)] transition-all shadow-xl shadow-blue-900/10 group-hover:-translate-y-1 active:scale-95 duration-200">
              Soy Marca
            </button>
          </Link>
          
          <Link href="/auth?role=influencer" className="w-full sm:w-auto group">
            <button className="w-full px-8 py-4 bg-white text-[var(--color-brand-dark)] border-2 border-[var(--color-brand-dark)]/10 rounded-2xl font-bold text-lg hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)] transition-all shadow-sm group-hover:-translate-y-1 active:scale-95 duration-200">
              Soy Influencer
            </button>
          </Link>
        </div>

      </section>

    </main>
  );
}