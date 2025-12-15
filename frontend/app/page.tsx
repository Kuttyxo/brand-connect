import Image from "next/image";

export default function Home() {
  return (
    // Usamos tu color de fondo principal (brand-dark) y texto claro (brand-light)
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-brand-dark text-brand-light">
      
      {/* Contenedor del Logo y Título */}
      <div className="text-center flex flex-col items-center animate-fade-in-up">
        
        {/* LOGO: Aquí está la corrección con el nombre exacto de tu archivo */}
        <Image 
          src="/logo.png" 
          alt="BrandConnect Logo"
          width={180} 
          height={180}
          priority 
          className="mb-8 drop-shadow-2xl rounded-2xl" // Agregué rounded por si acaso
        />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="block text-brand-light">El Marketplace de</span>
          {/* Usamos el gradiente de tu marca */}
          <span className="bg-clip-text text-transparent bg-brand-gradient">
            Micro-Influencers
          </span>
        </h1>
        
        <p className="mt-6 text-xl text-brand-light/80 max-w-2xl">
          Conecta marcas con creadores verificados por una fracción del costo. 
          Sin agencias. Sin comisiones abusivas.
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
        {/* Botón Principal con gradiente */}
        <button className="flex-1 px-8 py-4 bg-brand-gradient text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-brand-orange/30">
          Soy Marca
        </button>
        
        {/* Botón Secundario con borde */}
        <button className="flex-1 px-8 py-4 border-2 border-brand-light/30 text-brand-light rounded-xl font-bold text-lg hover:bg-brand-light/10 transition-all">
          Soy Influencer
        </button>
      </div>
      
    </main>
  );
}