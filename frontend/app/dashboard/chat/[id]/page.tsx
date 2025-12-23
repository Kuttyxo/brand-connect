'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, User, FileText, CheckCircle, Clock, UploadCloud, Eye } from 'lucide-react';
import Link from 'next/link';

// Componentes Modales
import CreateOfferModal from '@/components/CreateOfferModal'; 
import ReviewOfferModal from '@/components/ReviewOfferModal';
import SubmitWorkModal from '@/components/SubmitWorkModal'; // <--- NUEVO

export default function ChatPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  // Estados de Negocio
  const [appStatus, setAppStatus] = useState<string>('');
  const [userRole, setUserRole] = useState<'brand' | 'influencer' | null>(null);
  
  // Control de Modales
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false); // <--- NUEVO
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: appData } = await supabase
        .from('applications')
        .select(`*, influencer:profiles!influencer_id(*), campaign:campaigns(*, brand:profiles!brand_id(*))`)
        .eq('id', id)
        .single();

      if (appData) {
        const isBrand = appData.campaign.brand_id === user.id;
        setUserRole(isBrand ? 'brand' : 'influencer');
        setAppStatus(appData.status);
        setOtherUser(isBrand ? appData.influencer : appData.campaign.brand);
      }
      fetchMessages();
      setLoading(false);
    };

    initChat();

    const channel = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `application_id=eq.${id}` }, 
      (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

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
    setNewMessage('');
    await supabase.from('messages').insert({ application_id: id, sender_id: userId, content: text });
  };
  
  // Callbacks de Modales
  const handleOfferSent = () => { setAppStatus('offered'); fetchMessages(); };
  
  const handleDecisionMade = (decision: string) => {
      setAppStatus(decision === 'accepted' ? 'hired' : 'accepted');
      fetchMessages();
  };

  const handleWorkSubmitted = () => {
      setAppStatus('review');
      fetchMessages();
  };

  if (loading) return <div className="p-10 text-center">Cargando chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 relative">
      
      {/* HEADER */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/messages" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></Link>
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                {otherUser?.avatar_url ? (
                    <img src={`https://amciorpzfsiyhwraiyum.supabase.co/storage/v1/object/public/avatars/${otherUser.avatar_url}`} className="w-full h-full object-cover"/>
                ) : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20}/></div>}
            </div>
            <div>
                <h2 className="font-bold text-gray-800 leading-tight">{otherUser?.full_name || 'Usuario'}</h2>
                
                {/* STATUS BADGES */}
                {appStatus === 'accepted' && <p className="text-xs text-green-500 font-medium">● Negociando</p>}
                {appStatus === 'offered' && <p className="text-xs text-orange-500 font-medium flex items-center gap-1"><Clock size={10}/> Oferta Enviada</p>}
                {appStatus === 'hired' && <p className="text-xs text-blue-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> TRABAJO EN CURSO</p>}
                {appStatus === 'review' && <p className="text-xs text-purple-600 font-bold flex items-center gap-1"><Eye size={10}/> EN REVISIÓN</p>}
                {appStatus === 'completed' && <p className="text-xs text-green-600 font-black flex items-center gap-1"><CheckCircle size={10}/> FINALIZADO</p>}
            </div>
            </div>
        </div>

        {/* --- ACCIONES --- */}
        <div className="flex gap-2">
            {/* MARCA: Generar Acuerdo */}
            {userRole === 'brand' && appStatus === 'accepted' && (
                <button onClick={() => setShowOfferModal(true)} className="bg-[var(--color-brand-dark)] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5">
                    <FileText size={16} /> Generar Acuerdo
                </button>
            )}

            {/* INFLUENCER: Entregar Trabajo */}
            {userRole === 'influencer' && appStatus === 'hired' && (
                <button onClick={() => setShowSubmitModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 animate-pulse">
                    <UploadCloud size={16} /> Entregar Trabajo
                </button>
            )}
            
            {/* MARCA: Revisar Trabajo (Solo visual aquí, la acción real va en el mensaje) */}
            {userRole === 'brand' && appStatus === 'review' && (
                 <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                    Revisa la evidencia abajo 👇
                 </span>
            )}
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          
          // Detectar Mensajes de Sistema
          const isOffer = msg.content.includes('📝 PROPUESTA DE CONTRATO');
          const isSubmission = msg.content.includes('🚀 ¡TRABAJO ENTREGADO!');
          const isSystemMessage = isOffer || isSubmission || msg.content.includes('🤝 ¡TRATO CERRADO!');

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                isSystemMessage 
                    ? 'bg-gray-800 text-white border-2 border-opacity-50 ' + (isOffer ? 'border-[var(--color-brand-orange)]' : 'border-blue-500')
                    : isMe ? 'bg-[var(--color-brand-orange)] text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.content}
                
                {/* ACCIONES DENTRO DEL MENSAJE */}
                
                {/* 1. Influencer ve Oferta -> Botón Aceptar */}
                {isOffer && !isMe && userRole === 'influencer' && appStatus === 'offered' && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <button onClick={() => setShowReviewModal(true)} className="w-full bg-white text-gray-900 font-bold py-2 rounded hover:bg-green-50 transition-colors shadow-sm">
                            Ver Detalles y Aceptar
                        </button>
                    </div>
                )}

                {/* 2. Marca ve Entrega -> Botón Aprobar (PRÓXIMAMENTE) */}
                {isSubmission && !isMe && userRole === 'brand' && appStatus === 'review' && (
                     <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs opacity-70 mb-2 italic">El influencer espera tu aprobación para cobrar.</p>
                        <button className="w-full bg-green-500 text-white font-bold py-2 rounded hover:bg-green-600 transition-colors shadow-sm">
                            Revisar y Liberar Pago (Pronto)
                        </button>
                    </div>
                )}

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] outline-none transition-all"/>
        <button type="submit" disabled={!newMessage.trim()} className="bg-[var(--color-brand-dark)] text-white p-3 rounded-xl hover:bg-[var(--color-brand-orange)] transition-colors disabled:opacity-50"><Send size={20} /></button>
      </form>

      {/* MODALES */}
      {showOfferModal && <CreateOfferModal applicationId={id as string} influencerName={otherUser?.full_name} onClose={() => setShowOfferModal(false)} onOfferSent={handleOfferSent}/>}
      {showReviewModal && <ReviewOfferModal applicationId={id as string} onClose={() => setShowReviewModal(false)} onDecision={handleDecisionMade}/>}
      {showSubmitModal && <SubmitWorkModal applicationId={id as string} onClose={() => setShowSubmitModal(false)} onSubmitted={handleWorkSubmitted}/>}

    </div>
  );
}