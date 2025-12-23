'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, User, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import CreateOfferModal from '@/components/CreateOfferModal'; 
import ReviewOfferModal from '@/components/ReviewOfferModal';

export default function ChatPage() {
  const { id } = useParams(); // ID de la Application
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null); 
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // --- NUEVOS ESTADOS PARA V2 ---
  const [appStatus, setAppStatus] = useState<string>(''); // Estado actual (accepted, offered, hired...)
  const [userRole, setUserRole] = useState<'brand' | 'influencer' | null>(null); // Rol del usuario actual
  const [showOfferModal, setShowOfferModal] = useState(false); // Controlar el modal
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar datos iniciales
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Obtener info de la postulación para saber con quién hablo
      const { data: appData } = await supabase
        .from('applications')
        .select(`
          *,
          influencer:profiles!influencer_id(*),
          campaign:campaigns(*, brand:profiles!brand_id(*))
        `)
        .eq('id', id)
        .single();

      if (appData) {
        // Determinar Rol
        const isBrand = appData.campaign.brand_id === user.id;
        setUserRole(isBrand ? 'brand' : 'influencer');
        
        // Determinar Estado
        setAppStatus(appData.status);

        // Si soy la marca, hablo con el influencer. Si soy influencer, hablo con la marca.
        setOtherUser(isBrand ? appData.influencer : appData.campaign.brand);
      }

      // Cargar mensajes existentes
      fetchMessages();
      setLoading(false);
    };

    initChat();

    // SUSCRIPCIÓN EN TIEMPO REAL (Magia de Supabase) ✨
    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `application_id=eq.${id}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Scroll al fondo al llegar mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const text = newMessage;
    setNewMessage(''); // Limpiar input rápido

    await supabase.from('messages').insert({
      application_id: id,
      sender_id: userId,
      content: text
    });
  };
  
  // Callback cuando se envía una oferta exitosamente
  const handleOfferSent = () => {
      setAppStatus('offered'); // Actualizamos visualmente el estado
      // Opcional: Recargar mensajes para ver el mensaje automático
      fetchMessages();
  };

const handleDecisionMade = (decision: string) => {
      if (decision === 'accepted') {
          setAppStatus('hired'); // Visualmente cambiamos a CONTRATADO
      } else {
          setAppStatus('accepted'); // Volvemos a negociar
      }
      fetchMessages(); // Recargamos para ver el mensaje automático
  };

  if (loading) return <div className="p-10 text-center">Cargando chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 relative">
      
      {/* Header del Chat */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/candidates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                {otherUser?.avatar_url ? (
                    <img src={`https://amciorpzfsiyhwraiyum.supabase.co/storage/v1/object/public/avatars/${otherUser.avatar_url}`} className="w-full h-full object-cover"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20}/></div>
                )}
            </div>
            <div>
                <h2 className="font-bold text-gray-800 leading-tight">{otherUser?.full_name || 'Usuario'}</h2>
                
                {/* Badges de Estado */}
                {appStatus === 'accepted' && <p className="text-xs text-green-500 font-medium">● Negociando</p>}
                {appStatus === 'offered' && <p className="text-xs text-orange-500 font-medium flex items-center gap-1"><Clock size={10}/> Esperando respuesta a oferta</p>}
                {appStatus === 'hired' && <p className="text-xs text-blue-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> CONTRATADO</p>}
            </div>
            </div>
        </div>

        {/* --- BOTÓN DE ACCIÓN (SOLO MARCA) --- */}
        {userRole === 'brand' && appStatus === 'accepted' && (
            <button 
                onClick={() => setShowOfferModal(true)}
                className="bg-[var(--color-brand-dark)] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5"
            >
                <FileText size={16} />
                Generar Acuerdo
            </button>
        )}
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          // Detectar si es un mensaje de sistema (Oferta)
          const isSystemMessage = msg.content.includes('📝 PROPUESTA DE CONTRATO') || msg.content.includes('📝 HE ENVIADO UNA OFERTA');

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                isSystemMessage 
                    ? 'bg-gray-800 text-white border-2 border-[var(--color-brand-orange)]' // Estilo especial para ofertas
                    : isMe 
                        ? 'bg-[var(--color-brand-orange)] text-white rounded-br-none' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.content}
                
                {/* Si es una oferta y soy el influencer, mostrar botón (Simulado por ahora) */}
                {isSystemMessage && !isMe && userRole === 'influencer' && appStatus === 'offered' && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs opacity-70 mb-2 italic">La marca espera tu confirmación.</p>
                        <button
                        onClick={() => setShowReviewModal(true)}
                        className="w-full bg-white text-gray-900 font-bold py-2 rounded hover:bg-green-50 transition-colors"
                        >
                            Ver Detalles y Aceptar
                        </button>
                    </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-[var(--color-brand-dark)] text-white p-3 rounded-xl hover:bg-[var(--color-brand-orange)] transition-colors disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>

      {/* --- MODAL DE OFERTA --- */}
      {showOfferModal && (
        <CreateOfferModal 
            applicationId={id as string}
            influencerName={otherUser?.full_name || 'Influencer'}
            onClose={() => setShowOfferModal(false)}
            onOfferSent={handleOfferSent}
        />
      )}

{/* --- MODAL DE REVISIÓN (INFLUENCER) --- */}
      {showReviewModal && (
        <ReviewOfferModal 
            applicationId={id as string}
            onClose={() => setShowReviewModal(false)}
            onDecision={handleDecisionMade}
        />
      )}

    </div>
  );
}