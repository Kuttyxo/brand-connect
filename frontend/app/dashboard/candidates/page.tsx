'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Check, X, Briefcase, Calendar, MessageSquare, Eye, MapPin, Instagram, Facebook } from 'lucide-react';

const SUPABASE_PROJECT_URL = "https://amciorpzfsiyhwraiyum.supabase.co";

export default function CandidatesPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal de Perfil
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Obtener IDs de mis campañas
    const { data: myCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', user.id);
    if (!myCampaigns || myCampaigns.length === 0) { setLoading(false); return; }

    const campaignIds = myCampaigns.map(c => c.id);

    // 2. Obtener postulaciones
    const { data } = await supabase
      .from('applications')
      .select(`*, influencer:profiles(*), campaign:campaigns(title, budget)`)
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };

  // Función: Aceptar y Redirigir al Chat
  const handleAcceptAndChat = async (appId: string) => {
    // 1. Actualizar estado a 'accepted'
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId);
    
    // 2. Redirigir al chat
    router.push(`/dashboard/chat/${appId}`);
  };

  const handleReject = async (appId: string) => {
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
    fetchCandidates(); // Recargar lista
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${SUPABASE_PROJECT_URL}/storage/v1/object/public/avatars/${path}`;
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20 relative">
      
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Postulaciones</h1>
          <p className="text-gray-500 mt-1">Revisa perfiles y negocia con influencers.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-medium">
           Pendientes: <span className="text-[var(--color-brand-orange)] font-bold">{applications.filter(a => a.status === 'pending').length}</span>
        </div>
      </div>

      {/* Lista de Candidatos */}
      {loading ? (
        <div className="text-center p-10">Cargando...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="text-4xl mb-4">📭</div>
           <h3 className="text-xl font-bold text-gray-800">Bandeja vacía</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                
                {/* Info Candidato */}
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0">
                     {app.influencer.avatar_url ? (
                        <img src={getAvatarUrl(app.influencer.avatar_url)!} className="w-full h-full object-cover"/>
                     ) : <div className="w-full h-full flex items-center justify-center text-gray-400"><User /></div>}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{app.influencer.full_name}</h3>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                       <span className="flex items-center gap-1"><Briefcase size={14}/> {app.campaign.title}</span>
                       
                       {/* BOTÓN VER PERFIL */}
                       <button 
                         onClick={() => setSelectedProfile(app.influencer)}
                         className="flex items-center gap-1 text-[var(--color-brand-orange)] font-bold hover:underline"
                       >
                         <Eye size={14}/> Ver Perfil Completo
                       </button>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                  {app.status === 'pending' ? (
                    <>
                      <button onClick={() => handleReject(app.id)} className="px-4 py-2 rounded-xl text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors">
                        Rechazar
                      </button>
                      <button 
                        onClick={() => handleAcceptAndChat(app.id)}
                        className="px-6 py-2 rounded-xl text-white font-bold bg-[var(--color-brand-dark)] hover:bg-green-600 transition-colors shadow-md flex items-center gap-2"
                      >
                        <MessageSquare size={18}/> Aceptar y Chatear
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => router.push(`/dashboard/chat/${app.id}`)}
                      className="px-4 py-2 rounded-xl text-[var(--color-brand-dark)] font-bold border border-[var(--color-brand-dark)] hover:bg-gray-50 flex items-center gap-2"
                    >
                      <MessageSquare size={18}/> Ir al Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE PERFIL --- */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
            
            {/* Botón Cerrar */}
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-gray-100 z-10 transition-colors"
            >
              <X size={20}/>
            </button>

            {/* Header Modal */}
            <div className="h-32 bg-gradient-to-r from-[var(--color-brand-orange)] to-pink-500 relative"></div>
            
            <div className="px-8 pb-8 -mt-16">
              {/* Avatar Grande */}
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden mx-auto mb-4">
                 {selectedProfile.avatar_url ? (
                    <img src={getAvatarUrl(selectedProfile.avatar_url)!} className="w-full h-full object-cover"/>
                 ) : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><User size={40}/></div>}
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProfile.full_name}</h2>
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-1">
                  <MapPin size={14}/> {selectedProfile.city || 'Ubicación no especificada'}
                </div>
              </div>

              {/* Stats / Bio */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed text-center italic">
                  "{selectedProfile.bio || 'Sin biografía disponible.'}"
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {selectedProfile.instagram_handle && (
                     <div className="flex items-center gap-2 p-3 bg-pink-50 text-pink-700 rounded-xl justify-center font-bold text-sm">
                        <Instagram size={16}/> {selectedProfile.instagram_handle}
                     </div>
                   )}
                   {selectedProfile.tiktok_handle && (
                     <div className="flex items-center gap-2 p-3 bg-gray-100 text-gray-800 rounded-xl justify-center font-bold text-sm">
                        <span className="font-bold">Tk</span> {selectedProfile.tiktok_handle}
                     </div>
                   )}
                </div>

                {/* Categorías */}
                {selectedProfile.categories && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {selectedProfile.categories.map((cat: string) => (
                      <span key={cat} className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}