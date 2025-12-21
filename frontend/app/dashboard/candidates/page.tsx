'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  User, Check, X, Briefcase, MessageSquare, Eye, 
  MapPin, Instagram, Facebook, Share2, Hash 
} from 'lucide-react';

const SUPABASE_PROJECT_URL = "https://amciorpzfsiyhwraiyum.supabase.co";

export default function CandidatesPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', user.id);
    if (!myCampaigns || myCampaigns.length === 0) { setLoading(false); return; }

    const campaignIds = myCampaigns.map(c => c.id);

    const { data } = await supabase
      .from('applications')
      .select(`*, influencer:profiles(*), campaign:campaigns(title, budget)`)
      .in('campaign_id', campaignIds)
      // FILTRO IMPORTANTE: No traemos los rechazados para que no ensucien la lista
      .neq('status', 'rejected') 
      .order('created_at', { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };

  const handleAcceptAndChat = async (appId: string) => {
    // Actualización Optimista: Cambiamos visualmente a 'accepted'
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a));
    
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId);
    router.push(`/dashboard/chat/${appId}`);
  };

  const handleReject = async (appId: string) => {
    // EFECTO VISUAL: Lo eliminamos de la lista inmediatamente
    setApplications(prev => prev.filter(a => a.id !== appId));

    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
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

      {/* Lista */}
      {loading ? (
        <div className="text-center p-10">Cargando...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="text-4xl mb-4">📭</div>
           <h3 className="text-xl font-bold text-gray-800">Todo limpio</h3>
           <p className="text-gray-400 text-sm mt-1">No tienes postulaciones pendientes de revisión.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0">
                     {app.influencer.avatar_url ? <img src={getAvatarUrl(app.influencer.avatar_url)!} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><User /></div>}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{app.influencer.full_name}</h3>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                       <span className="flex items-center gap-1"><Briefcase size={14}/> {app.campaign.title}</span>
                       <button onClick={() => setSelectedProfile(app.influencer)} className="flex items-center gap-1 text-[var(--color-brand-orange)] font-bold hover:underline"><Eye size={14}/> Ver Perfil Completo</button>
                    </div>
                  </div>
                </div>

                {/* LOGICA DE BOTONES CORREGIDA */}
                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                  
                  {/* Solo mostrar opciones de decisión si está PENDIENTE */}
                  {app.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleReject(app.id)} 
                        className="px-4 py-2 rounded-xl text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button 
                        onClick={() => handleAcceptAndChat(app.id)} 
                        className="px-6 py-2 rounded-xl text-white font-bold bg-[var(--color-brand-dark)] hover:bg-green-600 transition-colors shadow-md flex items-center gap-2"
                      >
                        <MessageSquare size={18}/> Aceptar y Chatear
                      </button>
                    </>
                  )}

                  {/* Solo mostrar CHAT si está ACEPTADO */}
                  {app.status === 'accepted' && (
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

      {/* --- MODAL DE PERFIL (Mismo código de antes) --- */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative my-8">
            <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-gray-100 z-20 transition-colors shadow-sm text-gray-600"><X size={24}/></button>

            <div className="h-40 md:h-52 bg-gradient-to-r from-[var(--color-brand-dark)] to-[var(--color-brand-orange)] relative">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <div className="px-6 pb-8 md:px-10">
               <div className="flex flex-col md:flex-row items-end -mt-16 mb-6 gap-6">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden relative z-10">
                     {selectedProfile.avatar_url ? <img src={getAvatarUrl(selectedProfile.avatar_url)!} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><User size={64}/></div>}
                  </div>
                  <div className="flex-1 pb-2 text-center md:text-left">
                     <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">{selectedProfile.full_name} {selectedProfile.is_verified && <span className="text-blue-500">✓</span>}</h2>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 mt-1">
                        {selectedProfile.city && <span className="flex items-center gap-1"><MapPin size={16}/> {selectedProfile.city}, {selectedProfile.country}</span>}
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider">Influencer</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                     {selectedProfile.bio && <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800"><User size={20} className="text-[var(--color-brand-orange)]" /> Bio</h3><p className="text-gray-600 leading-relaxed whitespace-pre-line">{selectedProfile.bio}</p></div>}
                     {selectedProfile.categories && selectedProfile.categories.length > 0 && <div><h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Hash size={20} className="text-[var(--color-brand-orange)]" /> Intereses</h3><div className="flex flex-wrap gap-2">{selectedProfile.categories.map((cat: string, i: number) => (<span key={i} className="px-4 py-2 bg-orange-50 text-[var(--color-brand-orange)] rounded-xl font-medium border border-orange-100">{cat}</span>))}</div></div>}
                  </div>
                  <div className="space-y-4">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2"><Share2 size={20} className="text-[var(--color-brand-orange)]" /> Conecta</h3>
                     {selectedProfile.instagram_handle ? <a href={selectedProfile.instagram_url || '#'} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-200 transition-all"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center"><Instagram size={20} /></div><div><p className="font-bold text-gray-800">Instagram</p><p className="text-xs text-gray-500">{selectedProfile.instagram_handle}</p></div></div><div className="text-gray-300 group-hover:text-pink-500">→</div></a> : null}
                     {selectedProfile.tiktok_handle ? <a href={selectedProfile.tiktok_url || '#'} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-black transition-all"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 text-black rounded-full flex items-center justify-center"><span className="font-bold">Tk</span></div><div><p className="font-bold text-gray-800">TikTok</p><p className="text-xs text-gray-500">{selectedProfile.tiktok_handle}</p></div></div><div className="text-gray-300 group-hover:text-black">→</div></a> : null}
                     {selectedProfile.facebook_handle ? <a href={selectedProfile.facebook_url || '#'} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Facebook size={20} /></div><div><p className="font-bold text-gray-800">Facebook</p><p className="text-xs text-gray-500">{selectedProfile.facebook_handle}</p></div></div><div className="text-gray-300 group-hover:text-blue-500">→</div></a> : null}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}