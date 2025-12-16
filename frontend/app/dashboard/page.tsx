'use client'; // Necesario para pedir datos desde el navegador

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Definimos la forma de los datos para que TypeScript no se queje
type Profile = {
  full_name: string;
  role: string;
  social_handle: string;
  followers_count: number;
  engagement_rate: number;
  is_verified: boolean;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener el usuario logueado actualmente
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth'); // Si no hay usuario, mandar al login
          return;
        }

        // 2. Pedir los datos de SU perfil en la tabla pública
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // --- VISTA DE CARGA (SKELETON) ---
  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado Personalizado */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">
            Hola, <span className="text-[var(--color-brand-orange)] capitalize">{profile?.social_handle || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2">
            {profile?.role === 'brand' 
              ? 'Gestiona tus campañas y encuentra talento.' 
              : 'Aquí tienes el resumen de tu impacto en redes.'}
          </p>
        </div>
        
        {/* Badge de Verificación */}
        {profile?.is_verified && (
          <div className="hidden md:flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
            ✅ Cuenta Verificada
          </div>
        )}
      </div>

      {/* Tarjetas de Estadísticas REALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Seguidores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Seguidores Totales</h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">👥</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
            {/* Formateamos el número (ej: 12500 -> 12,500) */}
            {profile?.followers_count?.toLocaleString() || 0}
          </p>
          <span className="text-sm text-gray-400 font-medium">Actualizado auto.</span>
        </div>

        {/* Card 2: Engagement */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Engagement Rate</h3>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">🔥</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
            {profile?.engagement_rate?.toFixed(2) || 0}%
          </p>
          <span className="text-sm text-gray-400 font-medium">
            {profile?.engagement_rate && profile.engagement_rate > 3 
              ? '🚀 Excelente rendimiento' 
              : '📊 Sigue mejorando'}
          </span>
        </div>

        {/* Card 3: Rol (Difiere según si es Marca o Influencer) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {profile?.role === 'brand' ? 'Presupuesto Activo' : 'Nivel de Cuenta'}
            </h3>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg">
              {profile?.role === 'brand' ? '💰' : '⭐'}
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
             {profile?.role === 'brand' ? '$0' : 'Starter'}
          </p>
          <span className="text-sm text-blue-500 font-medium cursor-pointer hover:underline">Ver detalles →</span>
        </div>
      </div>

      {/* Estado del Bot de Python */}
      {!profile?.is_verified && profile?.role === 'influencer' && (
         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
           <div className="text-3xl">🤖</div>
           <div>
             <h3 className="font-bold text-yellow-800">Verificando tu cuenta...</h3>
             <p className="text-yellow-700 text-sm mt-1">
               Nuestro sistema está analizando tu perfil <strong>{profile?.social_handle}</strong> para calcular tus métricas reales. Esto puede tardar unos minutos.
             </p>
           </div>
         </div>
      )}

      {/* Sección Secundaria */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🚀
        </div>
        <h3 className="text-xl font-bold text-[var(--color-brand-dark)]">¡Estás listo para despegar!</h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          Aún no tienes campañas activas. Completa tu perfil para que las marcas te encuentren.
        </p>
        <button className="mt-6 px-6 py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold hover:bg-[var(--color-brand-orange)] transition-colors">
          Completar Perfil
        </button>
      </div>

    </div>
  );
}