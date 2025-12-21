'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut, Menu, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const getLinkClass = (path: string) => {
    const isACtive = pathname === path;
    return isACtive 
? "flex items-center gap-3 px-4 py-3 text-[var(--color-brand-dark)] bg-gray-100 rounded-xl font-medium transition-colors" // Activo
      : "flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)] rounded-xl font-medium transition-colors"; // Inactivo
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-start">
          <Link href="/dashboard">
            <Image 
              src="/brand-logo.png" 
              alt="BrandConnect Logo" 
              width={160} 
              height={40} 
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

{/* Navegación Desktop Dinámica */}
<nav className="flex-1 p-4 space-y-2">
  
  {/* Botón INICIO */}
  <Link 
    href="/dashboard" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard' 
        ? 'text-[var(--color-brand-dark)] bg-gray-100' // Estilo ACTIVO
        : 'text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)]' // Estilo INACTIVO
    }`}
  >
    <LayoutDashboard size={20} />
    Inicio
  </Link>

  {/* Botón CAMPAÑAS */}
  <Link 
    href="/dashboard/campaigns" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/campaigns' 
        ? 'text-[var(--color-brand-dark)] bg-gray-100' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)]'
    }`}
  >
    <ShoppingBag size={20} />
    Campañas
  </Link>

  {/* Botón MI PERFIL */}
  <Link 
    href="/dashboard/profile" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/profile' 
        ? 'text-[var(--color-brand-dark)] bg-gray-100' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)]'
    }`}
  >
    <Users size={20} />
    Mi Perfil
  </Link>

{/* --- MENSAJES --- */}
  <Link href="/dashboard/messages">
    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
      <MessageSquare size={20} />
      <span className="font-medium">Mensajes</span>
    </div>
  </Link>

  {/* Botón CONFIGURACIÓN */}
  <Link 
    href="/dashboard/settings" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/settings' 
        ? 'text-[var(--color-brand-dark)] bg-gray-100' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)]'
    }`}
  >
    <Settings size={20} />
    Configuración
  </Link>

</nav>

        {/* Botón Salir Desktop */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors text-left">
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>


      {/* --- CONTENIDO PRINCIPAL + HEADER MÓVIL --- */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* HEADER MÓVIL (Sticky top) */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 md:hidden sticky top-0 z-50 relative">
           <Link href="/dashboard" onClick={closeMenu}>
             <Image 
                src="/brand-logo.png" 
                alt="BrandConnect" 
                width={120} 
                height={30} 
                className="h-6 w-auto object-contain"
              />
           </Link>

           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="text-[var(--color-brand-dark)] p-2 hover:bg-gray-100 rounded-lg transition-colors z-50 relative"
             aria-label="Toggle Menu"
           >
             {/* Transición suave entre iconos */}
             <div className="relative w-6 h-6">
                <Menu size={24} className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <X size={24} className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
             </div>
           </button>
        </header>

        {/* --- MENÚ DESPLEGABLE MÓVIL CON TRANSICIÓN --- */}
        {/* Usamos clases dinámicas para la transición de altura y opacidad */}
        <div 
          className={`md:hidden absolute top-16 left-0 w-full z-40 bg-white shadow-xl overflow-hidden transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'max-h-[calc(100vh-4rem)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
          `}
        >
<nav className="flex flex-col p-4 space-y-2 border-b border-gray-200">
  
  {/* INICIO */}
  <Link 
    onClick={closeMenu} 
    href="/dashboard" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard'
        ? 'text-[var(--color-brand-dark)] bg-gray-50' // Estilo ACTIVO
        : 'text-gray-600 hover:bg-gray-50'            // Estilo INACTIVO
    }`}
  >
    <LayoutDashboard size={20} />
    Inicio
  </Link>

  {/* CAMPAÑAS */}
  <Link 
    onClick={closeMenu} 
    href="/dashboard/campaigns" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/campaigns'
        ? 'text-[var(--color-brand-dark)] bg-gray-50'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <ShoppingBag size={20} />
    Campañas
  </Link>

  {/* MI PERFIL */}
  <Link 
    onClick={closeMenu} 
    href="/dashboard/profile" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/profile'
        ? 'text-[var(--color-brand-dark)] bg-gray-50'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Users size={20} />
    Mi Perfil
  </Link>

  {/* CONFIGURACIÓN */}
  <Link 
    onClick={closeMenu} 
    href="/dashboard/settings" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      pathname === '/dashboard/settings'
        ? 'text-[var(--color-brand-dark)] bg-gray-50'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Settings size={20} />
    Configuración
  </Link>
  
  <div className="h-px bg-gray-100 my-2"></div>
  
  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium w-full text-left">
    <LogOut size={20} />
    Cerrar Sesión
  </button>
</nav>
        </div>
        
        {/* Contenido de la página */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      
    </div>
  );
}