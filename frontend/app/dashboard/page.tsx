'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
// Agregué iconos nuevos para el diseño premium (Rocket, Sparkles, ArrowRight)
import { Users, DollarSign, Briefcase, Star, Zap, Crown, ArrowRight, Plus, Search, Clock, Rocket, Sparkles } from 'lucide-react'; 
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
  STARTER: { min: 0, name: 'Starter', color: 'text-yellow-600', bg: 'bg-yellow-50', barColor: 'bg-yellow-600', icon: Star, next: 5 },
  PRO:     { min: 5, name: 'Pro Creator', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-600', icon: Zap, next: 20 },
  ELITE:   { min: 20, name: 'Legend', color: 'text-purple-600', bg: 'bg-purple-50', barColor: 'bg-purple-600', icon: Crown, next: 100 }
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);
  
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalCampaignsCreated: 0, // 🆕 NUEVO: Para saber si es REALMENTE nuevo
    totalBudget: 0,
    candidates: 0,
    completedCampaigns: 0, 
    earnings: 0,
    escrow: 0 
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
              // 🆕 Calculamos el total histórico
              const totalCreated = campaigns.length;
              
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
                  totalCampaignsCreated: totalCreated, // 🆕 Guardamos el dato
                  totalBudget: total,
                  candidates: candidatesCount,
                  completedCampaigns: 0,
                  earnings: 0,
                  escrow: 0
              });
          }
      } else {
          // --- INFLUENCER ---
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
            .select(`payout_amount, payment_status, applications!inner(influencer_id)`)
            .eq('applications.influencer_id', userId)
            .in('payment_status', ['released', 'held']);

          let realEarnings = 0;
          let moneyInEscrow = 0;

          if (myAgreements) {
            myAgreements.forEach((agreement: any) => {
                const amount = Number(agreement.payout_amount) || 0;
                if (agreement.payment_status === 'released') realEarnings += amount;
                else if (agreement.payment_status === 'held') moneyInEscrow += amount;
            });
          }

          setStats({
            activeCampaigns: activeCount || 0,
            completedCampaigns: completedCount || 0,
            earnings: realEarnings,
            escrow: moneyInEscrow,
            totalBudget: 0,
            candidates: 0,
            totalCampaignsCreated: 0
          });
      }

    } catch (error) {
      console.error('Error actualizando dashboard:', error);
    }
  }, []);

  useEffect(() => {
    let channelProfiles: any;
    let channelApps: any;
    let channelAgreements: any;

    const initDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?mode=login');
          return;
        }

        await fetchDashboardData(user.id);
        setLoading(false);

        // Canales Realtime (Optimizados)
        channelProfiles = supabase.channel('dash_prof').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();

        if (profile?.role === 'influencer') {
             channelApps = supabase.channel('dash_apps').on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `influencer_id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();
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
  
  if (loading) return <div className="p-8 text-center animate-pulse flex flex-col items-center justify-center h-[50vh] gap-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div><p className="text-gray-400 font-medium">Cargando tu espacio...</p></div>;

  const isBrand = profile?.role === 'brand';
  const formatMoney = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  // 🛡️ LÓGICA CORREGIDA PARA MOSTRAR EL CTA
  // Marca: Solo si NUNCA ha creado una campaña.
  // Influencer: Solo si NO está verificado.
  const showWelcomeCTA = (isBrand && stats.totalCampaignsCreated === 0) || (!isBrand && !profile?.is_verified);

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--color-brand-dark)] tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-600 capitalize">{profile?.full_name?.split(' ')[0] || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            {isBrand ? 'Resumen de tu actividad y campañas.' : 'Tu carrera como creador empieza aquí.'}
          </p>
        </div>
        
        <div className="w-full md:w-auto">
            {isBrand ? (
                <Link href="/create-campaign" className="group w-full md:w-auto flex items-center justify-center gap-3 bg-[var(--color-brand-dark)] text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all">
                    <Plus size={24} className="text-[var(--color-brand-orange)] group-hover:rotate-90 transition-transform"/> Nueva Campaña
                </Link>
            ) : (
                <Link href="/dashboard/campaigns" className="group w-full md:w-auto flex items-center justify-center gap-3 bg-white text-[var(--color-brand-dark)] border-2 border-[var(--color-brand-dark)] px-6 py-4 rounded-2xl font-bold text-lg shadow-sm hover:bg-[var(--color-brand-dark)] hover:text-white transition-all">
                    <Search size={24}/> Buscar Trabajo
                </Link>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      {isBrand ? (
        // VISTA MARCA
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6"><h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Activas</h3><div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform"><Briefcase size={24}/></div></div>
            <p className="text-4xl font-black text-purple-900">{stats.activeCampaigns}</p>
            <p className="text-sm text-purple-500 font-semibold mt-2">{stats.activeCampaigns === 0 ? 'Sin actividad' : 'En curso ahora'}</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6"><h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Inversión Viva</h3><div className="p-3 bg-green-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24}/></div></div>
            <p className="text-4xl font-black text-green-900 truncate" title={formatMoney(stats.totalBudget)}>{formatMoney(stats.totalBudget)}</p>
            <p className="text-sm text-green-500 font-semibold mt-2">Presupuesto comprometido</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6"><h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Candidatos</h3><div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24}/></div></div>
            <p className="text-4xl font-black text-blue-900">{stats.candidates}</p>
            <Link href="/dashboard/candidates" className="text-sm text-blue-500 font-bold mt-2 inline-flex items-center gap-1 hover:underline">Revisar perfiles <ArrowRight size={14}/></Link>
          </div>
        </div>
      ) : (
        // VISTA INFLUENCER
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD NIVEL */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 ${level.bg} rounded-bl-[3rem] -mr-6 -mt-6 opacity-40 transition-transform group-hover:scale-110 group-hover:rotate-12`}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Nivel Actual</h3>
                <div className={`p-3 ${level.bg} ${level.color} rounded-2xl`}><level.icon size={24}/></div>
              </div>
              <p className={`text-4xl font-black ${level.color} mb-2 tracking-tight`}>{level.name}</p>
              
              <div className="w-full bg-slate-100 rounded-full h-3 my-4 overflow-hidden p-0.5">
                  <div className={`h-full rounded-full transition-all duration-1000 ${level.barColor} shadow-sm`} style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">{jobsToNext > 0 ? `Faltan ${jobsToNext} trabajos` : '¡Nivel Máximo!'}</p>
                <button onClick={() => setShowBenefits(true)} className={`text-xs font-black ${level.color} hover:underline flex gap-1 items-center bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100`}>Beneficios <ArrowRight size={12}/></button>
              </div>
            </div>
          </div>

          {/* CARD GANANCIAS */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Ganancias</h3>
                <div className="p-3 bg-green-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24}/></div>
            </div>
            
            <p className="text-4xl font-black text-[var(--color-brand-dark)] truncate" title={formatMoney(stats.earnings)}>
              {formatMoney(stats.earnings)}
            </p>
            
            <div className="flex items-center gap-2 mt-4">
                <span className="text-xs font-bold text-green-700 bg-green-100/80 px-3 py-1 rounded-full">Disponible</span>
                {stats.escrow > 0 && (
                    <span className="text-xs font-bold text-orange-700 bg-orange-100/80 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse" title="Dinero en custodia">
                        <Clock size={12}/> +{formatMoney(stats.escrow)}
                    </span>
                )}
            </div>
          </div>

          {/* CARD SEGUIDORES */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Audiencia</h3>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24}/></div>
            </div>
            <p className="text-4xl font-black text-[var(--color-brand-dark)]">
                {profile?.followers_count?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-slate-500 font-bold mt-2 flex items-center gap-1">
                @{profile?.full_name || 'usuario'} 
                {profile?.is_verified && <Sparkles size={14} className="text-blue-500"/>}
            </p>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* ✨ NUEVO FOOTER CTA PREMIUM ✨ */}
      {/* ========================================== */}
      {showWelcomeCTA && (
        <div className="relative overflow-hidden rounded-[2.5rem] mt-12 p-8 md:p-12 text-center text-white shadow-2xl animate-in fade-in slide-in-from-bottom-6" style={{ background: 'linear-gradient(135deg, var(--color-brand-dark) 0%, #1a1a2e 100%)' }}>
            
            {/* Efectos de fondo sutiles */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--color-brand-orange)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
                    {isBrand ? <Rocket size={48} className="text-[var(--color-brand-orange)] drop-shadow-md"/> : <Sparkles size={48} className="text-yellow-400 drop-shadow-md"/>}
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                    {isBrand ? 'Tu próxima historia de éxito comienza aquí.' : 'Impulsa tu perfil al siguiente nivel.'}
                </h3>
                <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
                    {isBrand 
                        ? 'Conecta con creadores auténticos y lanza campañas que generan impacto real. El mundo está esperando ver tu marca.'
                        : 'Completa tu verificación para acceder a mejores campañas, pagos más rápidos y marcas exclusivas. ¡Destaca entre la multitud!'}
                </p>
                
                <Link href={isBrand ? '/create-campaign' : '/dashboard/profile/edit'} className="group relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    <button className="relative bg-white text-[var(--color-brand-dark)] px-10 py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3">
                        {isBrand ? 'Lanzar Primera Campaña' : 'Verificar mi Perfil Ahora'}
                        <ArrowRight size={24} className="text-[var(--color-brand-orange)] group-hover:translate-x-2 transition-transform"/>
                    </button>
                </Link>
            </div>
        </div>
      )}

      {showBenefits && <BenefitsModal onClose={() => setShowBenefits(false)} currentLevel={level.name} completed={stats.completedCampaigns} />}
    </div>
  );
}