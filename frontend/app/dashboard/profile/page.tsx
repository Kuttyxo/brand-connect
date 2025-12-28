'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit3, MapPin, Instagram, Facebook, Globe, 
  Share2, Hash, User, Building2, Video,
  Star, Zap, Crown, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
// Importamos las librerías de Embed directamente aquí
import { TikTokEmbed, InstagramEmbed, YouTubeEmbed } from 'react-social-media-embed';

type Profile = {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  bio: string;
  city: string;
  country: string;
  categories: string[];
  website: string;
  instagram_handle: string; instagram_url: string;
  tiktok_handle: string; tiktok_url: string;
  facebook_handle: string; facebook_url: string;
  is_verified: boolean;
};

// --- CONFIGURACIÓN DE NIVELES ---
const LEVELS = {
  STARTER: { min: 0, name: 'Starter', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Star },
  PRO:     { min: 5, name: 'Pro Creator', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Zap },
  ELITE:   { min: 20, name: 'Legend', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Crown }
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]); // Estado para los videos
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para insignias
  const [completedJobs, setCompletedJobs] = useState(0);
  const [campaignsCreated, setCampaignsCreated] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      // 1. Obtener Perfil Básico
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Avatar
        if (profileData.avatar_url) {
            if (profileData.avatar_url.startsWith('http')) {
                setAvatarUrl(profileData.avatar_url);
            } else {
                const { data: publicUrl } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(profileData.avatar_url);
                setAvatarUrl(publicUrl.publicUrl);
            }
        }

        // 2. Obtener PORTAFOLIO (Videos) 🎥
        if (profileData.role === 'influencer') { // Solo si es influencer gastamos recursos buscando videos
            const { data: portfolioData } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setPortfolio(portfolioData || []);
        }

        // 3. Estadísticas para Insignias
        if (profileData.role === 'influencer') {
            const { count } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('influencer_id', user.id)
                .eq('status', 'completed');
            setCompletedJobs(count || 0);
        } else {
            const { count } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('brand_id', user.id);
            setCampaignsCreated(count || 0);
        }
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [router]);

  const getCurrentLevel = (count: number) => {
    if (count >= LEVELS.ELITE.min) return LEVELS.ELITE;
    if (count >= LEVELS.PRO.min) return LEVELS.PRO;
    return LEVELS.STARTER;
  };

  if (loading) return <div className="animate-pulse p-8 space-y-4"><div className="h-48 bg-gray-200 rounded-3xl"></div><div className="h-20 bg-gray-200 rounded-xl"></div></div>;

  if (!profile) return <div>No se encontró el perfil.</div>;

  const isBrand = profile.role === 'brand';
  const level = getCurrentLevel(completedJobs);
  const isTrustedBrand = isBrand && profile.website && profile.avatar_url && (profile.is_verified || campaignsCreated > 0);

  return (
    <div className="animate-fade-in pb-20">
      
      {/* 1. HEADER / BANNER */}
      <div className="relative mb-20">
        <div className={`h-48 md:h-64 rounded-3xl shadow-md overflow-hidden relative ${isBrand ? 'bg-gradient-to-r from-slate-900 to-slate-800' : 'bg-gradient-to-r from-[var(--color-brand-dark)] to-[var(--color-brand-orange)]'}`}>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        {/* Tarjeta Flotante con Avatar */}
        <div className="absolute -bottom-16 left-6 md:left-10 flex items-end gap-6 w-full pr-10">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover"/>
                ) : (
                <div className="text-gray-300">
                    {isBrand ? <Building2 size={64} /> : <User size={64} />}
                </div>
                )}
            </div>
            {(profile.is_verified || isTrustedBrand) && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Verificado">
                    <CheckCircle2 size={20} />
                </div>
            )}
          </div>
          
          {/* INSIGNIAS DE NIVEL (Desktop) */}
          <div className="hidden md:flex mb-4 gap-3">
             {isBrand ? (
                 isTrustedBrand && (
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-green-100 text-green-700">
                        <ShieldCheck size={20} />
                        <div>
                            <p className="text-xs font-bold uppercase">Marca Confiable</p>
                            <p className="text-[10px] opacity-80">{campaignsCreated} campañas</p>
                        </div>
                    </div>
                 )
             ) : (
                 <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border bg-white ${level.color} ${level.border}`}>
                     <level.icon size={20} />
                     <div>
                         <p className="text-xs font-bold uppercase">{level.name}</p>
                         <p className="text-[10px] text-gray-500">{completedJobs} trabajos completados</p>
                     </div>
                 </div>
             )}
          </div>
        </div>

        {/* Botón Editar */}
        <div className="absolute -bottom-16 right-4 md:right-0 md:bottom-4 md:relative flex justify-end">
           <Link href="/dashboard/profile/edit">
             <button className="flex items-center gap-2 bg-white text-[var(--color-brand-dark)] px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-gray-50 transition-all border border-gray-100">
               <Edit3 size={18} />
               <span className="hidden md:inline">Editar Perfil</span>
               <span className="md:hidden">Editar</span>
             </button>
           </Link>
        </div>
      </div>

      {/* INSIGNIAS EN MÓVIL */}
      <div className="md:hidden mt-20 mb-6 px-2">
         {isBrand ? (
             isTrustedBrand ? (
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100 text-green-800">
                    <ShieldCheck size={24} />
                    <span className="font-bold text-sm">Empresa Verificada</span>
                </div>
             ) : (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-500">
                    <AlertCircle size={24} />
                    <span className="font-medium text-sm">Sin verificar</span>
                </div>
             )
         ) : (
             <div className={`flex items-center gap-3 p-3 rounded-xl border ${level.bg} ${level.border} ${level.color}`}>
                 <level.icon size={24} />
                 <div>
                     <p className="font-black text-lg leading-none">{level.name}</p>
                     <p className="text-xs opacity-80 font-medium">{completedJobs} trabajos completados</p>
                 </div>
             </div>
         )}
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 md:mt-0">
        
        {/* COLUMNA IZQUIERDA: Info Personal + Portafolio */}
        <div className="md:col-span-2 space-y-8">
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
              {profile.full_name || (isBrand ? 'Empresa Sin Nombre' : 'Usuario Sin Nombre')}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {profile.city}, {profile.country}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBrand ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                {isBrand ? 'Empresa' : 'Influencer'}
              </span>
            </div>
          </div>

          {/* Biografía */}
          {profile.bio && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                {isBrand ? <Building2 size={20} className="text-gray-400"/> : <User size={20} className="text-[var(--color-brand-orange)]" />}
                {isBrand ? 'Sobre la Empresa' : 'Bio'}
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Categorías */}
          {profile.categories && profile.categories.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Hash size={20} className="text-[var(--color-brand-orange)]" />
                {isBrand ? 'Industria' : 'Intereses'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat, index) => (
                  <span key={index} className="px-4 py-2 bg-orange-50 text-[var(--color-brand-orange)] rounded-xl font-medium border border-orange-100">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ✨ SECCIÓN PORTAFOLIO (Renderizado directo, sin componentes extra) ✨ */}
          {/* ========================================================= */}
          {!isBrand && portfolio.length > 0 && (
             <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-lg">
                    <Video size={20} className="text-purple-600"/> Portafolio Destacado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {portfolio.map((item) => (
                        <div key={item.id} className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="flex justify-center items-center bg-gray-50 min-h-[350px] w-full">
                                {item.platform === 'tiktok' && (
                                    <div className="w-full flex justify-center overflow-hidden scale-[0.85] sm:scale-100 origin-top">
                                        <TikTokEmbed url={item.url} width={325} />
                                    </div>
                                )}
                                {item.platform === 'instagram' && (
                                     <div className="w-full flex justify-center">
                                        <InstagramEmbed url={item.url} width={328} captioned />
                                    </div>
                                )}
                                {item.platform === 'youtube' && (
                                    <YouTubeEmbed url={item.url} width="100%" height={220} />
                                )}
                            </div>
                            
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider z-20">
                                {item.platform}
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

        </div>

        {/* COLUMNA DERECHA: Redes y Contacto */}
        <div className="space-y-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Share2 size={20} className="text-[var(--color-brand-orange)]" />
            Conecta
          </h3>
          <div className="grid gap-4">
            
            {/* SITIO WEB (MARCAS) */}
            {profile.website && (
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Globe size={20} /></div>
                    <div><p className="font-bold text-gray-800">Sitio Web</p><p className="text-xs text-gray-500 truncate max-w-[150px]">{profile.website.replace(/^https?:\/\//, '')}</p></div>
                  </div>
                  <div className="text-gray-300 group-hover:text-blue-500 transition-colors">→</div>
                </a>
            )}

            {/* INSTAGRAM */}
            {profile.instagram_handle && (
              <a href={profile.instagram_url || `https://instagram.com/${profile.instagram_handle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center"><Instagram size={20} /></div>
                  <div><p className="font-bold text-gray-800">Instagram</p><p className="text-xs text-gray-500">{profile.instagram_handle}</p></div>
                </div>
                <div className="text-gray-300 group-hover:text-pink-500 transition-colors">→</div>
              </a>
            )}

            {/* TIKTOK */}
            {profile.tiktok_handle && (
              <a href={profile.tiktok_url || `https://tiktok.com/@${profile.tiktok_handle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-black transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 text-black rounded-full flex items-center justify-center"><span className="font-bold">Tk</span></div>
                  <div><p className="font-bold text-gray-800">TikTok</p><p className="text-xs text-gray-500">{profile.tiktok_handle}</p></div>
                </div>
                <div className="text-gray-300 group-hover:text-black transition-colors">→</div>
              </a>
            )}

            {/* FACEBOOK */}
            {profile.facebook_handle && (
              <a href={profile.facebook_url || '#'} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Facebook size={20} /></div>
                  <div><p className="font-bold text-gray-800">Facebook</p><p className="text-xs text-gray-500">{profile.facebook_handle}</p></div>
                </div>
                <div className="text-gray-300 group-hover:text-blue-500 transition-colors">→</div>
              </a>
            )}
          </div>
          
          {/* Alerta si está vacío */}
          {((!isBrand && !profile.instagram_handle && !profile.tiktok_handle) || (isBrand && !profile.website)) && (
             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm border border-yellow-100 flex items-center gap-2">
                <AlertCircle size={16}/> 
                {isBrand ? 'Agrega tu Sitio Web para generar confianza.' : 'Conecta tus redes sociales.'}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}