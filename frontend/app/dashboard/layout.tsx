'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, Users, ShoppingBag, Settings, LogOut, 
  Menu, X, MessageSquare, Wallet // Importamos Wallet
} from 'lucide-react';
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
  const [role, setRole] = useState<string | null>(null); // Estado para el rol
  const [loading, setLoading] = useState(true);

  // 1. Detectar Rol al cargar
  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      setRole(data?.role || 'influencer');
      setLoading(false);
    };
    getUserRole();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Definición Centralizada del Menú
  const menuItems = [
    { 
      name: 'Inicio', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      show: true 
    },
    { 
      name: 'Campañas', 
      href: '/dashboard/campaigns', 
      icon: ShoppingBag,
      show: true 
    },
    { 
      name: 'Billetera', 
      href: '/dashboard/wallet', 
      icon: Wallet,
      show: role === 'influencer' // 💰 SOLO INFLUENCERS
    },
    { 
      name: 'Mi Perfil', 
      href: '/dashboard/profile', 
      icon: Users,
      show: true 
    },
    { 
      name: 'Mensajes', 
      href: '/dashboard/messages', 
      icon: MessageSquare,
      show: true 
    },
    { 
      name: 'Configuración', 
      href: '/dashboard/settings', 
      icon: Settings,
      show: true 
    },
  ];

  if (loading) return null; // O un spinner simple

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

        {/* Navegación Desktop */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.filter(item => item.show).map((item) => {
             const isActive = pathname === item.href;
             return (
                <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive 
                        ? 'text-[var(--color-brand-dark)] bg-gray-100' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[var(--color-brand-orange)]'
                    }`}
                >
                    <item.icon size={20} />
                    {item.name}
                </Link>
             );
          })}
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
             <div className="relative w-6 h-6">
                <Menu size={24} className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <X size={24} className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
             </div>
           </button>
        </header>

        {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
        <div 
          className={`md:hidden absolute top-16 left-0 w-full z-40 bg-white shadow-xl overflow-hidden transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'max-h-[calc(100vh-4rem)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
          `}
        >
            <nav className="flex flex-col p-4 space-y-2 border-b border-gray-200">
              {menuItems.filter(item => item.show).map((item) => {
                 const isActive = pathname === item.href;
                 return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                        isActive 
                            ? 'text-[var(--color-brand-dark)] bg-gray-50' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <item.icon size={20} />
                        {item.name}
                    </Link>
                 );
              })}
              
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