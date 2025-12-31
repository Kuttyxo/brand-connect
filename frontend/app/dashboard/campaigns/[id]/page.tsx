'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, MapPin, Briefcase, DollarSign, 
  CheckCircle, AlertTriangle, Users, TrendingUp, Eye, Heart, MessageSquare
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- SUB-COMPONENTE: GRÁFICO DE CAMPAÑA (REALTIME ⚡) ---
const CampaignPerformanceChart = ({ campaignId }: { campaignId: string }) => {
    const [data, setData] = useState<any[]>([]);
    
    // Función de carga
    const fetchStats = useCallback(async () => {
        const { data: history } = await supabase
            .from('campaign_stats_snapshots')
            .select('recorded_at, total_views')
            .eq('campaign_id', campaignId)
            .order('recorded_at', { ascending: true })
            .limit(30); // Últimos 30 puntos

        if (history && history.length > 0) {
            const formatted = history.map(item => ({
                date: new Date(item.recorded_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                views: item.total_views
            }));
            
            // Evitar re-render si es idéntico
            setData(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(formatted)) return formatted;
                return prev;
            });
        }
    }, [campaignId]);

    useEffect(() => {
        fetchStats();

        // SUSCRIPCIÓN REALTIME
        const channel = supabase.channel(`camp-stats-${campaignId}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'campaign_stats_snapshots', filter: `campaign_id=eq.${campaignId}` }, 
                (payload) => {
                    console.log("⚡ Campaña: Dato nuevo!", payload.new);
                    fetchStats(); 
                }
            )
            .subscribe();
        
        // POLLING (Respaldo)
        const interval = setInterval(fetchStats, 4000);

        return () => { supabase.removeChannel(channel); clearInterval(interval); };
    }, [campaignId, fetchStats]);

    // Si no hay datos (Campaña nueva)
    if (data.length === 0) return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col items-center justify-center min-h-[250px]">
            <TrendingUp className="text-gray-200 mb-2" size={48}/>
            <p className="text-gray-400 font-medium">Esperando datos de tráfico...</p>
            <p className="text-xs text-gray-300">El gráfico aparecerá cuando los influencers suban contenido.</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-purple-600" size={20}/> Rendimiento en Vivo
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} minTickGap={30}/>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [value.toLocaleString(), 'Vistas']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="#8b5cf6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorViews)" 
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTE: TABLA DE INFLUENCERS (SOLO MARCA) ---
const InfluencersTable = ({ campaignId }: { campaignId: string }) => {
    const [applicants, setApplicants] = useState<any[]>([]);

    useEffect(() => {
        const fetchApplicants = async () => {
            const { data } = await supabase
                .from('applications')
                .select(`
                    *,
                    profiles:influencer_id (full_name, avatar_url, instagram_handle, followers_count)
                `)
                .eq('campaign_id', campaignId);
            if (data) setApplicants(data);
        };
        fetchApplicants();
    }, [campaignId]);

    if (applicants.length === 0) return (
        <div className="p-8 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
            <Users className="mx-auto text-gray-300 mb-2" size={32}/>
            <p className="text-gray-500 font-medium">Aún no hay postulantes.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Influencers ({applicants.length})</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-400 font-bold uppercase text-left">
                        <tr>
                            <th className="px-6 py-4">Perfil</th>
                            <th className="px-6 py-4">Seguidores</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {applicants.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            {app.profiles?.avatar_url && <img src={app.profiles.avatar_url} className="w-full h-full object-cover"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{app.profiles?.full_name}</p>
                                            <p className="text-xs text-gray-500">@{app.profiles?.instagram_handle || 'usuario'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                    {app.profiles?.followers_count?.toLocaleString() || 0}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
                                        ${app.status === 'hired' ? 'bg-green-100 text-green-700' : 
                                          app.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                          'bg-yellow-100 text-yellow-700'}`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/messages?chat=${app.id}`}>
                                        <button className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-all">
                                            <MessageSquare size={18}/>
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Usuario
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Estados postulación
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Determinar si soy el dueño de la campaña
  const isOwner = userRole === 'brand' && userId === campaign?.brand_id;

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (profile) {
            setUserRole(profile.role);
            const hasBasicInfo = profile.avatar_url && profile.bio && profile.phone;
            const hasSocials = profile.instagram_handle || profile.tiktok_handle || profile.facebook_handle;
            setIsProfileComplete(!!(hasBasicInfo && hasSocials));

            if (profile.role === 'influencer') {
                const { data: application } = await supabase.from('applications').select('id').eq('campaign_id', id).eq('influencer_id', user.id).single();
                if (application) setHasApplied(true);
            }
        }
      }

      const { data: campData, error } = await supabase.from('campaigns').select('*').eq('id', id).single();

      if (error || !campData) {
        setLoading(false);
        return;
      }
      setCampaign(campData);

      const { data: brandData } = await supabase.from('profiles').select('full_name, avatar_url, is_verified, city, country').eq('id', campData.brand_id).single();
      setBrand(brandData);
      setLoading(false);
    };

    if (id) fetchCampaignDetails();
  }, [id]);

  const handleApply = async () => {
    if (!userId || userRole !== 'influencer') return;
    if (!isProfileComplete) return;

    if (!confirm('¿Estás seguro de que quieres postular a esta campaña?')) return;

    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({ campaign_id: id, influencer_id: userId, status: 'pending' });
      if (error) throw error;
      setHasApplied(true);
      alert('¡Postulación enviada con éxito! 🚀');
    } catch (error) { console.error(error); alert('Error al postular.'); } 
    finally { setApplying(false); }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `https://amciorpzfsiyhwraiyum.supabase.co/storage/v1/object/public/avatars/${path}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!campaign) return <div>Campaña no encontrada.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-brand-dark)] mb-6">
        <ArrowLeft size={20} /> Volver
      </Link>

      {/* HEADER DE CAMPAÑA (Común para todos) */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${campaign.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{campaign.status === 'open' ? 'Activa' : 'Cerrada'}</span>
                    {campaign.categories?.map((cat: string) => <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{cat}</span>)}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-[var(--color-brand-dark)] mb-2">{campaign.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Clock size={16}/> {new Date(campaign.created_at).toLocaleDateString()}</div>
                    {brand?.city && <div className="flex items-center gap-1"><MapPin size={16}/> {brand.city}, {brand.country}</div>}
                  </div>
              </div>
              <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Presupuesto Total</p>
                  <p className="text-4xl font-black text-[var(--color-brand-dark)] tracking-tight">{campaign.budget?.toLocaleString('es-CL', {style:'currency', currency:'CLP'})}</p>
              </div>
          </div>
      </div>

      {/* --- VISTA DE DUEÑO (MARCA) --- */}
      {isOwner ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Izquierda: Gráfico y Detalles */}
              <div className="lg:col-span-2">
                  <CampaignPerformanceChart campaignId={id as string} />
                  <InfluencersTable campaignId={id as string} />
              </div>
              
              {/* Columna Derecha: Resumen Rápido */}
              <div className="space-y-6">
                  <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                       <div className="relative z-10">
                           <h3 className="font-bold text-purple-200 mb-4">Estado General</h3>
                           <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                   <span>Vistas Totales</span>
                                   <span className="font-black text-2xl">28.5K</span>
                               </div>
                               <div className="flex justify-between items-center">
                                   <span>Engagement</span>
                                   <span className="font-black text-2xl">4.2%</span>
                               </div>
                           </div>
                       </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4">Descripción</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{campaign.description}</p>
                  </div>
              </div>
          </div>
      ) : (
          /* --- VISTA DE INFLUENCER / PUBLICO --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles de la Campaña</h3>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed text-lg">{campaign.description}</p>
                    
                    {campaign.requirements && (
                        <div className="mt-8">
                            <h4 className="font-bold text-gray-800 mb-3">Requisitos</h4>
                            <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{campaign.requirements}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-1">
               <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-6">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                     <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        {brand?.avatar_url ? <img src={getAvatarUrl(brand.avatar_url)!} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Briefcase size={20}/></div>}
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Organizado por</p>
                        <h4 className="font-bold text-gray-800">{brand?.full_name} {brand?.is_verified && '✓'}</h4>
                     </div>
                  </div>

                  {userRole === 'influencer' ? (
                    <>
                        {!isProfileComplete ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-orange-50 text-orange-800 text-sm rounded-xl flex gap-2 items-start">
                                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={16}/>
                                    <span>Debes completar tu perfil para postular.</span>
                                </div>
                                <Link href="/dashboard/profile/edit">
                                    <button className="w-full py-3 rounded-xl font-bold text-[var(--color-brand-orange)] border-2 border-[var(--color-brand-orange)] hover:bg-orange-50 transition-all">Completar Perfil</button>
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleApply}
                                disabled={hasApplied || applying || campaign.status !== 'open'}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                                    ${hasApplied ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' : 'bg-[var(--color-brand-dark)] text-white hover:bg-[var(--color-brand-orange)] hover:shadow-xl hover:-translate-y-1'}
                                    ${(applying || campaign.status !== 'open') && 'opacity-70 cursor-not-allowed'}
                                `}
                            >
                                {applying ? 'Enviando...' : hasApplied ? <><CheckCircle size={20}/> ¡Ya postulaste!</> : 'Postular Ahora'}
                            </button>
                        )}
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500 font-medium">Inicia sesión como Influencer para postular.</div>
                  )}
               </div>
            </div>
          </div>
      )}
    </div>
  );
}