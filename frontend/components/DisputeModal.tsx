'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Gavel, Loader2, Scale } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onDisputeRaised: () => void;
}

export default function DisputeModal({ applicationId, onClose, onDisputeRaised }: Props) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleDispute = async () => {
    if (!reason.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Marcar como DISPUTA
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'disputed' })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 2. Marcar dinero como RETENIDO (Held)
      const { error: agreeError } = await supabase
        .from('agreements')
        .update({ payment_status: 'held' })
        .eq('application_id', applicationId);
        
      if (agreeError) throw agreeError;

      // 3. Notificar en el chat
      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: `⚖️ DISPUTA INICIADA \n\nMotivo: "${reason}"\n\nEl equipo de Soporte de BrandConnect ha sido notificado. Los fondos están congelados hasta que un agente revise el caso.`
      });

      onDisputeRaised();
      onClose();
      alert('Disputa enviada. Un agente revisará el caso pronto.');

    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        
        <div className="bg-gray-800 p-6 text-white text-center">
            <Scale size={40} className="mx-auto mb-2 text-gray-300" />
            <h3 className="font-bold text-2xl">Iniciar Disputa</h3>
            <p className="text-gray-400 text-sm">Solicitar intervención de BrandConnect</p>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
            <p className="text-sm text-gray-600 text-center">
                Usar solo si no logran llegar a un acuerdo. Un administrador revisará el historial del chat y tomará una decisión final.
            </p>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">¿Cuál es el problema?</label>
                <textarea 
                    autoFocus
                    required
                    rows={4}
                    placeholder="Ej: El trabajo entregado no cumple con nada de lo acordado y la marca no quiere liberar el pago..."
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-gray-800 outline-none text-sm transition-all resize-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>

            <button 
                onClick={handleDispute} 
                disabled={loading || !reason.trim()}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin"/> : 'Enviar a Soporte'}
            </button>
        </div>
      </div>
    </div>
  );
}