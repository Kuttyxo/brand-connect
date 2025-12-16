import Link from 'next/link';
import Image from 'next/image'; // <--- IMPORTANTE: Agregamos esto
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* --- SIDEBAR (Menú Lateral) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        
        {/* Logo del Dashboard (CAMBIADO) */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-start">
          <Link href="/dashboard">
            <Image 
              src="/brand-logo.png" 
              alt="BrandConnect Logo" 
              width={160} 
              height={40} 
              priority
              className="h-10 w-auto object-contain" // Esto asegura que no se deforme
            />
          </Link>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[var(--color-brand-dark)] bg-gray-100 rounded-xl font-medium transition-colors">
            <LayoutDashboard size={20} />
            Inicio
          </Link>
          
          <Link href="/dashboard/campaigns" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)] rounded-xl font-medium transition-colors">
            <ShoppingBag size={20} />
            Campañas
          </Link>

          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)] rounded-xl font-medium transition-colors">
            <Users size={20} />
            Mi Perfil
          </Link>

          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)] rounded-xl font-medium transition-colors">
            <Settings size={20} />
            Configuración
          </Link>
        </nav>

        {/* Botón de Salir */}
        <div className="p-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors">
            <LogOut size={20} />
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between md:hidden">
           {/* Header móvil: También ponemos el logo aquí para consistencia */}
           <Image 
              src="/logo-full.png" 
              alt="BrandConnect" 
              width={120} 
              height={30} 
              className="h-6 w-auto object-contain"
            />
        </header>
        
        <div className="p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}