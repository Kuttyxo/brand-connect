import Image from "next/image";

export default function Home() {
  return (
    // Fondo usando la variable CSS directa
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-[var(--color-brand-dark)] text-[var(--color-brand-light)]">
      
      <div className="text-center flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="BrandConnect Logo"
          width={180} 
          height={180}
          priority 
          className="mb-8 drop-shadow-2xl rounded-2xl"
        />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="block">El Marketplace de</span>
          {/* Gradiente aplicado explícitamente */}
          <span className="bg-clip-text text-transparent bg-[linear-gradient(to_right,var(--color-brand-orange),var(--color-brand-accent1),var(--color-brand-accent2))]">
            Micro-Influencers
          </span>
        </h1>
        
        <p className="mt-6 text-xl opacity-80 max-w-2xl">
          Conecta marcas con creadores verificados por una fracción del costo. 
          Sin agencias. Sin comisiones abusivas.
        </p>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
        {/* Botón Principal con gradiente explícito */}
        <button className="flex-1 px-8 py-4 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg bg-[linear-gradient(to_right,var(--color-brand-orange),var(--color-brand-accent1),var(--color-brand-accent2))]">
          Soy Marca
        </button>
        
        {/* Botón Secundario */}
        <button className="flex-1 px-8 py-4 border-2 border-current rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
          Soy Influencer
        </button>
      </div>
      
    </main>
  );
}