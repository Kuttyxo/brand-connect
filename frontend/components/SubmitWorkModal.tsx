'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, UploadCloud, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';

interface SubmitWorkModalProps {
  applicationId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitWorkModal({ applicationId, onClose, onSubmitted }: SubmitWorkModalProps) {
  const [loading, setLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. VERIFICACIÓN DE SESIÓN (CRÍTICO PARA EVITAR EL ERROR "NO AUTENTICADO")
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("No autenticado. Por favor recarga la página e intenta de nuevo.");
      }

      if (!evidenceUrl.trim()) {
        throw new Error("Debes incluir un enlace a tu trabajo (Drive, TikTok, Instagram, etc).");
      }

      // 2. Actualizar el Contrato con la Evidencia (Tabla 'agreements')
      // Buscamos el acuerdo asociado a esta aplicación
      const { error: agreementError } = await supabase
        .from('agreements')
        .update({ 
            evidence_url: evidenceUrl,
            // Opcional: Podrías guardar las notas en algún campo si lo tienes, o dejarlas solo en el chat
        })
        .eq('application_id', applicationId);

      if (agreementError) throw new Error("Error guardando evidencia: " + agreementError.message);

      // 3. Cambiar estado de la Postulación a 'review' (Tabla 'applications')
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'review' })
        .eq('id', applicationId);

      if (appError) throw new Error("Error actualizando estado: " + appError.message);

      // 4. Enviar Mensaje Automático al Chat (Tabla 'messages')
      // Esto avisa a la marca que hay una nueva entrega
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
            application_id: applicationId,
            sender_id: user.id,
            content: `🚀 ¡TRABAJO ENVIADO!\n\n🔗 Evidencia: ${evidenceUrl}\n📝 Notas: ${notes || "Sin notas adicionales."}\n\nPor favor revisa el contenido y libera el pago si todo está correcto.`
        });

      if (msgError) throw new Error("Error enviando notificación: " + msgError.message);

      // ¡Éxito!
      onSubmitted();
      onClose();

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Ocurrió un error al entregar el trabajo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                <X size={24} />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <UploadCloud size={24} /> Entregar Trabajo
            </h2>
            <p className="text-blue-100 text-sm mt-1">
                Envía tus pruebas para que la marca las revise.
            </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <LinkIcon size={16} className="text-blue-500"/> Link a la Evidencia
                </label>
                <input 
                    type="url" 
                    required
                    placeholder="https://drive.google.com/..."
                    value={evidenceUrl}
                    onChange={e => setEvidenceUrl(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                <p className="text-[10px] text-gray-400">Pega el link a tu publicación, video, o carpeta de Drive.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500"/> Comentarios Adicionales
                </label>
                <textarea 
                    rows={3}
                    placeholder="Aquí están los cambios solicitados..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                />
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 size={20} className="animate-spin"/> : 'Confirmar Entrega'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}