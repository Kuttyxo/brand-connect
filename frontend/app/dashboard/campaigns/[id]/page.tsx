'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, MapPin, Briefcase, DollarSign, 
  CheckCircle, AlertCircle, AlertTriangle 
} from 'lucide-react';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Usuario
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false); // NUEVO

  // Estados postulación
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
           .from('profiles')
           .select('*') // Traemos todo para validar
           .eq('id', user.id)
           .single();
        
        if (profile) {
            setUserRole(profile.role);
            
            // --- VALIDACIÓN DE PERFIL COMPLETO ---
            // Requerimos: Foto, Bio, Teléfono y al menos una Red Social
            const hasBasicInfo = profile.avatar_url && profile.bio && profile.phone;
            const hasSocials = profile.instagram_handle || profile.tiktok_handle || profile.facebook_handle;
            
            setIsProfileComplete(!!(hasBasicInfo && hasSocials));
            // -------------------------------------

            if (profile.role === 'influencer') {
                const { data: application } = await supabase
                    .from('applications')
                    .select('id')
                    .eq('campaign_id', id)
                    .eq('influencer_id', user.id)
                    .single();
                if (application) setHasApplied(true);
            }
        }
      }

      const { data: campData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !campData) {
        setLoading(false);
        return;
      }
      setCampaign(campData);

      const { data: brandData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_verified, city, country')
        .eq('id', campData.brand_id)
        .single();
        
      setBrand(brandData);
      setLoading(false);
    };

    if (id) fetchCampaignDetails();
  }, [id]);

  const handleApply = async () => {
    if (!userId || userRole !== 'influencer') return;
    if (!isProfileComplete) return; // Doble seguridad

    if (!confirm('¿Estás seguro de que quieres postular a esta campaña?')) return;

    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
          campaign_id: id,
          influencer_id: userId,
          status: 'pending'
      });

      if (error) throw error;
      setHasApplied(true);
      alert('¡Postulación enviada con éxito! 🚀');
    } catch (error) {
      console.error(error);
      alert('Error al postular.');
    } finally {
      setApplying(false);
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `https://amciorpzfsiyhwraiyum.supabase.co/storage/v1/object/public/avatars/${path}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!campaign) return <div>Campaña no encontrada.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-brand-dark)] mb-6">
        <ArrowLeft size={20} /> Volver
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* IZQUIERDA: INFO CAMPAÑA */}
        <div className="lg:col-span-2 space-y-8">
            <div>
                <div className="flex gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">{campaign.status === 'open' ? 'Activa' : 'Cerrada'}</span>
                    {campaign.categories?.map((cat: string) => <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{cat}</span>)}
                </div>
                <h1 className="text-4xl font-extrabold text-[var(--color-brand-dark)] mb-4">{campaign.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-1"><Clock size={16}/> {new Date(campaign.created_at).toLocaleDateString()}</div>
                    {brand?.city && <div className="flex items-center gap-1"><MapPin size={16}/> {brand.city}, {brand.country}</div>}
                </div>
            </div>
            <div className="prose max-w-none">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Descripción</h3>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">{campaign.description}</p>
            </div>
        </div>

        {/* DERECHA: TARJETA ACCIÓN */}
        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-6">
              
              {/* Marca Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                 <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                    {brand?.avatar_url ? <img src={getAvatarUrl(brand.avatar_url)!} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Briefcase size={20}/></div>}
                 </div>
                 <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Organizado por</p>
                    <h4 className="font-bold text-gray-800">{brand?.full_name} {brand?.is_verified && '✓'}</h4>
                 </div>
              </div>

              {/* Presupuesto */}
              <div className="mb-8">
                 <p className="text-sm text-gray-500 mb-1">Presupuesto</p>
                 <div className="flex items-center gap-2 text-3xl font-extrabold text-[var(--color-brand-dark)]">
                    <DollarSign size={28} className="text-green-500" />
                    {campaign.budget?.toLocaleString('es-CL')}
                 </div>
              </div>

              {/* LOGICA DEL BOTÓN POSTULAR */}
              {userRole === 'influencer' ? (
                <>
                    {/* CASO 1: PERFIL INCOMPLETO */}
                    {!isProfileComplete ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 text-orange-800 text-sm rounded-xl flex gap-2 items-start">
                                <AlertTriangle className="flex-shrink-0 mt-0.5" size={16}/>
                                <span>Debes completar tu perfil (foto, bio, teléfono y redes) para postular.</span>
                            </div>
                            <Link href="/dashboard/profile/edit">
                                <button className="w-full py-3 rounded-xl font-bold text-[var(--color-brand-orange)] border-2 border-[var(--color-brand-orange)] hover:bg-orange-50 transition-all">
                                    Completar Perfil
                                </button>
                            </Link>
                        </div>
                    ) : (
                        // CASO 2: PERFIL LISTO -> BOTÓN NORMAL
                        <button
                            onClick={handleApply}
                            disabled={hasApplied || applying || campaign.status !== 'open'}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                                ${hasApplied 
                                ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' 
                                : 'bg-[var(--color-brand-dark)] text-white hover:bg-[var(--color-brand-orange)] hover:shadow-xl hover:-translate-y-1'
                                }
                                ${(applying || campaign.status !== 'open') && 'opacity-70 cursor-not-allowed'}
                            `}
                        >
                            {applying ? 'Enviando...' : hasApplied ? <><CheckCircle size={20}/> ¡Ya postulaste!</> : 'Postular Ahora'}
                        </button>
                    )}
                </>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">Vista de Marca</div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
}