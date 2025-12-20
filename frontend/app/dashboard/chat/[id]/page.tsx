'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const { id } = useParams(); // ID de la Application
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null); // Con quién hablo
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
        // Si soy la marca, hablo con el influencer. Si soy influencer, hablo con la marca.
        const isBrand = appData.campaign.brand_id === user.id;
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

  if (loading) return <div className="p-10 text-center">Cargando chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      
      {/* Header del Chat */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-4 shadow-sm">
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
            <p className="text-xs text-green-500 font-medium">● En línea para negociar</p>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                isMe 
                  ? 'bg-[var(--color-brand-orange)] text-white rounded-br-none' 
                  : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.content}
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
    </div>
  );
}