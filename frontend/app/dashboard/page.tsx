'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { 
  Users, DollarSign, Briefcase, Star, Zap, Crown, ArrowRight, Plus, 
  Search, Clock, Rocket, Sparkles, AlertCircle, Loader2, TrendingUp, LayoutDashboard
} from 'lucide-react'; 
import BenefitsModal from '@/components/BenefitsModal';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- DATOS MOCK GRÁFICO ---
const MOCK_DATA = [
  { date: 'Lun', followers: 10400 },
  { date: 'Mar', followers: 10450 },
  { date: 'Mie', followers: 10800 },
  { date: 'Jue', followers: 11200 },
  { date: 'Vie', followers: 11350 },
  { date: 'Sab', followers: 11500 },
  { date: 'Dom', followers: 11600 },
];

const GrowthChart = ({ role }: { role: string }) => {
  const start = MOCK_DATA[0].followers;
  const end = MOCK_DATA[MOCK_DATA.length - 1].followers;
  const growth = end - start;
  
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mt-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={24} />
            {role === 'brand' ? 'Impacto de Campañas (Alcance)' : 'Crecimiento de Audiencia'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'brand' ? 'Audiencia alcanzada en los últimos 7 días.' : 'Evolución de tu comunidad esta semana.'}
          </p>
        </div>
        <div className="bg-green-50 px-5 py-3 rounded-2xl text-green-700 text-right self-end sm:self-auto border border-green-100">
            <p className="text-3xl font-black tracking-tight">+{growth}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600/80">Seguidores Nuevos</p>
        </div>
      </div>
      <div className="h-[250px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DATA}>
            <defs>
              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
            {/* Usamos 'any' en el formatter para evitar error de tipos de Recharts */}
            <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px' }} 
                cursor={{ stroke: '#10B981', strokeWidth: 2 }} 
                formatter={(value: any) => [value.toLocaleString(), 'Seguidores']} 
            />
            <Area type="monotone" dataKey="followers" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorFollowers)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- TIPOS ---
type Profile = {
  id: string; 
  full_name: string;
  role: string;
  social_handle: string;
  followers_count: number;
  engagement_rate: number;
  is_verified: boolean;
  avatar_url: string | null;
  website: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
};

