'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { Users, DollarSign, Briefcase, Star, Activity, LoaderCircle, Zap, Crown, ArrowRight, Plus, Search, Clock } from 'lucide-react'; 
import BenefitsModal from '@/components/BenefitsModal';

type Profile = {
  full_name: string;
  role: string;
  social_handle: string;
  followers_count: number;
  engagement_rate: number;
  is_verified: boolean;
};

// --- CONFIGURACIÓN DE NIVELES ---
const LEVELS = {
  STARTER: { 
    min: 0, 
    name: 'Starter', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50', 
    barColor: 'bg-yellow-600', 
    icon: Star, 
    next: 5 
  },
  PRO: { 
    min: 5, 
    name: 'Pro Creator', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    barColor: 'bg-blue-600', 
    icon: Zap, 
    next: 20 
  },
  ELITE: { 
    min: 20, 
    name: 'Legend', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    barColor: 'bg-purple-600', 
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
    earnings: 0,
    escrow: 0 // Dinero "En camino" (Held)
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Calcular Nivel
  const getCurrentLevel = (count: number) => {
    if (count >= LEVELS.ELITE.min) return LEVELS.ELITE;
    if (count >= LEVELS.PRO.min) return LEVELS.PRO;
    return LEVELS.STARTER;
  };

  const level = getCurrentLevel(stats.completedCampaigns);
  
  // Calcular Progreso
  const range = level.next - level.min;
  const currentInLevel = stats.completedCampaigns - level.min;
  const progress = Math.min(100, Math.max(0, (currentInLevel / range) * 100));
  const jobsToNext = level.next - stats.completedCampaigns;

  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      // 1. Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      
      setProfile((prev) => JSON.stringify(prev) !== JSON.stringify(profileData) ? profileData : prev);

      if (profileData.role === 'brand') {
          // --- MARCA ---
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, budget, status') 
            .eq('brand_id', userId);

          if (campaigns) {
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
                  earnings: 0,
                  escrow: 0
              });
          }
      } else {
          // --- INFLUENCER (FINANZAS REALES) ---
          
          // A. Contar Activas
          const { count: activeCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('influencer_id', userId)
            .in('status', ['pending', 'accepted', 'hired', 'review']);

          // B. Contar Completadas
          const { count: completedCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('influencer_id', userId)
            .eq('status', 'completed');

          // C. Calcular Ganancias REALES
          // Usamos 'applications!inner' para asegurar la relación correcta
          const { data: myAgreements } = await supabase
            .from('agreements')
            .select(`
                payout_amount, 
                payment_status,
                applications!inner(influencer_id) 
            `)
            .eq('applications.influencer_id', userId)
            .in('payment_status', ['released', 'held']); // Traemos Pagado y En Custodia

          let realEarnings = 0;
          let moneyInEscrow = 0;

          if (myAgreements) {
            myAgreements.forEach((agreement: any) => {
                const amount = Number(agreement.payout_amount) || 0;
                
                if (agreement.payment_status === 'released') {
                    realEarnings += amount; // Dinero Tuyo
                } else if (agreement.payment_status === 'held') {
                    moneyInEscrow += amount; // Dinero en Camino
                }
            });
          }

          setStats({
            activeCampaigns: activeCount || 0,
            completedCampaigns: completedCount || 0,
            earnings: realEarnings,
            escrow: moneyInEscrow,
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
    let channelApps: any;
    let channelAgreements: any; // Escuchamos cambios en dinero

    const initDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?mode=login');
          return;
        }

        await fetchDashboardData(user.id);
        setLoading(false);

        // Canales Realtime
        channelProfiles = supabase.channel('dash_prof').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();

        if (profile?.role === 'influencer') {
             // Escuchar cambios en postulaciones (Niveles)
             channelApps = supabase.channel('dash_apps').on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `influencer_id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();
             
             // Escuchar cambios en dinero (Ganancias)
             // Nota: No podemos filtrar agreements por influencer_id directo (está en tabla hija), así que refrescamos con cualquier cambio en agreements y filtramos en fetch
             channelAgreements = supabase.channel('dash_money').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agreements' }, () => fetchDashboardData(user.id)).subscribe();
             
        } else {
             channelApps = supabase.channel('dash_camps').on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `brand_id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();
        }

      } catch (error) {
        console.error('Error inicial:', error);
        setLoading(false);
      }
    };

    initDashboard();

    return () => {
      if (channelProfiles) supabase.removeChannel(channelProfiles);
      if (channelApps) supabase.removeChannel(channelApps);
      if (channelAgreements) supabase.removeChannel(channelAgreements);
    };
  }, [router, fetchDashboardData, profile?.role]);
  
  if (loading) return <div className="p-8 text-center animate-pulse">Cargando tu imperio...</div>;

  const isBrand = profile?.role === 'brand';
  const formatMoney = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-brand-dark)]">
            Hola, <span className="text-[var(--color-brand-orange)] capitalize">{profile?.full_name?.split(' ')[0] || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {isBrand ? 'Gestiona tus campañas.' : 'Resumen de tu carrera.'}
          </p>
        </div>
        
        <div className="w-full md:w-auto">
            {isBrand ? (
                <Link href="/create-campaign" className="btn-primary flex items-center justify-center gap-2 bg-[var(--color-brand-orange)] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/10 hover:shadow-orange-200/50">
                    <Plus size={20}/> Nueva Campaña
                </Link>
            ) : (
                <Link href="/dashboard/campaigns" className="btn-secondary flex items-center justify-center gap-2 bg-[var(--color-brand-dark)] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-gray-900/10">
                    <Search size={20}/> Buscar Trabajo
                </Link>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      {isBrand ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4"><h3 className="text-gray-500 font-medium">Activas</h3><Briefcase className="text-purple-600"/></div>
            <p className="text-3xl font-black text-purple-900">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4"><h3 className="text-gray-500 font-medium">Inversión</h3><DollarSign className="text-green-600"/></div>
            <p className="text-3xl font-black text-green-900 truncate">{formatMoney(stats.totalBudget)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4"><h3 className="text-gray-500 font-medium">Candidatos</h3><Users className="text-blue-600"/></div>
            <p className="text-3xl font-black text-blue-900">{stats.candidates}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          {/* CARD NIVEL */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${level.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-500 font-medium">Nivel</h3>
                <level.icon className={level.color} size={24}/>
              </div>
              <p className={`text-3xl font-black ${level.color} mb-1`}>{level.name}</p>
              
              <div className="w-full bg-gray-100 rounded-full h-2 my-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${level.barColor}`} style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mb-3">{jobsToNext > 0 ? `Faltan ${jobsToNext} trabajos.` : '¡Máximo nivel!'}</p>
              <button onClick={() => setShowBenefits(true)} className="text-xs font-bold text-blue-500 hover:underline flex gap-1 items-center">Ver beneficios <ArrowRight size={12}/></button>
            </div>
          </div>

          {/* CARD GANANCIAS (REALES) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Ganancias</h3>
                <span className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></span>
            </div>
            
            <p className="text-3xl font-black text-[var(--color-brand-dark)] truncate" title={formatMoney(stats.earnings)}>
              {formatMoney(stats.earnings)}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Disponible</span>
                
                {/* Dinero en custodia (Held) */}
                {stats.escrow > 0 && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1" title="Dinero en custodia">
                        <Clock size={10}/> +{formatMoney(stats.escrow)}
                    </span>
                )}
            </div>
          </div>

          {/* CARD SEGUIDORES */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Seguidores</h3>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></span>
            </div>
            <p className="text-3xl font-black text-[var(--color-brand-dark)]">
                {profile?.followers_count?.toLocaleString() || 0}
            </p>
            <span className="text-sm text-gray-400 font-medium">@{profile?.full_name || 'usuario'}</span>
          </div>

        </div>
      )}

      {/* Footer Call to Action */}
      {((isBrand && stats.activeCampaigns === 0) || (!isBrand && !profile?.is_verified)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-8">
            <h3 className="font-bold text-lg text-gray-800">
                {isBrand ? '🚀 Lanza tu primera campaña' : '✨ Completa tu perfil'}
            </h3>
            <Link href={isBrand ? '/create-campaign' : '/dashboard/profile/edit'} className="inline-block mt-4 text-[var(--color-brand-orange)] font-bold hover:underline">
                Empezar ahora →
            </Link>
        </div>
      )}

      {showBenefits && <BenefitsModal onClose={() => setShowBenefits(false)} currentLevel={level.name} completed={stats.completedCampaigns} />}
    </div>
  );
}