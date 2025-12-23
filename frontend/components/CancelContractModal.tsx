'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelContractModal({ applicationId, onClose, onCancelled }: Props) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Marcar la postulación como CANCELADA
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 2. Marcar el dinero como REEMBOLSADO
      const { error: agreeError } = await supabase
        .from('agreements')
        .update({ payment_status: 'refunded' })
        .eq('application_id', applicationId);
        
      if (agreeError) throw agreeError;

      // 3. Notificar en el chat
      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: `🚫 CONTRATO CANCELADO \n\nMotivo: "${reason}"\n\nEl acuerdo ha sido anulado y los fondos han sido devueltos a la marca.`
      });

      onCancelled();
      onClose();
      alert('Contrato cancelado y fondos reembolsados.');

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
        
        <div className="bg-red-600 p-6 text-white text-center">
            <Trash2 size={40} className="mx-auto mb-2 text-red-100" />
            <h3 className="font-bold text-2xl">Cancelar Contrato</h3>
            <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-red-50 p-4 rounded-xl flex gap-3 items-start text-xs text-red-700">
                <AlertTriangle size={20} className="shrink-0"/>
                <p>Al cancelar, se reembolsará el dinero a la marca inmediatamente y se cerrará el chat. Úsalo solo si no hay solución.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Motivo de Cancelación</label>
                <textarea 
                    autoFocus
                    required
                    rows={3}
                    placeholder="Ej: El influencer no responde hace 5 días..."
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-red-500 outline-none text-sm transition-all resize-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>

            <button 
                onClick={handleCancel} 
                disabled={loading || !reason.trim()}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-red-200"
            >
                {loading ? <Loader2 className="animate-spin"/> : 'Confirmar Cancelación y Reembolso'}
            </button>
        </div>
      </div>
    </div>
  );
}