'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Link as LinkIcon, Send, Loader2, Image as ImageIcon } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitWorkModal({ applicationId, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [comments, setComments] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Guardar la evidencia en el acuerdo
      const { error: agreementError } = await supabase
        .from('agreements')
        .update({ evidence_url: evidenceUrl })
        .eq('application_id', applicationId);

      if (agreementError) throw agreementError;

      // 2. Cambiar estado a 'review' (Marca debe revisar)
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'review' })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 3. Avisar en el chat
      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: `🚀 ¡TRABAJO ENTREGADO! \n\n🔗 Link: ${evidenceUrl}\n📝 Nota: ${comments || 'Sin comentarios adicionales.'}\n\n(Esperando aprobación de la marca para liberar el pago)`
      });

      onSubmitted();
      onClose();
      alert('¡Evidencia enviada! La marca ha sido notificada.');

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
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
            <div>
                <h3 className="font-bold text-xl">Entregar Trabajo</h3>
                <p className="text-blue-100 text-sm">Sube la prueba de tu publicación</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
            {/* Input URL */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <LinkIcon size={14}/> Link de la Publicación
                </label>
                <input 
                    type="url" 
                    required
                    placeholder="https://instagram.com/p/..."
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm transition-all"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                />
            </div>

            {/* Input Comentarios */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <ImageIcon size={14}/> Comentarios Adicionales
                </label>
                <textarea 
                    rows={3}
                    placeholder="Aquí está el reel prometido. ¡Espero que les guste!"
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm transition-all resize-none"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                />
            </div>

            {/* Botón */}
            <button 
                type="submit" 
                disabled={loading || !evidenceUrl}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-blue-200"
            >
                {loading ? <Loader2 className="animate-spin"/> : <> <Send size={18}/> Enviar a Revisión </>}
            </button>

        </form>
      </div>
    </div>
  );
}