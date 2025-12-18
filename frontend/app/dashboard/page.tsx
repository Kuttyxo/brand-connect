'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Imports correctos para evitar conflictos
import Link from 'next/link'; 
import { Users, DollarSign, Briefcase, Star, Activity, LoaderCircle } from 'lucide-react'; 

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
  
  // Nuevo estado para las estadísticas de la marca
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalBudget: 0,
    candidates: 0
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función MAESTRA para pedir todos los datos (Perfil + Estadísticas)
  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      // 1. Obtener Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      
      // Actualizamos perfil si cambió
      setProfile((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(profileData)) {
              return profileData;
          }
          return prev;
      });

      // 2. Si es MARCA, calculamos sus estadísticas reales
      if (profileData.role === 'brand') {
          const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('budget, status') // Solo traemos lo necesario para sumar
            .eq('brand_id', userId);

          if (!campaignsError && campaigns) {
              const active = campaigns.filter(c => c.status === 'open').length;
              const total = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
              
              setStats({
                  activeCampaigns: active,
                  totalBudget: total,
                  candidates: 0 // (Pendiente: conectar con tabla applications)
              });
          }
      }

    } catch (error) {
      console.error('Error actualizando dashboard:', error);
    }
  }, []);

  useEffect(() => {
    let channelProfiles: any;
    let channelCampaigns: any;
    let pollingInterval: any; 

    const initDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?mode=login');
          return;
        }

        // 1. Carga Inicial
        await fetchDashboardData(user.id);
        setLoading(false);

        // 2. RESPALDO (Polling cada 4s)
        pollingInterval = setInterval(async () => {
            await fetchDashboardData(user.id);
        }, 4000);

        // 3. REALTIME: Escuchamos cambios en PERFIL
        console.log("🔌 Conectando Realtime...");
        
        channelProfiles = supabase
          .channel('dashboard_profiles')
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
            () => fetchDashboardData(user.id)
          )
          .subscribe();

        // 4. REALTIME: Escuchamos cambios en CAMPAÑAS (Nuevo)
        // Así el contador sube apenas creas una campaña
        channelCampaigns = supabase
          .channel('dashboard_campaigns')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'campaigns', filter: `brand_id=eq.${user.id}` },
            () => {
                console.log("🔔 Cambio en campañas detectado!");
                fetchDashboardData(user.id);
            }
          )
          .subscribe();

      } catch (error) {
        console.error('Error inicial:', error);
        setLoading(false);
      }
    };

    initDashboard();

    return () => {
      if (channelProfiles) supabase.removeChannel(channelProfiles);
      if (channelCampaigns) supabase.removeChannel(channelCampaigns);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [router, fetchDashboardData]);
  
  // --- SKELETON LOADING ---
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

  const isBrand = profile?.role === 'brand';

  // Formateador de dinero (CLP)
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado Común */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">
            Hola, <span className="text-[var(--color-brand-orange)] capitalize">{profile?.full_name || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2">
            {isBrand 
              ? 'Panel de Control para Marcas' 
              : 'Panel de Control para Creadores'}
          </p>
        </div>
        
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${isBrand ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
            {isBrand ? '🏢 Cuenta de Empresa' : '⚡ Cuenta de Creador'}
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      
      {isBrand ? (
        // VISTA MARCA
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Campañas Activas (AHORA REAL) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Campañas Activas</h3>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={20}/></span>
            </div>
            
            {/* Número Dinámico */}
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
                {stats.activeCampaigns}
            </p>
            
            <Link href="/create-campaign" className="text-sm text-[var(--color-brand-orange)] font-bold cursor-pointer hover:underline">
              Crear nueva +
            </Link>

          </div>

          {/* Card 2: Presupuesto Total (AHORA REAL) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Inversión Total</h3>
              <span className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></span>
            </div>
            
            {/* Dinero Dinámico */}
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
                {formatMoney(stats.totalBudget)}
            </p>
            
            <span className="text-sm text-gray-400 font-medium">Comprometido</span>
          </div>

          {/* Card 3: Postulaciones (Aún en 0 hasta que hagamos el marketplace) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Postulaciones</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
                {stats.candidates}
            </p>
            <span className="text-sm text-blue-500 font-medium cursor-pointer hover:underline">Ver candidatos →</span>
          </div>
        </div>
      ) : (
        // VISTA INFLUENCER
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {!profile?.is_verified && (
            <div className="col-span-1 md:col-span-3 bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                 <LoaderCircle size={32} className="animate-spin" />
               </div>
               <div>
                 <h3 className="font-bold text-lg text-yellow-800">Analizando tu perfil...</h3>
                 <p className="text-yellow-700 text-sm mt-1">
                   Nuestro robot está escaneando <strong>{profile?.social_handle}</strong>.
                   <br/>
                   Esto puede tardar unos segundos. La página se actualizará sola.
                 </p>
               </div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Seguidores</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
              {profile?.followers_count?.toLocaleString() || 0}
            </p>
            <span className="text-sm text-gray-400 font-medium">{profile?.social_handle}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Engagement</h3>
              <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Activity size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
              {profile?.engagement_rate?.toFixed(2) || 0}%
            </p>
            <span className="text-sm text-gray-400 font-medium">
              {profile?.engagement_rate && profile.engagement_rate > 3 ? '🚀 Bueno' : '📊 Normal'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Nivel</h3>
              <span className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Star size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">Starter</p>
            <span className="text-sm text-blue-500 font-medium cursor-pointer hover:underline">Ver beneficios →</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          {isBrand ? '📢' : '🚀'}
        </div>
        <h3 className="text-xl font-bold text-[var(--color-brand-dark)]">
          {isBrand ? 'Publica tu primera campaña' : '¡Estás listo para despegar!'}
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          {isBrand 
            ? 'Encuentra a los mejores micro-influencers para tu marca hoy mismo.'
            : 'Completa tu perfil para que las marcas te encuentren más rápido.'}
        </p>
        <button className="mt-6 px-6 py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold hover:bg-[var(--color-brand-orange)] transition-colors">
          {isBrand ? 'Crear Campaña' : 'Completar Perfil'}
        </button>
      </div>

    </div>
  );
}