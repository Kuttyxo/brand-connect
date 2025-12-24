'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, User, FileText, CheckCircle, UploadCloud, Eye, DollarSign, MoreVertical, AlertTriangle, ShieldAlert, Lock } from 'lucide-react';
import Link from 'next/link';

// Componentes Modales
import CreateOfferModal from '@/components/CreateOfferModal'; 
import ReviewOfferModal from '@/components/ReviewOfferModal';
import SubmitWorkModal from '@/components/SubmitWorkModal';
import ReleasePaymentModal from '@/components/ReleasePaymentModal';
import CancelContractModal from '@/components/CancelContractModal';
import DisputeModal from '@/components/DisputeModal';

export default function ChatPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  // Estados de Negocio
  const [appStatus, setAppStatus] = useState<string>('');
  const [userRole, setUserRole] = useState<'brand' | 'influencer' | 'admin' | null>(null);
  
  // Control de Modales
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Efecto de Inicialización y Suscripción Realtime
  useEffect(() => {
    let channel: any;

    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
  
        // Cargar datos de la postulación
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select(`*, influencer:profiles!influencer_id(*), campaign:campaigns(*, brand:profiles!brand_id(*))`)
          .eq('id', id)
          .single();
  
        if (appError) throw appError;

        if (appData) {
          // Detectar roles
          const isBrand = appData.campaign.brand_id === user.id;
          const isInfluencer = appData.influencer_id === user.id;

          if (isBrand) {
              setUserRole('brand');
              setOtherUser(appData.influencer);
          } else if (isInfluencer) {
              setUserRole('influencer');
              setOtherUser(appData.campaign.brand);
          } else {
              setUserRole('admin');
              setOtherUser(appData.campaign.brand); 
          }

          setAppStatus(appData.status);
        }
        
        await fetchMessages();

        // --- SUSCRIPCIÓN REALTIME DOBLE (MENSAJES + ESTADO) ---
        channel = supabase
          .channel(`chat:${id}`) 
          // A. Escuchar Mensajes Nuevos
          .on(
            'postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages', 
              filter: `application_id=eq.${id}` 
            }, 
            (payload) => {
              setMessages((current) => [...current, payload.new]);
            }
          )
          // B. Escuchar Cambios de Estado (ESTO ES LO NUEVO) 🚨
          // Cuando el Admin cambia el estado a 'cancelled' o 'completed', esto lo detecta.
          .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'applications',
                filter: `id=eq.${id}`
            },
            (payload) => {
                console.log("Estado actualizado:", payload.new.status);
                setAppStatus(payload.new.status); // Actualiza la UI instantáneamente
            }
          )
          .subscribe();

      } catch (err: any) {
          console.error("Error cargando chat:", err);
          setError(err.message);
      } finally {
          setLoading(false);
      }
    };
  
    initChat();
  
    // Limpieza al salir
    return () => { 
        if (channel) supabase.removeChannel(channel); 
    };
  }, [id]);

  // 2. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true });
    
    if (error) console.error("Error mensajes:", error);
    setMessages(data || []);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    
    const text = newMessage;
    setNewMessage(''); 

    const { error } = await supabase
        .from('messages')
        .insert({ 
            application_id: id, 
            sender_id: userId, 
            content: text 
        });

    if (error) {
        alert("Error al enviar mensaje");
        setNewMessage(text);
    }
  };
  
  const refreshChat = () => { fetchMessages(); };

  if (loading) return <div className="p-10 text-center flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div> Conectando...</div>;
  
  if (error) return <div className="p-10 text-center text-red-500">No se pudo cargar el chat.</div>;

  const isChatClosed = ['cancelled', 'completed'].includes(appStatus);
  const isReadOnly = userRole === 'admin'; 

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 relative">
      
      {userRole === 'admin' && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-yellow-200">
              <Eye size={14}/> MODO ESPECTADOR (ADMIN) - Estás visualizando una disputa activa
          </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm relative z-20">
        <div className="flex items-center gap-4">
            <Link href={userRole === 'admin' ? "/admin" : "/dashboard/messages"} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></Link>
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                {otherUser?.avatar_url ? (
                    <img src={otherUser.avatar_url.startsWith('http') ? otherUser.avatar_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${otherUser.avatar_url}`} className="w-full h-full object-cover"/>
                ) : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20}/></div>}
            </div>
            <div>
                <h2 className="font-bold text-gray-800 leading-tight">{otherUser?.full_name || 'Usuario'}</h2>
                
                {appStatus === 'disputed' && <p className="text-xs text-gray-800 font-black flex items-center gap-1"><ShieldAlert size={10}/> EN DISPUTA</p>}
                {appStatus === 'cancelled' && <p className="text-xs text-red-600 font-black flex items-center gap-1 animate-pulse"><AlertTriangle size={10}/> CANCELADO</p>}
                {appStatus === 'completed' && <p className="text-xs text-green-600 font-black flex items-center gap-1 animate-pulse"><CheckCircle size={10}/> FINALIZADO</p>}
                
                {/* Fallbacks visuales para otros estados */}
                {appStatus === 'hired' && <p className="text-xs text-blue-600 font-bold">Contratado</p>}
                {appStatus === 'review' && <p className="text-xs text-purple-600 font-bold">En Revisión</p>}

            </div>
            </div>
        </div>

        {userRole !== 'admin' && (
            <div className="flex gap-2 items-center">
                {userRole === 'brand' && appStatus === 'accepted' && (
                    <button onClick={() => setShowOfferModal(true)} className="bg-[var(--color-brand-dark)] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><FileText size={16} /> Acuerdo</button>
                )}
                {userRole === 'influencer' && appStatus === 'hired' && (
                    <button onClick={() => setShowSubmitModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse"><UploadCloud size={16} /> Entregar</button>
                )}
                {userRole === 'brand' && appStatus === 'review' && (
                    <button onClick={() => setShowReleaseModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-bounce"><DollarSign size={16} /> Pagar</button>
                )}

                {!isChatClosed && (
                    <div className="relative">
                        <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><MoreVertical size={20} /></button>
                        {showOptions && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                                <button onClick={() => { setShowDisputeModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><ShieldAlert size={16} /> Reportar Problema</button>
                                <button onClick={() => { setShowCancelModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"><AlertTriangle size={16} /> Cancelar Contrato</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowOptions(false)}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          const isSystemMessage = msg.content.includes('📝 PROPUESTA') || msg.content.includes('🚀 ¡TRABAJO') || msg.content.includes('🎉 ¡PAGO') || msg.content.includes('⚠️ CORRECCIONES') || msg.content.includes('🚫 CONTRATO') || msg.content.includes('⚖️');

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                isSystemMessage 
                    ? 'bg-gray-800 text-white border-2 border-gray-600'
                    : isMe ? 'bg-[var(--color-brand-orange)] text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.content}

                {msg.content.includes('📝 PROPUESTA') && userRole === 'influencer' && appStatus === 'offered' && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <button onClick={() => setShowReviewModal(true)} className="w-full bg-white text-gray-900 font-bold py-2 rounded shadow-sm">Ver y Aceptar</button>
                    </div>
                )}
                
                {msg.content.includes('🚀 ¡TRABAJO') && userRole === 'brand' && appStatus === 'review' && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <button onClick={() => setShowReleaseModal(true)} className="w-full bg-green-500 text-white font-bold py-2 rounded shadow-sm">Revisar Entrega</button>
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
        <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder={isReadOnly ? "Modo solo lectura (Admin)" : isChatClosed ? 'Chat cerrado' : "Escribe un mensaje..."} 
            disabled={isChatClosed || isReadOnly} 
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all disabled:opacity-50 disabled:bg-gray-100"
        />
        {!isReadOnly && (
            <button type="submit" disabled={!newMessage.trim() || isChatClosed} className="bg-[var(--color-brand-dark)] text-white p-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"><Send size={20} /></button>
        )}
        {isReadOnly && <div className="p-3 text-gray-400"><Lock size={20}/></div>}
      </form>

      {/* MODALES */}
      {showOfferModal && <CreateOfferModal applicationId={id as string} influencerName={otherUser?.full_name} onClose={() => setShowOfferModal(false)} onOfferSent={refreshChat}/>}
      {showReviewModal && <ReviewOfferModal applicationId={id as string} onClose={() => setShowReviewModal(false)} onDecision={() => {setAppStatus('hired'); refreshChat()}}/>} 
      {showSubmitModal && <SubmitWorkModal applicationId={id as string} onClose={() => setShowSubmitModal(false)} onSubmitted={() => {setAppStatus('review'); refreshChat()}}/>}
      {showReleaseModal && <ReleasePaymentModal applicationId={id as string} onClose={() => setShowReleaseModal(false)} onPaymentReleased={() => {setAppStatus('completed'); refreshChat()}} onChangesRequested={() => { setAppStatus('hired'); refreshChat(); }}/>}
      {showCancelModal && <CancelContractModal applicationId={id as string} onClose={() => setShowCancelModal(false)} onCancelled={() => {setAppStatus('cancelled'); refreshChat()}}/>}
      {showDisputeModal && <DisputeModal applicationId={id as string} onClose={() => setShowDisputeModal(false)} onDisputeRaised={() => {setAppStatus('disputed'); refreshChat()}}/>}

    </div>
  );
}