const LEVELS = {
  STARTER: { min: 0, name: 'Starter', color: 'text-yellow-600', bg: 'bg-yellow-50', barColor: 'bg-yellow-600', icon: Star, next: 5 },
  PRO:     { min: 5, name: 'Pro Creator', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-600', icon: Zap, next: 20 },
  ELITE:   { min: 20, name: 'Legend', color: 'text-purple-600', bg: 'bg-purple-50', barColor: 'bg-purple-600', icon: Crown, next: 100 }
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);
  const [stats, setStats] = useState({
    activeCampaigns: 0, totalCampaignsCreated: 0, totalBudget: 0, candidates: 0, completedCampaigns: 0, earnings: 0, escrow: 0 
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- DEFINICIÓN DE UTILIDADES (CORRECCIÓN AQUÍ) ---
  const formatMoney = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  // --- Lógica de Niveles ---
  const getCurrentLevel = (count: number) => {
    if (count >= LEVELS.ELITE.min) return LEVELS.ELITE;
    if (count >= LEVELS.PRO.min) return LEVELS.PRO;
    return LEVELS.STARTER;
  };
  const level = getCurrentLevel(stats.completedCampaigns);
  const range = level.next - level.min;
  const currentInLevel = stats.completedCampaigns - level.min;
  const progress = Math.min(100, Math.max(0, (currentInLevel / range) * 100));
  const jobsToNext = level.next - stats.completedCampaigns;

  // --- Fetch Data ---
  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileError) throw profileError;
      setProfile((prev) => (JSON.stringify(prev) !== JSON.stringify(profileData) ? profileData : prev));

      if (profileData.role === 'brand') {
          const { data: campaigns } = await supabase.from('campaigns').select('id, budget, status').eq('brand_id', userId);
          if (campaigns) {
              const active = campaigns.filter(c => c.status === 'open').length;
              const total = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
              const totalCreated = campaigns.length;
              let candidatesCount = 0;
              if (campaigns.length > 0) {
                const campaignIds = campaigns.map(c => c.id);
                const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds);
                candidatesCount = count || 0;
              }
              setStats({ activeCampaigns: active, totalCampaignsCreated: totalCreated, totalBudget: total, candidates: candidatesCount, completedCampaigns: 0, earnings: 0, escrow: 0 });
          }
      } else {
          const { count: activeCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('influencer_id', userId).in('status', ['pending', 'accepted', 'hired', 'review']);
          const { count: completedCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('influencer_id', userId).eq('status', 'completed');
          const { data: myAgreements } = await supabase.from('agreements').select(`payout_amount, payment_status, applications!inner(influencer_id)`).eq('applications.influencer_id', userId).in('payment_status', ['released', 'held']);
          let realEarnings = 0;
          let moneyInEscrow = 0;
          if (myAgreements) {
            myAgreements.forEach((agreement: any) => {
                const amount = Number(agreement.payout_amount) || 0;
                if (agreement.payment_status === 'released') realEarnings += amount;
                else if (agreement.payment_status === 'held') moneyInEscrow += amount;
            });
          }
          setStats({ activeCampaigns: activeCount || 0, completedCampaigns: completedCount || 0, earnings: realEarnings, escrow: moneyInEscrow, totalBudget: 0, candidates: 0, totalCampaignsCreated: 0 });
      }
    } catch (error) { console.error(error); }
  }, []);

  // --- Init & Realtime ---
  useEffect(() => {
    let channelProfiles: any;
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth?mode=login'); return; }
      await fetchDashboardData(user.id);
      setLoading(false);
      channelProfiles = supabase.channel('dash_prof').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchDashboardData(user.id)).subscribe();
    };
    initDashboard();
    return () => { if (channelProfiles) supabase.removeChannel(channelProfiles); };
  }, [router, fetchDashboardData]); 

  // --- VALIDACIONES DE ESTADO (ONBOARDING) ---
  const isBrand = profile?.role === 'brand';
  
  // 1. ¿Perfil Incompleto?
  const isProfileIncomplete = isBrand 
      ? (!profile?.avatar_url || !profile?.website || !profile?.bio)
      : (!profile?.avatar_url || !profile?.bio || (!profile?.instagram_handle && !profile?.tiktok_handle));

  // 2. ¿Usuario Nuevo (Sin Actividad)?
  // Marca: No ha creado campañas. Influencer: No ha postulado/completado nada.
  const isNewUser = isBrand 
      ? stats.totalCampaignsCreated === 0 
      : (stats.activeCampaigns === 0 && stats.completedCampaigns === 0);

  if (loading) return <div className="p-8 text-center animate-pulse flex flex-col items-center justify-center h-[50vh] gap-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div><p className="text-gray-400 font-medium">Cargando tu espacio...</p></div>;

  // --- VISTA 1: PERFIL INCOMPLETO (BLOQUEO) ---
  if (isProfileIncomplete) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-2xl w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
                  <div className="mb-6 flex justify-center">
                       <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center animate-bounce">
                           <AlertCircle size={48} />
                       </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">¡Falta poco, {profile?.full_name?.split(' ')[0]}! 🛑</h1>
                  <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                      Para garantizar la calidad de la plataforma, necesitas completar tu perfil antes de acceder al Dashboard.
                      <br/>
                      <span className="text-sm font-bold text-orange-600 mt-2 block">
                          {isBrand ? "Falta: Logo, Sitio Web o Bio." : "Falta: Foto, Bio o Redes Sociales."}
                      </span>
                  </p>
                  <Link href="/dashboard/profile/edit">
                      <button className="bg-[var(--color-brand-dark)] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                          Completar mi Perfil <ArrowRight size={20}/>
                      </button>
                  </Link>
              </div>
          </div>
      );
  }

  // --- VISTA 2: USUARIO NUEVO / SIN ACTIVIDAD (ONBOARDING) ---
  if (isNewUser) {
      return (
        <div className="animate-fade-in pb-24">
             {/* Header Simple */}
             <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-[var(--color-brand-dark)]">
                    Bienvenido a bordo, <span className="text-[var(--color-brand-orange)] capitalize">{profile?.full_name?.split(' ')[0]}</span> 🚀
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Tu perfil está listo. Ahora demos el siguiente paso.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 {/* Tarjeta de Acción Principal */}
                 <div className="bg-[var(--color-brand-dark)] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                     <div className="relative z-10">
                         <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                             {isBrand ? <Rocket size={32} className="text-[var(--color-brand-orange)]"/> : <Search size={32} className="text-[var(--color-brand-orange)]"/>}
                         </div>
                         <h2 className="text-3xl font-bold mb-4">{isBrand ? 'Lanza tu Primera Campaña' : 'Busca tu Primer Trabajo'}</h2>
                         <p className="text-white/70 mb-8 text-lg">
                             {isBrand 
                                ? 'Define tu presupuesto, describe lo que necesitas y recibe propuestas de influencers verificados en minutos.' 
                                : 'Explora campañas activas de marcas que buscan tu talento. Aplica y empieza a monetizar.'}
                         </p>
                         <Link href={isBrand ? "/create-campaign" : "/dashboard/campaigns"}>
                             <button className="bg-white text-[var(--color-brand-dark)] px-8 py-4 rounded-xl font-black text-lg hover:bg-[var(--color-brand-orange)] hover:text-white transition-all flex items-center gap-2">
                                 {isBrand ? 'Crear Campaña' : 'Explorar Campañas'} <ArrowRight size={20}/>
                             </button>
                         </Link>
                     </div>
                 </div>

                 {/* Tarjeta Informativa / Tutorial (Placeholder) */}
                 <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center h-full">
                     <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-gray-400"/> Tu Dashboard
                     </h3>
                     <p className="text-gray-500 mb-6">
                         Esta pantalla está vacía por ahora, pero pronto verás aquí:
                     </p>
                     <ul className="space-y-4">
                         <li className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                             <div className="bg-green-100 p-2 rounded-lg text-green-600"><DollarSign size={18}/></div>
                             <span className="font-medium">Tus ganancias y presupuesto en tiempo real.</span>
                         </li>
                         <li className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                             <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Briefcase size={18}/></div>
                             <span className="font-medium">El estado de tus campañas activas.</span>
                         </li>
                         <li className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                             <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><TrendingUp size={18}/></div>
                             <span className="font-medium">Gráficos de crecimiento de audiencia.</span>
                         </li>
                     </ul>
                 </div>
             </div>
        </div>
      );
  }

  // --- VISTA 3: DASHBOARD COMPLETO (USUARIO ACTIVO) ---
  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--color-brand-dark)] tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-600 capitalize">{profile?.full_name?.split(' ')[0] || 'Usuario'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            {isBrand ? 'Panel de control de la Marca.' : 'Tu carrera como creador empieza aquí.'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Nivel */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 ${level.bg} rounded-bl-[3rem] -mr-6 -mt-6 opacity-40 transition-transform group-hover:scale-110 group-hover:rotate-12`}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Nivel Actual</h3>
                <div className={`p-3 ${level.bg} ${level.color} rounded-2xl`}><level.icon size={24}/></div>
              </div>
              <p className={`text-4xl font-black ${level.color} mb-2 tracking-tight`}>{level.name}</p>
              <div className="w-full bg-slate-100 rounded-full h-3 my-4 overflow-hidden p-0.5"><div className={`h-full rounded-full transition-all duration-1000 ${level.barColor} shadow-sm`} style={{ width: `${progress}%` }}></div></div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">{jobsToNext > 0 ? `Faltan ${jobsToNext} trabajos` : '¡Nivel Máximo!'}</p>
                <button onClick={() => setShowBenefits(true)} className={`text-xs font-black ${level.color} hover:underline flex gap-1 items-center bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100`}>Beneficios <ArrowRight size={12}/></button>
              </div>
            </div>
          </div>
          {/* Card Ganancias */}
          <Link href="/dashboard/wallet" className="block group">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--color-brand-orange)] transition-all cursor-pointer relative overflow-hidden h-full">
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand-orange)]">
                    <ArrowRight size={24} className="-rotate-45"/>
                </div>
                <div className="flex justify-between mb-6">
                    <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm group-hover:text-[var(--color-brand-orange)] transition-colors">Ganancias</h3>
                    <div className="p-3 bg-green-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24}/></div>
                </div>
                <p className="text-4xl font-black text-[var(--color-brand-dark)] truncate" title={formatMoney(stats.earnings)}>
                    {formatMoney(stats.earnings)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-xs font-bold text-green-700 bg-green-100/80 px-3 py-1 rounded-full">Disponible</span>
                    {stats.escrow > 0 && (
                        <span className="text-xs font-bold text-orange-700 bg-orange-100/80 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse" title="Dinero en custodia">
                            <Clock size={12}/> +{formatMoney(stats.escrow)}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-6 font-bold group-hover:text-[var(--color-brand-orange)] transition-colors flex items-center gap-1">
                    Ver Billetera y Retirar <ArrowRight size={12}/>
                </p>
            </div>
          </Link>
          {/* Card Seguidores */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between mb-6">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Audiencia</h3>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24}/></div>
            </div>
            <p className="text-4xl font-black text-[var(--color-brand-dark)]">{profile?.followers_count?.toLocaleString() || 0}</p>
            <p className="text-sm text-slate-500 font-bold mt-2 flex items-center gap-1">@{profile?.social_handle || 'usuario'} {profile?.is_verified && <Sparkles size={14} className="text-blue-500"/>}</p>
          </div>
        </div>
      )}

      {/* Gráfico de Crecimiento */}
      {profile && <GrowthChart role={profile.role} />}

      {showBenefits && <BenefitsModal onClose={() => setShowBenefits(false)} currentLevel={level.name} completed={stats.completedCampaigns} />}
    </div>
  );
}