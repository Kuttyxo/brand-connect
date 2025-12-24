'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { Users, DollarSign, Briefcase, Star, Activity, LoaderCircle, Zap, Crown, ArrowRight, Plus, Search } from 'lucide-react'; 
import BenefitsModal from '@/components/BenefitsModal';

type Profile = {
  full_name: string;
  role: string;
  social_handle: string;
  followers_count: number;
  engagement_rate: number;
  is_verified: boolean;
};

// --- CONFIGURACIÓN DE NIVELES (CORREGIDO: Colores explícitos) ---
const LEVELS = {
  STARTER: { 
    min: 0, 
    name: 'Starter', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50', 
    barColor: 'bg-yellow-600', // <--- CLASE EXPLÍCITA AQUÍ
    icon: Star, 
    next: 5 
  },
  PRO: { 
    min: 5, 
    name: 'Pro Creator', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    barColor: 'bg-blue-600', // <--- CLASE EXPLÍCITA AQUÍ
    icon: Zap, 
    next: 20 
  },
  ELITE: { 
    min: 20, 
    name: 'Legend', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    barColor: 'bg-purple-600', // <--- CLASE EXPLÍCITA AQUÍ
    icon: Crown, 
    next: 100 
  }
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);
  
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalBudget: 0,
    candidates: 0,
    completedCampaigns: 0, 
    earnings: 0 
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Calcular Nivel Actual
  const getCurrentLevel = (count: number) => {
    if (count >= LEVELS.ELITE.min) return LEVELS.ELITE;
    if (count >= LEVELS.PRO.min) return LEVELS.PRO;
    return LEVELS.STARTER;
  };

  const level = getCurrentLevel(stats.completedCampaigns);
  
  // Calcular Progreso RELATIVO
  const range = level.next - level.min;
  const currentInLevel = stats.completedCampaigns - level.min;
  const progress = Math.min(100, Math.max(0, (currentInLevel / range) * 100));
  
  const jobsToNext = level.next - stats.completedCampaigns;

  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      
      setProfile((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(profileData)) {
              return profileData;
          }
          return prev;
      });

      if (profileData.role === 'brand') {
          // --- LÓGICA MARCA ---
          const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('id, budget, status') 
            .eq('brand_id', userId);

          if (!campaignsError && campaigns) {
              const active = campaigns.filter(c => c.status === 'open').length;
              const total = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
              
              let candidatesCount = 0;
              if (campaigns.length > 0) {
                const campaignIds = campaigns.map(c => c.id);
                const { count } = await supabase
                  .from('applications')
                  .select('*', { count: 'exact', head: true }) 
                  .in('campaign_id', campaignIds);
                candidatesCount = count || 0;
              }
              
              setStats({
                  activeCampaigns: active,
                  totalBudget: total,
                  candidates: candidatesCount,
                  completedCampaigns: 0,
                  earnings: 0
              });
          }
      } else {
          // --- LÓGICA INFLUENCER ---
          const { count: activeCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('influencer_id', userId)
            .in('status', ['pending', 'accepted', 'hired', 'review']);

          const { count: completedCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('influencer_id', userId)
            .eq('status', 'completed');

          const { data: myAgreements } = await supabase
            .from('agreements')
            .select('payout_amount, application!inner(influencer_id)')
            .eq('application.influencer_id', userId) 
            .eq('payment_status', 'released');

          const totalEarnings = myAgreements?.reduce((acc, curr) => acc + (curr.payout_amount || 0), 0) || 0;

          setStats({
            activeCampaigns: activeCount || 0,
            completedCampaigns: completedCount || 0,
            earnings: totalEarnings,
            totalBudget: 0,
            candidates: 0
          });
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

        await fetchDashboardData(user.id);
        setLoading(false);

        pollingInterval = setInterval(async () => {
            await fetchDashboardData(user.id);
        }, 4000);

        channelProfiles = supabase
          .channel('dashboard_profiles')
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
            () => fetchDashboardData(user.id)
          )
          .subscribe();

        if (profile?.role === 'influencer') {
             channelCampaigns = supabase
              .channel('dashboard_apps')
              .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'applications', filter: `influencer_id=eq.${user.id}` },
                () => fetchDashboardData(user.id)
              )
              .subscribe();
        } else {
             channelCampaigns = supabase
              .channel('dashboard_campaigns')
              .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'campaigns', filter: `brand_id=eq.${user.id}` },
                () => fetchDashboardData(user.id)
              )
              .subscribe();
        }

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
  }, [router, fetchDashboardData, profile?.role]);
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-8 p-6">
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20">
      
      {/* ENCABEZADO RESPONSIVE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-brand-dark)]">
            Hola, <span className="text-[var(--color-brand-orange)] capitalize">{profile?.full_name?.split(' ')[0] || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {isBrand 
              ? 'Gestiona tus campañas y contratos.' 
              : 'Aquí está el resumen de tu carrera.'}
          </p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {isBrand ? (
                <Link href="/create-campaign" className="w-full sm:w-auto justify-center bg-[var(--color-brand-orange)] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/10 hover:shadow-orange-200/50 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={20}/> Nueva Campaña
                </Link>
            ) : (
                <Link href="/dashboard/campaigns" className="w-full sm:w-auto justify-center bg-[var(--color-brand-dark)] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-gray-900/10 hover:shadow-gray-200/50 active:scale-95 transition-all flex items-center gap-2">
                    <Search size={20}/> Buscar Trabajo
                </Link>
            )}
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      
      {isBrand ? (
        // VISTA MARCA
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Campañas Activas</h3>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">{stats.activeCampaigns}</p>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Inversión Total</h3>
              <span className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></span>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-brand-dark)] truncate" title={formatMoney(stats.totalBudget)}>
                {formatMoney(stats.totalBudget)}
            </p>
            <span className="text-xs md:text-sm text-gray-400 font-medium">Comprometido</span>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Postulaciones</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">{stats.candidates}</p>
            <Link href="/dashboard/candidates" className="text-xs md:text-sm text-blue-500 font-medium cursor-pointer hover:underline block mt-1">
                Ver candidatos →
            </Link>
          </div>
        </div>
      ) : (
        // VISTA INFLUENCER
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          {!profile?.is_verified && (
            <div className="col-span-1 md:col-span-3 bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 shrink-0">
                 <LoaderCircle size={28} className="animate-spin" />
               </div>
               <div className="text-center md:text-left">
                 <h3 className="font-bold text-base md:text-lg text-yellow-800">Analizando perfil...</h3>
                 <p className="text-yellow-700 text-xs md:text-sm mt-1">
                   Escaneando <strong>{profile?.social_handle}</strong>. La página se actualizará sola.
                 </p>
               </div>
            </div>
          )}
          
          {/* CARD NIVEL (DINÁMICA + FIX COLOR) */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 ${level.bg} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50`}></div>
            
            <div className="flex items-center justify-between mb-2 relative z-10">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Tu Nivel</h3>
              <span className={`p-2 ${level.bg} ${level.color} rounded-lg`}><level.icon size={20}/></span>
            </div>
            
            <div className="relative z-10">
                <p className={`text-2xl md:text-3xl font-extrabold ${level.color} mb-1`}>{level.name}</p>
                
                {/* Barra de Progreso */}
                <div className="w-full bg-gray-100 rounded-full h-2 mt-3 mb-2 overflow-hidden relative">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${level.barColor}`} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                <p className="text-[10px] md:text-xs text-gray-400 mb-3 font-medium">
                    {jobsToNext > 0 
                        ? `Faltan ${jobsToNext} trabajos para subir.` 
                        : '¡Nivel máximo alcanzado! 🚀'}
                </p>

                <button 
                    onClick={() => setShowBenefits(true)}
                    className="text-xs md:text-sm text-blue-500 font-medium cursor-pointer hover:underline flex items-center gap-1 p-1 -ml-1"
                >
                    Ver beneficios <ArrowRight size={14}/>
                </button>
            </div>
          </div>

          {/* CARD GANANCIAS */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Ganancias</h3>
              <span className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></span>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-brand-dark)] truncate" title={formatMoney(stats.earnings)}>
              {formatMoney(stats.earnings)}
            </p>
            <span className="text-xs md:text-sm text-gray-400 font-medium">Acumulado total</span>
          </div>

          {/* CARD SEGUIDORES */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium text-sm md:text-base">Seguidores</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></span>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-brand-dark)]">
                {profile?.followers_count?.toLocaleString() || 0}
            </p>
            <span className="text-xs md:text-sm text-gray-400 font-medium">{profile?.social_handle}</span>
          </div>
        </div>
      )}

      {/* Footer Condicional */}
      {((isBrand && stats.activeCampaigns === 0) || (!isBrand && !profile?.is_verified)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center py-12 md:py-20 animate-fade-in mx-auto max-w-2xl">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl md:text-3xl">
            {isBrand ? '📢' : '🚀'}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[var(--color-brand-dark)]">
            {isBrand ? 'Publica tu primera campaña' : '¡Estás listo para despegar!'}
          </h3>
          <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto mt-2">
            {isBrand 
              ? 'Encuentra a los mejores micro-influencers para tu marca hoy mismo.'
              : 'Completa tu perfil para que las marcas te encuentren más rápido.'}
          </p>
          
          <Link href={isBrand ? '/create-campaign' : '/dashboard/profile/edit'}>
            <button className="mt-6 px-6 py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold hover:bg-[var(--color-brand-orange)] transition-colors w-full sm:w-auto">
              {isBrand ? 'Crear Campaña' : 'Completar Perfil'}
            </button>
          </Link>
        </div>
      )}

      {/* MODAL DE BENEFICIOS */}
      {showBenefits && <BenefitsModal onClose={() => setShowBenefits(false)} currentLevel={level.name} completed={stats.completedCampaigns} />}

    </div>
  );
}