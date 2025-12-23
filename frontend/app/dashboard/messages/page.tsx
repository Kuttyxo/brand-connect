'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquare, User, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

const SUPABASE_PROJECT_URL = "https://amciorpzfsiyhwraiyum.supabase.co";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Traemos todas las postulaciones ACEPTADAS (que son las que tienen chat)
      // Gracias a RLS, si soy influencer veo las mías, si soy marca veo las de mis campañas.
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          influencer:profiles!influencer_id(*),
          campaign:campaigns(
            title,
            brand:profiles!brand_id(*)
          )
        `)
        .neq('status', 'pending')
        .neq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      setConversations(data || []);
      setLoading(false);
    };

    fetchConversations();
  }, []);

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${SUPABASE_PROJECT_URL}/storage/v1/object/public/avatars/${path}`;
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-orange-500"/></div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Tus Mensajes</h1>
        <p className="text-gray-500">Conversaciones activas de tus campañas.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
             <MessageSquare size={30} />
           </div>
           <h3 className="text-lg font-bold text-gray-700">No hay chats activos</h3>
           <p className="text-gray-400 text-sm mt-1">
             Los chats aparecen cuando una postulación es <span className="text-green-600 font-bold">Aceptada</span>.
           </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv) => {
            // Lógica para determinar "El Otro":
            // Si soy el influencer, el otro es la Marca. Si soy la marca, el otro es el Influencer.
            const isMeInfluencer = conv.influencer_id === userId;
            const otherUser = isMeInfluencer ? conv.campaign.brand : conv.influencer;
            const roleLabel = isMeInfluencer ? 'Marca' : 'Influencer';

            return (
              <Link key={conv.id} href={`/dashboard/chat/${conv.id}`}>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all group flex items-center gap-4 cursor-pointer">
                  
                  {/* Avatar del Otro */}
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                     {otherUser?.avatar_url ? (
                        <img src={getAvatarUrl(otherUser.avatar_url)!} className="w-full h-full object-cover"/>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24}/></div>
                     )}
                  </div>

                  {/* Info Central */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-lg">{otherUser?.full_name || 'Usuario'}</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {roleLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Briefcase size={14} className="text-[var(--color-brand-orange)]"/>
                      <span>Campaña: <strong className="text-gray-700">{conv.campaign.title}</strong></span>
                    </div>
                  </div>

                  {/* Flecha Acción */}
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[var(--color-brand-dark)] group-hover:text-white transition-colors">
                    <ArrowRight size={18} />
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}